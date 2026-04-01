import type {
  Action,
  AutopilotResponse,
  ChatMessage,
  ResetResponse,
  StepResponse,
  TaskName,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

export function resetEpisode(taskName: TaskName): Promise<ResetResponse> {
  return request<ResetResponse>('/reset', {
    method: 'POST',
    body: JSON.stringify({ task_name: taskName }),
  });
}

export function stepEpisode(action: Action): Promise<StepResponse> {
  return request<StepResponse>('/step', {
    method: 'POST',
    body: JSON.stringify(action),
  });
}

export function runAutopilot(messages: ChatMessage[]): Promise<AutopilotResponse> {
  return request<AutopilotResponse>('/autopilot', {
    method: 'POST',
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b',
      base_url: 'https://integrate.api.nvidia.com/v1',
      messages,
      temperature: 0.3,
      max_tokens: 512,
    }),
  });
}
