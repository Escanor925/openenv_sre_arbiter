import { motion } from 'framer-motion';
import { Shield, Activity, Wifi } from 'lucide-react';
import type { EpisodeState } from '../types/sre';
import { MAX_BUDGET } from '../types/sre';

interface HeaderProps {
  state: EpisodeState | null;
  isConnected: boolean;
}

function getBudgetColor(spent: number): string {
  const pct = spent / MAX_BUDGET;
  if (pct >= 0.8) return 'bg-sre-red';
  if (pct >= 0.5) return 'bg-sre-orange';
  if (pct >= 0.3) return 'bg-sre-yellow';
  return 'bg-sre-green';
}

function getBudgetGlow(spent: number): string {
  const pct = spent / MAX_BUDGET;
  if (pct >= 0.8) return 'shadow-[0_0_12px_rgba(239,68,68,0.5)]';
  if (pct >= 0.5) return 'shadow-[0_0_12px_rgba(249,115,22,0.4)]';
  return '';
}

export function Header({ state, isConnected }: HeaderProps) {
  const spent = state?.budget_spent ?? 0;
  const pct = (spent / MAX_BUDGET) * 100;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-sre-border bg-sre-surface/80 backdrop-blur-sm">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sre-accent-dim">
          <Shield className="w-5 h-5 text-sre-accent" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sre-text-bright tracking-wide">
            CLOUD SRE ARBITER
          </h1>
          <p className="text-xs text-sre-text-muted font-mono">
            {state ? `${state.incident_id} • Turn ${state.turn_number}/${state.max_turns}` : 'No active episode'}
          </p>
        </div>
      </div>

      {/* Budget Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-sre-text-muted font-mono">BUDGET</span>
          <span className="text-xs font-mono text-sre-text-bright">
            ${spent.toLocaleString()} / ${MAX_BUDGET.toLocaleString()}
          </span>
        </div>
        <div className={`h-2 rounded-full bg-sre-surface-alt overflow-hidden ${getBudgetGlow(spent)}`}>
          <motion.div
            className={`h-full rounded-full ${getBudgetColor(spent)}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-4">
        {state && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-sre-surface-alt">
            <Activity className="w-3.5 h-3.5 text-sre-accent" />
            <span className="text-xs font-mono text-sre-text-bright">
              Health: {state.system_health.toFixed(0)}%
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-sre-green' : 'text-sre-red'}`} />
          <span className={`text-xs font-mono ${isConnected ? 'text-sre-green' : 'text-sre-red'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
}
