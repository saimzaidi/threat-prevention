import { 
  FrameSamplingResult, 
  SmokeAnalysisResult, 
  IncidentRecord, 
  AlertRecord, 
  OperatorNote, 
  IncidentStatus 
} from '../types';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  stage: string;
  timestamp: string;
}

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export interface BackendHealthState {
  status: ConnectionStatus;
  data?: HealthResponse;
  error?: string;
  lastChecked?: string;
}

export interface VideoUploadResult {
  upload_id: string;
  original_filename: string;
  size_bytes: number;
  content_type: string;
  status: string;
  created_at: string;
  storage_mode: string;
  analysis_status: string;
}

const rawBase = (import.meta?.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBase === '/api' ? '' : rawBase;

/**
 * Safely extracts a brief, sanitized preview from HTML or non-JSON responses.
 * Avoids leaking raw internal HTML or unparsed markup into the operator UI.
 */
function sanitizeResponsePreview(text: string, maxLen = 140): string {
  if (!text) return '';
  // Check for HTML <title> tag first
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  // Strip HTML tags and normalize whitespace
  const stripped = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return '';
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen)}...` : stripped;
}

/**
 * Robust JSON response parser that handles HTML error pages from reverse proxies,
 * 413 payloads, and dev-server fallbacks without crashing on JSON.parse('<').
 */
async function parseJsonResponse<T>(response: Response): Promise<{
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}> {
  const status = response.status;
  const statusText =
    response.statusText ||
    (status === 413
      ? 'Payload Too Large'
      : status === 404
      ? 'Not Found'
      : status === 502
      ? 'Bad Gateway'
      : status === 503
      ? 'Service Unavailable'
      : 'Error');

  const contentType = response.headers.get('content-type') || '';

  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    return {
      ok: false,
      status,
      error: `Failed to read response from server (HTTP ${status})`,
    };
  }

  // Attempt to parse JSON if content-type indicates it or text starts with JSON delimiters
  const isLikelyJson =
    contentType.includes('application/json') ||
    rawText.trim().startsWith('{') ||
    rawText.trim().startsWith('[');

  if (isLikelyJson) {
    try {
      const parsed = JSON.parse(rawText) as T;
      if (!response.ok) {
        const errorMsg =
          (parsed as any)?.message ||
          (parsed as any)?.detail ||
          (parsed as any)?.error ||
          `HTTP ${status}: ${statusText}`;
        return { ok: false, status, data: parsed, error: errorMsg };
      }
      return { ok: true, status, data: parsed };
    } catch {
      // JSON parsing failed; fall through to non-JSON handler
    }
  }

  // Handle non-JSON response (e.g. HTML error page or fallback)
  const preview = sanitizeResponsePreview(rawText);
  if (!response.ok) {
    return {
      ok: false,
      status,
      error: `HTTP ${status} (${statusText})${preview ? `: ${preview}` : ''}`,
    };
  }

  // HTTP status was 2xx, but the body was HTML or non-JSON
  return {
    ok: false,
    status,
    error: `Server returned non-JSON response (HTTP ${status})${preview ? `: ${preview}` : ''}`,
  };
}

export async function checkBackendHealth(): Promise<{
  connected: boolean;
  data?: HealthResponse;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await parseJsonResponse<HealthResponse>(response);
    if (!result.ok || !result.data) {
      return {
        connected: false,
        error: result.error || `HTTP ${response.status}: Failed health check`,
      };
    }

    if (result.data.status === 'healthy') {
      return {
        connected: true,
        data: result.data,
      };
    }

    return {
      connected: false,
      error: 'Unexpected response status from backend',
    };
  } catch (err: unknown) {
    let message = 'Network connection failed';
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        message = 'Request timed out';
      } else {
        message = err.message;
      }
    }
    return {
      connected: false,
      error: message,
    };
  }
}

export async function uploadVideo(file: File): Promise<{
  success: boolean;
  data?: VideoUploadResult;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Note: Do NOT manually set Content-Type header so fetch generates the boundary
    const response = await fetch(`${API_BASE_URL}/api/videos/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await parseJsonResponse<VideoUploadResult>(response);
    if (!result.ok || !result.data) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: Upload failed`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    let message = 'Upload request failed';
    if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      error: message,
    };
  }
}

export async function sampleVideoFrames(
  uploadId: string,
  config?: { interval_seconds?: number; max_frames?: number }
): Promise<{
  success: boolean;
  data?: FrameSamplingResult;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/videos/${uploadId}/sample-frames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config || {}),
    });

    const result = await parseJsonResponse<FrameSamplingResult>(response);
    if (!result.ok || !result.data) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: Frame sampling failed`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    let message = 'Frame sampling request failed';
    if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      error: message,
    };
  }
}

export async function detectSmokeInVideo(
  uploadId: string,
  config?: { confidence_threshold?: number; iou_threshold?: number }
): Promise<{
  success: boolean;
  data?: SmokeAnalysisResult;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/videos/${uploadId}/detect-smoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config || {}),
    });

    const result = await parseJsonResponse<SmokeAnalysisResult>(response);
    if (!result.ok || !result.data) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: Smoke detection failed`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    let message = 'Smoke detection request failed';
    if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      error: message,
    };
  }
}

export interface ModelStatus {
  name: string;
  version: string;
  architecture: string;
  target_class: string;
  license: string;
  input_shape: number[];
  default_confidence_threshold: number;
  default_iou_threshold: number;
  engine: string;
  model_file_exists: boolean;
  model_path: string;
}

export async function fetchModelStatus(): Promise<{
  success: boolean;
  data?: ModelStatus;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/model/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const result = await parseJsonResponse<ModelStatus>(response);
    if (!result.ok || !result.data) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: Failed to fetch model status`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    let message = 'Failed to fetch model status';
    if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      error: message,
    };
  }
}

export async function fetchIncidents(): Promise<{
  success: boolean;
  data?: IncidentRecord[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const result = await parseJsonResponse<IncidentRecord[]>(response);
    if (!result.ok || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch incidents' };
    }
    return { success: true, data: result.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error fetching incidents',
    };
  }
}

export async function fetchIncidentById(id: string): Promise<{
  success: boolean;
  data?: IncidentRecord;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const result = await parseJsonResponse<IncidentRecord>(response);
    if (!result.ok || !result.data) {
      return { success: false, error: result.error || `Failed to fetch incident ${id}` };
    }
    return { success: true, data: result.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error fetching incident',
    };
  }
}

export async function updateIncidentStatusApi(
  id: string,
  status: IncidentStatus,
  operator = 'Operator (Desk 01)'
): Promise<{
  success: boolean;
  data?: IncidentRecord;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, operator }),
    });
    const result = await parseJsonResponse<IncidentRecord>(response);
    if (!result.ok || !result.data) {
      return { success: false, error: result.error || 'Failed to update incident status' };
    }
    return { success: true, data: result.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error updating incident status',
    };
  }
}

export async function addIncidentNoteApi(
  id: string,
  text: string,
  author = 'Operator (Desk 01)'
): Promise<{
  success: boolean;
  data?: OperatorNote;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    const result = await parseJsonResponse<OperatorNote>(response);
    if (!result.ok || !result.data) {
      return { success: false, error: result.error || 'Failed to add operator note' };
    }
    return { success: true, data: result.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error adding note',
    };
  }
}

export async function fetchAlerts(): Promise<{
  success: boolean;
  data?: AlertRecord[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const result = await parseJsonResponse<AlertRecord[]>(response);
    if (!result.ok || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch alerts' };
    }
    return { success: true, data: result.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error fetching alerts',
    };
  }
}

export async function acknowledgeAlertApi(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonResponse<{ success: boolean }>(response);
    if (!result.ok) {
      return { success: false, error: result.error || 'Failed to acknowledge alert' };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error acknowledging alert',
    };
  }
}

export async function createIncidentFromDetectionApi(
  uploadId: string,
  analysisResult?: SmokeAnalysisResult
): Promise<{
  success: boolean;
  incident?: IncidentRecord;
  alert?: AlertRecord;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents/create-from-detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upload_id: uploadId, analysis_result: analysisResult }),
    });
    const result = await parseJsonResponse<{
      success: boolean;
      incident?: IncidentRecord;
      alert?: AlertRecord;
      isDuplicate?: boolean;
      message?: string;
      error?: string;
    }>(response);
    if (!result.ok || !result.data) {
      return { success: false, error: result.error || 'Failed to create incident from detection' };
    }
    return result.data;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error creating incident',
    };
  }
}


