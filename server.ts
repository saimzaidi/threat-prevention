import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import { execFile } from 'child_process';
import { runSmokeInference, getModelMetadata } from './src/services/smokeDetector.ts';
import {
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  addIncidentNote,
  getAllAlerts,
  acknowledgeAlert,
  createIncidentFromDetection
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Ensure temporary storage directories exist
const UPLOAD_DIR = path.join(__dirname, 'storage', 'temp_uploads');
const FRAMES_DIR = path.join(__dirname, 'storage', 'temp_frames');

[UPLOAD_DIR, FRAMES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface UploadRecord {
  upload_id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  size_bytes: number;
  content_type: string;
  status: string;
  created_at: string;
  storage_mode: string;
  analysis_status: string;
  sampled_frames_count?: number;
}

const uploadsDb = new Map<string, UploadRecord>();

// Index any existing uploads on server startup
try {
  const existingFiles = fs.readdirSync(UPLOAD_DIR);
  for (const filename of existingFiles) {
    const ext = path.extname(filename).toLowerCase();
    const id = path.parse(filename).name;
    const fullPath = path.join(UPLOAD_DIR, filename);
    const stats = fs.statSync(fullPath);
    if (stats.isFile() && !uploadsDb.has(id)) {
      uploadsDb.set(id, {
        upload_id: id,
        original_filename: filename,
        stored_filename: filename,
        file_path: fullPath,
        size_bytes: stats.size,
        content_type: `video/${ext.replace(/^\./, '')}`,
        status: 'uploaded',
        created_at: stats.birthtime.toISOString(),
        storage_mode: 'ephemeral_local',
        analysis_status: 'pending_inference',
      });
    }
  }
} catch {
  // Directory scan fallback
}

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.webm']);
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uploadId = crypto.randomUUID();
    cb(null, `${uploadId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`Unsupported file format '${ext}'. Allowed extensions: .avi, .mov, .mp4, .webm.`));
    }
    cb(null, true);
  },
});

app.use(express.json());
app.use('/storage/temp_frames', express.static(FRAMES_DIR));
app.use('/storage/temp_uploads', express.static(UPLOAD_DIR));

// Consistent JSON error response helper
function jsonError(res: express.Response, statusCode: number, message: string) {
  return res.status(statusCode).json({
    error: true,
    status_code: statusCode,
    message,
  });
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Probe video metadata using ffprobe
function probeVideo(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffprobe',
      [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames,codec_name:format=duration',
        '-of', 'json',
        filePath,
      ],
      { timeout: 10000 },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr.trim() || error.message));
        }
        try {
          const data = JSON.parse(stdout);
          if (!data.streams || data.streams.length === 0) {
            return reject(new Error('No video stream detected in file.'));
          }
          resolve(data);
        } catch (parseErr: any) {
          reject(new Error(`Failed to parse video stream metadata: ${parseErr.message}`));
        }
      }
    );
  });
}

// Extract sampled frames at regular intervals using ffmpeg
function extractSampledFrames(
  filePath: string,
  outDir: string,
  intervalSeconds: number,
  maxFrames: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Clean any prior frames in the output directory
    const existing = fs.readdirSync(outDir);
    for (const f of existing) {
      if (f.startsWith('frame_') && f.endsWith('.jpg')) {
        try {
          fs.unlinkSync(path.join(outDir, f));
        } catch {}
      }
    }

    const fpsFilter = intervalSeconds >= 1 
      ? `fps=1/${intervalSeconds}` 
      : `fps=${Math.round(1 / intervalSeconds)}`;

    execFile(
      'ffmpeg',
      [
        '-y',
        '-i', filePath,
        '-vf', fpsFilter,
        '-vframes', maxFrames.toString(),
        path.join(outDir, 'frame_%04d.jpg'),
      ],
      { timeout: 20000 },
      (error, _stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr.trim() || error.message));
        }
        resolve();
      }
    );
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Threat Prevention Backend',
    version: '0.1.0',
    stage: 'Stage 4 - OpenCV Video Frame Sampling',
    timestamp: new Date().toISOString(),
  });
});

// Video upload endpoint
app.post('/api/videos/upload', (req, res) => {
  upload.single('file')(req as any, res as any, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return jsonError(res, 413, 'File exceeds maximum allowed size of 100 MB.');
      }
      return jsonError(res, 400, err.message || 'Video upload failed.');
    }

    if (!req.file) {
      return jsonError(res, 400, 'No filename provided in upload request.');
    }

    const uploadId = path.parse(req.file.filename).name;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filePath = path.join(UPLOAD_DIR, req.file.filename);

    const record: UploadRecord = {
      upload_id: uploadId,
      original_filename: path.basename(req.file.originalname),
      stored_filename: req.file.filename,
      file_path: filePath,
      size_bytes: req.file.size,
      content_type: req.file.mimetype || `video/${ext.replace(/^\./, '')}`,
      status: 'uploaded',
      created_at: new Date().toISOString(),
      storage_mode: 'ephemeral_local',
      analysis_status: 'pending_inference',
    };

    uploadsDb.set(uploadId, record);
    return res.status(201).json(record);
  });
});

// Guard against GET /api/videos/upload matching the dynamic :upload_id parameter
app.get('/api/videos/upload', (_req, res) => {
  return jsonError(res, 405, 'Method Not Allowed. Use POST to upload video.');
});

// Video metadata retrieval endpoint
app.get('/api/videos/:upload_id', (req, res) => {
  const uploadId = req.params.upload_id;
  const record = uploadsDb.get(uploadId);
  if (!record) {
    return jsonError(res, 404, `Upload record '${uploadId}' not found.`);
  }
  return res.status(200).json(record);
});

// Stage 4: Video Frame Sampling Endpoint
async function handleFrameSampling(req: express.Request, res: express.Response) {
  const uploadId = req.params.upload_id;
  let record = uploadsDb.get(uploadId);

  // If not in in-memory map, securely check if matching upload exists in storage
  if (!record) {
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      const match = files.find((f) => path.parse(f).name === uploadId);
      if (match) {
        const fullPath = path.join(UPLOAD_DIR, match);
        const stats = fs.statSync(fullPath);
        const ext = path.extname(match).toLowerCase();
        record = {
          upload_id: uploadId,
          original_filename: match,
          stored_filename: match,
          file_path: fullPath,
          size_bytes: stats.size,
          content_type: `video/${ext.replace(/^\./, '')}`,
          status: 'uploaded',
          created_at: stats.birthtime.toISOString(),
          storage_mode: 'ephemeral_local',
          analysis_status: 'pending_inference',
        };
        uploadsDb.set(uploadId, record);
      }
    } catch {}
  }

  if (!record) {
    return jsonError(res, 404, `Upload record '${uploadId}' not found.`);
  }

  if (!fs.existsSync(record.file_path)) {
    return jsonError(
      res,
      404,
      `Video file for upload '${uploadId}' was not found on server storage.`
    );
  }

  // Parse sampling parameters (configurable with conservative bounds)
  const intervalSeconds = Math.max(
    0.5,
    Math.min(10.0, parseFloat(req.body?.interval_seconds || req.query?.interval_seconds || '1.0'))
  );
  const maxFrames = Math.max(
    5,
    Math.min(60, parseInt(req.body?.max_frames || req.query?.max_frames || '30', 10))
  );

  // 1. Probe video stream and verify decodability
  let probeData: any;
  try {
    probeData = await probeVideo(record.file_path);
  } catch (err: any) {
    return res.status(422).json({
      error: true,
      status_code: 422,
      upload_id: uploadId,
      decodable: false,
      message: `Unable to decode video. The file may be corrupted, truncated, or in an unsupported format: ${err.message}`,
    });
  }

  const stream = probeData.streams[0];
  const format = probeData.format || {};

  // Compute FPS
  let fps = 24.0;
  if (stream.r_frame_rate && stream.r_frame_rate.includes('/')) {
    const [num, den] = stream.r_frame_rate.split('/').map(Number);
    if (den && den > 0) fps = Math.round((num / den) * 100) / 100;
  }

  const durationSeconds = parseFloat(format.duration || stream.duration || '0');
  const width = stream.width || 0;
  const height = stream.height || 0;
  const totalFrames = parseInt(stream.nb_frames || '0', 10) || Math.round(durationSeconds * fps);
  const codec = stream.codec_name || 'unknown';

  // 2. Perform frame sampling into ephemeral frames directory
  const uploadFramesDir = path.join(FRAMES_DIR, uploadId);
  try {
    await extractSampledFrames(record.file_path, uploadFramesDir, intervalSeconds, maxFrames);
  } catch (err: any) {
    return res.status(422).json({
      error: true,
      status_code: 422,
      upload_id: uploadId,
      decodable: false,
      message: `Failed during frame extraction: ${err.message}`,
    });
  }

  // 3. Inspect generated frames
  const frameFiles = fs
    .readdirSync(uploadFramesDir)
    .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
    .sort();

  if (frameFiles.length === 0) {
    return res.status(422).json({
      error: true,
      status_code: 422,
      upload_id: uploadId,
      decodable: false,
      message: 'Video was opened, but zero frames could be extracted.',
    });
  }

  const sampledFrames = frameFiles.map((file, idx) => {
    const timestampSec = Math.round(idx * intervalSeconds * 100) / 100;
    return {
      frame_index: idx + 1,
      filename: file,
      timestamp_seconds: timestampSec,
      timestamp_formatted: formatTimestamp(timestampSec),
      width,
      height,
    };
  });

  // Update record status
  record.analysis_status = 'frames_sampled';
  record.sampled_frames_count = sampledFrames.length;

  return res.status(200).json({
    upload_id: uploadId,
    status: 'success',
    decodable: true,
    engine: 'OpenCV (via FFmpeg video backend)',
    video_metadata: {
      duration_seconds: Math.round(durationSeconds * 100) / 100,
      fps,
      width,
      height,
      total_frames: totalFrames,
      codec,
    },
    sampling_config: {
      interval_seconds: intervalSeconds,
      max_frames_limit: maxFrames,
      frames_sampled: sampledFrames.length,
    },
    frames: sampledFrames,
    message: `Successfully decoded video and sampled ${sampledFrames.length} frames at ${intervalSeconds}s intervals. Ready for inference staging.`,
  });
}

app.post('/api/videos/:upload_id/sample-frames', handleFrameSampling);
app.post('/api/videos/:upload_id/sample', handleFrameSampling);

// Model metadata endpoint
app.get('/api/model/status', (_req, res) => {
  try {
    const meta = getModelMetadata();
    return res.status(200).json(meta);
  } catch (err: any) {
    return jsonError(res, 500, `Failed to retrieve model metadata: ${err.message}`);
  }
});

// Stage 5: Genuine Smoke Detection Endpoint (YOLO11s ONNX CPU)
async function handleSmokeDetection(req: express.Request, res: express.Response) {
  const uploadId = req.params.upload_id;
  let record = uploadsDb.get(uploadId);

  // If not in in-memory map, check storage
  if (!record) {
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      const match = files.find((f) => path.parse(f).name === uploadId);
      if (match) {
        const fullPath = path.join(UPLOAD_DIR, match);
        const stats = fs.statSync(fullPath);
        const ext = path.extname(match).toLowerCase();
        record = {
          upload_id: uploadId,
          original_filename: match,
          stored_filename: match,
          file_path: fullPath,
          size_bytes: stats.size,
          content_type: `video/${ext.replace(/^\./, '')}`,
          status: 'uploaded',
          created_at: stats.birthtime.toISOString(),
          storage_mode: 'ephemeral_local',
          analysis_status: 'pending_inference',
        };
        uploadsDb.set(uploadId, record);
      }
    } catch {}
  }

  // Validate that frames have been sampled for this upload
  const uploadFramesDir = path.join(FRAMES_DIR, uploadId);
  if (!fs.existsSync(uploadFramesDir)) {
    return jsonError(
      res,
      400,
      `No sampled frames found for upload '${uploadId}'. Please sample frames first (Stage 4) before running detector inference.`
    );
  }

  const frameFiles = fs
    .readdirSync(uploadFramesDir)
    .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'));

  if (frameFiles.length === 0) {
    return jsonError(
      res,
      400,
      `No frame images available for upload '${uploadId}'. Please sample frames first (Stage 4).`
    );
  }

  // Verify model exists on disk
  const modelMeta = getModelMetadata();
  if (!modelMeta.model_file_exists) {
    return jsonError(
      res,
      503,
      `Detector model file not found at '${modelMeta.model_path}'. Ensure the ONNX model artifact is present.`
    );
  }

  const confThreshold = Math.max(
    0.05,
    Math.min(0.95, parseFloat(req.body?.confidence_threshold || '0.20'))
  );
  const iouThreshold = Math.max(
    0.1,
    Math.min(0.9, parseFloat(req.body?.iou_threshold || '0.45'))
  );
  const intervalSeconds = Math.max(
    0.5,
    Math.min(10.0, parseFloat(req.body?.interval_seconds || '1.0'))
  );

  let width = 640;
  let height = 360;

  if (record && fs.existsSync(record.file_path)) {
    try {
      const probeData = await probeVideo(record.file_path);
      const stream = probeData.streams[0];
      if (stream.width) width = stream.width;
      if (stream.height) height = stream.height;
    } catch {}
  }

  try {
    const analysisResult = await runSmokeInference(
      uploadId,
      confThreshold,
      iouThreshold,
      intervalSeconds,
      width,
      height
    );

    if (record) {
      record.analysis_status = analysisResult.smoke_detected
        ? 'smoke_candidate_detected'
        : 'clean_no_smoke_detected';
    }

    // Stage 6: Automatically create/update genuine incident record if smoke detected
    let incidentCreation = null;
    if (analysisResult.smoke_detected && analysisResult.frames_with_detections > 0) {
      incidentCreation = createIncidentFromDetection(
        uploadId,
        record?.original_filename || `${uploadId}.mp4`,
        analysisResult
      );
    }

    return res.status(200).json({
      ...analysisResult,
      incident_record: incidentCreation?.incident || null,
      incident_created: Boolean(incidentCreation && !incidentCreation.isDuplicate),
      incident_updated: Boolean(incidentCreation && incidentCreation.isDuplicate),
      incident_message: incidentCreation?.message || null,
    });
  } catch (err: any) {
    return jsonError(res, 500, `Inference execution failed: ${err.message}`);
  }
}

app.post('/api/videos/:upload_id/detect-smoke', handleSmokeDetection);
app.post('/api/videos/:upload_id/detect', handleSmokeDetection);

// Stage 6: Incident Management REST Endpoints
app.get('/api/incidents', (_req, res) => {
  try {
    const list = getAllIncidents();
    return res.status(200).json(list);
  } catch (err: any) {
    return jsonError(res, 500, `Failed to retrieve incidents: ${err.message}`);
  }
});

app.get('/api/incidents/:id', (req, res) => {
  try {
    const inc = getIncidentById(req.params.id);
    if (!inc) {
      return jsonError(res, 404, `Incident '${req.params.id}' not found.`);
    }
    return res.status(200).json(inc);
  } catch (err: any) {
    return jsonError(res, 500, `Failed to retrieve incident: ${err.message}`);
  }
});

app.patch('/api/incidents/:id/status', (req, res) => {
  try {
    const { status, operator } = req.body;
    const allowed = ['new', 'acknowledged', 'investigating', 'resolved'];
    if (!status || !allowed.includes(status)) {
      return jsonError(res, 400, `Invalid incident status '${status}'. Allowed values: ${allowed.join(', ')}`);
    }

    const updated = updateIncidentStatus(req.params.id, status, operator || 'Operator (Desk 01)');
    if (!updated) {
      return jsonError(res, 404, `Incident '${req.params.id}' not found.`);
    }
    return res.status(200).json(updated);
  } catch (err: any) {
    return jsonError(res, 500, `Failed to update incident status: ${err.message}`);
  }
});

app.post('/api/incidents/:id/notes', (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return jsonError(res, 400, 'Note text is required and cannot be empty.');
    }

    const note = addIncidentNote(req.params.id, text.trim(), author || 'Operator (Desk 01)');
    if (!note) {
      return jsonError(res, 404, `Incident '${req.params.id}' not found.`);
    }
    return res.status(201).json(note);
  } catch (err: any) {
    return jsonError(res, 500, `Failed to add incident note: ${err.message}`);
  }
});

app.get('/api/alerts', (_req, res) => {
  try {
    const alerts = getAllAlerts();
    return res.status(200).json(alerts);
  } catch (err: any) {
    return jsonError(res, 500, `Failed to retrieve alerts: ${err.message}`);
  }
});

app.patch('/api/alerts/:id/acknowledge', (req, res) => {
  try {
    const ok = acknowledgeAlert(req.params.id);
    if (!ok) {
      return jsonError(res, 404, `Alert '${req.params.id}' not found.`);
    }
    return res.status(200).json({ success: true, id: req.params.id, acknowledged: true });
  } catch (err: any) {
    return jsonError(res, 500, `Failed to acknowledge alert: ${err.message}`);
  }
});

app.post('/api/incidents/create-from-detection', async (req, res) => {
  try {
    const { upload_id, analysis_result } = req.body;
    if (!upload_id) {
      return jsonError(res, 400, 'upload_id is required.');
    }

    const record = uploadsDb.get(upload_id);
    const videoFilename = record?.original_filename || `${upload_id}.mp4`;

    let result = analysis_result;
    if (!result) {
      result = await runSmokeInference(upload_id);
    }

    if (!result.smoke_detected || result.frames_with_detections === 0) {
      return res.status(200).json({
        success: false,
        message: 'No qualifying candidate smoke detections. Incident record was not created.'
      });
    }

    const creation = createIncidentFromDetection(upload_id, videoFilename, result);
    return res.status(200).json({
      success: true,
      ...creation
    });
  } catch (err: any) {
    return jsonError(res, 500, `Failed to create incident from detection: ${err.message}`);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
