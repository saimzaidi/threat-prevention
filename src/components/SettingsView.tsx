import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Lock, 
  FileText, 
  Sliders,
  AlertCircle,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { BackendHealthState } from '../api/client';

interface SettingsViewProps {
  backendState: BackendHealthState;
  onRefreshBackend: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  backendState,
  onRefreshBackend
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Backend Foundation Status Card (Stage 2) */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-semibold text-neutral-900">
              Backend Service Foundation (FastAPI)
            </h2>
          </div>
          <button
            type="button"
            onClick={onRefreshBackend}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${backendState.status === 'checking' ? 'animate-spin' : ''}`} />
            <span>Test Health Endpoint</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
            <span className="text-neutral-500 font-medium block">Endpoint & Connection</span>
            <div className="flex items-center gap-2">
              {backendState.status === 'connected' ? (
                <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Connected (200 OK)
                </span>
              ) : backendState.status === 'checking' ? (
                <span className="inline-flex items-center gap-1 text-neutral-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                  Checking connection...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-800 font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Disconnected / Offline
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-neutral-600">
              Route: GET /api/health
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
            <span className="text-neutral-500 font-medium block">Service Metadata</span>
            {backendState.data ? (
              <div className="text-[11px] font-mono text-neutral-700 space-y-0.5">
                <div>Service: {backendState.data.service}</div>
                <div>Version: {backendState.data.version}</div>
                <div>Stage: {backendState.data.stage}</div>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">
                {backendState.error || 'Backend process is not running. Start FastAPI on localhost:8000.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Planned Architecture Specifications */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Local Processing & Inference Parameters (Planned Stages 3–6)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* AI Model Spec */}
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 font-medium">
              <Cpu className="w-4 h-4 text-neutral-600" />
              <span>Inference Engine (Stage 3 & 5)</span>
            </div>
            <div className="space-y-1 text-neutral-600 font-mono text-[11px]">
              <div>Target: ONNX Runtime (CPU)</div>
              <div>Candidate: pyronear/yolo11s_sensitive-detector</div>
              <div>Input Resolution: 640 × 640 px</div>
              <div>Default Frame Sampling: 1.0 fps</div>
              <div>Multi-frame Confirmation: Sustained 3 frames</div>
            </div>
          </div>

          {/* Database Spec */}
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 font-medium">
              <Database className="w-4 h-4 text-neutral-600" />
              <span>Persistence & Storage (Stage 6)</span>
            </div>
            <div className="space-y-1 text-neutral-600 font-mono text-[11px]">
              <div>Database: SQLite (local file)</div>
              <div>Database File: ./data/threat_prevention.db</div>
              <div>Evidence Directory: ./storage/evidence_frames/</div>
              <div>Retention: Temporary local cache only</div>
              <div>Cloud Dependencies: None (Zero paid APIs)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ethical & Safety Governance Boundaries */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-neutral-700" />
          <span>Privacy & Safety Invariants (Strict Policy)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600 pt-1">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
            <span className="font-semibold text-neutral-900 block">1. Zero Facial Identification</span>
            <p className="text-[11px] leading-relaxed">
              System architecture strictly prohibits facial recognition or biometric identification. Presence is evaluated solely for physical safety and hazard conditions.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
            <span className="font-semibold text-neutral-900 block">2. No Automated Emergency Dispatch</span>
            <p className="text-[11px] leading-relaxed">
              The platform never places automated emergency calls or contacts external authorities. All escalations require human operator inspection and verification.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
            <span className="font-semibold text-neutral-900 block">3. Local-First Processing</span>
            <p className="text-[11px] leading-relaxed">
              Footage is analyzed locally on the host machine. No video frames are transmitted to external cloud APIs or proprietary third-party servers.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
            <span className="font-semibold text-neutral-900 block">4. Distinguishable Simulation</span>
            <p className="text-[11px] leading-relaxed">
              Simulated demonstration scenarios are indelibly stamped with simulation metadata to prevent confusing training scenarios with genuine security alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Project Documentation References */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
        <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
          Root Project Specifications
        </h3>
        <p className="text-xs text-neutral-500">
          The following governance documents in the project root govern all code and model implementations:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-stone-50 rounded border border-stone-200 flex items-center justify-between text-neutral-800">
            <span>PROJECT_PLAN.md</span>
            <span className="text-[10px] text-neutral-500 font-sans">Scope & Principles</span>
          </div>
          <div className="p-2.5 bg-stone-50 rounded border border-stone-200 flex items-center justify-between text-neutral-800">
            <span>ARCHITECTURE.md</span>
            <span className="text-[10px] text-neutral-500 font-sans">System Pipeline</span>
          </div>
          <div className="p-2.5 bg-stone-50 rounded border border-stone-200 flex items-center justify-between text-neutral-800">
            <span>BUILD_PLAN.md</span>
            <span className="text-[10px] text-neutral-500 font-sans">Stage Sequence</span>
          </div>
          <div className="p-2.5 bg-stone-50 rounded border border-stone-200 flex items-center justify-between text-neutral-800">
            <span>AGENTS.md</span>
            <span className="text-[10px] text-neutral-500 font-sans">AI Coding Rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};
