import json
from pydantic import BaseModel, Field
from typing import Dict, Any, Tuple, Optional, Literal, List

# --- 1. PYDANTIC MODELS (Strict schemas for OpenEnv) ---

class Observation(BaseModel):
    incident_id: str
    active_alerts: List[str]
    system_metrics: Dict[str, str]
    investigation_results: Dict[str, str] 
    budget_spent: float
    turn_number: int

class Action(BaseModel):
    containment_action: Literal["scale_up_nodes", "rate_limit_all", "rollback_last_deploy", "do_nothing"]
    investigation_query: Literal["analyze_ip_traffic", "query_db_locks", "check_commit_diffs", "none"]
    declare_root_cause: Literal["ddos_attack", "viral_traffic", "bad_code", "database_lock", "unknown"]
    justification: str = Field(..., description="A short explanation of the decision.")

class Reward(BaseModel):
    total_score: float
    breakdown: Dict[str, float]

class State(BaseModel):
    task_name: str
    current_case_index: int
    total_cases: int
    is_done: bool

# --- 2. ENVIRONMENT ENGINE ---

class CloudSREEnv:
    def __init__(self, data_path: str = "data.json"):
        with open(data_path, 'r') as f:
            self.dataset = json.load(f)
        self.current_task = None
        self.cases = []
        self.current_index = 0
        
        self.case_turn = 0
        self.budget_spent = 0.0
        self.investigation_results = {}
        self.MAX_TURNS = 5

    def reset(self, task_name: str = "easy") -> Observation:
        if task_name not in self.dataset:
            raise ValueError(f"Task '{task_name}' not found. Options: easy, medium, hard")
        
        self.current_task = task_name
        self.cases = self.dataset[task_name]
        self.current_index = 0
        
        self._reset_case_state()
        return self._get_observation()

    def _reset_case_state(self):
        self.case_turn = 0
        self.budget_spent = 0.0
        self.investigation_results = {}

    def step(self, action: Action) -> Tuple[Optional[Observation], Reward, bool, Dict[str, Any]]:
        if self.current_index >= len(self.cases):
            raise RuntimeError("All cases complete. Call reset().")

        case_data = self.cases[self.current_index]
        ground_truth = case_data["ground_truth"]
        hidden_data = case_data["hidden_data"]

        self.case_turn += 1
        done = False
        info = {"justification": action.justification}

        # --- PROCESS CONTAINMENT (Financial Impact) ---
        if action.containment_action == "scale_up_nodes":
            self.budget_spent += 500.0
        elif action.containment_action == "rollback_last_deploy":
            self.budget_spent += 200.0
        elif action.containment_action == "do_nothing" and action.declare_root_cause == "unknown":
            self.budget_spent += 1000.0 

        # --- PROCESS INVESTIGATION ---
        if action.investigation_query != "none":
            self.budget_spent += 50.0 
            if action.investigation_query in hidden_data:
                self.investigation_results[action.investigation_query] = hidden_data[action.investigation_query]
            else:
                self.investigation_results[action.investigation_query] = "Query returned no anomalies."

        # --- CHECK END CONDITIONS ---
        if action.declare_root_cause != "unknown" or self.case_turn >= self.MAX_TURNS:
            done = True
            
            rc_score = 0.5 if action.declare_root_cause == ground_truth["root_cause"] else 0.0
            contain_score = 0.3 if action.containment_action == ground_truth["ideal_containment"] else 0.0
            efficiency_score = max(0.0, 0.2 - (self.budget_spent / 5000.0))
            if rc_score == 0: efficiency_score = 0.0 
            
            total_score = round(rc_score + contain_score + efficiency_score, 2)
            
            reward = Reward(
                total_score=total_score, 
                breakdown={"root_cause": rc_score, "containment": contain_score, "efficiency": efficiency_score, "budget_spent": self.budget_spent}
            )
            
            self.current_index += 1
            self._reset_case_state()
            
            next_obs = self._get_observation() if self.current_index < len(self.cases) else None
            return next_obs, reward, done, info

        reward = Reward(total_score=0.0, breakdown={"status": "investigating", "budget_spent": self.budget_spent})
        return self._get_observation(), reward, done, info

    def state(self) -> State:
        return State(
            task_name=self.current_task or "none",
            current_case_index=self.current_index,
            total_cases=len(self.cases),
            is_done=self.current_index >= len(self.cases)
        )

    def _get_observation(self) -> Optional[Observation]:
        if self.current_index >= len(self.cases):
            return None
        case = self.cases[self.current_index]
        return Observation(
            incident_id=case["incident_id"],
            active_alerts=case["active_alerts"],
            system_metrics=case["system_metrics"],
            investigation_results=self.investigation_results,
            budget_spent=self.budget_spent,
            turn_number=self.case_turn
        )
