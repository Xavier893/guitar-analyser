# Quick Start - Running the Application

## Prerequisites

- Python 3.8+
- Node.js 16+
- pnpm (or npm)
- git

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- FastAPI
- Uvicorn
- librosa
- numpy
- scipy
- httpx

### 2. Configure Environment (Optional)
Create `.env` file in backend directory:
```bash
cat > .env << EOF
N8N_WEBHOOK_URL=https://xavas.app.n8n.cloud/webhook-test/guitar-analyser
EOF
```

### 3. Start Backend Server
```bash
cd backend
python main.py
```

Backend will be available at: `http://localhost:8000`

#### Optional: Using Uvicorn directly
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

### 2. Configure Environment (Optional)
Create `.env.local` file in frontend directory:
```bash
cat > .env.local << EOF
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

### 3. Start Frontend Server
```bash
cd frontend
pnpm dev
```

Frontend will be available at: `http://localhost:3000`

## Testing the Integration

### 1. Check Backend Health
```bash
curl http://localhost:8000/sessions
```

### 2. Upload a Test Audio File
```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@path/to/audio.wav" \
  -F "session_name=Test Session" \
  -F "session_date=2025-11-18" \
  -F "session_notes=Test upload"
```

### 3. Access Frontend
Open browser and navigate to: `http://localhost:3000`

## Common Issues & Troubleshooting

### Backend Port Already in Use
If port 8000 is already in use:
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
python main.py --port 8001
```

### CORS Issues
If you see CORS errors, make sure:
1. Backend is running with CORS middleware enabled (it is by default)
2. Frontend is trying to reach correct backend URL
3. Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`

### Audio File Issues
Supported formats:
- WAV (.wav)
- MP3 (.mp3)

For best results:
- Sample rate: 44.1 kHz or higher
- Duration: 30 seconds to 5 minutes
- File size: Under 50 MB

### Python Import Errors
If you get librosa import errors:
```bash
cd backend
pip install librosa numpy scipy httpx fastapi uvicorn
```

## File Upload Examples

### Using Python
```python
import requests

files = {'file': open('guitar.wav', 'rb')}
data = {
    'session_name': 'My Session',
    'session_date': '2025-11-18',
    'session_notes': 'Practice session'
}

response = requests.post(
    'http://localhost:8000/analyze',
    files=files,
    data=data
)

print(response.json())
```

### Using JavaScript/Fetch
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('session_name', 'My Session')
formData.append('session_date', '2025-11-18')
formData.append('session_notes', 'Practice session')

const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  body: formData
})

const data = await response.json()
console.log(data)
```

## Production Deployment

### Backend (Production)
```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app

# Using Docker
docker build -t guitar-analyser-backend .
docker run -p 8000:8000 guitar-analyser-backend
```

### Frontend (Production)
```bash
# Build and start
cd frontend
pnpm build
pnpm start

# Or deploy to Vercel
vercel --prod
```

### Important for Production
1. Set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL
2. Update CORS settings in backend to only allow your frontend domain
3. Use environment variables for sensitive data
4. Enable HTTPS
5. Consider adding authentication
6. Monitor API usage and add rate limiting

## API Documentation

Full API documentation is available in `API_INTEGRATION.md`

Endpoints:
- `POST /analyze` - Upload and analyze audio
- `GET /sessions` - Get all sessions

## Support

For issues or questions:
1. Check the `API_INTEGRATION.md` documentation
2. Review error messages in console output
3. Check network tab in browser DevTools
4. Review backend logs in terminal

## Next Steps

1. Create your first session and upload an audio file
2. Explore the analysis metrics
3. Customize the frontend to match your branding
4. Integrate with your database for session storage
5. Add authentication if needed
