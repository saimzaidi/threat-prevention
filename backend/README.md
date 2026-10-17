# Threat Prevention — Backend Service

The backend API service for Threat Prevention (CODE//CONNECT’26 — Problem Statement 02) is consolidated into `server.ts` as an integrated Express service that serves both API endpoints and the Vite frontend.

## Available Endpoints:
- `GET /api/health` — Returns backend health status and version metadata
- `POST /api/videos/upload` — Accepts and validates uploaded video footage (MP4, MOV, AVI, WebM; max 100MB)
- `GET /api/videos/:upload_id` — Returns upload status and metadata

## Development:
```bash
npm run dev
```
Starts the full-stack server on `http://0.0.0.0:3000`.
