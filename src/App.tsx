/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { VideoAnalysisView } from './components/VideoAnalysisView';
import { AlertsView } from './components/AlertsView';
import { IncidentsView } from './components/IncidentsView';
import { ScenarioSimulatorView } from './components/ScenarioSimulatorView';
import { SettingsView } from './components/SettingsView';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { checkBackendHealth, BackendHealthState } from './api/client';
import { 
  SAMPLE_INCIDENTS, 
  SAMPLE_ALERTS, 
  INITIAL_ACTIVITY_LOG 
} from './data/mockData';
import { 
  IncidentRecord, 
  AlertRecord, 
  ActivityLogItem, 
  SimulationScenario, 
  IncidentStatus 
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Backend connection state (Stage 2)
  const [backendState, setBackendState] = useState<BackendHealthState>({
    status: 'checking',
  });

  // Core application state
  const [incidents, setIncidents] = useState<IncidentRecord[]>(SAMPLE_INCIDENTS);
  const [alerts, setAlerts] = useState<AlertRecord[]>(SAMPLE_ALERTS);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

  // Safe health-check trigger
  const verifyBackendHealth = useCallback(async () => {
    setBackendState(prev => ({ ...prev, status: 'checking' }));
    const result = await checkBackendHealth();
    if (result.connected && result.data) {
      setBackendState({
        status: 'connected',
        data: result.data,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } else {
      setBackendState({
        status: 'disconnected',
        error: result.error || 'Connection refused',
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  // Check health on initial mount
  useEffect(() => {
    verifyBackendHealth();
  }, [verifyBackendHealth]);

  // Toggle demo/sample mode vs pristine workspace empty state
  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      // Switch to empty state
      setIncidents([]);
      setAlerts([]);
      setIsDemoMode(false);
    } else {
      // Re-populate sample data
      setIncidents(SAMPLE_INCIDENTS);
      setAlerts(SAMPLE_ALERTS);
      setIsDemoMode(true);
    }
  };

  // Status progression handler
  const handleUpdateIncidentStatus = (incidentId: string, newStatus: IncidentStatus) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const updated = {
          ...inc,
          status: newStatus,
          resolvedAt: newStatus === 'resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : inc.resolvedAt
        };
        // Update selected incident if open in modal
        if (selectedIncident && selectedIncident.id === incidentId) {
          setSelectedIncident(updated);
        }
        return updated;
      }
      return inc;
    }));

    // Append to audit trail
    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      action: `Status Changed to ${newStatus.toUpperCase()}`,
      targetId: incidentId,
      targetType: 'incident',
      operator: 'Operator (Desk 01)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: `Operator updated incident status to ${newStatus}`
    };
    setActivityLog(prev => [newLog, ...prev]);
  };

  // Add operator note
  const handleAddNote = (incidentId: string, noteText: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      author: 'Operator (Desk 01)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      text: noteText
    };

    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const updated = {
          ...inc,
          notes: [...inc.notes, newNote]
        };
        if (selectedIncident && selectedIncident.id === incidentId) {
          setSelectedIncident(updated);
        }
        return updated;
      }
      return inc;
    }));

    // Append to audit trail
    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      action: 'Operator Note Added',
      targetId: incidentId,
      targetType: 'incident',
      operator: 'Operator (Desk 01)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: `Added observation: "${noteText.slice(0, 40)}..."`
    };
    setActivityLog(prev => [newLog, ...prev]);
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return { ...a, acknowledged: true };
      }
      return a;
    }));

    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      action: 'Alert Acknowledged',
      targetId: alertId,
      targetType: 'alert',
      operator: 'Operator (Desk 01)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: 'Operator acknowledged incoming threat signal'
    };
    setActivityLog(prev => [newLog, ...prev]);
  };

  // Scenario Simulator: Inject a predefined scenario into local state
  const handleInjectScenario = (scenario: SimulationScenario) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const incidentId = `SIM-${Date.now().toString().slice(-4)}`;

    const newSimulatedIncident: IncidentRecord = {
      id: incidentId,
      title: `[SIMULATED] ${scenario.name}`,
      category: scenario.category,
      severity: scenario.severity,
      status: 'new',
      source: 'simulation',
      videoSource: scenario.videoReference,
      videoTimestamp: scenario.simulatedTimestamp,
      detectionScore: scenario.simulatedScore,
      detectionRule: scenario.detectionRule,
      description: `[SIMULATED EVENT FOR WORKFLOW TESTING] ${scenario.description}`,
      createdAt: timestamp,
      notes: [
        {
          id: `note-${Date.now()}`,
          author: 'Scenario Simulator',
          timestamp: timestamp,
          text: `Injected scenario "${scenario.name}". Operational rationale: ${scenario.rationale}`
        }
      ],
      isSampleData: true
    };

    const newAlert: AlertRecord = {
      id: `ALT-SIM-${Date.now().toString().slice(-3)}`,
      title: `[SIMULATED] ${scenario.name}`,
      category: scenario.category,
      severity: scenario.severity,
      source: 'simulation',
      timestamp: timestamp,
      videoSource: scenario.videoReference,
      videoTimestamp: scenario.simulatedTimestamp,
      confidenceScore: scenario.simulatedScore,
      triggerRule: scenario.detectionRule,
      incidentId: incidentId,
      acknowledged: false,
      isSampleData: true
    };

    setIncidents(prev => [newSimulatedIncident, ...prev]);
    setAlerts(prev => [newAlert, ...prev]);

    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      action: 'Scenario Injected',
      targetId: incidentId,
      targetType: 'simulation',
      operator: 'Scenario Simulator',
      timestamp: timestamp,
      details: `Generated simulated ${scenario.category} incident`
    };
    setActivityLog(prev => [newLog, ...prev]);
  };

  // Reset simulated records
  const handleResetSimulations = () => {
    setIncidents(prev => prev.filter(i => i.source !== 'simulation'));
    setAlerts(prev => prev.filter(a => a.source !== 'simulation'));
  };

  const openIncidentsCount = incidents.filter(i => i.status === 'new').length;
  const unacknowledgedAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const simulatedIncidentsCount = incidents.filter(i => i.source === 'simulation').length;

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-neutral-900 font-sans flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        openIncidentsCount={openIncidentsCount}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateToUpload={() => setCurrentTab('video-analysis')}
          backendState={backendState}
          onRefreshBackend={verifyBackendHealth}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewView
              incidents={incidents}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
              onNavigateToUpload={() => setCurrentTab('video-analysis')}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              activityLog={activityLog}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onNavigateToIncidents={() => setCurrentTab('incidents')}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          )}

          {currentTab === 'video-analysis' && (
            <VideoAnalysisView />
          )}

          {currentTab === 'simulator' && (
            <ScenarioSimulatorView
              onInjectScenario={handleInjectScenario}
              onResetSimulations={handleResetSimulations}
              simulatedIncidentsCount={simulatedIncidentsCount}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView 
              backendState={backendState}
              onRefreshBackend={verifyBackendHealth}
            />
          )}
        </main>
      </div>

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateIncidentStatus}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
