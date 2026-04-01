import { Bot, PlayCircle, RotateCcw, WandSparkles } from 'lucide-react';
import type {
  Action,
  ContainmentAction,
  InvestigationQuery,
  RootCause,
  TaskName,
} from '../types';

interface ActionConsoleProps {
  taskName: TaskName;
  action: Action;
  disabled: boolean;
  isBusy: boolean;
  isAutopilotBusy: boolean;
  onTaskNameChange: (task: TaskName) => void;
  onActionChange: (action: Action) => void;
  onStartIncident: () => void;
  onRunManualAction: () => void;
  onRunAutoPilot: () => void;
}

const containmentOptions: ContainmentAction[] = [
  'scale_up_nodes',
  'rate_limit_all',
  'rollback_last_deploy',
  'do_nothing',
];

const investigationOptions: InvestigationQuery[] = [
  'analyze_ip_traffic',
  'query_db_locks',
  'check_commit_diffs',
  'check_service_mesh',
  'check_resource_utilization',
  'none',
];

const rootCauseOptions: RootCause[] = [
  'unknown',
  'ddos_attack',
  'viral_traffic',
  'bad_code',
  'database_lock',
];

function prettyLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ActionConsole({
  taskName,
  action,
  disabled,
  isBusy,
  isAutopilotBusy,
  onTaskNameChange,
  onActionChange,
  onStartIncident,
  onRunManualAction,
  onRunAutoPilot,
}: ActionConsoleProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Bot className="h-4 w-4 text-fuchsia-300" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Action Console</p>
      </div>

      <label className="block space-y-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">Scenario</span>
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          value={taskName}
          onChange={(event) => onTaskNameChange(event.target.value as TaskName)}
          disabled={isBusy || isAutopilotBusy}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onStartIncident}
        disabled={isBusy || isAutopilotBusy}
      >
        <RotateCcw className="h-4 w-4" />
        Start Incident
      </button>

      <label className="block space-y-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">Containment Action</span>
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          value={action.containment_action}
          onChange={(event) =>
            onActionChange({
              ...action,
              containment_action: event.target.value as ContainmentAction,
            })
          }
          disabled={disabled || isBusy}
        >
          {containmentOptions.map((option) => (
            <option key={option} value={option}>
              {prettyLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">Investigation Query</span>
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          value={action.investigation_query}
          onChange={(event) =>
            onActionChange({
              ...action,
              investigation_query: event.target.value as InvestigationQuery,
            })
          }
          disabled={disabled || isBusy}
        >
          {investigationOptions.map((option) => (
            <option key={option} value={option}>
              {prettyLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">Declare Root Cause</span>
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          value={action.declare_root_cause}
          onChange={(event) =>
            onActionChange({
              ...action,
              declare_root_cause: event.target.value as RootCause,
            })
          }
          disabled={disabled || isBusy}
        >
          {rootCauseOptions.map((option) => (
            <option key={option} value={option}>
              {prettyLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">Justification</span>
        <textarea
          rows={4}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          value={action.justification}
          onChange={(event) => onActionChange({ ...action, justification: event.target.value })}
          disabled={disabled || isBusy}
          placeholder="Explain why this containment + investigation pair is optimal right now."
        />
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRunManualAction}
          disabled={disabled || isBusy || isAutopilotBusy}
        >
          <PlayCircle className="h-4 w-4" />
          {isBusy ? 'Executing...' : 'Run Action'}
        </button>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRunAutoPilot}
          disabled={disabled || isBusy || isAutopilotBusy}
        >
          <WandSparkles className="h-4 w-4" />
          {isAutopilotBusy ? 'Thinking...' : 'Auto-Pilot (Run AI)'}
        </button>
      </div>
    </div>
  );
}
