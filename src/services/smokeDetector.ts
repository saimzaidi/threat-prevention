import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import * as ort from 'onnxruntime-node';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface NormalizedBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SmokeDetection {
  class: string;
  confidence: number;
  bbox: BoundingBox;
  normalized_bbox: NormalizedBoundingBox;
}

export interface FrameInferenceResult {
  frame_index: number;
  filename: string;
  timestamp_seconds: number;
  timestamp_formatted: string;
  smoke_detected: boolean;
  max_score: number;
  detections: SmokeDetection[];
}

export interface SmokeAnalysisResult {
  upload_id: string;
  status: string;
  smoke_detected: boolean;
  model_info: {
    name: string;
    version: string;
    architecture: string;
    target_class: string;
    license: string;
    input_shape: number[];
    confidence_threshold: number;
    iou_threshold: number;
    engine: string;
  };
  total_frames_evaluated: number;
  frames_with_detections: number;
  max_confidence_detected: number;
  processing_time_ms: number;
  frame_results: FrameInferenceResult[];
  notice: string;
}

const MODEL_PATH = path.resolve(process.cwd(), 'models', 'yolo11s_smoke', 'best.onnx');
let sessionInstance: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;

export async function getInferenceSession(): Promise<ort.InferenceSession> {
  if (sessionInstance) return sessionInstance;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error(`ONNX model file not found at expected path: ${MODEL_PATH}`);
  }

  sessionLoadingPromise = (async () => {
    try {
      const session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['cpu'],
      });
      sessionInstance = session;
      return session;
    } catch (err: any) {
      sessionLoadingPromise = null;
      throw new Error(`Failed to load ONNX Runtime session for YOLO11s smoke detector: ${err.message}`);
    }
  })();

  return sessionLoadingPromise;
}

export function getModelMetadata() {
  return {
    name: 'pyronear/yolo11s_sensitive-detector',
    version: 'v1.1.0',
    architecture: 'YOLO11s',
    target_class: 'smoke',
    license: 'Apache-2.0',
    input_shape: [1, 3, 1024, 1024],
    default_confidence_threshold: 0.20,
    default_iou_threshold: 0.45,
    engine: 'ONNX Runtime CPU',
    model_file_exists: fs.existsSync(MODEL_PATH),
    model_path: MODEL_PATH,
  };
}

/**
 * Resize and extract raw RGB24 buffer at 1024x1024 using ffmpeg.
 */
function extractRawRGB1024(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-i', filePath,
        '-vf', 'scale=1024:1024',
        '-f', 'rawvideo',
        '-pix_fmt', 'rgb24',
        '-',
      ],
      { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024, timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr.toString().trim() || err.message));
        }
        if (stdout.length !== 1024 * 1024 * 3) {
          return reject(new Error(`Unexpected raw buffer size: ${stdout.length} (expected ${1024 * 1024 * 3})`));
        }
        resolve(stdout);
      }
    );
  });
}

function calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
  const [x1A, y1A, x2A, y2A] = boxA;
  const [x1B, y1B, x2B, y2B] = boxB;

  const interX1 = Math.max(x1A, x1B);
  const interY1 = Math.max(y1A, y1B);
  const interX2 = Math.min(x2A, x2B);
  const interY2 = Math.min(y2A, y2B);

  const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const areaA = (x2A - x1A) * (y2A - y1A);
  const areaB = (x2B - x1B) * (y2B - y1B);
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

function nonMaxSuppression(
  boxes: Array<{ score: number; box: [number, number, number, number]; normBox: [number, number, number, number] }>,
  iouThreshold: number
) {
  // Sort descending by confidence score
  boxes.sort((a, b) => b.score - a.score);

  const selected: typeof boxes = [];
  for (const candidate of boxes) {
    let keep = true;
    for (const existing of selected) {
      if (calculateIoU(candidate.box, existing.box) > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) {
      selected.push(candidate);
      if (selected.length >= 10) break; // Limit max detections per frame to 10
    }
  }

  return selected;
}

/**
 * Preprocesses a single frame, runs ONNX inference with YOLO11s, and applies NMS.
 */
export async function evaluateFrame(
  framePath: string,
  origWidth = 640,
  origHeight = 360,
  confThreshold = 0.20,
  iouThreshold = 0.45
): Promise<{ max_score: number; detections: SmokeDetection[] }> {
  const session = await getInferenceSession();
  const rawRgb = await extractRawRGB1024(framePath);

  const numPixels = 1024 * 1024;
  const floatData = new Float32Array(3 * numPixels);
  for (let i = 0; i < numPixels; i++) {
    floatData[i] = rawRgb[i * 3] / 255.0;
    floatData[numPixels + i] = rawRgb[i * 3 + 1] / 255.0;
    floatData[2 * numPixels + i] = rawRgb[i * 3 + 2] / 255.0;
  }

  const tensor = new ort.Tensor('float32', floatData, [1, 3, 1024, 1024]);
  const results = await session.run({ images: tensor });
  const outputData = results.output0.data as Float32Array;

  const numAnchors = 21504;
  let maxScore = 0;
  const rawCandidates: Array<{
    score: number;
    box: [number, number, number, number];
    normBox: [number, number, number, number];
  }> = [];

  for (let i = 0; i < numAnchors; i++) {
    const score = outputData[4 * numAnchors + i];
    if (score > maxScore) maxScore = score;

    if (score >= confThreshold) {
      const cx = outputData[0 * numAnchors + i];
      const cy = outputData[1 * numAnchors + i];
      const w = outputData[2 * numAnchors + i];
      const h = outputData[3 * numAnchors + i];

      const x1 = Math.max(0, Math.min(origWidth, (cx - w / 2) * (origWidth / 1024)));
      const y1 = Math.max(0, Math.min(origHeight, (cy - h / 2) * (origHeight / 1024)));
      const x2 = Math.max(0, Math.min(origWidth, (cx + w / 2) * (origWidth / 1024)));
      const y2 = Math.max(0, Math.min(origHeight, (cy + h / 2) * (origHeight / 1024)));

      rawCandidates.push({
        score: Math.round(score * 1000) / 1000,
        box: [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)],
        normBox: [
          Math.round((x1 / origWidth) * 1000) / 1000,
          Math.round((y1 / origHeight) * 1000) / 1000,
          Math.round((x2 / origWidth) * 1000) / 1000,
          Math.round((y2 / origHeight) * 1000) / 1000,
        ],
      });
    }
  }

  const nmsDetections = nonMaxSuppression(rawCandidates, iouThreshold);

  const formattedDetections: SmokeDetection[] = nmsDetections.map((d) => ({
    class: 'smoke',
    confidence: d.score,
    bbox: {
      x1: d.box[0],
      y1: d.box[1],
      x2: d.box[2],
      y2: d.box[3],
      width: d.box[2] - d.box[0],
      height: d.box[3] - d.box[1],
    },
    normalized_bbox: {
      x1: d.normBox[0],
      y1: d.normBox[1],
      x2: d.normBox[2],
      y2: d.normBox[3],
    },
  }));

  return {
    max_score: Math.round(maxScore * 1000) / 1000,
    detections: formattedDetections,
  };
}

/**
 * Runs genuine smoke detection inference on all sampled frames belonging to an upload ID.
 */
export async function runSmokeInference(
  uploadId: string,
  confThreshold = 0.20,
  iouThreshold = 0.45
): Promise<SmokeAnalysisResult> {
  const startTime = Date.now();
  const framesDir = path.resolve(process.cwd(), 'storage', 'temp_frames', uploadId);

  if (!fs.existsSync(framesDir)) {
    throw new Error(`No sampled frames found for upload '${uploadId}'. Please run frame sampling (Stage 4) first.`);
  }

  const frameFiles = fs
    .readdirSync(framesDir)
    .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
    .sort();

  if (frameFiles.length === 0) {
    throw new Error(`Sampled frames directory for upload '${uploadId}' is empty. Please run frame sampling first.`);
  }

  // Probe original video width/height if available, otherwise default to 640x360
  let width = 640;
  let height = 360;

  const frameResults: FrameInferenceResult[] = [];
  let maxConfidenceDetected = 0;
  let framesWithDetections = 0;

  for (let idx = 0; idx < frameFiles.length; idx++) {
    const filename = frameFiles[idx];
    const framePath = path.join(framesDir, filename);
    const timestampSec = Math.round(idx * 1.0 * 100) / 100;
    const mins = Math.floor(timestampSec / 60);
    const secs = Math.floor(timestampSec % 60);
    const ms = Math.floor((timestampSec % 1) * 1000);
    const timestampFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;

    try {
      const { max_score, detections } = await evaluateFrame(
        framePath,
        width,
        height,
        confThreshold,
        iouThreshold
      );

      if (max_score > maxConfidenceDetected) {
        maxConfidenceDetected = max_score;
      }

      const hasSmoke = detections.length > 0;
      if (hasSmoke) {
        framesWithDetections++;
      }

      frameResults.push({
        frame_index: idx + 1,
        filename,
        timestamp_seconds: timestampSec,
        timestamp_formatted: timestampFormatted,
        smoke_detected: hasSmoke,
        max_score,
        detections,
      });
    } catch (err: any) {
      frameResults.push({
        frame_index: idx + 1,
        filename,
        timestamp_seconds: timestampSec,
        timestamp_formatted: timestampFormatted,
        smoke_detected: false,
        max_score: 0,
        detections: [],
      });
    }
  }

  const processingTimeMs = Date.now() - startTime;
  const overallSmokeDetected = framesWithDetections > 0;

  return {
    upload_id: uploadId,
    status: 'success',
    smoke_detected: overallSmokeDetected,
    model_info: {
      name: 'pyronear/yolo11s_sensitive-detector',
      version: 'v1.1.0',
      architecture: 'YOLO11s',
      target_class: 'smoke',
      license: 'Apache-2.0',
      input_shape: [1, 3, 1024, 1024],
      confidence_threshold: confThreshold,
      iou_threshold: iouThreshold,
      engine: 'ONNX Runtime CPU',
    },
    total_frames_evaluated: frameFiles.length,
    frames_with_detections: framesWithDetections,
    max_confidence_detected: maxConfidenceDetected,
    processing_time_ms: processingTimeMs,
    frame_results: frameResults,
    notice: 'Smoke detection provides visual candidate signals only. It is not confirmation of fire or an emergency. Operational review by a human operator is required.',
  };
}
