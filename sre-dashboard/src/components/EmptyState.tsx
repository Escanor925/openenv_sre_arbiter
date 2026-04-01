import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-sm"
      >
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-sre-accent-dim flex items-center justify-center"
        >
          <Shield className="w-8 h-8 text-sre-accent" />
        </motion.div>
        <h2 className="text-lg font-semibold text-sre-text-bright mb-2">
          No Active Incident
        </h2>
        <p className="text-sm text-sre-text-muted mb-6 leading-relaxed">
          Select a difficulty level and click START to begin an SRE episode.
          The AI will analyze the incident and recommend containment actions.
        </p>
        <div className="space-y-2 text-left">
          {[
            { label: 'Easy', desc: 'Bad code deploy — 2 turns expected', color: 'text-sre-green' },
            { label: 'Medium', desc: 'Cascading DB deadlock — 3 turns', color: 'text-sre-yellow' },
            { label: 'Hard', desc: 'DDoS disguised as viral — 4 turns', color: 'text-sre-red' },
          ].map((d) => (
            <div key={d.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sre-surface-alt/50 border border-sre-border">
              <ChevronRight className={`w-3.5 h-3.5 ${d.color}`} />
              <div>
                <span className={`text-xs font-mono font-semibold ${d.color}`}>{d.label}</span>
                <span className="text-xs text-sre-text-muted ml-2">{d.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] font-mono text-sre-text-muted">
          Press <kbd className="px-1.5 py-0.5 rounded bg-sre-surface-alt border border-sre-border text-sre-text">Ctrl+Shift+D</kbd> for Chaos Engineering tools
        </p>
      </motion.div>
    </div>
  );
}
