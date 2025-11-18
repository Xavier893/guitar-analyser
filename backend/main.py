from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import io
import httpx
from scipy.stats import variation
import scipy
import scipy.ndimage
import scipy.signal

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

N8N_WEBHOOK_URL = "https://xavas.app.n8n.cloud/webhook/guitar-analyser"

# ---------------------
# Audio preprocessing
# ---------------------
def preprocess_audio(y, sr,
                     hp_cut=80.0,    # high-pass to remove rumble
                     lp_cut=4000.0,  # low-pass to reduce high harmonics/mp3 fizz
                     pre_emph=0.97):
    """Apply HPF, LPF and pre-emphasis to boost fundamentals for pitch detection."""
    # High-pass / Low-pass using Butterworth filters
    nyq = 0.5 * sr
    filtered = y.copy()

    # High-pass
    if hp_cut is not None and hp_cut > 0 and hp_cut < nyq:
        b, a = scipy.signal.butter(2, hp_cut / nyq, btype='highpass')
        filtered = scipy.signal.filtfilt(b, a, filtered)

    # Low-pass
    if lp_cut is not None and lp_cut < nyq:
        b, a = scipy.signal.butter(2, lp_cut / nyq, btype='lowpass')
        filtered = scipy.signal.filtfilt(b, a, filtered)

    # Pre-emphasis (boost high frequency slightly to help YIN on DI guitars)
    if pre_emph and 0.0 < pre_emph < 1.0:
        emphasized = np.append(filtered[0], filtered[1:] - pre_emph * filtered[:-1])
    else:
        emphasized = filtered

    # Normalize to -1..1 to avoid numerical issues
    maxv = np.max(np.abs(emphasized)) or 1.0
    emphasized = emphasized / maxv
    return emphasized

# ---------------------
# Accurate onset detection (unchanged idea, tuned)
# ---------------------
def detect_notes_accurate(y, sr,
                          rms_frame=2048,
                          rms_hop=256,
                          smooth=9,
                          threshold_ratio=0.06,
                          min_note_ms=40,
                          min_silence_ms=40,
                          merge_silence_ms=40):
    """
    Robust note segmentation specialized for clean DI electric guitar recordings.
    Returns onset sample indices (including final len(y)).
    """
    rms = librosa.feature.rms(y=y, frame_length=rms_frame, hop_length=rms_hop)[0]
    rms_smooth = scipy.ndimage.uniform_filter1d(rms, size=max(3, smooth))

    med = np.median(rms_smooth)
    peak = np.max(rms_smooth)
    threshold = med + threshold_ratio * (peak - med)
    threshold = max(threshold, 1e-9)

    onset_indices = []
    is_active = False
    start_idx = 0
    silence_counter = 0

    min_note_frames = int((min_note_ms / 1000) * (sr / rms_hop))
    min_silence_frames = int((min_silence_ms / 1000) * (sr / rms_hop))
    merge_silence_frames = int((merge_silence_ms / 1000) * (sr / rms_hop))

    for i, val in enumerate(rms_smooth):
        if not is_active:
            if val >= threshold:
                is_active = True
                start_idx = i
                silence_counter = 0
        else:
            if val < threshold:
                silence_counter += 1
            else:
                silence_counter = 0

            if silence_counter >= min_silence_frames:
                duration = i - start_idx
                if duration >= min_note_frames:
                    onset_indices.append(start_idx)
                is_active = False

    if len(onset_indices) == 0:
        # fallback: treat entire file as one region
        return np.array([0, len(y)])

    onset_samples = np.array(onset_indices, dtype=int) * rms_hop

    # Merge onsets that are too close (likely micro-transients)
    if len(onset_samples) > 1:
        merged = [onset_samples[0]]
        for s in onset_samples[1:]:
            if (s - merged[-1]) < (merge_silence_frames * rms_hop):
                # skip (merge)
                continue
            merged.append(s)
        onset_samples = np.array(merged, dtype=int)

    # Optionally ensure a leading 0 if audio starts loud
    if onset_samples[0] > 0 and np.mean(np.abs(y[:onset_samples[0]])) > (0.05 * np.max(np.abs(y))):
        onset_samples = np.insert(onset_samples, 0, 0)

    if onset_samples[-1] < len(y):
        onset_samples = np.append(onset_samples, len(y))

    return onset_samples

# ---------------------
# Pitch track (improved)
# ---------------------
def compute_pitch_track(y, sr, frame_length=4096, hop_length=256, fmin=82.0, fmax=1100.0):
    """
    Compute a cleaned YIN pitch track on preprocessed audio.
    Uses a larger frame_length for DI electric guitar to stabilize F0.
    """
    # YIN
    try:
        f0 = librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=frame_length, hop_length=hop_length)
    except Exception:
        # fallback to defaults if input too short
        f0 = librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr)

    f0[f0 <= 0] = np.nan
    return f0

# ---------------------
# Pitch smoothing helper
# ---------------------
def smooth_pitch_track(f0, size=5):
    """Median-smooth the pitch track but keep NaNs for unvoiced frames."""
    mask = np.isnan(f0)
    if np.all(mask):
        return f0
    filled = f0.copy()
    filled[mask] = np.nanmedian(f0)
    smoothed = scipy.ndimage.median_filter(filled, size=size)
    smoothed[mask] = np.nan
    return smoothed

# ---------------------
# Compute pitch per note (robust)
# ---------------------
def compute_pitch_per_note(pitch_track, onset_samples, sr, hop_length=256):
    """
    Improved version:
    - Per-note median pitch from middle 50% of frames
    - Removes >200 cent within-note outliers
    - ALWAYS computes pitch deviation relative to nearest semitone (musically correct)
    """
    f0 = smooth_pitch_track(pitch_track, size=5)

    onset_frames = (onset_samples / hop_length).astype(int)
    onset_frames = np.clip(onset_frames, 0, len(f0))

    note_medians = []
    stabilities = []

    for i in range(len(onset_frames) - 1):
        s = onset_frames[i]
        e = onset_frames[i + 1]

        note_f0 = f0[s:e]
        note_f0 = note_f0[~np.isnan(note_f0)]

        if len(note_f0) < 3:
            continue

        # Use middle 50%
        lo = int(0.25 * len(note_f0))
        hi = int(0.75 * len(note_f0))
        mid = note_f0[lo:hi] if hi > lo else note_f0

        if len(mid) < 2:
            mid = note_f0

        # Remove >200 cent outliers
        med = np.median(mid)
        cents = 1200 * np.log2(mid / med)
        mid_clean = mid[np.abs(cents) <= 200]

        if len(mid_clean) < 2:
            mid_clean = mid

        note_med = float(np.median(mid_clean))
        note_std = float(np.std(mid_clean))

        note_medians.append(note_med)
        stabilities.append(float(np.exp(-note_std / 40.0)))

    if len(note_medians) == 0:
        return 1.0, 0.0

    # NEW: always snap each note to nearest semitone
    deviations = []
    for mp in note_medians:
        midi = librosa.hz_to_midi(mp)
        nearest = np.round(midi)
        nearest_hz = librosa.midi_to_hz(nearest)
        cents = 1200 * np.log2(mp / nearest_hz)
        deviations.append(abs(cents))

    pitch_deviation = float(np.mean(deviations))
    pitch_stability = float(np.mean(stabilities))

    return pitch_stability, pitch_deviation


# ---------------------
# Sustain (improved)
# ---------------------
def compute_sustain(y, sr, onset_samples, hop_length=256):
    """Compute sustain using RMS log-decay per note."""
    sustains = []
    for i in range(len(onset_samples) - 1):
        start = int(onset_samples[i])
        end = int(onset_samples[i + 1])
        seg = y[start:end]
        if len(seg) < int(0.03 * sr):
            continue
        rms = librosa.feature.rms(y=seg, frame_length=1024, hop_length=hop_length).flatten()
        rms = rms[rms > 1e-9]
        if len(rms) < 3:
            continue
        decay = np.log(rms[0]) - np.log(rms[-1])
        sustain_val = float(np.exp(-decay))
        sustains.append(np.clip(sustain_val, 0.0, 1.0))
    return float(np.mean(sustains)) if sustains else 0.0

# ---------------------
# Timing helpers (same)
# ---------------------
def compute_timing_accuracy(onsets_sec, tempo):
    if len(onsets_sec) < 2 or tempo <= 0:
        return 1.0
    iois = np.diff(onsets_sec)
    ideal = 60.0 / tempo
    accuracy = 1.0 - np.mean(np.abs(iois - ideal) / ideal)
    return float(np.clip(accuracy, 0, 1))

def compute_timing_stability(onsets_sec):
    if len(onsets_sec) < 3:
        return 1.0
    iois = np.diff(onsets_sec)
    med = np.median(iois)
    if med <= 0:
        return 1.0
    stability = 1.0 - (np.median(np.abs(iois - med)) / med)
    return float(np.clip(stability, 0, 1))

# ---------------------
# Main extraction (drop-in)
# ---------------------
def extract_practice_metrics(audio_bytes: bytes):
    """
    Master pipeline using the improved pieces above. Returns metrics dict.
    """
    y_raw, sr = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=True)

    # Preprocess audio for stable pitch detection
    y = preprocess_audio(y_raw, sr, hp_cut=80.0, lp_cut=4000.0, pre_emph=0.97)

    # Tempo (can be noisy for short clips)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

    # Onset detection with robust parameters for DI guitar
    onset_samples = detect_notes_accurate(y, sr,
                                         rms_frame=2048, rms_hop=256,
                                         smooth=9, threshold_ratio=0.06,
                                         min_note_ms=40, min_silence_ms=40, merge_silence_ms=40)

    # Pitch track (larger frame for stability)
    hop = 256
    pitch_track = compute_pitch_track(y, sr, frame_length=4096, hop_length=hop, fmin=82.0, fmax=1100.0)

    # Per-note pitch metrics
    pitch_stability, pitch_deviation_cents = compute_pitch_per_note(pitch_track, onset_samples, sr, hop_length=hop)

    # Sustain
    sustain = compute_sustain(y, sr, onset_samples, hop_length=hop)

    # Timing metrics (convert onset samples to seconds)
    onsets_sec = onset_samples / sr
    if len(onsets_sec) < 2:
        timing_accuracy = 1.0
        timing_stability = 1.0
    else:
        timing_accuracy = compute_timing_accuracy(onsets_sec, tempo)
        timing_stability = compute_timing_stability(onsets_sec)

    note_count = max(0, len(onset_samples) - 1)

    # Adaptive scoring: if sample is tiny, de-emphasize timing
    if note_count < 4:
        score_val = (
            0.5 * pitch_stability +
            0.3 * sustain +
            0.2 * (1 - min(pitch_deviation_cents / 400.0, 1.0))
        )
    else:
        score_val = (
            0.4 * timing_accuracy +
            0.25 * timing_stability +
            0.2 * pitch_stability +
            0.1 * (1 - min(pitch_deviation_cents / 400.0, 1.0)) +
            0.05 * sustain
        )

    practice_score = int(np.clip(score_val * 100.0, 0, 100))

    return {
        "bpm": float(tempo),
        "timing_accuracy": float(timing_accuracy),
        "timing_stability": float(timing_stability),
        "pitch_stability": float(pitch_stability),
        "pitch_deviation_cents": float(pitch_deviation_cents),
        "sustain": float(sustain),
        "note_count": int(note_count),
        "practice_score": int(practice_score)
    }



@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...), session_name: str = Form(...), session_date: str = Form(...),session_notes: str = Form(None)):
    audio_bytes = await file.read()
    features = extract_practice_metrics(audio_bytes)

    payload = {
        "method": "post",
        "session_name": session_name,
        "session_date": session_date,
        "session_notes": session_notes,
        "features": features
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(N8N_WEBHOOK_URL, json=payload)
        enriched_row = response.json()

    if enriched_row == None:
        return {"error": "Failed to retrieve analysis results."}
    else:
        return enriched_row


@app.get("/sessions")
async def get_sessions():
    params = {
        "method": "get"
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(N8N_WEBHOOK_URL, params=params)

    # Log the response for debugging
    print(f"📡 N8N Response Status: {response.status_code}")
    print(f"📡 N8N Response Content: {response.content}")
    print(f"📡 N8N Response Text: {response.text}")
    
    # Check if response is successful
    if response.status_code != 200:
        print(f"❌ N8N returned status {response.status_code}")
        return {"error": f"N8N webhook returned status {response.status_code}", "sessions": []}
    
    # Try to parse JSON, with fallback
    try:
        data = response.json()
        print(f"✅ Successfully parsed N8N response: {data}")
        return data
    except Exception as e:
        print(f"❌ Failed to parse N8N response as JSON: {e}")
        print(f"❌ Raw response: {response.text}")
        return {"error": f"Failed to parse N8N response: {str(e)}", "sessions": []}