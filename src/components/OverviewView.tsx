import React from 'react';
import { 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Video, 
  ArrowRight, 
  ShieldAlert, 
  Activity,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { IncidentRecord, ActivityLogItem } from '../types';

interface OverviewViewProps {
  incidents: IncidentRecord[];
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onNavigateToUpload: () => void;
  onSelectIncident: (incident: IncidentRecord) => void;
  activityLog: ActivityLogItem[];
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  incidents,
  isDemoMode,
  onToggleDemoMode,
  onNavigateToUpload,
  onSelectIncident,
  activityLog
}) => {
  const openCount = incidents.filter(i => i.status === 'new').length;
  const investigatingCount = incidents.filter(i => i.status === 'investigating' || i.status === 'acknowledged').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const videosAnalyzedCount = isDemoMode ? 4 : 0;

  const recentIncidents = incidents.slice(0, 4);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">Critical</span>;
      case 'high':
        return <span className="text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">High</span>;
      case 'medium':
        return <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Medium</span>;
      default:
        return <span className="text-[11px] font-medium text-neutral-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">Low</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'real_model':
        return (
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            AI Model
          </span>
        );
      case 'simulation':
        return (
          <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            Simulated
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono text-neutral-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">
            Rule-Based
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Prototype State & Demo Data Toggle */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Prototype Environment Status
            </span>
            <span className="text-[11px] px-2 py-0.5 bg-neutral-200/80 text-neutral-700 rounded font-mono">
              Stage 1 Foundation
            </span>
          </div>
          <p className="text-xs text-neutral-600 max-w-xl">
            This dashboard displays the front-end operator workflow. AI inference (PyroNear YOLO11s) and the FastAPI backend are planned for Stage 2 & 5.
          </p>
        </div>

        {/* Toggle between Empty State and Sample Data */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-300 shrink-0">
          <span className="text-xs font-medium text-neutral-700">
            {isDemoMode ? 'Sample Data Preview' : 'Workspace Empty State'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isDemoMode}
            onClick={onToggleDemoMode}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isDemoMode ? 'bg-neutral-900' : 'bg-stone-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                isDemoMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Open Incidents */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
            <span className="font-medium">Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 tabular-nums">
            {openCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {openCount === 0 ? 'No unhandled threats' : 'Requires operator triage'}
          </p>
        </div>

        {/* Under Investigation */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
            <span className="font-medium">Investigating</span>
            <Search className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 tabular-nums">
            {investigatingCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Active operator review
          </p>
        </div>

        {/* Resolved */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
            <span className="font-medium">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 tabular-nums">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Persisted in history
          </p>
        </div>

        {/* Videos Analyzed */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
            <span className="font-medium">Videos Processed</span>
            <Video className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 tabular-nums">
            {videosAnalyzedCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {isDemoMode ? 'Sample video runs' : 'Awaiting video upload'}
          </p>
        </div>
      </div>

      {/* Primary Action Banner */}
      <div className="bg-neutral-900 text-white rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
              Primary Workflow
            </span>
          </div>
          <h2 className="text-base md:text-lg font-semibold tracking-tight text-stone-100">
            Submit Footage for Threat Detection
          </h2>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            Upload local security camera video (.mp4, .mov, .avi) to test file validation and inspect frames.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToUpload}
          className="px-4 py-2 text-xs font-medium text-neutral-900 bg-white rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-2 shrink-0 shadow-xs"
        >
          <span>Open Video Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Split: Recent Incidents & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Recent Incidents
            </h3>
            <span className="text-xs text-neutral-500">
              {incidents.length} total recorded
            </span>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="p-8 text-center bg-white border border-stone-200 rounded-xl space-y-2">
              <ShieldAlert className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="text-xs font-semibold text-neutral-900">
                No Incidents on Record
              </div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No threat alerts have been registered yet. Toggle "Sample Data Preview" above or use the Scenario Simulator to evaluate operator workflows.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className="p-4 bg-white border border-stone-200 rounded-xl hover:border-neutral-400 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono text-neutral-500">
                          {incident.id}
                        </span>
                        {getSeverityBadge(incident.severity)}
                        {getSourceBadge(incident.source)}
                        {incident.isSampleData && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            · Sample
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs md:text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {incident.title}
                      </h4>
                    </div>

                    <span className="text-xs font-medium capitalize text-neutral-600 shrink-0">
                      {incident.status}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-1">
                    {incident.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-stone-100 font-mono">
                    <span>Source: {incident.videoSource}</span>
                    <span>{incident.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Operator Audit Trail
            </h3>
            <Activity className="w-3.5 h-3.5 text-neutral-400" />
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3.5">
            {activityLog.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">
                No activity recorded yet.
              </p>
            ) : (
              activityLog.map((act) => (
                <div key={act.id} className="text-xs space-y-1 pb-3 border-b border-stone-100 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between text-neutral-900 font-medium">
                    <span>{act.action}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {act.timestamp.split(' ')[1] || act.timestamp}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-[11px] leading-tight">
                    {act.details}
                  </p>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    By {act.operator}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
