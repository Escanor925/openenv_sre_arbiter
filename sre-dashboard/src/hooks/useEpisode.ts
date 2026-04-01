import { useState, useCallback } from 'react';
import type {
  TaskName,
  Action,
  Observation,
  Reward,
  EpisodeState,
  AutopilotPhase,
} from '../types/sre';
import { resetEpisode, submitStep, runAutopilot } from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TurnRecord {
  turn: number;
  action: Action;
  observation: Observation | null;
  reward: Reward | null;
}

interface EpisodeHook {
  observation: Observation | null;
  state: EpisodeState | null;
  reward: Reward | null;
  history: TurnRecord[];
  isLoading: boolean;
  isAutopiloting: boolean;
  autopilotPhase: AutopilotPhase;
  error: string | null;
  isDone: boolean;
  healerTriggered: boolean;
  aiRawResponse: string | null;
  reset: (taskName: TaskName) => Promise<void>;
  step: (action: Action) => Promise<void>;
  autopilot: () => Promise<Action | null>;
  setAutopilotPhase: (phase: AutopilotPhase) => void;
}

// ─── God-Level System Prompt ─────────────────────────────────────────────────

const SRE_SYSTEM_PROMPT = `You are an elite, battle-tested Site Reliability Engineer (SRE) leading incident response for a critical cloud infrastructure. A live production incident is currently unfolding.

YOUR OBJECTIVES:
1. CONTAINMENT: Stabilize the system immediately to prevent cascading failures.
2. INVESTIGATION: Gather concrete telemetry and logs to find the true source of the failure.
3. RESOLUTION: Declare the root cause ONLY when you have definitive proof. Do not guess.

AVAILABLE ACTIONS:
- Containment Actions: scale_up_nodes, rate_limit_all, rollback_last_deploy, do_nothing
- Investigation Queries: analyze_ip_traffic, query_db_locks, check_commit_diffs, check_service_mesh, check_resource_utilization, none
- Root Cause Declarations: ddos_attack, viral_traffic, bad_code, database_lock, unknown

RULES OF ENGAGEMENT:
- You must balance budget and system health.
- If system health is dropping rapidly, prioritize containment over investigation.
- You will be heavily penalized for declaring a root cause prematurely without sufficient evidence.
- Set declare_root_cause to "unknown" while still investigating.
- Once evidence is conclusive, declare the root cause to resolve the incident.
- Every action costs money. Unnecessary spending lowers your score.
- Inaction causes system health to degrade. The system can crash.

STRATEGY:
Turn 1-2: Stabilize with containment AND run investigation queries.
Turn 3+: Declare root cause once evidence supports it.
Never declare a root cause on turn 1 unless evidence is absolutely conclusive.

OUTPUT FORMAT:
You must respond with a raw, valid JSON object and absolutely nothing else. Do not use markdown formatting, backticks, or conversational filler. The JSON must exactly match this schema:
{
  "containment_action": "<exact string from available containment actions>",
  "investigation_query": "<exact string from available investigation queries>",
  "declare_root_cause": "<exact string from available root causes, or 'unknown'>",
  "justification": "<A brief, 1-3 sentence technical explanation citing specific evidence>"
}`;

// ─── Dynamic Prompt Builder ──────────────────────────────────────────────────

/**
 * Constructs the "user" message for the LLM by injecting the full live
 * observation state and the history of actions already taken. This gives the
 * model complete situational awareness each turn.
 */
export function generateAutopilotPayload(
  obs: Observation,
  history: TurnRecord[],
): Array<{ role: string; content: string }> {
  return [
    { role: 'system', content: SRE_SYSTEM_PROMPT },
    { role: 'user', content: buildUserMessage(obs, history) },
  ];
}

function buildUserMessage(obs: Observation, history: TurnRecord[]): string {
  const lines: string[] = [];

  lines.push('=== CURRENT SYSTEM STATE ===');
  lines.push(`INCIDENT: ${obs.incident_id} | Severity: ${obs.severity}`);
  lines.push(`Turn: ${obs.turn_number} | Turns Remaining: ${obs.turns_remaining}`);
  lines.push(`System Health: ${obs.system_health}% | Budget Spent: $${obs.budget_spent}`);
  lines.push('');

  lines.push('--- Observation ---');
  lines.push(obs.initial_observation);
  lines.push('');

  lines.push('--- Active Alerts ---');
  for (const a of obs.active_alerts) {
    lines.push(`  \u2022 ${a}`);
  }
  lines.push('');

  lines.push('--- System Metrics ---');
  for (const [k, v] of Object.entries(obs.system_metrics)) {
    lines.push(`  ${k}: ${v}`);
  }
  lines.push('');

  if (Object.keys(obs.investigation_results).length > 0) {
    lines.push('--- Investigation Results (EVIDENCE GATHERED) ---');
    for (const [k, v] of Object.entries(obs.investigation_results)) {
      lines.push(`  [${k}]: ${v}`);
    }
    lines.push('');
  }

  lines.push('--- Timeline ---');
  for (const t of obs.timeline) {
    lines.push(`  ${t}`);
  }

  if (history.length > 0) {
    lines.push('');
    lines.push('=== PREVIOUS ACTIONS TAKEN ===');
    for (const h of history) {
      lines.push(
        `Turn ${h.turn}: containment=${h.action.containment_action}, ` +
        `investigation=${h.action.investigation_query}, ` +
        `root_cause=${h.action.declare_root_cause}`,
      );
      lines.push(`  Justification: ${h.action.justification}`);
    }
  }

  return lines.join('\n');
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useEpisode(): EpisodeHook {
  const [observation, setObservation] = useState<Observation | null>(null);
  const [state, setState] = useState<EpisodeState | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [history, setHistory] = useState<TurnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autopilotPhase, setAutopilotPhase] = useState<AutopilotPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [healerTriggered, setHealerTriggered] = useState(false);
  const [aiRawResponse, setAiRawResponse] = useState<string | null>(null);

  const isAutopiloting = autopilotPhase !== 'idle';

  const reset = useCallback(async (taskName: TaskName) => {
    setIsLoading(true);
    setError(null);
    setHistory([]);
    setReward(null);
    setIsDone(false);
    setHealerTriggered(false);
    setAiRawResponse(null);
    setAutopilotPhase('idle');
    try {
      const res = await resetEpisode(taskName);
      setObservation(res.observation);
      setState(res.state);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const step = useCallback(async (action: Action) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await submitStep(action);
      const record: TurnRecord = {
        turn: res.info.turn,
        action,
        observation: res.observation,
        reward: res.done ? res.reward : null,
      };
      setHistory((prev) => [...prev, record]);
      setObservation(res.observation);
      setState(res.state);
      if (res.done) {
        setReward(res.reward);
        setIsDone(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Step failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const autopilot = useCallback(async (): Promise<Action | null> => {
    if (!observation) return null;
    setAutopilotPhase('thinking');
    setError(null);
    setHealerTriggered(false);
    try {
      const messages = generateAutopilotPayload(observation, history);
      const res = await runAutopilot(messages);
      setAiRawResponse(res.content);

      const parsed = JSON.parse(res.content) as Action;
      const reser = JSON.stringify(parsed);
      if (res.content.trim() !== reser) {
        setHealerTriggered(true);
      }

      setAutopilotPhase('filling');
      return parsed;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Autopilot failed');
      setAutopilotPhase('idle');
      return null;
    }
  }, [observation, history]);

  const setPhase = useCallback((phase: AutopilotPhase) => {
    setAutopilotPhase(phase);
  }, []);

  return {
    observation,
    state,
    reward,
    history,
    isLoading,
    isAutopiloting,
    autopilotPhase,
    error,
    isDone,
    healerTriggered,
    aiRawResponse,
    reset,
    step,
    autopilot,
    setAutopilotPhase: setPhase,
  };
}
