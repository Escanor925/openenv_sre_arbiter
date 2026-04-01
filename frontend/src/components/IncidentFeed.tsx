import { TerminalSquare } from 'lucide-react';
import type { FeedEntry } from '../types';

interface IncidentFeedProps {
  feed: FeedEntry[];
}

const toneMap: Record<FeedEntry['source'], string> = {
  system: 'text-slate-200',
  alert: 'text-rose-300',
  ai: 'text-cyan-300',
  user: 'text-emerald-300',
  error: 'text-amber-300',
};

export function IncidentFeed({ feed }: IncidentFeedProps) {
  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <TerminalSquare className="h-4 w-4 text-cyan-300" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Live Incident Feed</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {feed.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 font-mono text-xs text-slate-500">
            Waiting for episode boot. Press START INCIDENT to stream live telemetry and AI reasoning.
          </div>
        ) : null}

        {feed.map((entry) => (
          <div key={entry.id} className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-slate-500">
              <span>{entry.source}</span>
              <span>{entry.at}</span>
            </div>
            <p className={`whitespace-pre-wrap font-mono text-xs leading-relaxed ${toneMap[entry.source]}`}>
              {entry.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
