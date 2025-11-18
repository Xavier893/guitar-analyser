# Guitar Analyser - API Integration Guide

## Overview

The Guitar Analyser application consists of a FastAPI backend that processes guitar audio files and a Next.js frontend that provides the user interface for managing sessions and viewing analysis results.

## Architecture

### Backend (Python/FastAPI)
- **Location**: `/backend`
- **Main File**: `main.py`
- **Port**: 8000 (default)
- **API Endpoints**:
  - `POST /analyze` - Upload and analyze guitar audio
  - `GET /sessions` - Retrieve list of sessions

### Frontend (Next.js/TypeScript)
- **Location**: `/frontend`
- **Main API Client**: `lib/api-client.ts`
- **Backend URL**: `http://localhost:8000` (configurable via `NEXT_PUBLIC_BACKEND_URL`)

## API Endpoints

### 1. Upload and Analyze Audio
**Endpoint**: `POST /analyze`

**Request**:
```
Content-Type: multipart/form-data

Parameters:
- file: File (required) - Audio file (WAV or MP3)
- session_name: string (required) - Name of the session
- session_date: string (required) - Date of the session (YYYY-MM-DD format)
- session_notes: string (optional) - Additional notes about the session
```

**Response**:
```json
{
  "status": "analysis_complete",
  "sent": {
    "method": "post",
    "session_name": "Jazz Solo",
    "session_date": "2025-11-18",
    "session_notes": "Great take",
    "features": {
      "bpm": 120.5,
      "timing_accuracy": 0.94,
      "timing_stability": 0.92,
      "pitch_stability": 0.88,
      "pitch_deviation_cents": 2.5,
      "sustain": 0.0456,
      "note_count": 24
    }
  }
}
```

### 2. Get Sessions
**Endpoint**: `GET /sessions`

**Request**:
```
GET /sessions
```

**Response**:
```json
{
  "sessions": [
    {
      "id": "1",
      "session_name": "Jazz Solo",
      "session_date": "2025-11-18",
      "session_notes": "Great take",
      "features": {
        "bpm": 120.5,
        "timing_accuracy": 0.94,
        "timing_stability": 0.92,
        "pitch_stability": 0.88,
        "pitch_deviation_cents": 2.5,
        "sustain": 0.0456,
        "note_count": 24
      }
    }
  ]
}
```

## Audio Analysis Features

The backend extracts the following features from guitar audio:

1. **BPM (Beats Per Minute)** - Detected tempo
2. **Timing Accuracy** - How close to the detected tempo (0-1 scale)
3. **Timing Stability** - Consistency of inter-onset intervals (0-1 scale)
4. **Pitch Stability** - Consistency of pitch within notes (0-1 scale)
5. **Pitch Deviation (cents)** - Average deviation from median pitch per note
6. **Sustain** - Average decay rate of note segments
7. **Note Count** - Number of detected notes/onsets

## Frontend Integration

### API Client (`frontend/lib/api-client.ts`)

#### Available Functions:

```typescript
// Upload audio file and get analysis
uploadAudioFile(
  file: File,
  sessionName: string,
  sessionDate: string,
  sessionNotes?: string
): Promise<AnalysisResponse>

// Fetch all sessions
fetchSessions(): Promise<SessionsResponse>

// Generic API call
apiCall(
  endpoint: string,
  options?: RequestInit
): Promise<any>
```

### Components Using API

1. **SessionsList** (`components/sessions-list.tsx`)
   - Displays list of sessions from backend
   - Shows analysis results and status

2. **FileUpload** (`components/file-upload.tsx`)
   - Handles drag-and-drop file upload
   - Calls `uploadAudioFile()` on file selection
   - Shows upload progress

3. **AnalysisResults** (`components/analysis-results.tsx`)
   - Displays analysis metrics from backend
   - Renders BPM, timing, pitch, and sustain data
   - Shows raw feature data

4. **SessionDetailPage** (`app/sessions/[id]/page.tsx`)
   - Loads/creates sessions
   - Handles file upload via `uploadAudioFile()`
   - Displays analysis results

## Environment Configuration

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Backend (`.env`)
```env
N8N_WEBHOOK_URL=https://xavas.app.n8n.cloud/webhook-test/guitar-analyser
```

## Running the Application

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# API available at http://localhost:8000
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
# UI available at http://localhost:3000
```

## CORS Configuration

The backend includes CORS middleware configured to accept requests from any origin:
- `allow_origins`: ["*"]
- `allow_methods`: ["*"]
- `allow_headers`: ["*"]

This allows the frontend to communicate with the backend during development. In production, restrict this to specific origins.

## Data Flow

1. **User creates session** → Session stored in sessionStorage
2. **User uploads audio** → Frontend sends to `POST /analyze`
3. **Backend processes** → Extracts audio features using librosa/scipy
4. **Backend sends webhook** → Forwards data to n8n webhook
5. **Frontend receives response** → Displays analysis results
6. **User can view sessions** → `GET /sessions` retrieves all sessions

## Error Handling

Both API endpoints follow standard HTTP status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `500` - Server error

Error responses include a message explaining the issue:
```json
{
  "message": "Error description"
}
```

## File Upload Constraints

- **Supported Formats**: WAV, MP3
- **Maximum File Size**: 50 MB (enforced by frontend validation)
- **Audio Processing**: 
  - Converted to mono
  - Sample rate auto-detected and preserved
  - Duration: typically 30 seconds to 5 minutes for best results

## Deployment Considerations

### Backend Deployment
- Deploy FastAPI application to server (Gunicorn, Uvicorn)
- Configure `N8N_WEBHOOK_URL` environment variable
- Set appropriate CORS origins for production
- Ensure sufficient disk space for audio processing

### Frontend Deployment
- Build: `pnpm build`
- Set `NEXT_PUBLIC_BACKEND_URL` to production backend URL
- Deploy to Vercel or similar Next.js hosting

## Testing the API

### Using cURL

```bash
# Upload and analyze
curl -X POST http://localhost:8000/analyze \
  -F "file=@guitar_sample.wav" \
  -F "session_name=Test Session" \
  -F "session_date=2025-11-18" \
  -F "session_notes=Test notes"

# Get sessions
curl http://localhost:8000/sessions
```

### Using Python

```python
import requests

# Upload file
files = {'file': open('guitar_sample.wav', 'rb')}
data = {
    'session_name': 'Test',
    'session_date': '2025-11-18',
    'session_notes': 'Test'
}
response = requests.post(
    'http://localhost:8000/analyze',
    files=files,
    data=data
)
print(response.json())
```
