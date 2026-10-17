import type { AlertRecord, IncidentRecord, SimulationScenario, ActivityLogItem } from '../types/index.ts';

export const SAMPLE_INCIDENTS: IncidentRecord[] = [
  {
    id: 'INC-2026-001',
    title: 'Outdoor Wildfire Smoke Plume',
    category: 'Fire & Smoke',
    severity: 'high',
    status: 'investigating',
    source: 'real_model',
    videoSource: 'ridge_cam_north_04.mp4',
    videoTimestamp: '00:03:14',
    detectionScore: 0.84,
    detectionRule: 'PyroNear YOLO11s candidate model: smoke class score >= 0.70 sustained across 3 sampled frames',
    description: 'Elevated gray-white smoke plume detected dispersing north-east over ridge line. Sustained detection threshold reached.',
    createdAt: '2026-10-17 02:45:10',
    notes: [
      {
        id: 'note-1',
        author: 'Operator S. Zaidi',
        timestamp: '2026-10-17 02:50:22',
        text: 'Visual inspection confirms smoke pattern. Cross-referencing local forestry weather station. Dispatched site ranger for perimeter check.'
      }
    ],
    isSampleData: true
  },
  {
    id: 'INC-2026-002',
    title: 'Loading Bay Forklift Pedestrian Conflict',
    category: 'Workplace Accident',
    severity: 'critical',
    status: 'new',
    source: 'simulation',
    videoSource: 'bay_c_overhead_08.mp4',
    videoTimestamp: '00:01:42',
    detectionScore: 0.91,
    detectionRule: 'Simulated proximity rule: worker within 1.5m vehicle blind spot without high-vis motion clearance',
    description: '[SIMULATED SCENARIO] Heavy material handling vehicle in motion with pedestrian in active transit corridor.',
    createdAt: '2026-10-17 03:12:05',
    notes: [
      {
        id: 'note-2',
        author: 'System (Scenario Simulator)',
        timestamp: '2026-10-17 03:12:05',
        text: 'Automated test scenario injected for operator escalation protocol verification.'
      }
    ],
    isSampleData: true
  },
  {
    id: 'INC-2026-003',
    title: 'After-Hours Fence Breach Alert',
    category: 'Unauthorized Access / Theft',
    severity: 'medium',
    status: 'acknowledged',
    source: 'rule_based',
    videoSource: 'east_gate_fence_02.mp4',
    videoTimestamp: '00:05:19',
    detectionScore: 0.72,
    detectionRule: 'Rule-based perimeter motion detector: tripwire violation during schedule 23:00 - 06:00',
    description: 'Motion tripwire triggered along secondary eastern fence line. Unidentified figure observed near equipment cache.',
    createdAt: '2026-10-17 01:15:30',
    notes: [
      {
        id: 'note-3',
        author: 'Operator S. Zaidi',
        timestamp: '2026-10-17 01:22:15',
        text: 'Camera zoomed. Figure moved off-property toward service road. Floodlights activated. Logged for night shift review.'
      }
    ],
    isSampleData: true
  },
  {
    id: 'INC-2026-004',
    title: 'Electrical Panel Thermal Overheat',
    category: 'Fire & Smoke',
    severity: 'medium',
    status: 'resolved',
    source: 'simulation',
    videoSource: 'generator_room_01.mp4',
    videoTimestamp: '00:02:11',
    detectionScore: 0.78,
    detectionRule: 'Simulated thermal sensor variance > 45°C over baseline operating ambient',
    description: '[SIMULATED SCENARIO] Local thermal signature exceeded baseline operating threshold in auxiliary switchboard.',
    createdAt: '2026-10-16 19:40:00',
    resolvedAt: '2026-10-16 20:15:22',
    notes: [
      {
        id: 'note-4',
        author: 'Operator S. Zaidi',
        timestamp: '2026-10-16 20:15:22',
        text: 'Maintenance team inspected auxiliary unit. Loose terminal tightened and cooling fan reset. Threat cleared.'
      }
    ],
    isSampleData: true
  }
];

export const SAMPLE_ALERTS: AlertRecord[] = [
  {
    id: 'ALT-109',
    title: 'Smoke Plume Detected (Ridge Cam North)',
    category: 'Fire & Smoke',
    severity: 'high',
    source: 'real_model',
    timestamp: '2026-10-17 02:45:10',
    videoSource: 'ridge_cam_north_04.mp4',
    videoTimestamp: '00:03:14',
    confidenceScore: 0.84,
    triggerRule: 'PyroNear YOLO11s: score >= 0.70 sustained 3 frames',
    incidentId: 'INC-2026-001',
    acknowledged: true,
    isSampleData: true
  },
  {
    id: 'ALT-108',
    title: 'Loading Bay Forklift Collision Risk',
    category: 'Workplace Accident',
    severity: 'critical',
    source: 'simulation',
    timestamp: '2026-10-17 03:12:05',
    videoSource: 'bay_c_overhead_08.mp4',
    videoTimestamp: '00:01:42',
    confidenceScore: 0.91,
    triggerRule: 'Simulation: vehicle-pedestrian proximity zone',
    incidentId: 'INC-2026-002',
    acknowledged: false,
    isSampleData: true
  },
  {
    id: 'ALT-107',
    title: 'Perimeter Tripwire Crossing',
    category: 'Unauthorized Access / Theft',
    severity: 'medium',
    source: 'rule_based',
    timestamp: '2026-10-17 01:15:30',
    videoSource: 'east_gate_fence_02.mp4',
    videoTimestamp: '00:05:19',
    confidenceScore: 0.72,
    triggerRule: 'Rule-based motion tripwire after hours',
    incidentId: 'INC-2026-003',
    acknowledged: true,
    isSampleData: true
  },
  {
    id: 'ALT-106',
    title: 'Auxiliary Generator Thermal Anomaly',
    category: 'Fire & Smoke',
    severity: 'medium',
    source: 'simulation',
    timestamp: '2026-10-16 19:40:00',
    videoSource: 'generator_room_01.mp4',
    videoTimestamp: '00:02:11',
    confidenceScore: 0.78,
    triggerRule: 'Simulation: thermal variance > 45°C',
    incidentId: 'INC-2026-004',
    acknowledged: true,
    isSampleData: true
  }
];

export const PREDEFINED_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scen-smoke-wildfire',
    name: 'Wildfire Smoke Horizon Plume',
    category: 'Fire & Smoke',
    severity: 'high',
    description: 'Simulates daytime outdoor footage where a rising thin column of wildfire smoke appears along the horizon line across three consecutive 1-second sample intervals.',
    simulatedScore: 0.86,
    simulatedTimestamp: '00:02:35',
    videoReference: 'test_footage_pine_ridge.mp4',
    rationale: 'Demonstrates the planned PyroNear YOLO11s smoke detection path and validates multi-frame confirmation logic before escalating to incident status.',
    detectionRule: 'YOLO11s Candidate: smoke class >= 0.75 across >= 2 frames'
  },
  {
    id: 'scen-forklift-hazard',
    name: 'Warehouse Material Handling Collision Hazard',
    category: 'Workplace Accident',
    severity: 'critical',
    description: 'Simulates indoor logistics surveillance where a forklift enters a restricted pedestrian intersection while a worker is carrying supplies without line-of-sight.',
    simulatedScore: 0.92,
    simulatedTimestamp: '00:01:18',
    videoReference: 'test_footage_warehouse_dock.mp4',
    rationale: 'Illustrates how future accident-prevention models or spatial proximity heuristics will be reviewed by an operator without contacting automated external dispatchers.',
    detectionRule: 'Spatial Proximity Heuristic: pedestrian distance < 2.0m to active machinery'
  },
  {
    id: 'scen-physical-altercation',
    name: 'Facility Access Corridor Altercation',
    category: 'Physical Altercation',
    severity: 'critical',
    description: 'Simulates rapid hostile posturing and physical struggle between two individuals near an employee badge turnstile.',
    simulatedScore: 0.88,
    simulatedTimestamp: '00:04:12',
    videoReference: 'test_footage_corridor_b.mp4',
    rationale: 'Demonstrates ethical safety boundaries: shows that violence detection requires high-confidence validated kinematic models rather than inferring intent from ordinary person presence.',
    detectionRule: 'Simulated Action Recognition: rapid kinematic displacement & collision'
  },
  {
    id: 'scen-night-theft',
    name: 'Perimeter Cut & Equipment Staging',
    category: 'Unauthorized Access / Theft',
    severity: 'medium',
    description: 'Simulates night-time infrared surveillance of an individual loitering near an outdoor copper transformer yard and carrying tools.',
    simulatedScore: 0.74,
    simulatedTimestamp: '00:06:50',
    videoReference: 'test_footage_yard_east.mp4',
    rationale: 'Demonstrates distinguishing loitering and tripwire alarms from confirmed theft, allowing operator investigation and manual note logging.',
    detectionRule: 'Temporal Loitering Rule: stationary target > 45s in exclusion zone'
  }
];

export const INITIAL_ACTIVITY_LOG: ActivityLogItem[] = [
  {
    id: 'act-1',
    action: 'Incident Investigated',
    targetId: 'INC-2026-001',
    targetType: 'incident',
    operator: 'Operator S. Zaidi',
    timestamp: '2026-10-17 02:50:22',
    details: 'Status changed to Investigating · Added field note'
  },
  {
    id: 'act-2',
    action: 'Alert Acknowledged',
    targetId: 'ALT-109',
    targetType: 'alert',
    operator: 'Operator S. Zaidi',
    timestamp: '2026-10-17 02:46:01',
    details: 'Verified ridge cam smoke alert'
  },
  {
    id: 'act-3',
    action: 'Scenario Injected',
    targetId: 'INC-2026-002',
    targetType: 'simulation',
    operator: 'Scenario Simulator',
    timestamp: '2026-10-17 03:12:05',
    details: 'Created simulated workplace hazard incident'
  }
];
