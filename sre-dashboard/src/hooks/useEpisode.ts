import { useState, useCallback } from 'react';
import type {
  TaskName,
  Action,
  Observation,
  Reward,
  EpisodeState,
} from '../types/sre';
import { resetEpisode, submitStep, runAutopilot } from '../api/client';

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
  error: string | null;
  isDone: boolean;
  healerTriggered: boolean;
  aiRawResponse: string | null;
  reset: (taskName: TaskName) => Promise<void>;
  step: (action: Action) => Promise<void>;
  autopilot: () => Promise<Action | null>;
}

const SRE_SYSTEM_PROMPT = `You are a Tier-1 Site Reliability Engineer (SRE) responding to a live production incident.

## Mission
Every turn you MUST make two decisions:
1. **Containment:** An immediate ops action to keep the system online.
2. **Investigation:** A diagnostic query to gather root-cause evidence.

## Rules
- Do NOT guess the root cause until investigation results provide strong evidence.
- Set declare_root_cause to "unknown" while still investigating.
- Once evidence is conclusive, declare the root cause to resolve the incident.
- Every action costs money. Unnecessary spending lowers your score.
- Inaction causes system health to degrade. The system can crash.

## Strategy
Turn 1-2: Stabilize with containment AND run investigation queries.
Turn 3+: Declare root cause once evidence supports it.
Never declare a root cause on turn 1 unless evidence is absolutely conclusive.

## RESPONSE FORMAT — MANDATORY
OUTPUT ONLY A SINGLE RAW JSON OBJECT. NOTHING ELSE.
{
  "containment_action": "scale_up_nodes | rate_limit_all | rollback_last_deploy | do_nothing",
  "investigation_query": "analyze_ip_traffic | query_db_locks | check_commit_diffs | check_service_mesh | check_resource_utilization | none",
  "declare_root_cause": "ddos_attack | viral_traffic | bad_code | database_lock | unknown",
  "justification": "1-3 sentence explanation citing specific evidence gathered"
}`;

function formatObservation(obs: Observation): string {
  let msg = `INCIDENT ${obs.incident_id} | Severity: ${obs.severity} | Turn ${obs.turn_number} | ${obs.turns_remaining} remaining\n`;
  msg += `System Health: ${obs.system_health}% | Budget Spent: $${obs.budget_spent}\n\n`;
  msg += `Observation: ${obs.initial_observation}\n\n`;
  msg += `Active Alerts:\n${obs.active_alerts.map((a) => `  - ${a}`).join('\n')}\n\n`;
  msg += `System Metrics:\n${Object.entries(obs.system_metrics).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n\n`;

  if (Object.keys(obs.investigation_results).length > 0) {
    msg += `Investigation Results:\n${Object.entries(obs.investigation_results).map(([k, v]) => `  [${k}]: ${v}`).join('\n')}\n\n`;
  }

  msg += `Timeline:\n${obs.timeline.map((t) => `  ${t}`).join('\n')}`;
  return msg;
}

export function useEpisode(): EpisodeHook {
  const [observation, setObservation] = useState<Observation | null>(null);
  const [state, setState] = useState<EpisodeState | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [history, setHistory] = useState<TurnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutopiloting, setIsAutopiloting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [healerTriggered, setHealerTriggered] = useState(false);
  const [aiRawResponse, setAiRawResponse] = useState<string | null>(null);

  const reset = useCallback(async (taskName: TaskName) => {
    setIsLoading(true);
    setError(null);
    setHistory([]);
    setReward(null);
    setIsDone(false);
    setHealerTriggered(false);
    setAiRawResponse(null);
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
    setIsAutopiloting(true);
    setError(null);
    setHealerTriggered(false);
    try {
      const messages = [
        { role: 'system', content: SRE_SYSTEM_PROMPT },
        { role: 'user', content: formatObservation(observation) },
      ];
      const res = await runAutopilot(messages);
      setAiRawResponse(res.content);

      const parsed = JSON.parse(res.content) as Action;
      // If the raw content differs from re-serialized, healer likely intervened
      const reser = JSON.stringify(parsed);
      if (res.content.trim() !== reser) {
        setHealerTriggered(true);
      }
      return parsed;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Autopilot failed');
      return null;
    } finally {
      setIsAutopiloting(false);
    }
  }, [observation]);

  return {
    observation,
    state,
    reward,
    history,
    isLoading,
    isAutopiloting,
    error,
    isDone,
    healerTriggered,
    aiRawResponse,
    reset,
    step,
    autopilot,
  };
}
