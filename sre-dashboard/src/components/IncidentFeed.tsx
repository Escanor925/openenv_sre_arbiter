import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, AlertTriangle, Wrench, Brain, ChevronDown } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import type { Observation, Action, Reward } from '../types/sre';
import {
  CONTAINMENT_LABELS,
  INVESTIGATION_LABELS,
  ROOT_CAUSE_LABELS,
} from '../types/sre';

interface TurnEntry {
  turn: number;
  action: Action;
  observation: Observation | null;
  reward: Reward | null;
}

interface IncidentFeedProps {
  observation: Observation | null;
  history: TurnEntry[];
  isAutopiloting: boolean;
  healerTriggered: boolean;
  aiRawResponse: string | null;
  reward: Reward | null;
  isDone: boolean;
}

const KEYWORD_PATTERNS = [
  { pattern: /DDoS|ddos_attack|botnet/gi, color: 'text-sre-red' },
  { pattern: /database|db_lock|deadlock/gi, color: 'text-sre-orange' },
  { pattern: /bad_code|rollback|deploy/gi, color: 'text-sre-yellow' },
  { pattern: /P1|CRITICAL|crash/gi, color: 'text-sre-red font-bold' },
  { pattern: /P2|WARNING/gi, color: 'text-sre-orange font-bold' },
  { pattern: /resolved|success|correct/gi, color: 'text-sre-green font-bold' },
];

function highlightKeywords(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    let earliest = { index: remaining.length, length: 0, color: '' };

    for (const kw of KEYWORD_PATTERNS) {
      kw.pattern.lastIndex = 0;
      const match = kw.pattern.exec(remaining);
      if (match && match.index < earliest.index) {
        earliest = { index: match.index, length: match[0].length, color: kw.color };
      }
    }

    if (earliest.index === remaining.length) {
      parts.push(remaining);
      break;
    }

    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }
    parts.push(
      <span key={keyIdx++} className={earliest.color}>
        {remaining.slice(earliest.index, earliest.index + earliest.length)}
      </span>,
    );
    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return parts;
}

export function IncidentFeed({
  observation,
  history,
  isAutopiloting,
  healerTriggered,
  aiRawResponse,
  reward,
  isDone,
}: IncidentFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, observation, isAutopiloting]);

  return (
    <div className="flex flex-col h-full">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-sre-border bg-sre-surface/60">
        <Terminal className="w-4 h-4 text-sre-accent" />
        <span className="text-xs font-mono text-sre-text-muted tracking-wider">INCIDENT FEED</span>
        {healerTriggered && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono bg-sre-purple-dim text-sre-purple border border-sre-purple/30"
          >
            AUTO-HEAL TRIGGERED
          </motion.span>
        )}
      </div>

      {/* Feed Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {/* Initial observation */}
        {observation && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sre-red">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">[{observation.incident_id}] {observation.severity} INCIDENT</span>
            </div>
            <p className="text-sre-text pl-5 leading-relaxed">
              {highlightKeywords(observation.initial_observation)}
            </p>
            <div className="pl-5 text-sre-text-muted">
              {observation.active_alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-sre-orange">▸</span> {highlightKeywords(alert)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Turn history */}
        <AnimatePresence mode="popLayout">
          {history.map((entry) => (
            <motion.div
              key={entry.turn}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-l-2 border-sre-accent/30 pl-3 space-y-1.5"
            >
              <div className="text-sre-accent text-[11px]">
                ── Turn {entry.turn} ──────────────────
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-3 h-3 text-sre-yellow" />
                <span className="text-sre-text-bright">
                  {CONTAINMENT_LABELS[entry.action.containment_action]}
                </span>
                <span className="text-sre-text-muted">•</span>
                <span className="text-sre-text">
                  {INVESTIGATION_LABELS[entry.action.investigation_query]}
                </span>
              </div>
              {entry.action.declare_root_cause !== 'unknown' && (
                <div className="flex items-center gap-2 text-sre-orange">
                  <Brain className="w-3 h-3" />
                  <span>Root Cause Declared: {ROOT_CAUSE_LABELS[entry.action.declare_root_cause]}</span>
                </div>
              )}
              <p className="text-sre-text-muted italic leading-relaxed">
                "{highlightKeywords(entry.action.justification)}"
              </p>

              {/* Investigation results from next observation */}
              {entry.observation && Object.keys(entry.observation.investigation_results).length > 0 && (
                <div className="mt-1 space-y-1">
                  {Object.entries(entry.observation.investigation_results).map(([key, val]) => (
                    <div key={key} className="text-sre-green">
                      <span className="text-sre-green/70">[{key}]</span> {highlightKeywords(val)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI Thinking State */}
        {isAutopiloting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-sre-accent-dim border border-sre-accent/20"
          >
            <div className="flex gap-1">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 rounded-full bg-sre-accent"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-sre-accent"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-sre-accent"
              />
            </div>
            <span className="text-sre-accent text-xs animate-pulse-glow">
              Nemotron 120B analyzing incident...
            </span>
          </motion.div>
        )}

        {/* AI Raw Response (Debug Thought Chain) */}
        {aiRawResponse && (
          <Collapsible.Root>
            <Collapsible.Trigger className="flex items-center gap-2 text-[10px] text-sre-text-muted hover:text-sre-text transition-colors cursor-pointer group">
              <Brain className="w-3 h-3" />
              <span>AI Thought Chain</span>
              <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
            </Collapsible.Trigger>
            <Collapsible.Content>
              <motion.pre
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-1.5 p-2 rounded bg-sre-bg/80 border border-sre-border text-[10px] text-sre-text overflow-x-auto whitespace-pre-wrap"
              >
                {highlightKeywords(aiRawResponse)}
              </motion.pre>
            </Collapsible.Content>
          </Collapsible.Root>
        )}

        {/* Final Score */}
        {isDone && reward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 rounded-lg border border-sre-green/30 bg-sre-green-dim"
          >
            <div className="text-sre-green font-bold text-sm mb-2">
              EPISODE RESOLVED — Score: {(reward.total_score * 100).toFixed(1)}%
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {Object.entries(reward.breakdown).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sre-text-muted">{key.replace(/_/g, ' ')}</span>
                  <span className={val < 0 ? 'text-sre-red' : 'text-sre-text-bright'}>
                    {typeof val === 'number' ? val.toFixed(2) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
