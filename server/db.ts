import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import type { 
  IncidentRecord, 
  IncidentStatus, 
  AlertRecord, 
  OperatorNote,
  SmokeAnalysisResult 
} from '../src/types/index.ts';
import { SAMPLE_INCIDENTS, SAMPLE_ALERTS } from '../src/data/mockData.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'threat_prevention.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const db = new DatabaseSync(DB_PATH);
  
  // Enable foreign keys and WAL mode for reliability
  db.exec('PRAGMA foreign_keys = ON;');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      video_source TEXT NOT NULL,
      video_timestamp TEXT NOT NULL,
      detection_score REAL,
      detection_rule TEXT,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      evidence_frame_url TEXT,
      upload_id TEXT,
      model_identifier TEXT,
      affected_frames_count INTEGER DEFAULT 0,
      affected_frames_json TEXT,
      is_sample_data INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS incident_notes (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL,
      author TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY(incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      source TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      video_source TEXT NOT NULL,
      video_timestamp TEXT NOT NULL,
      confidence_score REAL,
      trigger_rule TEXT NOT NULL,
      incident_id TEXT,
      acknowledged INTEGER DEFAULT 0,
      is_sample_data INTEGER DEFAULT 0
    );
  `);

  // Seed sample data if table is currently empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number };
  if (countRow.count === 0) {
    seedInitialData(db);
  }

  dbInstance = db;
  return db;
}

function seedInitialData(db: DatabaseSync) {
  const insertIncident = db.prepare(`
    INSERT INTO incidents (
      id, title, category, severity, status, source, video_source,
      video_timestamp, detection_score, detection_rule, description,
      created_at, resolved_at, evidence_frame_url, upload_id,
      model_identifier, affected_frames_count, affected_frames_json, is_sample_data
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertNote = db.prepare(`
    INSERT INTO incident_notes (id, incident_id, author, timestamp, text)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      id, title, category, severity, source, timestamp, video_source,
      video_timestamp, confidence_score, trigger_rule, incident_id,
      acknowledged, is_sample_data
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const inc of SAMPLE_INCIDENTS) {
    insertIncident.run(
      inc.id,
      inc.title,
      inc.category,
      inc.severity,
      inc.status,
      inc.source,
      inc.videoSource,
      inc.videoTimestamp,
      inc.detectionScore ?? null,
      inc.detectionRule ?? null,
      inc.description,
      inc.createdAt,
      inc.resolvedAt ?? null,
      inc.evidenceFrameUrl ?? null,
      inc.uploadId ?? null,
      inc.modelIdentifier ?? null,
      inc.affectedFramesCount ?? 0,
      inc.affectedFrames ? JSON.stringify(inc.affectedFrames) : null,
      inc.isSampleData ? 1 : 0
    );

    for (const note of inc.notes) {
      insertNote.run(note.id, inc.id, note.author, note.timestamp, note.text);
    }
  }

  for (const alt of SAMPLE_ALERTS) {
    insertAlert.run(
      alt.id,
      alt.title,
      alt.category,
      alt.severity,
      alt.source,
      alt.timestamp,
      alt.videoSource,
      alt.videoTimestamp,
      alt.confidenceScore ?? null,
      alt.triggerRule,
      alt.incidentId ?? null,
      alt.acknowledged ? 1 : 0,
      alt.isSampleData ? 1 : 0
    );
  }
}

export function getAllIncidents(): IncidentRecord[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all() as any[];

  return rows.map((row) => {
    const notesRows = db.prepare(
      'SELECT id, author, timestamp, text FROM incident_notes WHERE incident_id = ? ORDER BY timestamp ASC'
    ).all(row.id) as unknown as OperatorNote[];

    let affectedFrames: any = undefined;
    if (row.affected_frames_json) {
      try {
        affectedFrames = JSON.parse(row.affected_frames_json);
      } catch {}
    }

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      severity: row.severity,
      status: row.status as IncidentStatus,
      source: row.source,
      videoSource: row.video_source,
      videoTimestamp: row.video_timestamp,
      detectionScore: row.detection_score !== null ? row.detection_score : undefined,
      detectionRule: row.detection_rule || undefined,
      description: row.description,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at || undefined,
      evidenceFrameUrl: row.evidence_frame_url || undefined,
      uploadId: row.upload_id || undefined,
      modelIdentifier: row.model_identifier || undefined,
      affectedFramesCount: row.affected_frames_count || 0,
      affectedFrames,
      notes: notesRows,
      isSampleData: Boolean(row.is_sample_data),
    };
  });
}

export function getIncidentById(id: string): IncidentRecord | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as any;
  if (!row) return null;

  const notesRows = db.prepare(
    'SELECT id, author, timestamp, text FROM incident_notes WHERE incident_id = ? ORDER BY timestamp ASC'
  ).all(row.id) as unknown as OperatorNote[];

  let affectedFrames: any = undefined;
  if (row.affected_frames_json) {
    try {
      affectedFrames = JSON.parse(row.affected_frames_json);
    } catch {}
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    severity: row.severity,
    status: row.status as IncidentStatus,
    source: row.source,
    videoSource: row.video_source,
    videoTimestamp: row.video_timestamp,
    detectionScore: row.detection_score !== null ? row.detection_score : undefined,
    detectionRule: row.detection_rule || undefined,
    description: row.description,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
    evidenceFrameUrl: row.evidence_frame_url || undefined,
    uploadId: row.upload_id || undefined,
    modelIdentifier: row.model_identifier || undefined,
    affectedFramesCount: row.affected_frames_count || 0,
    affectedFrames,
    notes: notesRows,
    isSampleData: Boolean(row.is_sample_data),
  };
}

export function getIncidentByUploadId(uploadId: string): IncidentRecord | null {
  const db = getDatabase();
  const row = db.prepare('SELECT id FROM incidents WHERE upload_id = ? LIMIT 1').get(uploadId) as any;
  if (!row) return null;
  return getIncidentById(row.id);
}

export function updateIncidentStatus(
  id: string, 
  status: IncidentStatus, 
  operator = 'Operator (Desk 01)'
): IncidentRecord | null {
  const db = getDatabase();
  const existing = getIncidentById(id);
  if (!existing) return null;

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const resolvedAt = status === 'resolved' ? now : (status === 'investigating' && existing.status === 'resolved' ? null : existing.resolvedAt || null);

  db.prepare('UPDATE incidents SET status = ?, resolved_at = ? WHERE id = ?').run(
    status,
    resolvedAt,
    id
  );

  // Append audit trail note
  const noteId = `note-${Date.now()}`;
  db.prepare(`
    INSERT INTO incident_notes (id, incident_id, author, timestamp, text)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    noteId,
    id,
    operator,
    now,
    `Operator status change: Marked as ${status.toUpperCase()}`
  );

  return getIncidentById(id);
}

export function addIncidentNote(
  incidentId: string, 
  text: string, 
  author = 'Operator (Desk 01)'
): OperatorNote | null {
  const db = getDatabase();
  const existing = getIncidentById(incidentId);
  if (!existing) return null;

  const noteId = `note-${Date.now()}`;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.prepare(`
    INSERT INTO incident_notes (id, incident_id, author, timestamp, text)
    VALUES (?, ?, ?, ?, ?)
  `).run(noteId, incidentId, author, timestamp, text);

  return {
    id: noteId,
    author,
    timestamp,
    text
  };
}

export function getAllAlerts(): AlertRecord[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC').all() as any[];

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    severity: r.severity,
    source: r.source,
    timestamp: r.timestamp,
    videoSource: r.video_source,
    videoTimestamp: r.video_timestamp,
    confidenceScore: r.confidence_score !== null ? r.confidence_score : undefined,
    triggerRule: r.trigger_rule,
    incidentId: r.incident_id || undefined,
    acknowledged: Boolean(r.acknowledged),
    isSampleData: Boolean(r.is_sample_data)
  }));
}

export function acknowledgeAlert(alertId: string): boolean {
  const db = getDatabase();
  const res = db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(alertId);
  return res.changes > 0;
}

export interface IncidentCreationResult {
  incident: IncidentRecord;
  alert?: AlertRecord;
  isDuplicate: boolean;
  message: string;
}

/**
 * Creates or updates an incident record strictly from genuine AI smoke detection results.
 * Enforces deduplication on upload_id, creates an alert, and saves to SQLite.
 */
export function createIncidentFromDetection(
  uploadId: string,
  videoFilename: string,
  analysisResult: SmokeAnalysisResult
): IncidentCreationResult | null {
  // Integrity check: NEVER create incident from non-detection results
  if (!analysisResult.smoke_detected || analysisResult.frames_with_detections === 0) {
    return null;
  }

  const db = getDatabase();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Find all frames with candidate detections
  const detectingFrames = analysisResult.frame_results
    .filter((f) => f.smoke_detected && f.detections.length > 0)
    .map((f) => ({
      frame_index: f.frame_index,
      timestamp_seconds: f.timestamp_seconds,
      timestamp_formatted: f.timestamp_formatted,
      confidence: f.max_score,
      filename: f.filename,
      bbox: f.detections[0]?.bbox,
      normalized_bbox: f.detections[0]?.normalized_bbox,
    }));

  const primaryFrame = detectingFrames[0] || analysisResult.frame_results[0];
  const maxScore = analysisResult.max_confidence_detected;

  // Severity rule: based on model confidence
  const severity = maxScore >= 0.40 ? 'critical' : maxScore >= 0.20 ? 'high' : 'medium';

  // Deduplication check: Has an incident already been created for this upload?
  const existing = getIncidentByUploadId(uploadId);
  if (existing) {
    // Update existing incident with latest inference pass instead of creating duplicate
    db.prepare(`
      UPDATE incidents
      SET detection_score = MAX(detection_score, ?),
          affected_frames_count = ?,
          affected_frames_json = ?
      WHERE id = ?
    `).run(
      maxScore,
      detectingFrames.length,
      JSON.stringify(detectingFrames),
      existing.id
    );

    addIncidentNote(
      existing.id,
      `Re-analyzed video with YOLO11s ONNX. Peak confidence observed: ${(maxScore * 100).toFixed(1)}% across ${detectingFrames.length} candidate frame(s). Incident record updated.`,
      'AI Detector (Deduplication System)'
    );

    return {
      incident: getIncidentById(existing.id)!,
      isDuplicate: true,
      message: `Existing incident ${existing.id} updated with new inference data (deduplication applied).`
    };
  }

  // Create new genuine incident record
  const incidentId = `INC-${uploadId.slice(0, 8).toUpperCase()}`;
  const alertId = `ALT-${uploadId.slice(0, 8).toUpperCase()}`;

  const title = `Candidate Smoke Signature (${(maxScore * 100).toFixed(0)}%)`;
  const evidenceFrameUrl = primaryFrame?.filename 
    ? `/storage/temp_frames/${uploadId}/${primaryFrame.filename}` 
    : undefined;

  const detectionRule = `PyroNear YOLO11s ONNX: Smoke candidate score ${(maxScore * 100).toFixed(1)}% across ${detectingFrames.length} sampled frame(s).`;
  const description = `Visual smoke candidate detected by YOLO11s ONNX CPU detector in video '${videoFilename}'. Detected in ${detectingFrames.length} frame(s) with peak confidence of ${(maxScore * 100).toFixed(1)}% at timestamp ${primaryFrame?.timestamp_formatted || '00:00.000'}. CANDIDATE ALERT ONLY: Visual pattern detection requires human operator inspection before taking response action.`;

  db.prepare(`
    INSERT INTO incidents (
      id, title, category, severity, status, source, video_source,
      video_timestamp, detection_score, detection_rule, description,
      created_at, resolved_at, evidence_frame_url, upload_id,
      model_identifier, affected_frames_count, affected_frames_json, is_sample_data
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
    )
  `).run(
    incidentId,
    title,
    'Fire & Smoke',
    severity,
    'new',
    'real_model',
    videoFilename,
    primaryFrame?.timestamp_formatted || '00:00.000',
    maxScore,
    detectionRule,
    description,
    now,
    null,
    evidenceFrameUrl || null,
    uploadId,
    'pyronear/yolo11s_sensitive-detector (YOLO11s ONNX CPU)',
    detectingFrames.length,
    JSON.stringify(detectingFrames)
  );

  // Initial audit trail note
  db.prepare(`
    INSERT INTO incident_notes (id, incident_id, author, timestamp, text)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `note-${Date.now()}`,
    incidentId,
    'AI Detector Engine',
    now,
    `Automated incident ticket opened following verified ONNX CPU detection. Peak confidence: ${(maxScore * 100).toFixed(1)}%. Operator inspection required.`
  );

  // Associated Alert Record
  db.prepare(`
    INSERT INTO alerts (
      id, title, category, severity, source, timestamp, video_source,
      video_timestamp, confidence_score, trigger_rule, incident_id,
      acknowledged, is_sample_data
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
    )
  `).run(
    alertId,
    title,
    'Fire & Smoke',
    severity,
    'real_model',
    now,
    videoFilename,
    primaryFrame?.timestamp_formatted || '00:00.000',
    maxScore,
    detectionRule,
    incidentId,
    0
  );

  const newIncident = getIncidentById(incidentId)!;
  const newAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as any;

  return {
    incident: newIncident,
    alert: {
      id: newAlert.id,
      title: newAlert.title,
      category: newAlert.category,
      severity: newAlert.severity,
      source: newAlert.source,
      timestamp: newAlert.timestamp,
      videoSource: newAlert.video_source,
      videoTimestamp: newAlert.video_timestamp,
      confidenceScore: newAlert.confidence_score,
      triggerRule: newAlert.trigger_rule,
      incidentId: newAlert.incident_id,
      acknowledged: Boolean(newAlert.acknowledged),
      isSampleData: false
    },
    isDuplicate: false,
    message: `Genuine incident ${incidentId} created and committed to SQLite database.`
  };
}
