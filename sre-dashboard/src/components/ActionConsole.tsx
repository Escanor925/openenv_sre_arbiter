import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, RotateCcw, ChevronDown } from 'lucide-react';
import type {
  TaskName,
  ContainmentAction,
  InvestigationQuery,
  RootCause,
  Action,
} from '../types/sre';
import {
  CONTAINMENT_LABELS,
  CONTAINMENT_COSTS,
  INVESTIGATION_LABELS,
  INVESTIGATION_COST,
  ROOT_CAUSE_LABELS,
} from '../types/sre';

interface ActionConsoleProps {
  onSubmit: (action: Action) => void;
  onAutopilot: () => Promise<Action | null>;
  onReset: (taskName: TaskName) => void;
  isLoading: boolean;
  isAutopiloting: boolean;
  isDone: boolean;
  hasEpisode: boolean;
}

const CONTAINMENT_OPTIONS: ContainmentAction[] = [
  'scale_up_nodes',
  'rate_limit_all',
  'rollback_last_deploy',
  'do_nothing',
];

const INVESTIGATION_OPTIONS: InvestigationQuery[] = [
  'analyze_ip_traffic',
  'query_db_locks',
  'check_commit_diffs',
  'check_service_mesh',
  'check_resource_utilization',
  'none',
];

const ROOT_CAUSE_OPTIONS: RootCause[] = [
  'unknown',
  'ddos_attack',
  'viral_traffic',
  'bad_code',
  'database_lock',
];

const TASK_OPTIONS: TaskName[] = ['easy', 'medium', 'hard'];

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; detail?: string }>;
  disabled: boolean;
}

function SelectField({ label, value, onChange, options, disabled }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-mono text-sre-text-muted tracking-wider uppercase">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-sre-bg border border-sre-border rounded-md px-3 py-2 text-xs font-mono text-sre-text-bright focus:outline-none focus:border-sre-accent/50 focus:ring-1 focus:ring-sre-accent/30 disabled:opacity-40 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{opt.detail ? ` (${opt.detail})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sre-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

export function ActionConsole({
  onSubmit,
  onAutopilot,
  onReset,
  isLoading,
  isAutopiloting,
  isDone,
  hasEpisode,
}: ActionConsoleProps) {
  const [containment, setContainment] = useState<ContainmentAction>('do_nothing');
  const [investigation, setInvestigation] = useState<InvestigationQuery>('none');
  const [rootCause, setRootCause] = useState<RootCause>('unknown');
  const [justification, setJustification] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskName>('easy');

  const disabled = isLoading || isAutopiloting || isDone;

  const handleSubmit = useCallback(() => {
    if (!justification.trim()) return;
    onSubmit({
      containment_action: containment,
      investigation_query: investigation,
      declare_root_cause: rootCause,
      justification: justification.trim(),
    });
  }, [containment, investigation, rootCause, justification, onSubmit]);

  const handleAutopilot = useCallback(async () => {
    const action = await onAutopilot();
    if (action) {
      setContainment(action.containment_action);
      setInvestigation(action.investigation_query);
      setRootCause(action.declare_root_cause);
      setJustification(action.justification);
      // Auto-submit the AI action
      onSubmit(action);
    }
  }, [onAutopilot, onSubmit]);

  return (
    <div className="flex flex-col h-full">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-sre-border bg-sre-surface/60">
        <span className="text-xs font-mono text-sre-text-muted tracking-wider">ACTION CONSOLE</span>
        {!hasEpisode || isDone ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value as TaskName)}
              className="bg-sre-bg border border-sre-border rounded px-2 py-1 text-xs font-mono text-sre-text-bright"
            >
              {TASK_OPTIONS.map((t) => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
            <button
              onClick={() => onReset(selectedTask)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-sre-accent-dim text-sre-accent text-xs font-mono hover:bg-sre-accent/25 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-3 h-3" />
              {hasEpisode ? 'NEW EPISODE' : 'START'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Action Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <SelectField
          label="Containment Action"
          value={containment}
          onChange={(v) => setContainment(v as ContainmentAction)}
          options={CONTAINMENT_OPTIONS.map((v) => ({
            value: v,
            label: CONTAINMENT_LABELS[v],
            detail: `$${CONTAINMENT_COSTS[v]}`,
          }))}
          disabled={disabled}
        />

        <SelectField
          label="Investigation Query"
          value={investigation}
          onChange={(v) => setInvestigation(v as InvestigationQuery)}
          options={INVESTIGATION_OPTIONS.map((v) => ({
            value: v,
            label: INVESTIGATION_LABELS[v],
            detail: v !== 'none' ? `$${INVESTIGATION_COST}` : '$0',
          }))}
          disabled={disabled}
        />

        <SelectField
          label="Declare Root Cause"
          value={rootCause}
          onChange={(v) => setRootCause(v as RootCause)}
          options={ROOT_CAUSE_OPTIONS.map((v) => ({
            value: v,
            label: ROOT_CAUSE_LABELS[v],
          }))}
          disabled={disabled}
        />

        <div className="space-y-1">
          <label className="text-[10px] font-mono text-sre-text-muted tracking-wider uppercase">
            Justification
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            disabled={disabled}
            placeholder="Explain your reasoning..."
            rows={3}
            className="w-full bg-sre-bg border border-sre-border rounded-md px-3 py-2 text-xs font-mono text-sre-text-bright placeholder:text-sre-text-muted/50 focus:outline-none focus:border-sre-accent/50 focus:ring-1 focus:ring-sre-accent/30 disabled:opacity-40 resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-sre-border space-y-2">
        {/* Autopilot Button */}
        <motion.button
          onClick={handleAutopilot}
          disabled={disabled || !hasEpisode}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #38bdf8 100%)',
          }}
        >
          <Zap className="w-4 h-4" />
          {isAutopiloting ? 'NEMOTRON THINKING...' : 'AUTO-PILOT (RUN AI)'}
          {isAutopiloting && (
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: '50%' }}
            />
          )}
        </motion.button>

        {/* Manual Submit */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !hasEpisode || !justification.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sre-surface-alt border border-sre-border text-xs font-mono text-sre-text-bright hover:bg-sre-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          SUBMIT MANUAL ACTION
        </button>
      </div>
    </div>
  );
}
