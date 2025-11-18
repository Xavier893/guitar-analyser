# Frontend & Backend API Integration - Summary of Changes

## Overview
Successfully updated the Guitar Analyser frontend and backend to work together using the FastAPI backend API for audio analysis and session management.

## Files Modified

### 1. Frontend API Client (`frontend/lib/api-client.ts`)
**Changes**:
- Updated to use `NEXT_PUBLIC_BACKEND_URL` environment variable (defaults to `http://localhost:8000`)
- Added `uploadAudioFile()` function for uploading audio files to the backend `/analyze` endpoint
- Added `fetchSessions()` function to retrieve sessions from the backend `/sessions` endpoint
- Properly handles multipart form data for file uploads

### 2. Analysis Results Component (`frontend/components/analysis-results.tsx`)
**Changes**:
- Updated `AnalysisData` interface to match backend response structure
- Changed from nested object structure (timing.bpm) to flat structure (bpm)
- Updated metric displays to handle optional fields from backend
- Converted percentage values (0-1 scale) to display format (0-100)
- Made feedback section conditional (only shows if feedback exists)
- Made raw features section conditional (only renders if data exists)

### 3. Session Detail Page (`frontend/app/sessions/[id]/page.tsx`)
**Changes**:
- Added import for `uploadAudioFile` from API client
- Updated `AnalysisData` interface to match backend response
- Replaced mock analysis with actual API call in `handleFileUpload()`
- Now sends file, session name, date, and notes to backend
- Extracts features from backend response and stores in session state

### 4. Home Page (`frontend/app/page.tsx`)
**Changes**:
- Added `useEffect` hook to load sessions on component mount
- Implemented `loadSessions()` function that calls `fetchSessions()` API
- Removed hardcoded mock sessions
- Added loading state while fetching sessions
- Updated sessions list display to handle loading and empty states
- Added refresh callback for sessions list component

### 5. Sessions List Component (`frontend/components/sessions-list.tsx`)
**No changes needed** - Component already supports the session data structure returned by backend

## New Files Created

### 1. Frontend Environment Configuration (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 2. Backend Environment Configuration (`.env`)
```env
N8N_WEBHOOK_URL=https://xavas.app.n8n.cloud/webhook-test/guitar-analyser
```

### 3. API Integration Documentation (`API_INTEGRATION.md`)
Comprehensive guide including:
- Architecture overview
- API endpoint documentation
- Request/response examples
- Frontend integration details
- Component documentation
- Environment setup
- Running instructions
- Error handling
- Deployment considerations
- Testing examples

## Data Flow

### Upload & Analyze
1. User creates session with name, date, and optional notes
2. User uploads audio file via FileUpload component
3. Frontend calls `uploadAudioFile()` → `POST /analyze`
4. Backend processes audio and extracts features
5. Backend sends webhook to n8n
6. Frontend receives response with features
7. Frontend displays analysis results

### View Sessions
1. Home page loads
2. `useEffect` calls `loadSessions()`
3. Frontend fetches from `GET /sessions`
4. Backend returns list of sessions
5. Frontend displays sessions in SessionsList component

## Backend API Endpoints

### POST /analyze
- Input: multipart form-data with file, session_name, session_date, session_notes
- Output: Analysis features (bpm, timing_accuracy, pitch_stability, etc.)
- WebHook: Forwards data to n8n

### GET /sessions
- Input: None (method parameter for n8n routing)
- Output: List of all sessions with their analysis features

## Key Integration Points

1. **Audio File Upload**: Uses multipart/form-data to handle file uploads
2. **Feature Extraction**: Backend extracts 7 key metrics per session
3. **Session Management**: Sessions stored via n8n webhook backend
4. **Error Handling**: Proper error messages from API to frontend
5. **Environment Configuration**: Backend URL configurable per environment

## Testing the Integration

### Prerequisites
- Backend running: `python backend/main.py` (port 8000)
- Frontend running: `cd frontend && pnpm dev` (port 3000)
- n8n webhook configured (for session persistence)

### Test Steps
1. Navigate to http://localhost:3000
2. Click "New Session"
3. Fill in session details and create
4. Upload a WAV or MP3 file
5. Wait for analysis to complete
6. View results displayed with backend metrics

## Benefits of This Integration

✅ **Decoupled Architecture**: Frontend and backend can be deployed independently
✅ **Real Analysis**: Uses actual librosa and scipy for audio processing
✅ **Scalable**: Can handle multiple concurrent uploads
✅ **Extensible**: Easy to add new audio metrics
✅ **Professional Metrics**: Industry-standard audio analysis features
✅ **Data Persistence**: Integration with n8n for session storage

## Next Steps (Optional Enhancements)

- [ ] Add authentication/authorization
- [ ] Implement database storage instead of n8n for sessions
- [ ] Add batch upload capability
- [ ] Implement real-time progress updates via WebSockets
- [ ] Add advanced filtering/sorting for sessions
- [ ] Generate downloadable PDF reports
