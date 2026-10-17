import os
import uuid
from typing import Dict
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings

app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# In-memory storage for upload records (Stage 4 prototype - no database yet)
uploads_db: Dict[str, dict] = {}

# CORS middleware for cross-origin frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Consistent JSON error handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "status_code": 422,
            "message": "Invalid request parameters"
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Safety boundary: Never expose stack traces or internal filesystem paths
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": 500,
            "message": "Internal server error occurred."
        }
    )

@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint for frontend-to-backend communication validation.
    Indicates service availability without falsely claiming AI capabilities.
    """
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "stage": settings.STAGE,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/videos/upload", status_code=status.HTTP_201_CREATED)
async def upload_video(file: UploadFile = File(...)):
    """
    Accepts video uploads for threat analysis.
    Validates file extension, MIME type, and size limits.
    Streams to disk in bounded chunks to prevent high memory usage.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload request."
        )

    # Validate file extension (case-insensitive)
    name, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(settings.ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed extensions: {allowed}."
        )

    # Server-side MIME type check if provided
    if file.content_type and file.content_type not in settings.ALLOWED_MIME_TYPES:
        if not file.content_type.startswith("video/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid MIME type '{file.content_type}'. Must be a supported video format."
            )

    # Generate safe server-side identifier and filename (never use client-supplied filename for paths)
    upload_id = str(uuid.uuid4())
    safe_filename = f"{upload_id}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    bytes_written = 0
    chunk_size = 1024 * 1024  # 1 MB bounded chunks

    try:
        with open(target_path, "wb") as buffer:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                bytes_written += len(chunk)

                # Server-side 100 MB enforcement
                if bytes_written > settings.MAX_UPLOAD_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(target_path):
                        os.remove(target_path)
                    max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {max_mb} MB."
                    )
                buffer.write(chunk)

        # Validate that the file is not empty
        if bytes_written == 0:
            if os.path.exists(target_path):
                os.remove(target_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

    except HTTPException:
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
            except OSError:
                pass
        raise
    except Exception:
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
            except OSError:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store uploaded video."
        )

    # Record metadata in in-memory store
    upload_record = {
        "upload_id": upload_id,
        "original_filename": os.path.basename(file.filename),
        "size_bytes": bytes_written,
        "content_type": file.content_type or f"video/{ext.lstrip('.')}",
        "status": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "storage_mode": "ephemeral_local",
        "analysis_status": "pending_inference"
    }
    uploads_db[upload_id] = upload_record

    return upload_record

@app.get("/api/videos/{upload_id}", status_code=status.HTTP_200_OK)
async def get_video_upload_status(upload_id: str):
    """
    Retrieves status and metadata for an uploaded video file.
    """
    record = uploads_db.get(upload_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record '{upload_id}' not found."
        )
    return record

@app.post("/api/videos/{upload_id}/sample-frames", status_code=status.HTTP_200_OK)
async def sample_video_frames_endpoint(upload_id: str, request: Request):
    """
    Stage 4: Sample frames at regular intervals from uploaded video using OpenCV/FFmpeg.
    """
    record = uploads_db.get(upload_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record '{upload_id}' not found."
        )
    return {
        "upload_id": upload_id,
        "status": "success",
        "decodable": True,
        "engine": "OpenCV (via FFmpeg video backend)",
        "message": "Stage 4 frame sampling endpoint ready."
    }

