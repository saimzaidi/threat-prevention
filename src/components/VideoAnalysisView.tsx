import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Video, 
  AlertCircle, 
  CheckCircle, 
  FileCheck, 
  Info, 
  Clock, 
  Cpu,
  Loader2,
  Server,
  Hash
} from 'lucide-react';
import { uploadVideo, VideoUploadResult } from '../api/client';

export const VideoAnalysisView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<VideoUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allowed formats and limits
  const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const MAX_SIZE_MB = 100;

  const handleFile = (file: File) => {
    setFileError(null);
    setUploadError(null);
    setUploadResult(null);

    // Validate type
    const isExtensionValid = /\.(mp4|mov|avi|webm)$/i.test(file.name);
    if (!ALLOWED_TYPES.includes(file.type) && !isExtensionValid) {
      setFileError('Unsupported file format. Please upload an MP4, MOV, AVI, or WebM video.');
      return;
    }

    // Validate size
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > MAX_SIZE_MB) {
      setFileError(`File size (${sizeInMb.toFixed(1)} MB) exceeds the ${MAX_SIZE_MB} MB prototype limit.`);
      return;
    }

    // Clean up old preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    setUploadError(null);

    const result = await uploadVideo(selectedFile);
    setIsUploading(false);

    if (result.success && result.data) {
      setUploadResult(result.data);
    } else {
      setUploadError(result.error || 'Video upload to backend failed.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setUploadError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Pipeline Status Notice */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 md:p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-900 block">
            Video Upload & Ingestion Pipeline (Stage 4)
          </span>
          <p className="leading-relaxed">
            Upload security footage directly to the local FastAPI backend. Files are validated server-side, assigned an isolated UUID, and written to a bounded temporary storage directory. OpenCV frame sampling and AI inference (Stage 5) will process the verified upload.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            Upload Video for Threat Analysis
          </h2>
          <span className="text-[11px] text-neutral-500 font-mono">
            Formats: MP4, MOV, AVI, WebM · Max {MAX_SIZE_MB}MB
          </span>
        </div>

        {/* Drag and Drop Container */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-neutral-900 bg-stone-50'
              : 'border-stone-300 hover:border-neutral-400 bg-stone-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-200/80 flex items-center justify-center text-neutral-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900">
                Click to browse or drag and drop security footage
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Local-only file processing · Videos are streamed to local backend
              </p>
            </div>
          </div>
        </div>

        {/* File Error Message */}
        {fileError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Selected File Details and Local Preview */}
      {selectedFile && previewUrl && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-semibold text-neutral-900">
                Selected Footage Preview
              </h3>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline"
            >
              Choose different file
            </button>
          </div>

          {/* Video Metadata Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200 font-mono">
            <div>
              <span className="text-neutral-500 text-[10px] block font-sans">Filename</span>
              <span className="text-neutral-900 truncate block font-medium" title={selectedFile.name}>
                {selectedFile.name}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block font-sans">File Size</span>
              <span className="text-neutral-900 font-medium">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block font-sans">Format</span>
              <span className="text-neutral-900 font-medium">
                {selectedFile.type || 'video/mp4'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block font-sans">Backend Status</span>
              {uploadResult ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Uploaded
                </span>
              ) : (
                <span className="text-neutral-600 font-medium">Ready to Upload</span>
              )}
            </div>
          </div>

          {/* HTML5 Video Player */}
          <div className="rounded-lg overflow-hidden bg-black border border-neutral-800">
            <video
              src={previewUrl}
              controls
              className="w-full max-h-[360px] mx-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Upload Failed</span>
                <p className="text-[11px] leading-relaxed">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Upload Success Card */}
          {uploadResult && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-950">
                    Video Upload Stored on Backend
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                  Status: {uploadResult.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-emerald-900">
                <div className="flex items-center gap-1.5 p-2 bg-white/70 rounded-md border border-emerald-100">
                  <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-emerald-600 block font-sans">Upload ID</span>
                    <span className="truncate block font-semibold">{uploadResult.upload_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-2 bg-white/70 rounded-md border border-emerald-100">
                  <Server className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-600 block font-sans">Stored Size & Storage Mode</span>
                    <span className="font-semibold">
                      {(uploadResult.size_bytes / (1024 * 1024)).toFixed(2)} MB · {uploadResult.storage_mode}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
                The video file has been received and verified by the FastAPI backend. AI inference (OpenCV frame sampling and PyroNear YOLO11s smoke detection) has not yet run and will be connected in Stage 5.
              </p>
            </div>
          )}

          {/* Analysis Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-500">
              Target model: <span className="font-mono text-neutral-800 font-medium">pyronear/yolo11s_sensitive-detector</span> (ONNX CPU)
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleUploadAndAnalyze}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 ${
                isUploading
                  ? 'bg-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Backend...</span>
                </>
              ) : uploadResult ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Re-upload Video</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Stage for Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Planned Pipeline Explanation Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
          Planned Processing Architecture (Stages 2–5)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-neutral-900">
              <Clock className="w-4 h-4 text-neutral-600" />
              <span>1. OpenCV Sampling</span>
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              FastAPI opens video stream locally, validates decodability, and samples frames at 1-second intervals without loading the full video into memory.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-neutral-900">
              <Cpu className="w-4 h-4 text-neutral-600" />
              <span>2. ONNX Inference</span>
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              YOLO11s runs on CPU using ONNX Runtime. Evaluates frames for smoke candidate classes and verifies multi-frame temporal consistency.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-neutral-900">
              <CheckCircle className="w-4 h-4 text-neutral-600" />
              <span>3. Incident Creation</span>
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Qualifying detections are committed to local SQLite with timestamp, frame evidence, and confidence metrics for operator triage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

