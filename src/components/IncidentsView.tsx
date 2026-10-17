import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  Video, 
  MessageSquare,
  SlidersHorizontal
} from 'lucide-react';
import { IncidentRecord, IncidentStatus, SeverityLevel } from '../types';

interface IncidentsViewProps {
  incidents: IncidentRecord[];
  onSelectIncident: (incident: IncidentRecord) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onSelectIncident
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.videoSource.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || inc.status === selectedStatus;

    return matchesSearch && matchesStatus;
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

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'new':
        return <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">New</span>;
      case 'acknowledged':
        return <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Acknowledged</span>;
      case 'investigating':
        return <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">Investigating</span>;
      case 'resolved':
        return <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Resolved</span>;
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
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents by ID, category, or camera..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-stone-50/50"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg shrink-0">
          {(['all', 'new', 'acknowledged', 'investigating', 'resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                selectedStatus === st
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List / Table */}
      {filteredIncidents.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-2">
          <FileText className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-xs font-semibold text-neutral-900">
            No Incidents Recorded
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || selectedStatus !== 'all'
              ? 'No incidents match the selected status or query.'
              : 'No incidents are currently stored in SQLite. In Stage 6, detections will persist automatically.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-neutral-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title & Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Video Ref</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className="hover:bg-stone-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-900 whitespace-nowrap">
                      {incident.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {incident.title}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {incident.category}
                        {incident.isSampleData && ' · Sample'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSeverityBadge(incident.severity)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(incident.status)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSourceBadge(incident.source)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                      <div>{incident.videoSource}</div>
                      <div className="text-neutral-400">{incident.videoTimestamp}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 text-neutral-500">
                        {incident.notes.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {incident.notes.length}
                          </span>
                        )}
                        <span className="text-xs font-medium text-neutral-700 underline group-hover:text-neutral-900">
                          Inspect
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
