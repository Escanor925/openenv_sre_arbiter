export type TaskName = 'easy' | 'medium' | 'hard';

export type ContainmentAction =
  | 'scale_up_nodes'
  | 'rate_limit_all'
  | 'rollback_last_deploy'
  | 'do_nothing';

export type InvestigationQuery =
  | 'analyze_ip_traffic'
  | 'query_db_locks'
  | 'check_commit_diffs'
  | 'check_service_mesh'
  | 'check_resource_utilization'
  | 'none';

export type RootCause =
  | 'ddos_attack'
  | 'viral_traffic'
  | 'bad_code'
  | 'database_lock'
  | 'unknown';

export interface Action {
  containment_action: ContainmentAction;
  investigation_query: InvestigationQuery;
  declare_root_cause: RootCause;
  justification: string;
}

export interface Observation {
  incident_id: string;
  severity: string;
  initial_observation: string;
  active_alerts: string[];
  system_metrics: Record<string, string>;
  timeline: string[];
  investigation_results: Record<string, string>;
  system_health: number;
  budget_spent: number;
  turn_number: number;
  turns_remaining: number;
  available_actions: Record<string, string[]>;
}

export interface RewardBreakdown {
  root_cause: number;
  containment: number;
  evidence: number;
  efficiency: number;
  health: number;
  budget_spent: number;
  final_health: number;
  turns_used: number;
  penalty_premature_guess?: number;
  penalty_system_crash?: number;
}

export interface Reward {
  total_score: number;
  breakdown: RewardBreakdown;
}

export interface EpisodeState {
  task_name: TaskName;
  incident_id: string;
  turn_number: number;
  max_turns: number;
  system_health: number;
  budget_spent: number;
  is_done: boolean;
}

export interface ResetResponse {
  status: number;
  observation: Observation;
  state: EpisodeState;
}

export interface StepResponse {
  status: number;
  observation: Observation | null;
  reward: Reward;
  done: boolean;
  info: {
    justification: string;
    turn: number;
    grading_detail: RewardBreakdown;
  };
  state: EpisodeState;
}

export interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export interface AutopilotResponse {
  content: string;
}

export interface FeedEntry {
  id: string;
  source: 'system' | 'alert' | 'ai' | 'user' | 'error';
  message: string;
  at: string;
}

export interface TelemetryPoint {
  turn: number;
  cpu: number;
  memory: number;
  network: number;
  disk: number;
}
