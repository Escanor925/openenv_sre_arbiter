import { useCallback, useMemo, useState } from 'react';
import { resetEpisode, runAutopilot, stepEpisode } from '../api';
import type {
  Action,
  FeedEntry,
  Observation,
  Reward,
  TaskName,
  TelemetryPoint,
} from '../types';

const MAX_BUDGET = 5000;

function parseMetricValue(raw: string | undefined): number {
  if (!raw) return 0;
  const numeric = Number.parseFloat(raw.replace(/[^\d.-]/g, ''));
  if (Number.isNaN(numeric)) return 0;
  if (numeric > 100) return Math.min(100, numeric / 10);
  return Math.max(0, Math.min(100, numeric));
}

function toTelemetry(observation: Observation): TelemetryPoint {
  return {
    turn: observation.turn_number,
    cpu: parseMetricValue(observation.system_metrics.cpu),
    memory: parseMetricValue(observation.system_metrics.memory),
    network: parseMetricValue(
      observation.system_metrics.network_traffic ?? observation.system_metrics.traffic_volume,
    ),
    disk: parseMetricValue(observation.system_metrics.disk_io ?? observation.system_metrics.disk),
  };
}

function nowTag(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function makeUserPrompt(observation: Observation): string {
  const investigations = Object.entries(observation.investigation_results)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return [
    `Incident ${observation.incident_id} (${observation.severity}) turn ${observation.turn_number}.`,
    `Health ${observation.system_health} and budget ${observation.budget_spent}.`,
    `Initial observation: ${observation.initial_observation}`,
    `Alerts: ${observation.active_alerts.join(' | ')}`,
    `Timeline: ${observation.timeline.join(' | ')}`,
    investigations ? `Investigation results:\n${investigations}` : 'Investigation results: none yet.',
    'Return only JSON action for containment and investigation with concise justification.',
  ].join('\n');
}

export interface ArbiterState {
  observation: Observation | null;
  reward: Reward | null;
  telemetry: TelemetryPoint[];
  feed: FeedEntry[];
  budgetSpent: number;
  budgetRatio: number;
  health: number;
  turn: number;
  isDone: boolean;
  isBusy: boolean;
  isAutopilotBusy: boolean;
  error: string | null;
  startEpisode: (taskName: TaskName) => Promise<void>;
  runStep: (action: Action) => Promise<void>;
  runAutoPilot: () => Promise<Action | null>;
}

export function useArbiter(): ArbiterState {
  const [observation, setObservation] = useState<Observation | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [budgetSpent, setBudgetSpent] = useState(0);
  const [health, setHealth] = useState(100);
  const [turn, setTurn] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isAutopilotBusy, setIsAutopilotBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendFeed = useCallback((entry: Omit<FeedEntry, 'id' | 'at'>) => {
    setFeed((prev) => [
      ...prev,
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: nowTag(),
      },
    ]);
  }, []);

  const syncObservation = useCallback((next: Observation) => {
    setObservation(next);
    setBudgetSpent(next.budget_spent);
    setHealth(next.system_health);
    setTurn(next.turn_number);
    setTelemetry((prev) => {
      const point = toTelemetry(next);
      if (prev.length > 0 && prev[prev.length - 1].turn === point.turn) {
        return [...prev.slice(0, -1), point];
      }
      return [...prev, point].slice(-40);
    });
  }, []);

  const startEpisode = useCallback(
    async (taskName: TaskName) => {
      setIsBusy(true);
      setError(null);
      setReward(null);
      setIsDone(false);
      setFeed([]);
      setTelemetry([]);
      try {
        const res = await resetEpisode(taskName);
        syncObservation(res.observation);
        appendFeed({ source: 'system', message: `Episode booted on ${taskName.toUpperCase()} profile.` });
        appendFeed({ source: 'alert', message: res.observation.initial_observation });
        res.observation.active_alerts.forEach((alert) => {
          appendFeed({ source: 'alert', message: `ALERT: ${alert}` });
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start episode.';
        setError(message);
        appendFeed({ source: 'error', message });
      } finally {
        setIsBusy(false);
      }
    },
    [appendFeed, syncObservation],
  );

  const runStep = useCallback(
    async (action: Action) => {
      setIsBusy(true);
      setError(null);
      appendFeed({
        source: 'user',
        message: `Contain: ${action.containment_action} | Investigate: ${action.investigation_query} | Root: ${action.declare_root_cause}`,
      });
      appendFeed({ source: 'user', message: `Reasoning: ${action.justification}` });

      try {
        const res = await stepEpisode(action);
        if (res.observation) {
          syncObservation(res.observation);
          appendFeed({ source: 'system', message: `Turn ${res.info.turn} executed. Health now ${res.state.system_health.toFixed(1)}.` });
          const latestTimeline = res.observation.timeline[res.observation.timeline.length - 1];
          if (latestTimeline) {
            appendFeed({ source: 'system', message: latestTimeline });
          }
        }

        if (res.done) {
          setReward(res.reward);
          setIsDone(true);
          appendFeed({ source: 'system', message: `Incident closed. Final score ${res.reward.total_score.toFixed(3)}.` });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Step request failed.';
        setError(message);
        appendFeed({ source: 'error', message });
      } finally {
        setIsBusy(false);
      }
    },
    [appendFeed, syncObservation],
  );

  const runAutoPilot = useCallback(async (): Promise<Action | null> => {
    if (!observation) {
      return null;
    }

    setIsAutopilotBusy(true);
    setError(null);
    appendFeed({ source: 'ai', message: 'Nemotron-120B is synthesizing the next move...' });

    try {
      const response = await runAutopilot([
        { role: 'user', content: makeUserPrompt(observation) },
      ]);
      const action = JSON.parse(response.content) as Action;

      appendFeed({ source: 'ai', message: `AI Strategy: ${action.justification}` });
      await runStep(action);
      return action;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auto-pilot failed.';
      setError(message);
      appendFeed({ source: 'error', message });
      return null;
    } finally {
      setIsAutopilotBusy(false);
    }
  }, [appendFeed, observation, runStep]);

  const budgetRatio = useMemo(() => {
    return Math.min(1, Math.max(0, budgetSpent / MAX_BUDGET));
  }, [budgetSpent]);

  return {
    observation,
    reward,
    telemetry,
    feed,
    budgetSpent,
    budgetRatio,
    health,
    turn,
    isDone,
    isBusy,
    isAutopilotBusy,
    error,
    startEpisode,
    runStep,
    runAutoPilot,
  };
}
