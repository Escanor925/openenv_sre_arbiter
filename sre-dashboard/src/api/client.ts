import type {
  TaskName,
  Action,
  ResetResponse,
  StepResponse,
  EpisodeState,
  AutopilotResponse,
} from '../types/sre';

const BASE = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function resetEpisode(taskName: TaskName): Promise<ResetResponse> {
  return request<ResetResponse>('/reset', {
    method: 'POST',
    body: JSON.stringify({ task_name: taskName }),
  });
}

export function submitStep(action: Action): Promise<StepResponse> {
  return request<StepResponse>('/step', {
    method: 'POST',
    body: JSON.stringify(action),
  });
}

export function getState(): Promise<EpisodeState> {
  return request<EpisodeState>('/state');
}

export function runAutopilot(
  messages: Array<{ role: string; content: string }>,
): Promise<AutopilotResponse> {
  return request<AutopilotResponse>('/autopilot', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      temperature: 0.3,
      max_tokens: 512,
    }),
  });
}
