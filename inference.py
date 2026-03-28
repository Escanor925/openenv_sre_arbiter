
import os
import json
from openai import OpenAI
from environment import CloudSREEnv, Action

def run_evaluation():
    # Strictly adheres to the hackathon requirements for env vars
    api_key = os.getenv("HF_TOKEN") or os.getenv("OPENAI_API_KEY", "dummy_key")
    base_url = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
    model_name = os.getenv("MODEL_NAME", "gpt-4o-mini") # Change to whatever model your team is using

    client = OpenAI(api_key=api_key, base_url=base_url)
    env = CloudSREEnv(data_path="data.json")

    tasks = ["easy", "medium", "hard"]
    
    print(f"Starting OpenEnv SRE Evaluation with model: {model_name}\n" + "="*50)

    for task in tasks:
        obs = env.reset(task_name=task)
        done = False
        
        print(f"\n[ TASK: {task.upper()} ]")
        
        # The Multi-Step 'Contain & Investigate' Loop
        while not done:
            print(f"  Turn {obs.turn_number} | Budget Spent: ${obs.budget_spent}")
            
            prompt = f"""
            You are a Tier-1 SRE. Review the current system state and take action.
            
            Current Observation:
            - Active Alerts: {obs.active_alerts}
            - System Metrics: {obs.system_metrics}
            - Investigation Results (Clues): {obs.investigation_results}
            
            Return a JSON object matching this schema exactly. 
            If you need more info, set declare_root_cause to "unknown" and pick an investigation_query.
            If you know the issue, declare it to end the incident.
            
            {{
                "containment_action": "scale_up_nodes" | "rate_limit_all" | "rollback_last_deploy" | "do_nothing",
                "investigation_query": "analyze_ip_traffic" | "query_db_locks" | "check_commit_diffs" | "none",
                "declare_root_cause": "ddos_attack" | "viral_traffic" | "bad_code" | "database_lock" | "unknown",
                "justification": "string"
            }}
            """

            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.0 # Deterministic behavior for evaluation
                )
                
                action_data = json.loads(response.choices[0].message.content)
                action = Action(**action_data)
                
                print(f"  AI Action -> Contain: {action.containment_action} | Investigate: {action.investigation_query} | Root Cause: {action.declare_root_cause}")
                
                obs, reward, done, info = env.step(action)
                
                if done:
                    print(f"  -> Incident Resolved. Final Score: {reward.total_score} | Breakdown: {reward.breakdown}")
                
            except Exception as e:
                print(f"  Error processing turn. Make sure your API keys are set! Error details: {e}")
                break

if __name__ == "__main__":
    run_evaluation()
