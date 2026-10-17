import React, { useState } from 'react';
import { 
  PlaySquare, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  UserX, 
  Sparkles, 
  Info,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { SimulationScenario, ThreatCategory } from '../types';
import { PREDEFINED_SCENARIOS } from '../data/mockData';

interface ScenarioSimulatorViewProps {
  onInjectScenario: (scenario: SimulationScenario) => void;
  onResetSimulations: () => void;
  simulatedIncidentsCount: number;
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({
  onInjectScenario,
  onResetSimulations,
  simulatedIncidentsCount
}) => {
  const [injectedIds, setInjectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const handleInject = (scenario: SimulationScenario) => {
    onInjectScenario(scenario);
    setInjectedIds(prev => [...prev, scenario.id]);
    setNotification(`Simulated incident "${scenario.name}" injected. View in Incidents tab.`);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleReset = () => {
    onResetSimulations();
    setInjectedIds([]);
    setNotification('All simulated demonstration records removed.');
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const getCategoryIcon = (category: ThreatCategory) => {
    switch (category) {
      case 'Fire & Smoke':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'Workplace Accident':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'Physical Altercation':
        return <UserX className="w-4 h-4 text-rose-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Simulation Transparency & Safety Banner */}
      <div className="p-4 md:p-5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Simulation Safety & Ethical Oversight Policy</span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          The Scenario Simulator is exclusively designed to test operator review and incident resolution workflows for categories where real local AI models are not yet validated.
        </p>
        <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5 pt-1">
          <li><strong>Never Real Inference:</strong> Injected events are explicitly flagged as <code className="font-mono bg-amber-100 px-1 rounded">[SIMULATED]</code>.</li>
          <li><strong>Zero Automated Dispatch:</strong> Simulations never trigger automated calls to law enforcement, fire, or emergency medical services.</li>
          <li><strong>Decision Support:</strong> A human operator retains 100% control over incident evaluation.</li>
        </ul>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-neutral-900 text-white rounded-lg text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-white underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Simulator Control Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Predefined Threat Scenarios
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Select a threat scenario to simulate the alert-to-resolution operational lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-neutral-500">
            Active simulated records: <strong className="text-neutral-900">{simulatedIncidentsCount}</strong>
          </span>
          {simulatedIncidentsCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulations</span>
            </button>
          )}
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PREDEFINED_SCENARIOS.map((scenario) => {
          const hasBeenInjected = injectedIds.includes(scenario.id);

          return (
            <div
              key={scenario.id}
              className="bg-white border border-stone-200 rounded-xl p-5 space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                    {getCategoryIcon(scenario.category)}
                    <span>{scenario.category}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                    scenario.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    scenario.severity === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {scenario.severity} Severity
                  </span>
                </div>

                <h3 className="text-xs md:text-sm font-semibold text-neutral-900">
                  {scenario.name}
                </h3>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {scenario.description}
                </p>

                {/* Technical / Rationale Box */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-neutral-600 space-y-1">
                  <div className="font-medium text-neutral-800">Operational Rationale:</div>
                  <p className="leading-tight">{scenario.rationale}</p>
                  <div className="pt-1 text-[10px] text-neutral-500 font-mono">
                    Simulated Rule: {scenario.detectionRule}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Score: {(scenario.simulatedScore * 100).toFixed(0)}% (Simulated)
                </span>

                <button
                  type="button"
                  onClick={() => handleInject(scenario)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <PlaySquare className="w-3.5 h-3.5" />
                  <span>{hasBeenInjected ? 'Inject Again' : 'Inject Scenario'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
