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
