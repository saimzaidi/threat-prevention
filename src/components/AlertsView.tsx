import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  Video, 
  Clock, 
  AlertTriangle,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { AlertRecord, SeverityLevel, ThreatCategory } from '../types';

interface AlertsViewProps {
  alerts: AlertRecord[];
  onAcknowledgeAlert: (alertId: string) => void;
  onNavigateToIncidents: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onNavigateToIncidents
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.videoSource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
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
      {/* Search and Filters Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by title, camera source, or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-stone-50/50"
          />
        </div>

        {/* Severity segmented filter */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg shrink-0">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                selectedSeverity === sev
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-2">
          <Bell className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-xs font-semibold text-neutral-900">
            No Alerts Found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || selectedSeverity !== 'all'
              ? 'No alerts match your current filter criteria.'
              : 'The alert queue is currently empty. Detections will appear here when video analysis runs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`p-4 bg-white border rounded-xl hover:border-neutral-400 cursor-pointer transition-all space-y-2 group ${
                alert.acknowledged ? 'border-stone-200 opacity-90' : 'border-stone-300 ring-1 ring-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-medium text-neutral-500">
                      {alert.id}
                    </span>
                    {getSeverityBadge(alert.severity)}
                    {getSourceBadge(alert.source)}
                    {alert.isSampleData && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        · Sample Record
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs md:text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.acknowledged ? (
                    <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledgeAlert(alert.id);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-xs"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-stone-100 font-mono gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{alert.videoSource}</span>
                  <span>· {alert.videoTimestamp}</span>
                </div>
                {alert.confidenceScore !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>Signal Score: {(alert.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                )}
                <span>Triggered: {alert.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Alert Inspection Drawer / Modal */}
      {selectedAlert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-medium text-neutral-500">{selectedAlert.id}</span>
                  {getSeverityBadge(selectedAlert.severity)}
                  {getSourceBadge(selectedAlert.source)}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {selectedAlert.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-lg border border-stone-200">
              <div>
                <span className="text-neutral-500 block font-medium">Trigger Rule</span>
                <p className="text-neutral-900 font-mono text-[11px] mt-0.5">{selectedAlert.triggerRule}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-500 block font-sans">Video Source</span>
                  <span className="text-neutral-900 font-medium">{selectedAlert.videoSource}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block font-sans">Video Timestamp</span>
                  <span className="text-neutral-900 font-medium">{selectedAlert.videoTimestamp}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {!selectedAlert.acknowledged && (
                <button
                  type="button"
                  onClick={() => {
                    onAcknowledgeAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Mark Acknowledged
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedAlert(null);
                  onNavigateToIncidents();
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                View in Incidents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
