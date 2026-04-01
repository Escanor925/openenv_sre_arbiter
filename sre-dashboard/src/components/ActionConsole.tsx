import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, RotateCcw, ChevronDown, Bot, Play } from 'lucide-react';
import type {
  TaskName,
  ContainmentAction,
  InvestigationQuery,
  RootCause,
  Action,
  AutopilotPhase,
} from '../types/sre';
import {
  CONTAINMENT_LABELS,
  CONTAINMENT_COSTS,
  INVESTIGATION_LABELS,
  INVESTIGATION_COST,
  ROOT_CAUSE_LABELS,
} from '../types/sre';

// ─── Constants ───────────────────────────────────────────────────────────────

const FILL_DELAY_MS = 450;
const TYPEWRITER_MS = 18;
const SUBMIT_COUNTDOWN_MS = 1500;

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ActionConsoleProps {
  onSubmit: (action: Action) => void;
  onAutopilot: () => Promise<Action | null>;
  onSetAutopilotPhase: (phase: AutopilotPhase) => void;
  onReset: (taskName: TaskName) => void;
  isLoading: boolean;
  autopilotPhase: AutopilotPhase;
  isDone: boolean;
  hasEpisode: boolean;
}

// ─── SelectField ─────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; detail?: string }>;
  blocked: boolean;
  aiFilled: boolean;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  blocked,
  aiFilled,
}: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-mono text-sre-text-muted tracking-wider uppercase">
          {label}
        </label>
        <AnimatePresence>
          {aiFilled && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sre-green-dim text-sre-green border border-sre-green/30"
            >
              AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className={`relative ${blocked ? 'pointer-events-none' : ''}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            'w-full appearance-none bg-sre-bg rounded-md px-3 py-2 text-xs font-mono text-sre-text-bright',
            'focus:outline-none transition-all duration-300',
            aiFilled
              ? 'border border-sre-green/50 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
              : blocked
                ? 'border border-sre-border opacity-50'
                : 'border border-sre-border focus:border-sre-accent/50 focus:ring-1 focus:ring-sre-accent/30 cursor-pointer',
          ].join(' ')}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.detail ? ` (${opt.detail})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sre-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Autopilot Button Content ────────────────────────────────────────────────

function PulseDots({ count = 3, speed = 1 }: { count?: number; speed?: number }) {
  return (
    <span className="flex gap-0.5 ml-1">
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: speed, repeat: Infinity, delay: i * 0.2 }}
          className="w-1 h-1 rounded-full bg-white"
        />
      ))}
    </span>
  );
}

function AutopilotButtonContent({ phase }: { phase: AutopilotPhase }) {
  switch (phase) {
    case 'thinking':
      return (
        <>
          <Zap className="w-4 h-4" />
          <span>NEMOTRON ANALYZING</span>
          <PulseDots speed={1.2} />
        </>
      );
    case 'filling':
      return (
        <>
          <Bot className="w-4 h-4" />
          <span>AI FILLING FORM</span>
          <PulseDots speed={0.8} />
        </>
      );
    case 'submitting':
      return (
        <>
          <Play className="w-4 h-4" />
          <span>AUTO-EXECUTING</span>
        </>
      );
    default:
      return (
        <>
          <Zap className="w-4 h-4" />
          <span>AUTO-PILOT (RUN AI)</span>
        </>
      );
  }
}

// ─── Gradient per phase ──────────────────────────────────────────────────────

function phaseGradient(phase: AutopilotPhase): string {
  switch (phase) {
    case 'thinking':
      return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #38bdf8 100%)';
    case 'filling':
      return 'linear-gradient(135deg, #059669 0%, #22c55e 50%, #38bdf8 100%)';
    case 'submitting':
      return 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #22c55e 100%)';
    default:
      return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #38bdf8 100%)';
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ActionConsole({
  onSubmit,
  onAutopilot,
  onSetAutopilotPhase,
  onReset,
  isLoading,
  autopilotPhase,
  isDone,
  hasEpisode,
}: ActionConsoleProps) {
  // ── Form state (controlled inputs) ──────────────────────────────────────
  const [containment, setContainment] = useState<ContainmentAction>('do_nothing');
  const [investigation, setInvestigation] = useState<InvestigationQuery>('none');
  const [rootCause, setRootCause] = useState<RootCause>('unknown');
  const [justification, setJustification] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskName>('easy');

  // ── AI visual state ─────────────────────────────────────────────────────
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Tracks the current autopilot run so stale animations abort on reset/unmount
  const autopilotRunRef = useRef(0);

  // Reset form fields when episode is cleared
  useEffect(() => {
    if (!hasEpisode) {
      setContainment('do_nothing');
      setInvestigation('none');
      setRootCause('unknown');
      setJustification('');
      setAiFilledFields(new Set());
      autopilotRunRef.current++;
    }
  }, [hasEpisode]);

  // ── Derived flags ───────────────────────────────────────────────────────
  const isUserBlocked = isLoading || autopilotPhase !== 'idle' || isDone;
  const isAiActive = autopilotPhase === 'filling' || autopilotPhase === 'submitting';

  // ── Manual submit ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!justification.trim()) return;
    onSubmit({
      containment_action: containment,
      investigation_query: investigation,
      declare_root_cause: rootCause,
      justification: justification.trim(),
    });
  }, [containment, investigation, rootCause, justification, onSubmit]);

  // ── Autopilot orchestration ─────────────────────────────────────────────
  const handleAutopilotClick = useCallback(async () => {
    const runId = ++autopilotRunRef.current;
    const isCurrent = () => autopilotRunRef.current === runId;

    // 1 ── Lock form & reset fields while AI thinks
    setContainment('do_nothing');
    setInvestigation('none');
    setRootCause('unknown');
    setJustification('');
    setAiFilledFields(new Set());

    // 2 ── Call LLM (hook sets phase → "thinking" → "filling")
    const action = await onAutopilot();
    if (!action || !isCurrent()) return;

    // 3 ── Staggered field fill ────────────────────────────────────────────
    await wait(FILL_DELAY_MS);
    if (!isCurrent()) return;
    setContainment(action.containment_action);
    setAiFilledFields(new Set(['containment']));

    await wait(FILL_DELAY_MS);
    if (!isCurrent()) return;
    setInvestigation(action.investigation_query);
    setAiFilledFields(new Set(['containment', 'investigation']));

    await wait(FILL_DELAY_MS);
    if (!isCurrent()) return;
    setRootCause(action.declare_root_cause);
    setAiFilledFields(new Set(['containment', 'investigation', 'rootCause']));

    // 4 ── Typewriter effect on justification ──────────────────────────────
    await wait(200);
    for (let i = 1; i <= action.justification.length; i++) {
      if (!isCurrent()) return;
      setJustification(action.justification.slice(0, i));
      await wait(TYPEWRITER_MS);
    }
    setAiFilledFields(
      new Set(['containment', 'investigation', 'rootCause', 'justification']),
    );

    // 5 ── Countdown pause so user can read the justification ──────────────
    onSetAutopilotPhase('submitting');
    await wait(SUBMIT_COUNTDOWN_MS);
    if (!isCurrent()) return;

    // 6 ── Auto-submit the AI action to the game engine ────────────────────
    onSubmit(action);
    setAiFilledFields(new Set());
    onSetAutopilotPhase('idle');
  }, [onAutopilot, onSubmit, onSetAutopilotPhase]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Console Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-sre-border bg-sre-surface/60">
        <span className="text-xs font-mono text-sre-text-muted tracking-wider">
          ACTION CONSOLE
        </span>
        {(!hasEpisode || isDone) && (
          <div className="flex items-center gap-2">
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value as TaskName)}
              className="bg-sre-bg border border-sre-border rounded px-2 py-1 text-xs font-mono text-sre-text-bright"
            >
              {TASK_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
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
        )}
      </div>

      {/* ── Action Form ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* AI Thinking placeholder in justification area */}
        {autopilotPhase === 'thinking' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-sre-purple-dim border border-sre-purple/20 mb-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-sre-purple/30 border-t-sre-purple rounded-full"
            />
            <span className="text-[11px] font-mono text-sre-purple animate-pulse-glow">
              Nemotron-120B is analyzing telemetry...
            </span>
          </motion.div>
        )}

        <SelectField
          label="Containment Action"
          value={containment}
          onChange={(v) => setContainment(v as ContainmentAction)}
          options={CONTAINMENT_OPTIONS.map((v) => ({
            value: v,
            label: CONTAINMENT_LABELS[v],
            detail: `$${CONTAINMENT_COSTS[v]}`,
          }))}
          blocked={isUserBlocked}
          aiFilled={aiFilledFields.has('containment')}
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
          blocked={isUserBlocked}
          aiFilled={aiFilledFields.has('investigation')}
        />

        <SelectField
          label="Declare Root Cause"
          value={rootCause}
          onChange={(v) => setRootCause(v as RootCause)}
          options={ROOT_CAUSE_OPTIONS.map((v) => ({
            value: v,
            label: ROOT_CAUSE_LABELS[v],
          }))}
          blocked={isUserBlocked}
          aiFilled={aiFilledFields.has('rootCause')}
        />

        {/* Justification textarea */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-mono text-sre-text-muted tracking-wider uppercase">
              Justification
            </label>
            <AnimatePresence>
              {aiFilledFields.has('justification') && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sre-green-dim text-sre-green border border-sre-green/30"
                >
                  AI
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className={isUserBlocked ? 'pointer-events-none' : ''}>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={
                autopilotPhase === 'thinking'
                  ? 'Nemotron-120B is analyzing telemetry...'
                  : 'Explain your reasoning...'
              }
              rows={3}
              className={[
                'w-full bg-sre-bg rounded-md px-3 py-2 text-xs font-mono text-sre-text-bright',
                'placeholder:text-sre-text-muted/50 focus:outline-none resize-none transition-all duration-300',
                aiFilledFields.has('justification')
                  ? 'border border-sre-green/50 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                  : isAiActive
                    ? 'border border-sre-accent/30'
                    : isUserBlocked
                      ? 'border border-sre-border opacity-50'
                      : 'border border-sre-border focus:border-sre-accent/50 focus:ring-1 focus:ring-sre-accent/30',
              ].join(' ')}
            />
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────── */}
      <div className="p-4 border-t border-sre-border space-y-2">
        {/* Autopilot Button */}
        <div className="relative">
          <motion.button
            onClick={handleAutopilotClick}
            disabled={isUserBlocked || !hasEpisode}
            whileHover={autopilotPhase === 'idle' ? { scale: 1.01 } : undefined}
            whileTap={autopilotPhase === 'idle' ? { scale: 0.99 } : undefined}
            className={[
              'w-full relative overflow-hidden flex items-center justify-center gap-2',
              'px-4 py-2.5 rounded-lg font-mono text-xs font-semibold text-white',
              'disabled:opacity-40 disabled:cursor-not-allowed transition-shadow',
              autopilotPhase === 'idle'
                ? 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : '',
            ].join(' ')}
            style={{ background: phaseGradient(autopilotPhase) }}
          >
            <AutopilotButtonContent phase={autopilotPhase} />

            {/* Shimmer sweep during active phases */}
            {autopilotPhase !== 'idle' && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: autopilotPhase === 'thinking' ? 1.5 : 1,
                  repeat: Infinity,
                }}
                style={{ width: '50%' }}
              />
            )}
          </motion.button>

          {/* Countdown progress bar during "submitting" phase */}
          <AnimatePresence>
            {autopilotPhase === 'submitting' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-full bg-sre-accent"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{
                    duration: SUBMIT_COUNTDOWN_MS / 1000,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Manual Submit */}
        <button
          onClick={handleSubmit}
          disabled={isUserBlocked || !hasEpisode || !justification.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sre-surface-alt border border-sre-border text-xs font-mono text-sre-text-bright hover:bg-sre-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          SUBMIT MANUAL ACTION
        </button>
      </div>
    </div>
  );
}
