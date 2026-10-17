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
  onNavigateToVideoAnalysis?: (uploadId?: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdateStatus,
  onAddNote,
  onNavigateToVideoAnalysis
}) => {
  const [noteText, setNoteText] = useState('');
  const [evidenceLoadError, setEvidenceLoadError] = useState(false);

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

          {/* AI Candidate Detection Disclaimer for Real Model */}
          {incident.source === 'real_model' && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Candidate Smoke Detection (Human Review Required):</span> This record was generated from genuine AI inference ({incident.modelIdentifier || 'YOLO11s ONNX CPU'}). It indicates an unconfirmed visual candidate, not proof of fire or an emergency. Operator inspection of visual evidence is required before initiating response protocols.
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

          {/* Visual Evidence Section */}
          {incident.evidenceFrameUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  Detection Evidence & Bounding Boxes
                </h3>
                {incident.uploadId && onNavigateToVideoAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToVideoAnalysis(incident.uploadId);
                    }}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-medium underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect in Video Analysis View</span>
                  </button>
                )}
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-3">
                <div className="relative mx-auto max-w-lg rounded-lg overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                  {!evidenceLoadError ? (
                    <>
                      <img
                        src={incident.evidenceFrameUrl}
                        alt="Evidence frame"
                        onError={() => setEvidenceLoadError(true)}
                        className="w-full h-auto block"
                      />
                      {incident.affectedFrames && incident.affectedFrames[0]?.normalized_bbox && (
                        <div
                          className="absolute border-2 border-amber-500 bg-amber-500/20 pointer-events-none"
                          style={{
                            top: `${incident.affectedFrames[0].normalized_bbox.y1 * 100}%`,
                            left: `${incident.affectedFrames[0].normalized_bbox.x1 * 100}%`,
                            width: `${(incident.affectedFrames[0].normalized_bbox.x2 - incident.affectedFrames[0].normalized_bbox.x1) * 100}%`,
                            height: `${(incident.affectedFrames[0].normalized_bbox.y2 - incident.affectedFrames[0].normalized_bbox.y1) * 100}%`,
                          }}
                        >
                          <div className="absolute -top-5 left-0 bg-amber-600 text-white text-[9px] font-mono px-1 py-0.2 rounded font-semibold whitespace-nowrap shadow-xs">
                            smoke: {((incident.detectionScore || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      Evidence frame image was cleared or is not available in ephemeral cache.
                    </div>
                  )}
                </div>

                {incident.affectedFrames && incident.affectedFrames.length > 0 && (
                  <div className="text-[11px] font-mono text-neutral-600 flex flex-wrap gap-2 pt-1 border-t border-stone-200">
                    <span className="font-sans font-medium text-neutral-800">Affected Frames ({incident.affectedFramesCount || incident.affectedFrames.length}):</span>
                    {incident.affectedFrames.map((af, i) => (
                      <span key={i} className="bg-white border border-stone-200 px-1.5 py-0.5 rounded">
                        Frame #{af.frame_index} ({af.timestamp_formatted}) · {(af.confidence * 100).toFixed(1)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
