from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import io
import httpx
from scipy.stats import variation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

N8N_WEBHOOK_URL = "https://xavas.app.n8n.cloud/webhook/guitar-analyser"

def compute_pitch_track(y, sr):
    """Return pitch (Hz) over time using librosa.yin."""
    f0 = librosa.yin(y, fmin=80, fmax=1200, sr=sr)
    f0[f0 <= 0] = np.nan  # mark unvoiced frames as NaN
    return f0

def compute_sustain(y, sr, onset_frames):
    """Estimate sustain as average decay of each note segment."""
    if len(onset_frames) < 2:
        return 0.0
    sustains = []
    for i in range(len(onset_frames)-1):
        start = int(onset_frames[i])
        end = int(onset_frames[i+1])
        segment = y[start:end]
        env = librosa.onset.onset_strength(y=segment, sr=sr)
        if len(env) > 1:
            decay = np.mean(np.maximum(0, np.diff(env)) * -1)
            sustains.append(abs(decay))
    return float(np.mean(sustains)) if sustains else 0.0

def compute_pitch_per_note(pitch_track, onset_frames):
    """Compute pitch deviation and stability per note."""
    deviations = []
    stabilities = []
    for i in range(len(onset_frames)-1):
        start = int(onset_frames[i])
        end = int(onset_frames[i+1])
        note_pitch = pitch_track[start:end]
        note_pitch = note_pitch[~np.isnan(note_pitch)]
        if len(note_pitch) > 1:
            stabilities.append(np.exp(-np.std(note_pitch)/50))
            median_pitch = np.median(note_pitch)
            cents = 1200 * np.log2(note_pitch / median_pitch)
            deviations.append(np.mean(np.abs(cents)))
    # Aggregate across notes
    pitch_stability = float(np.mean(stabilities)) if stabilities else 1.0
    pitch_deviation = float(np.mean(deviations)) if deviations else 0.0
    return pitch_stability, pitch_deviation

def compute_timing_accuracy(onsets, tempo):
    if len(onsets) < 2:
        return 1.0
    iois = np.diff(onsets)
    ideal_ioi = 60.0 / tempo
    deviation = np.abs(iois - ideal_ioi)
    accuracy = 1.0 - np.mean(deviation / ideal_ioi)
    return float(max(0, min(1, accuracy)))

def compute_timing_stability(onsets):
    if len(onsets) < 3:
        return 1.0

    iois = np.diff(onsets)
    median_ioi = np.median(iois)

    stability = 1.0 - np.median(np.abs(iois - median_ioi) / median_ioi)
    stability = max(0, min(1, stability))

    return float(max(0, min(1, stability)))

def extract_practice_metrics(audio_bytes: bytes):
    y, sr = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=True)

    # 1. Tempo & Onsets
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units='samples')
    onset_frames = np.append(onset_frames, len(y))  # include end of audio

    # 2. Pitch tracking
    pitch_track = compute_pitch_track(y, sr)

    # 3. Pitch per note
    pitch_stability, pitch_deviation_cents = compute_pitch_per_note(pitch_track, onset_frames)

    # 4. Sustain
    sustain = compute_sustain(y, sr, onset_frames)

    # 5. Timing metrics
    onsets_sec = onset_frames / sr
    timing_accuracy = compute_timing_accuracy(onsets_sec, tempo)
    timing_stability = compute_timing_stability(onsets_sec)

    return {
        "bpm": float(tempo),
        "timing_accuracy": timing_accuracy,
        "timing_stability": timing_stability,
        "pitch_stability": pitch_stability,
        "pitch_deviation_cents": pitch_deviation_cents,
        "sustain": sustain,
        "note_count": len(onset_frames)-1
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
        await client.post(N8N_WEBHOOK_URL, json=payload)

    return {"status": "analysis_complete", "sent": payload}


@app.get("/sessions")
async def get_sessions():
    params = {
        "method": "get"
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(N8N_WEBHOOK_URL, params=params)

    return response.json()