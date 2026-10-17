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

const rawBase = (import.meta?.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBase === '/api' ? '' : rawBase;

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
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      return {
        connected: false,
        error: errJson?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data: HealthResponse = await response.json();
    if (data.status === 'healthy') {
      return {
        connected: true,
        data,
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

export async function uploadVideo(file: File): Promise<{
  success: boolean;
  data?: VideoUploadResult;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Note: Do NOT set Content-Type header so fetch generates the boundary
    const response = await fetch(`${API_BASE_URL}/api/videos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      return {
        success: false,
        error: errJson?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data: VideoUploadResult = await response.json();
    return {
      success: true,
      data,
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

