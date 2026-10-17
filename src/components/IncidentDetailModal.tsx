import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Video, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Send,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { IncidentRecord, IncidentStatus } from '../types';

interface IncidentDetailModalProps {
  incident: IncidentRecord | null;
  onClose: () => void;
  onUpdateStatus: (incidentId: string, newStatus: IncidentStatus) => void;
  onAddNote: (incidentId: string, noteText: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdateStatus,
  onAddNote
}) => {
  const [noteText, setNoteText] = useState('');

  if (!incident) return null;

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(incident.id, noteText.trim());
    setNoteText('');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">Critical</span>;
      case 'high':
        return <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">High</span>;
      case 'medium':
        return <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Medium</span>;
      default:
        return <span className="text-xs font-medium text-neutral-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">Low</span>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'new':
        return <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">New</span>;
      case 'acknowledged':
        return <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Acknowledged</span>;
      case 'investigating':
        return <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">Investigating</span>;
      case 'resolved':
        return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Resolved</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'real_model':
        return (
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            AI Model Output
          </span>
        );
      case 'simulation':
        return (
          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            Simulation Scenario
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium text-neutral-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 inline-block" />
            Rule-Based Signal
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-2xl w-full overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold text-neutral-500">
                {incident.id}
              </span>
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
              {getSourceBadge(incident.source)}
            </div>
            <h2 className="text-base font-semibold text-neutral-900">
              {incident.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-stone-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Simulation disclaimer if simulated */}
          {incident.source === 'simulation' && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Simulated Demonstration Record:</span> This event was generated by the Scenario Simulator for testing operator response workflows. It was not derived from real-world AI inference.
              </div>
            </div>
          )}

          {/* Core metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 space-y-1">
              <span className="text-neutral-500 block font-medium">Video Source & Timestamp</span>
              <div className="flex items-center gap-2 text-neutral-900 font-medium">
                <Video className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-mono">{incident.videoSource}</span>
                <span className="text-neutral-400">·</span>
                <span className="font-mono">{incident.videoTimestamp}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 space-y-1">
              <span className="text-neutral-500 block font-medium">Detection Signal Metric</span>
              <div className="flex items-center gap-2 text-neutral-900 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-mono">
                  {incident.detectionScore !== undefined 
                    ? `Score: ${(incident.detectionScore * 100).toFixed(0)}%`
                    : 'N/A'}
                </span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  (Uncalibrated model output)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 space-y-1 sm:col-span-2">
              <span className="text-neutral-500 block font-medium">Detection Trigger Rule</span>
              <p className="text-neutral-800 font-mono text-[11px] leading-relaxed">
                {incident.detectionRule || 'Manual operator trigger'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-1.5">
              Incident Summary
            </h3>
            <p className="text-xs text-neutral-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
              {incident.description}
            </p>
          </div>

          {/* Workflow Status Actions */}
          <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-900">
                Operator Response Workflow
              </h3>
              <span className="text-[11px] text-neutral-500">
                Human-in-the-loop verification
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {incident.status === 'new' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(incident.id, 'acknowledged')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Acknowledge Incident
                </button>
              )}

              {incident.status !== 'investigating' && incident.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(incident.id, 'investigating')}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors shadow-xs"
                >
                  Mark as Investigating
                </button>
              )}

              {incident.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(incident.id, 'resolved')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve Incident</span>
                </button>
              )}

              {incident.status === 'resolved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(incident.id, 'investigating')}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Re-open for Investigation
                </button>
              )}
            </div>
          </div>

          {/* Operator Activity and Notes Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Operator Notes & Audit Trail
              </h3>
              <span className="text-[11px] text-neutral-500 font-mono">
                {incident.notes.length} {incident.notes.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {incident.notes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="font-medium text-neutral-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-500" />
                      {note.author}
                    </span>
                    <span className="font-mono">{note.timestamp}</span>
                  </div>
                  <p className="text-neutral-700 leading-relaxed">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Add note form */}
            <form onSubmit={handleNoteSubmit} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add operator observation, dispatcher note, or action taken..."
                className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
              />
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>Created {incident.createdAt}</span>
            {incident.resolvedAt && (
              <span>· Resolved {incident.resolvedAt}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
