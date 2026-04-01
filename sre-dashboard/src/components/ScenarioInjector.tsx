import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, X, Play, AlertTriangle, Code2 } from 'lucide-react';
import type { TaskName } from '../types/sre';

interface ScenarioInjectorProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (taskName: TaskName) => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  {
    id: 'easy',
    task: 'easy' as TaskName,
    label: 'Bad Code Deploy',
    severity: 'P2',
    description: 'Checkout API returning 34% HTTP 500 errors after deploy. Red herring: CPU/memory normal.',
    color: 'text-sre-yellow',
    borderColor: 'border-sre-yellow/30',
  },
  {
    id: 'medium',
    task: 'medium' as TaskName,
    label: 'Cascading DB Deadlock',
    severity: 'P1',
    description: 'Auth timeouts → API Gateway 502s → 4 microservices failing. Analytics query holding 12-min lock.',
    color: 'text-sre-orange',
    borderColor: 'border-sre-orange/30',
  },
  {
    id: 'hard',
    task: 'hard' as TaskName,
    label: 'DDoS Disguised as Viral',
    severity: 'P1',
    description: '400% traffic spike. 5% legit viral + 95% botnet. Scaling up wastes budget on bots.',
    color: 'text-sre-red',
    borderColor: 'border-sre-red/30',
  },
];

const CUSTOM_TEMPLATE = `{
  "incident_id": "INC-CUSTOM",
  "severity": "P1",
  "initial_observation": "Custom incident description...",
  "active_alerts": [
    "Alert 1",
    "Alert 2"
  ],
  "system_metrics": {
    "cpu": "85%",
    "memory": "72%",
    "error_rate": "45%",
    "network_traffic": "200%"
  }
}`;

export function ScenarioInjector({ isOpen, onClose, onInject, isLoading }: ScenarioInjectorProps) {
  const [customJson, setCustomJson] = useState(CUSTOM_TEMPLATE);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const validateJson = useCallback((val: string) => {
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, []);

  const handleCustomChange = useCallback((val: string) => {
    setCustomJson(val);
    validateJson(val);
  }, [validateJson]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-sre-surface border-l border-sre-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sre-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sre-orange-dim">
                  <FlaskConical className="w-4 h-4 text-sre-orange" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-sre-text-bright">Chaos Engineering</h2>
                  <p className="text-[10px] font-mono text-sre-text-muted">SCENARIO INJECTOR — DEV TOOLS</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-sre-surface-alt transition-colors"
              >
                <X className="w-4 h-4 text-sre-text-muted" />
              </button>
            </div>

            {/* Warning */}
            <div className="mx-5 mt-4 flex items-start gap-2 p-3 rounded-lg bg-sre-orange-dim border border-sre-orange/20">
              <AlertTriangle className="w-4 h-4 text-sre-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-sre-orange leading-relaxed">
                Injecting a scenario will reset the current episode. This is for demo/testing purposes only.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex mx-5 mt-4 rounded-lg bg-sre-bg overflow-hidden border border-sre-border">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 px-4 py-2 text-xs font-mono transition-colors ${
                  activeTab === 'presets'
                    ? 'bg-sre-surface-alt text-sre-text-bright'
                    : 'text-sre-text-muted hover:text-sre-text'
                }`}
              >
                PRESETS
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 px-4 py-2 text-xs font-mono transition-colors ${
                  activeTab === 'custom'
                    ? 'bg-sre-surface-alt text-sre-text-bright'
                    : 'text-sre-text-muted hover:text-sre-text'
                }`}
              >
                CUSTOM JSON
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {activeTab === 'presets' ? (
                <div className="space-y-3">
                  {PRESET_SCENARIOS.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-lg border ${scenario.borderColor} bg-sre-bg cursor-pointer group`}
                      onClick={() => !isLoading && onInject(scenario.task)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold ${scenario.color}`}>
                            [{scenario.severity}]
                          </span>
                          <span className="text-sm text-sre-text-bright font-medium">
                            {scenario.label}
                          </span>
                        </div>
                        <Play className={`w-4 h-4 ${scenario.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                      <p className="text-[11px] text-sre-text-muted leading-relaxed">
                        {scenario.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sre-surface-alt text-sre-text-muted">
                          task: {scenario.task}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-sre-text-muted">
                    <Code2 className="w-3.5 h-3.5" />
                    <span className="font-mono">Custom Incident State (JSON)</span>
                  </div>
                  <textarea
                    value={customJson}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    spellCheck={false}
                    className="w-full h-64 bg-sre-bg border border-sre-border rounded-lg px-4 py-3 text-xs font-mono text-sre-text-bright placeholder:text-sre-text-muted/50 focus:outline-none focus:border-sre-accent/50 focus:ring-1 focus:ring-sre-accent/30 resize-none"
                  />
                  {jsonError && (
                    <p className="text-[11px] font-mono text-sre-red">{jsonError}</p>
                  )}
                  <p className="text-[10px] text-sre-text-muted leading-relaxed">
                    Custom JSON injection is for visual testing. The backend uses its own data.json scenarios.
                    Use presets to trigger real backend episodes.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-5 border-t border-sre-border">
              <button
                onClick={() => {
                  if (activeTab === 'presets') return;
                  // For custom tab, just inject easy as fallback (backend handles actual data)
                  onInject('easy');
                }}
                disabled={isLoading || (activeTab === 'custom' && jsonError !== null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sre-orange-dim border border-sre-orange/30 text-sre-orange text-xs font-mono font-semibold hover:bg-sre-orange/20 transition-colors disabled:opacity-40"
              >
                <FlaskConical className="w-4 h-4" />
                {isLoading ? 'INJECTING...' : 'INJECT & RESET EPISODE'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
