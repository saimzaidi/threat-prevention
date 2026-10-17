export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved';

export type DetectionSource = 'real_model' | 'rule_based' | 'simulation';

export type ThreatCategory = 
  | 'Fire & Smoke'
  | 'Workplace Accident'
  | 'Physical Altercation'
  | 'Unauthorized Access / Theft'
  | 'Perimeter Anomaly';

export interface OperatorNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  category: ThreatCategory;
  severity: SeverityLevel;
  status: IncidentStatus;
  source: DetectionSource;
  videoSource: string;
  videoTimestamp: string;
  detectionScore?: number;
  detectionRule?: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
  evidenceFrameUrl?: string;
  notes: OperatorNote[];
  isSampleData?: boolean;
}

export interface AlertRecord {
  id: string;
  title: string;
  category: ThreatCategory;
  severity: SeverityLevel;
  source: DetectionSource;
  timestamp: string;
  videoSource: string;
  videoTimestamp: string;
  confidenceScore?: number;
  triggerRule: string;
  incidentId?: string;
  acknowledged: boolean;
  isSampleData?: boolean;
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: ThreatCategory;
  severity: SeverityLevel;
  description: string;
  simulatedScore: number;
  simulatedTimestamp: string;
  videoReference: string;
  rationale: string;
  detectionRule: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  targetId: string;
  targetType: 'incident' | 'alert' | 'video' | 'simulation';
  operator: string;
  timestamp: string;
  details: string;
}

export interface SampledFrameMetadata {
  frame_index: number;
  filename?: string;
  timestamp_seconds: number;
  timestamp_formatted: string;
  width: number;
  height: number;
}

export interface VideoMetadata {
  duration_seconds: number;
  fps: number;
  width: number;
  height: number;
  total_frames: number;
  codec: string;
}

export interface FrameSamplingResult {
  upload_id: string;
  status: string;
  decodable: boolean;
  engine: string;
  video_metadata: VideoMetadata;
  sampling_config: {
    interval_seconds: number;
    max_frames_limit: number;
    frames_sampled: number;
  };
  frames: SampledFrameMetadata[];
  message: string;
}

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


