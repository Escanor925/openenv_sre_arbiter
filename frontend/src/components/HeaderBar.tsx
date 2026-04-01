import { Activity, ShieldAlert } from 'lucide-react';

interface HeaderBarProps {
  budgetSpent: number;
  budgetMax: number;
  health: number;
  turn: number;
  isDone: boolean;
}

export function HeaderBar({ budgetSpent, budgetMax, health, turn, isDone }: HeaderBarProps) {
  const budgetRatio = Math.min(1, Math.max(0, budgetSpent / budgetMax));
  const healthTone = health >= 70 ? 'text-emerald-400' : health >= 40 ? 'text-amber-300' : 'text-rose-400';

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-6 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-cyan-400/20 p-2 text-cyan-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg tracking-wide text-slate-100">Cloud SRE Arbiter v2.0</p>
            <p className="truncate font-mono text-xs text-slate-400">Nemotron-120B Incident Command Center</p>
          </div>
        </div>

        <div className="flex w-[460px] max-w-full items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between font-mono text-xs text-slate-300">
              <span>Budget Tracker</span>
              <span>${budgetSpent.toFixed(0)} / ${budgetMax}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 transition-all duration-500"
                style={{ width: `${budgetRatio * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono text-xs">
            <Activity className="h-4 w-4 text-cyan-300" />
            <span className="text-slate-300">Turn {turn}</span>
            <span className={healthTone}>Health {health.toFixed(0)}%</span>
            <span className={isDone ? 'text-emerald-400' : 'text-amber-300'}>
              {isDone ? 'RESOLVED' : 'LIVE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
