from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import io
import httpx
import joblib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

N8N_WEBHOOK_URL = "https://your-n8n-url/webhook/guitar-analysis"

# Load ML model (example placeholder)
try:
    model = joblib.load("model.pkl")
except:
    model = None

def extract_features(audio_bytes: bytes):
    y, sr = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=True)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    rms = float(np.mean(librosa.feature.rms(y=y)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))

    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    mfcc_mean = [float(np.mean(m)) for m in mfcc]

    features = {
        "tempo": tempo,
        "spectral_centroid": spectral_centroid,
        "loudness_rms": rms,
        "zero_crossing_rate": zcr,
        "mfcc_mean": mfcc_mean
    }

    if model:
        vector = np.array([tempo, spectral_centroid, rms, zcr] + mfcc_mean).reshape(1, -1)
        prediction = float(model.predict(vector)[0])
        features["model_prediction"] = prediction

    return features

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    features = extract_features(audio_bytes)

    async with httpx.AsyncClient(timeout=20.0) as client:
        await client.post(N8N_WEBHOOK_URL, json=features)

    return {"status": "analysis_complete", "features": features}
