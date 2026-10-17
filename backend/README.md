# Threat Prevention — Backend Service

FastAPI backend service for Threat Prevention (CODE//CONNECT’26 — Problem Statement 02).

## Current Stage: Stage 2 — Backend Foundation

This service currently provides:
- FastAPI initialization and configuration.
- Health-check endpoint: `GET /api/health`.
- Consistent JSON error handling.
- CORS support for local React/Vite development.

*(Video processing, OpenCV, and ONNX Runtime inference will be added in Stages 4 and 5).*

---

## Local Windows Development Instructions

### Step 1: Open a new terminal for the backend
Open PowerShell or Command Prompt in the project root directory (`threat-prevention/`):

```powershell
cd backend
```

### Step 2: Create a virtual environment
Run:
```powershell
python -m venv venv
```

### Step 3: Activate the virtual environment
On Windows (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
```
*(If script execution is disabled on PowerShell, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`, or use Command Prompt: `venv\Scripts\activate.bat`)*

### Step 4: Install minimal backend dependencies
```powershell
pip install -r requirements.txt
```

### Step 5: Start the FastAPI development server
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- Health check: `http://127.0.0.1:8000/api/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

---

## Running the Complete System (Two Terminals)

- **Terminal 1 (Backend):**
  ```powershell
  cd backend
  .\venv\Scripts\activate
  uvicorn main:app --reload --port 8000
  ```

- **Terminal 2 (Frontend):**
  ```powershell
  npm run dev
  ```
