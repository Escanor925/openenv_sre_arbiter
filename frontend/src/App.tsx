import { useState } from 'react';
import { ActionConsole } from './components/ActionConsole';
import { HeaderBar } from './components/HeaderBar';
import { IncidentFeed } from './components/IncidentFeed';
import { TelemetryGrid } from './components/TelemetryGrid';
import { useArbiter } from './hooks/useArbiter';
import type { Action, TaskName } from './types';

const BUDGET_MAX = 5000;

const defaultAction: Action = {
  containment_action: 'do_nothing',
  investigation_query: 'none',
  declare_root_cause: 'unknown',
  justification: 'Stabilizing while gathering first evidence batch.',
};

function App() {
  const [taskName, setTaskName] = useState<TaskName>('easy');
  const [action, setAction] = useState<Action>(defaultAction);
  const {
    observation,
    reward,
    telemetry,
    feed,
    budgetSpent,
    health,
    turn,
    isDone,
    isBusy,
    isAutopilotBusy,
    error,
    startEpisode,
    runStep,
    runAutoPilot,
  } = useArbiter();

  const handleStart = async () => {
    await startEpisode(taskName);
    setAction(defaultAction);
  };

  const handleManualRun = async () => {
    await runStep(action);
  };

  const handleAutoPilot = async () => {
    const aiAction = await runAutoPilot();
    if (aiAction) {
      setAction(aiAction);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_82%_22%,rgba(167,139,250,0.15),transparent_38%),radial-gradient(circle_at_70%_85%,rgba(52,211,153,0.10),transparent_45%)]" />

      <div className="relative z-10">
        <HeaderBar
          budgetSpent={budgetSpent}
          budgetMax={BUDGET_MAX}
          health={health}
          turn={turn}
          isDone={isDone}
        />

        <main className="mx-auto w-full max-w-[1800px] p-4">
          <div className="mb-4 grid gap-4 lg:grid-cols-3 lg:items-start">
            <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Live Telemetry Grid</p>
              <TelemetryGrid telemetry={telemetry} observation={observation} />
            </section>

            <section className="min-h-[560px]">
              <IncidentFeed feed={feed} />
            </section>

            <section>
              <ActionConsole
                taskName={taskName}
                action={action}
                disabled={!observation || isDone}
                isBusy={isBusy}
                isAutopilotBusy={isAutopilotBusy}
                onTaskNameChange={setTaskName}
                onActionChange={setAction}
                onStartIncident={handleStart}
                onRunManualAction={handleManualRun}
                onRunAutoPilot={handleAutoPilot}
              />
            </section>
          </div>

          {error ? (
            <div className="mb-3 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-200">
              {error}
            </div>
          ) : null}

          {reward ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-emerald-200">Episode Scorecard</p>
              <p className="font-display text-3xl text-emerald-300">{(reward.total_score * 100).toFixed(1)}%</p>
              <div className="mt-3 grid gap-2 text-xs text-slate-200 sm:grid-cols-2 lg:grid-cols-5">
                <div>Root Cause: {(reward.breakdown.root_cause * 100).toFixed(1)}%</div>
                <div>Containment: {(reward.breakdown.containment * 100).toFixed(1)}%</div>
                <div>Evidence: {(reward.breakdown.evidence * 100).toFixed(1)}%</div>
                <div>Efficiency: {(reward.breakdown.efficiency * 100).toFixed(1)}%</div>
                <div>Health: {(reward.breakdown.health * 100).toFixed(1)}%</div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
