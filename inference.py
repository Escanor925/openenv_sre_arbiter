"""
Cloud SRE Arbiter — Inference / Evaluation Script
===================================================
Proves the environment works by driving an LLM through all three tasks
(easy, medium, hard) via the HTTP API.

Required environment variables:
  NVIDIA_API_KEY — NVIDIA API catalog key (primary, runs Kimi 2.5 on cloud)
  API_BASE_URL   — LLM API endpoint (default: NVIDIA API catalog)
  MODEL_NAME     — Model to use (default: moonshotai/kimi-k2.5)
  HF_TOKEN       — Fallback: HF token or OpenAI key
"""

import os
import sys
import json
import time
import requests
from openai import OpenAI


# ---------------------------------------------------------------------------
# CONFIG (strictly from env vars — no hardcoded keys)
# ---------------------------------------------------------------------------

ENV_API_URL = os.getenv("ENV_API_URL", "http://localhost:7860")  # our FastAPI server
API_BASE_URL = os.getenv("API_BASE_URL", "https://integrate.api.nvidia.com/v1")  # NVIDIA cloud API catalog
MODEL_NAME = os.getenv("MODEL_NAME", "moonshotai/kimi-k2.5")
HF_TOKEN = (
    os.getenv("NVIDIA_API_KEY")
    or os.getenv("KIMI_API_KEY")
    or os.getenv("HF_TOKEN")
    or os.getenv("OPENAI_API_KEY", "")
)

if not HF_TOKEN:
    print("ERROR: Set NVIDIA_API_KEY (or KIMI_API_KEY / OPENAI_API_KEY) environment variable.")
    sys.exit(1)


# ---------------------------------------------------------------------------
# SYSTEM PROMPT — gives the LLM its SRE persona and the rules
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a Tier-1 Site Reliability Engineer (SRE) responding to a live production incident.

## Your Mission
You must make TWO decisions every turn:
1. **Containment (Ops):** Take an immediate action to keep the system online.
2. **Investigation (Sec/Data):** Run a diagnostic query to find the root cause.

## Rules
- Do NOT guess the root cause until you have gathered evidence via investigation queries.
- Set `declare_root_cause` to "unknown" while you are still investigating.
- Once you have enough evidence, declare the root cause to resolve the incident.
- Every action costs money. Be efficient — unnecessary spending lowers your score.
- If you do nothing, system health degrades each turn. The system can crash.

## Response Format
CRITICAL: Your entire response must be ONLY a raw JSON object. No markdown, no explanation, no code fences. Just the JSON object matching this exact schema:
{
    "containment_action": "scale_up_nodes" | "rate_limit_all" | "rollback_last_deploy" | "do_nothing",
    "investigation_query": "analyze_ip_traffic" | "query_db_locks" | "check_commit_diffs" | "check_service_mesh" | "check_resource_utilization" | "none",
    "declare_root_cause": "ddos_attack" | "viral_traffic" | "bad_code" | "database_lock" | "unknown",
    "justification": "Brief explanation citing evidence you have gathered so far"
}

## Strategy
Turn 1-2: Focus on containment to stabilize the system AND run investigation queries.
Turn 3+: Once you have evidence, declare the root cause.
Do NOT declare a root cause on turn 1 unless the evidence is absolutely conclusive."""


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def format_observation(obs: dict) -> str:
    """Convert an observation dict into a human-readable prompt for the LLM."""
    lines = [
        f"## Incident: {obs['incident_id']} (Severity: {obs['severity']})",
        f"**Situation:** {obs['initial_observation']}",
        "",
        f"### Active Alerts ({len(obs['active_alerts'])})",
    ]
    for alert in obs["active_alerts"]:
        lines.append(f"  - 🚨 {alert}")

    lines.append("\n### System Metrics")
    for k, v in obs["system_metrics"].items():
        lines.append(f"  - {k}: {v}")

    lines.append(f"\n### System Health: {obs['system_health']}% | Budget Spent: ${obs['budget_spent']}")
    lines.append(f"### Turn: {obs['turn_number']} | Turns Remaining: {obs['turns_remaining']}")

    if obs.get("timeline"):
        lines.append("\n### Timeline")
        for event in obs["timeline"]:
            lines.append(f"  - {event}")

    if obs.get("investigation_results"):
        lines.append("\n### 🔍 Investigation Results (Evidence Gathered)")
        for query, result in obs["investigation_results"].items():
            lines.append(f"  **{query}:** {result}")
    else:
        lines.append("\n### 🔍 Investigation Results: None yet — run queries to gather evidence!")

    return "\n".join(lines)


def call_env_reset(task_name: str) -> dict:
    """POST /reset to the environment API."""
    resp = requests.post(
        f"{ENV_API_URL}/reset",
        json={"task_name": task_name},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def call_env_step(action: dict) -> dict:
    """POST /step to the environment API."""
    resp = requests.post(
        f"{ENV_API_URL}/step",
        json=action,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def parse_llm_action(content: str) -> dict:
    """
    Extract a JSON action from the LLM response.
    Handles cases where the LLM wraps JSON in markdown code fences.
    """
    text = content.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines (the fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    return json.loads(text)


# ---------------------------------------------------------------------------
# MAIN EVALUATION LOOP
# ---------------------------------------------------------------------------

def run_evaluation():
    """Drive the LLM through all three tasks and report scores."""
    client = OpenAI(api_key=HF_TOKEN, base_url=API_BASE_URL)
    tasks = ["easy", "medium", "hard"]
    results = {}

    print("=" * 70)
    print("  CLOUD SRE ARBITER — EVALUATION RUN")
    print(f"  Model: {MODEL_NAME}")
    print(f"  Environment: {ENV_API_URL}")
    print("=" * 70)

    for task in tasks:
        print(f"\n{'─' * 70}")
        print(f"  📋 TASK: {task.upper()}")
        print(f"{'─' * 70}")

        # Reset the environment
        reset_data = call_env_reset(task)
        obs = reset_data["observation"]
        done = False
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]

        while not done:
            # Build the user message from the observation
            user_msg = format_observation(obs)

            # Keep only system prompt + current observation to avoid bloating context
            # The observation already contains all state (health, budget, evidence)
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ]

            print(f"\n  Turn {obs['turn_number']} | Health: {obs['system_health']}% | Budget: ${obs['budget_spent']}")

            # Call the LLM
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    temperature=0.0,
                    max_tokens=4096,
                )
                raw_content = response.choices[0].message.content
                if not raw_content:
                    raise ValueError(f"LLM returned empty content. Finish reason: {response.choices[0].finish_reason}")
                action_data = parse_llm_action(raw_content)

                # Validate required fields
                required_fields = [
                    "containment_action",
                    "investigation_query",
                    "declare_root_cause",
                    "justification",
                ]
                for field in required_fields:
                    if field not in action_data:
                        raise ValueError(f"Missing required field: {field}")

                print(f"  ├─ Contain:     {action_data['containment_action']}")
                print(f"  ├─ Investigate: {action_data['investigation_query']}")
                print(f"  ├─ Root Cause:  {action_data['declare_root_cause']}")
                print(f"  └─ Reason:      {action_data['justification'][:80]}")

                # No need to track conversation — each turn gets full state in the observation

            except Exception as exc:
                print(f"  ⚠️  LLM error: {exc}")
                # Fallback: investigate and do nothing
                action_data = {
                    "containment_action": "do_nothing",
                    "investigation_query": "check_commit_diffs",
                    "declare_root_cause": "unknown",
                    "justification": f"LLM error fallback: {exc}",
                }

            # Send to environment
            try:
                step_data = call_env_step(action_data)
                done = step_data["done"]

                if done:
                    reward = step_data["reward"]
                    score = reward["total_score"]
                    results[task] = score
                    print(f"\n  ✅ INCIDENT RESOLVED — Score: {score}")
                    print(f"  📊 Breakdown:")
                    for k, v in reward["breakdown"].items():
                        print(f"     {k}: {v}")
                else:
                    obs = step_data["observation"]

            except Exception as exc:
                print(f"  ❌ Environment step error: {exc}")
                results[task] = 0.0
                done = True

        time.sleep(0.5)  # brief pause between tasks

    # --- FINAL SUMMARY ---
    print(f"\n{'=' * 70}")
    print("  📋 FINAL RESULTS")
    print(f"{'=' * 70}")
    total = 0.0
    for task in tasks:
        score = results.get(task, 0.0)
        total += score
        bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
        print(f"  {task.upper():8s}  {bar}  {score:.2f}")

    avg = total / len(tasks) if tasks else 0.0
    print(f"{'─' * 70}")
    print(f"  AVERAGE SCORE: {avg:.2f}")
    print(f"{'=' * 70}")

    return results


if __name__ == "__main__":
    run_evaluation()
