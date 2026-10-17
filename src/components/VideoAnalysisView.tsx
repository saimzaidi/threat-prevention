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
  Hash,
  Film,
  Layers,
  Sliders,
  CheckCircle2,
  Play
} from 'lucide-react';
import { uploadVideo, sampleVideoFrames, VideoUploadResult } from '../api/client';
import { FrameSamplingResult } from '../types';

export const VideoAnalysisView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<VideoUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage 4 Frame Sampling State
  const [isSampling, setIsSampling] = useState(false);
  const [samplingResult, setSamplingResult] = useState<FrameSamplingResult | null>(null);
  const [samplingError, setSamplingError] = useState<string | null>(null);
  const [samplingInterval, setSamplingInterval] = useState<number>(1.0);
  const [maxFramesLimit, setMaxFramesLimit] = useState<number>(30);

  // Allowed formats and limits
  const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const MAX_SIZE_MB = 100;

  const handleFile = (file: File) => {
    setFileError(null);
    setUploadError(null);
    setUploadResult(null);
    setSamplingResult(null);
    setSamplingError(null);

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
    setSamplingResult(null);
    setSamplingError(null);

    const result = await uploadVideo(selectedFile);
    setIsUploading(false);

    if (result.success && result.data) {
      setUploadResult(result.data);
    } else {
      setUploadError(result.error || 'Video upload to backend failed.');
    }
  };

  const handleSampleFrames = async () => {
    if (!uploadResult || isSampling) return;
    setIsSampling(true);
    setSamplingError(null);

    const result = await sampleVideoFrames(uploadResult.upload_id, {
      interval_seconds: samplingInterval,
      max_frames: maxFramesLimit,
    });
    setIsSampling(false);

    if (result.success && result.data) {
      setSamplingResult(result.data);
    } else {
      setSamplingError(result.error || 'Failed to decode and sample video frames.');
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
    setSamplingResult(null);
    setSamplingError(null);
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
            Video Ingestion & Frame Sampling Pipeline (Stages 3 & 4)
          </span>
          <p className="leading-relaxed">
            Upload security footage to backend storage, verify decodability, and extract a bounded, timestamped sample of frames at regular intervals using the OpenCV/FFmpeg engine. Frame metadata is extracted without loading entire videos into memory, preparing footage for Stage 5 inference.
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
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
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
                The video file has been received and verified by the backend. Proceed to Stage 4 to sample frames at regular intervals using OpenCV before detector inference.
              </p>
            </div>
          )}

          {/* Upload Button */}
          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
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

          {/* Stage 4: OpenCV Frame Sampling Card */}
          {uploadResult && (
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Stage 4 — OpenCV Video Frame Sampling
                  </h3>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Engine: OpenCV (FFmpeg Demuxer)
                </span>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Probe the uploaded video container, confirm decodability, and extract a bounded sample of video frames at regular time intervals without loading the full video into memory.
              </p>

              {/* Sampling Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-stone-200">
                <div className="space-y-1">
                  <label htmlFor="sampling-interval" className="text-[11px] font-medium text-neutral-700 block">
                    Sampling Interval (Seconds)
                  </label>
                  <select
                    id="sampling-interval"
                    value={samplingInterval}
                    onChange={(e) => setSamplingInterval(parseFloat(e.target.value))}
                    disabled={isSampling}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-md px-2.5 py-1.5 text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="0.5">Every 0.5s (High density)</option>
                    <option value="1.0">Every 1.0s (Recommended standard)</option>
                    <option value="2.0">Every 2.0s (Sparse overview)</option>
                    <option value="5.0">Every 5.0s (Long video scan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="max-frames-limit" className="text-[11px] font-medium text-neutral-700 block">
                    Max Frame Limit (Bounded Memory)
                  </label>
                  <select
                    id="max-frames-limit"
                    value={maxFramesLimit}
                    onChange={(e) => setMaxFramesLimit(parseInt(e.target.value, 10))}
                    disabled={isSampling}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-md px-2.5 py-1.5 text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="10">10 Frames (Fast probe)</option>
                    <option value="20">20 Frames</option>
                    <option value="30">30 Frames (Recommended default)</option>
                    <option value="50">50 Frames (Extended inspection)</option>
                  </select>
                </div>
              </div>

              {/* Sample Action Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-neutral-500">
                  Target: Upload ID <span className="font-mono text-neutral-800">{uploadResult.upload_id.slice(0, 8)}...</span>
                </div>

                <button
                  type="button"
                  disabled={isSampling}
                  onClick={handleSampleFrames}
                  className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 ${
                    isSampling
                      ? 'bg-neutral-600 cursor-not-allowed'
                      : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer'
                  }`}
                >
                  {isSampling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Decoding & Sampling Frames...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Sample Frames with OpenCV</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sampling Error Banner */}
              {samplingError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">Sampling Error</span>
                    <p className="text-[11px] leading-relaxed">{samplingError}</p>
                  </div>
                </div>
              )}

              {/* Sampling Success Results */}
              {samplingResult && (
                <div className="mt-4 bg-white border border-stone-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-neutral-900">
                        OpenCV Video Stream & Decoded Frame Metadata
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                      Decodable: Verified
                    </span>
                  </div>

                  {/* Stream Properties */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono bg-stone-50 p-3 rounded-lg border border-stone-200 text-neutral-800">
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Duration</span>
                      <span className="font-semibold">{samplingResult.video_metadata.duration_seconds}s</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Framerate</span>
                      <span className="font-semibold">{samplingResult.video_metadata.fps} fps</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Resolution</span>
                      <span className="font-semibold">
                        {samplingResult.video_metadata.width} × {samplingResult.video_metadata.height}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Codec</span>
                      <span className="font-semibold uppercase">{samplingResult.video_metadata.codec}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Sampled Frames</span>
                      <span className="font-semibold text-emerald-700">
                        {samplingResult.frames.length} / {samplingResult.video_metadata.total_frames}
                      </span>
                    </div>
                  </div>

                  {/* Sampled Frames Timeline Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-600">
                      <span className="font-medium text-neutral-900">
                        Extracted Frame Timeline ({samplingResult.sampling_config.interval_seconds}s interval)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {samplingResult.frames.length} frames staged
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100 text-xs font-mono">
                      {samplingResult.frames.map((frame) => (
                        <div
                          key={frame.frame_index}
                          className="px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 font-sans text-[11px] w-6">
                              #{frame.frame_index}
                            </span>
                            <span className="font-semibold text-neutral-900">
                              {frame.timestamp_formatted}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              ({frame.timestamp_seconds.toFixed(2)}s)
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-neutral-500">
                              {frame.width}×{frame.height}
                            </span>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-medium font-sans">
                              Decoded Matrix OK
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Stage Boundary Note */}
                  <p className="text-[11px] text-neutral-500 leading-relaxed border-t border-stone-100 pt-3">
                    <span className="font-semibold text-neutral-700">Safety & Stage Boundary:</span> Frame decoding verified successfully. Frames are staged in isolated server storage for Stage 5 inference. No smoke or threat presence has been inferred or claimed at this stage.
                  </p>
                </div>
              )}
            </div>
          )}
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
              Opens video stream locally, validates decodability, and samples frames at configurable intervals without loading the full video into memory.
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
