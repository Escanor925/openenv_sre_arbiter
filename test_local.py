import requests
import json

BASE_URL = "http://127.0.0.1:7860"

print("Testing POST /reset ...")
# Reset endpoint expects task_name, not task_id
try:
    reset_res = requests.post(f"{BASE_URL}/reset", json={"task_name": "hard"})
    print(f"Status: {reset_res.status_code}")
    print(json.dumps(reset_res.json(), indent=2))
except Exception as e:
    print("Error hitting /reset:", e)

print("\nTesting POST /step ...")
# Simulating the AI deciding to investigate the traffic first
# containment_action must be a valid literal, not "none"
fake_action = {
    "containment_action": "do_nothing",
    "investigation_query": "analyze_ip_traffic",
    "declare_root_cause": "unknown",
    "justification": "Initial investigation - analyzing IP traffic patterns before taking containment action"
}

try:
    step_res = requests.post(f"{BASE_URL}/step", json=fake_action)
    print(f"Status: {step_res.status_code}")
    print(json.dumps(step_res.json(), indent=2))
except Exception as e:
    print("Error hitting /step:", e)
