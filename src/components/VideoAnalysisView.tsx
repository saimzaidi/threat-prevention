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
import { 
  uploadVideo, 
  sampleVideoFrames, 
  detectSmokeInVideo, 
  fetchModelStatus, 
  VideoUploadResult, 
  ModelStatus 
} from '../api/client';
import { FrameSamplingResult, SmokeAnalysisResult } from '../types';

interface VideoAnalysisViewProps {
  onNavigateToIncident?: (incidentId: string) => void;
  onRefreshIncidents?: () => void;
}

export const VideoAnalysisView: React.FC<VideoAnalysisViewProps> = ({
  onNavigateToIncident,
  onRefreshIncidents,
}) => {
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

  // Stage 5 Real AI Smoke Detection State
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<SmokeAnalysisResult | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState<number>(0.20);
  const [iouThreshold, setIouThreshold] = useState<number>(0.45);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(1);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  // Stage 6 Associated Incident State
  const [associatedIncident, setAssociatedIncident] = useState<any | null>(null);
  const [incidentMessage, setIncidentMessage] = useState<string | null>(null);

  // Check model metadata on load
  React.useEffect(() => {
    fetchModelStatus().then((res) => {
      if (res.success && res.data) {
        setModelStatus(res.data);
      }
    });
  }, []);

  // Allowed formats and limits
  const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const MAX_SIZE_MB = 100;

  const handleFile = (file: File) => {
    setFileError(null);
    setUploadError(null);
    setUploadResult(null);
    setSamplingResult(null);
    setSamplingError(null);
    setDetectionResult(null);
    setDetectionError(null);
    setSelectedFrameIndex(1);

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
    setDetectionResult(null);
    setDetectionError(null);
    setSelectedFrameIndex(1);

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
    setDetectionResult(null);
    setDetectionError(null);
    setSelectedFrameIndex(1);

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

  const handleDetectSmoke = async () => {
    if (!uploadResult || isDetecting) return;
    setIsDetecting(true);
    setDetectionError(null);

    const result = await detectSmokeInVideo(uploadResult.upload_id, {
      confidence_threshold: confThreshold,
      iou_threshold: iouThreshold,
    });
    setIsDetecting(false);

    if (result.success && result.data) {
      setDetectionResult(result.data);
      const raw = result.data as any;
      if (raw.incident_record) {
        setAssociatedIncident(raw.incident_record);
        setIncidentMessage(raw.incident_message || 'Incident saved to SQLite database.');
        onRefreshIncidents?.();
      } else {
        setAssociatedIncident(null);
        setIncidentMessage(null);
      }
      const firstHit = result.data.frame_results.find((f) => f.smoke_detected);
      if (firstHit) {
        setSelectedFrameIndex(firstHit.frame_index);
      } else {
        setSelectedFrameIndex(1);
      }
    } else {
      setDetectionError(result.error || 'Smoke detector inference execution failed.');
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
    setDetectionResult(null);
    setDetectionError(null);
    setAssociatedIncident(null);
    setIncidentMessage(null);
    setSelectedFrameIndex(1);
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

          {/* Stage 5: Genuine AI Smoke Detection Card */}
          {uploadResult && (
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-neutral-800" />
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Stage 5 — Real AI Smoke Detection (YOLO11s ONNX CPU)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
                  <span>ONNX CPU Engine Ready</span>
                </div>
              </div>

              {/* Model Provenance and Metadata Banner */}
              <div className="bg-white p-3.5 rounded-lg border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-neutral-700">
                <div>
                  <span className="text-[10px] text-neutral-500 font-sans block">Model Architecture</span>
                  <span className="font-semibold text-neutral-900">{modelStatus?.architecture || 'YOLO11s'} (PyroNear)</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-sans block">Tensor Input</span>
                  <span className="font-semibold text-neutral-900">1×3×1024×1024 RGB</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-sans block">Anchors Evaluated</span>
                  <span className="font-semibold text-neutral-900">21,504 / frame</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-sans block">License & Engine</span>
                  <span className="font-semibold text-neutral-900">{modelStatus?.license || 'Apache-2.0'} · CPU</span>
                </div>
              </div>

              {!samplingResult ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    Please run <strong>Stage 4: OpenCV Frame Sampling</strong> above first. The detector requires decoded video frames in isolated temporary storage before executing ONNX inference.
                  </p>
                </div>
              ) : (
                <>
                  {/* Detection Configuration Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-stone-200">
                    <div className="space-y-1">
                      <label htmlFor="conf-threshold" className="text-[11px] font-medium text-neutral-700 block">
                        Confidence Threshold (Sensitivity)
                      </label>
                      <select
                        id="conf-threshold"
                        value={confThreshold}
                        onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                        disabled={isDetecting}
                        className="w-full text-xs bg-stone-50 border border-stone-300 rounded-md px-2.5 py-1.5 text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                      >
                        <option value="0.15">0.15 (High sensitivity / early wildfire signal)</option>
                        <option value="0.20">0.20 (Standard recommended)</option>
                        <option value="0.25">0.25 (Balanced)</option>
                        <option value="0.35">0.35 (High confidence only)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="iou-threshold" className="text-[11px] font-medium text-neutral-700 block">
                        NMS IoU Overlap Threshold
                      </label>
                      <select
                        id="iou-threshold"
                        value={iouThreshold}
                        onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                        disabled={isDetecting}
                        className="w-full text-xs bg-stone-50 border border-stone-300 rounded-md px-2.5 py-1.5 text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                      >
                        <option value="0.30">0.30 (Aggressive suppression)</option>
                        <option value="0.45">0.45 (Standard IoU)</option>
                        <option value="0.60">0.60 (Permissive boxes)</option>
                      </select>
                    </div>
                  </div>

                  {/* Run Inference Action Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-neutral-500">
                      Evaluates <span className="font-semibold text-neutral-800">{samplingResult.frames.length}</span> staged frames on local CPU
                    </div>

                    <button
                      type="button"
                      disabled={isDetecting}
                      onClick={handleDetectSmoke}
                      className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 ${
                        isDetecting
                          ? 'bg-neutral-600 cursor-not-allowed'
                          : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer'
                      }`}
                    >
                      {isDetecting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Running YOLO11s ONNX Inference...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Real Smoke Detector (ONNX CPU)</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Inference Error Banner */}
              {detectionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">Inference Execution Error</span>
                    <p className="text-[11px] leading-relaxed">{detectionError}</p>
                  </div>
                </div>
              )}

              {/* Genuine Inference Results Display */}
              {detectionResult && (
                <div className="mt-4 bg-white border border-stone-200 rounded-xl p-5 space-y-5">
                  {/* Status Banner: Clearly distinguishing genuine detections vs no detections */}
                  {detectionResult.smoke_detected ? (
                    <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-amber-950">
                        <span className="font-bold text-sm block text-amber-900">
                          Smoke Candidate Detected
                        </span>
                        <p className="leading-relaxed">
                          YOLO11s ONNX inference detected candidate smoke patterns in{' '}
                          <strong>{detectionResult.frames_with_detections} of {detectionResult.total_frames_evaluated}</strong> evaluated frames.
                          Peak candidate confidence: <strong>{(detectionResult.max_confidence_detected * 100).toFixed(1)}%</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-emerald-950">
                        <span className="font-bold text-sm block text-emerald-900">
                          Clean Video: No Smoke Detected
                        </span>
                        <p className="leading-relaxed">
                          YOLO11s ONNX inference evaluated all <strong>{detectionResult.total_frames_evaluated}</strong> sampled frames across the video duration.
                          Peak candidate score observed was <strong>{(detectionResult.max_confidence_detected * 100).toFixed(1)}%</strong> (below the detection threshold of {(confThreshold * 100).toFixed(0)}%). Zero candidate smoke boxes triggered.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stage 6: Persistent Incident Status Box */}
                  {associatedIncident ? (
                    <div className="p-4 bg-stone-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono font-bold bg-amber-400 text-neutral-950 px-2 py-0.5 rounded">
                            Stage 6 Incident Committed
                          </span>
                          <span className="text-xs font-mono font-semibold text-neutral-100">
                            {associatedIncident.id}
                          </span>
                          <span className="text-[11px] text-neutral-400">·</span>
                          <span className="text-[11px] text-amber-300 font-medium">
                            Status: {associatedIncident.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {incidentMessage || 'Candidate detection ticket saved to local SQLite database with affected frame evidence.'}
                        </p>
                      </div>

                      {onNavigateToIncident && (
                        <button
                          type="button"
                          onClick={() => onNavigateToIncident(associatedIncident.id)}
                          className="px-3.5 py-1.5 text-xs font-medium bg-white text-neutral-900 rounded-lg hover:bg-stone-100 transition-colors shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Open Incident Ticket</span>
                        </button>
                      )}
                    </div>
                  ) : !detectionResult.smoke_detected ? (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-neutral-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                        <span>System Policy: No qualifying candidate smoke detections. Per safety rules, no incident ticket was created.</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">Zero False Incidents</span>
                    </div>
                  ) : null}

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Frames Evaluated</span>
                      <span className="font-semibold text-neutral-900">{detectionResult.total_frames_evaluated}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Frames With Detections</span>
                      <span className={`font-semibold ${detectionResult.frames_with_detections > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}`}>
                        {detectionResult.frames_with_detections}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Max Model Score</span>
                      <span className="font-semibold text-neutral-900">
                        {(detectionResult.max_confidence_detected * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Inference Latency</span>
                      <span className="font-semibold text-neutral-900">
                        {(detectionResult.processing_time_ms / 1000).toFixed(2)}s
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">Avg Latency / Frame</span>
                      <span className="font-semibold text-neutral-900">
                        {Math.round(detectionResult.processing_time_ms / (detectionResult.total_frames_evaluated || 1))} ms
                      </span>
                    </div>
                  </div>

                  {/* Per-Frame Inspection & Evidence Visualization */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                        Per-Frame Inference Evidence Inspector
                      </h4>
                      <span className="text-[11px] text-neutral-500">
                        Select any frame to inspect visual bounding boxes
                      </span>
                    </div>

                    {/* Frame Selector Timeline Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {detectionResult.frame_results.map((frame) => {
                        const isSelected = selectedFrameIndex === frame.frame_index;
                        return (
                          <button
                            key={frame.frame_index}
                            type="button"
                            onClick={() => setSelectedFrameIndex(frame.frame_index)}
                            className={`px-3 py-2 rounded-lg text-xs font-mono text-left shrink-0 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                : frame.smoke_detected
                                ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                                : 'bg-stone-50 text-neutral-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-sans font-medium text-[11px]">#{frame.frame_index}</span>
                              {frame.smoke_detected ? (
                                <span className={`text-[9px] font-sans font-semibold px-1 py-0.2 rounded ${isSelected ? 'bg-amber-400 text-neutral-900' : 'bg-amber-200 text-amber-900'}`}>
                                  {frame.detections.length} candidate{frame.detections.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className={`text-[9px] font-sans px-1 py-0.2 rounded ${isSelected ? 'bg-neutral-700 text-neutral-300' : 'text-neutral-400'}`}>
                                  Clean
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold mt-0.5">
                              {frame.timestamp_formatted}
                            </div>
                            <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              Score: {(frame.max_score * 100).toFixed(1)}%
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Frame Detail Canvas */}
                    {(() => {
                      const frame = detectionResult.frame_results.find(
                        (f) => f.frame_index === selectedFrameIndex
                      ) || detectionResult.frame_results[0];

                      if (!frame) return null;

                      return (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-neutral-900">
                                Frame #{frame.frame_index}
                              </span>
                              <span className="text-neutral-400">·</span>
                              <span className="font-mono font-medium text-neutral-800">
                                Timestamp: {frame.timestamp_formatted} ({frame.timestamp_seconds.toFixed(2)}s)
                              </span>
                              <span className="text-neutral-400">·</span>
                              <span className="text-neutral-500 font-mono">
                                Peak Score: {(frame.max_score * 100).toFixed(1)}%
                              </span>
                            </div>

                            <div>
                              {frame.smoke_detected ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3 text-amber-700" />
                                  {frame.detections.length} Smoke Bounding Box{frame.detections.length > 1 ? 'es' : ''}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  No Smoke Detected (Score &lt; {(confThreshold * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Image Canvas with Real Bounding Box Overlays */}
                          <div className="relative mx-auto max-w-2xl rounded-lg overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                            <img
                              src={`/storage/temp_frames/${uploadResult.upload_id}/${frame.filename}`}
                              alt={`Sampled frame ${frame.frame_index} at ${frame.timestamp_formatted}`}
                              className="w-full h-auto block select-none"
                            />

                            {/* Bounding box overlays */}
                            {frame.detections.map((det, dIdx) => {
                              const { normalized_bbox } = det;
                              const top = `${normalized_bbox.y1 * 100}%`;
                              const left = `${normalized_bbox.x1 * 100}%`;
                              const width = `${(normalized_bbox.x2 - normalized_bbox.x1) * 100}%`;
                              const height = `${(normalized_bbox.y2 - normalized_bbox.y1) * 100}%`;

                              return (
                                <div
                                  key={dIdx}
                                  className="absolute border-2 border-amber-500 bg-amber-500/20 pointer-events-none transition-all"
                                  style={{ top, left, width, height }}
                                >
                                  <div className="absolute -top-5 left-0 bg-amber-600 text-white text-[10px] font-mono px-1 py-0.2 rounded font-semibold whitespace-nowrap shadow-xs">
                                    smoke: {(det.confidence * 100).toFixed(1)}%
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Bounding Box Coordinate Table */}
                          {frame.detections.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-medium text-neutral-700 block">
                                Detected Candidate Bounding Boxes:
                              </span>
                              <div className="border border-stone-200 rounded-lg overflow-hidden bg-white text-xs font-mono divide-y divide-stone-100">
                                {frame.detections.map((det, idx) => (
                                  <div
                                    key={idx}
                                    className="px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                                      <span className="font-semibold text-neutral-900 font-sans">
                                        Candidate #{idx + 1}
                                      </span>
                                      <span className="text-neutral-500">
                                        [x1: {det.bbox.x1}, y1: {det.bbox.y1}, x2: {det.bbox.x2}, y2: {det.bbox.y2}]
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-neutral-500">
                                        {det.bbox.width} × {det.bbox.height} px
                                      </span>
                                      <span className="font-bold text-amber-700">
                                        Confidence: {(det.confidence * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-neutral-600 flex items-center justify-between">
                              <span>Zero candidate detections met the threshold of {(confThreshold * 100).toFixed(0)}% on this frame.</span>
                              <span className="font-mono text-neutral-500 text-[11px]">Highest evaluated anchor score: {(frame.max_score * 100).toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Safety Boundary Banner from Model Notice */}
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-neutral-600 leading-relaxed space-y-1">
                    <span className="font-semibold text-neutral-900 block font-sans">
                      Safety & Operational Boundary:
                    </span>
                    <p>{detectionResult.notice}</p>
                  </div>
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
