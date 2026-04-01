/** Mirrors backend Pydantic schemas from environment.py */

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

export type AutopilotPhase = 'idle' | 'thinking' | 'filling' | 'submitting';

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

export interface AutopilotResponse {
  content: string;
}

/** Cost constants matching environment.py */
export const CONTAINMENT_COSTS: Record<ContainmentAction, number> = {
  scale_up_nodes: 500,
  rate_limit_all: 100,
  rollback_last_deploy: 200,
  do_nothing: 0,
};

export const INVESTIGATION_COST = 50;
export const MAX_BUDGET = 5000;
export const MAX_TURNS = 6;

/** Display labels */
export const CONTAINMENT_LABELS: Record<ContainmentAction, string> = {
  scale_up_nodes: 'Scale Up Nodes',
  rate_limit_all: 'Rate Limit All',
  rollback_last_deploy: 'Rollback Deploy',
  do_nothing: 'Do Nothing',
};

export const INVESTIGATION_LABELS: Record<InvestigationQuery, string> = {
  analyze_ip_traffic: 'Analyze IP Traffic',
  query_db_locks: 'Query DB Locks',
  check_commit_diffs: 'Check Commit Diffs',
  check_service_mesh: 'Check Service Mesh',
  check_resource_utilization: 'Check Resources',
  none: 'None',
};

export const ROOT_CAUSE_LABELS: Record<RootCause, string> = {
  ddos_attack: 'DDoS Attack',
  viral_traffic: 'Viral Traffic',
  bad_code: 'Bad Code Deploy',
  database_lock: 'Database Lock',
  unknown: 'Unknown (Investigating)',
};
