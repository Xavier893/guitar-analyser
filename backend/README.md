# Backend (Ready for Railway Deployment)

## How to deploy
1. Push this folder to GitHub
2. Go to Railway → New Project → Deploy from GitHub
3. Add a variable in Railway:
   - N8N_WEBHOOK_URL = your webhook
4. Done

## Endpoints
### POST /analyze
Upload an audio file (wav/mp3). Processes in memory and sends results to n8n.
