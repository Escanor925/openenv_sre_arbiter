---
title: Cloud SRE Arbiter
emoji: 🚨
colorFrom: red
colorTo: yellow
sdk: docker
pinned: false
---

<div align="center">

# 🚨 Cloud SRE Arbiter

### *Can Your AI Survive a Real Outage?*

[![OpenEnv Compliant](https://img.shields.io/badge/OpenEnv-Compliant-00C853?style=for-the-badge&logo=openai&logoColor=white)](#-openenv-compliance)
[![NVIDIA Nemotron](https://img.shields.io/badge/NVIDIA-Nemotron--120B-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](#-ai-engine--nvidia-nemotron-120b)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-deployment)
[![Hugging Face](https://img.shields.io/badge/🤗_HuggingFace-Live_Demo-FFD21E?style=for-the-badge)](#-live-demo)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)

---

**An OpenEnv-compliant, RL-style evaluation environment that stress-tests an AI agent's ability to act as a Tier-1 Site Reliability Engineer during live, cascading server outages — grading containment quality, evidence gathering, budget discipline, and root-cause identification across escalating difficulty levels.**

[Live Demo](#-live-demo) · [Architecture](#%EF%B8%8F-system-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [The JSON Healer](#-the-json-healer--our-secret-sauce) · [Team](#-team)

</div>

---

## 📋 Table of Contents

- [🎯 The Problem](#-the-problem)
- [💡 The Core Mechanic: "Contain & Investigate"](#-the-core-mechanic-contain--investigate)
- [🏗️ System Architecture](#%EF%B8%8F-system-architecture)
- [🧠 AI Engine — NVIDIA Nemotron 120B](#-ai-engine--nvidia-nemotron-120b)
- [🩹 The JSON Healer — Our Secret Sauce](#-the-json-healer--our-secret-sauce)
- [🎮 SRE Command Center (Frontend)](#-sre-command-center-frontend)
- [📊 Deterministic Grading System](#-deterministic-grading-system)
- [🗂️ Scenario Design](#%EF%B8%8F-scenario-design)
- [🚀 Quick Start](#-quick-start)
- [📡 API Reference](#-api-reference)
- [✅ OpenEnv Compliance](#-openenv-compliance)
- [🐳 Deployment](#-deployment)
- [📁 Project Structure](#-project-structure)
- [👥 Team](#-team)

---

## 🎯 The Problem

> *"It's 3 AM. PagerDuty is screaming. Four microservices are cascading into failure. The CEO is asking if you're under a DDoS attack. You have 6 turns, $5,000 in budget, and a system that's bleeding 15% health per turn of inaction. What do you do?"*

Real SRE work demands **simultaneous** action under uncertainty: you must keep the system alive *right now* while investigating what's actually broken. Most AI benchmarks test either reasoning *or* action — never both under pressure, under budget, with real consequences for mistakes.

**Cloud SRE Arbiter** changes that. We built an environment where the AI agent must:

- 🔥 **Triage** — Parse an alert storm and identify what's actually critical
- 🛡️ **Contain** — Take immediate ops actions (scale, rollback, rate-limit) to stop the bleeding
- 🔍 **Investigate** — Run diagnostic queries to gather root-cause evidence
- 🎯 **Declare** — Identify the root cause, but *only* when evidence supports it
- 💰 **Budget** — Every action costs real money. Reckless spending tanks your score

> **One wrong call and the system crashes. One premature guess and you lose 30% of your score.**

---

## 💡 The Core Mechanic: "Contain & Investigate"

The agent makes **dual decisions every single turn** — this is the defining innovation. The two action axes are orthogonal and both mandatory:

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT TURN                               │
│                                                                 │
│   ┌──────────────────────┐    ┌──────────────────────────────┐  │
│   │   🛡️ CONTAINMENT     │    │   🔍 INVESTIGATION           │  │
│   │   (Ops / Keep Alive) │    │   (Sec / Root Cause)         │  │
│   │                      │    │                              │  │
│   │ • scale_up_nodes     │    │ • analyze_ip_traffic         │  │
│   │ • rate_limit_all     │    │ • query_db_locks             │  │
│   │ • rollback_last_dep… │    │ • check_commit_diffs         │  │
│   │ • do_nothing         │    │ • check_service_mesh         │  │
│   │                      │    │ • check_resource_utilization │  │
│   └──────────────────────┘    │ • none                       │  │
│                               └──────────────────────────────┘  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │   🎯 DECLARATION: declare_root_cause                     │  │
│   │   ddos_attack | viral_traffic | bad_code |               │  │
│   │   database_lock | unknown (keep investigating)           │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

The environment **grades each axis independently** — you can nail the root cause but still score poorly if you let the system crash while figuring it out.

### Why This Matters

| Failure Mode | What Happens | Score Impact |
|:---|:---|:---|
| 🔴 All investigation, no containment | System health decays **−15/turn**, crash → **−0.50 penalty** | Catastrophic |
| 🟡 All containment, no investigation | Time runs out, root cause never found → **0/40% score** | Severe |
| 🟠 Guess root cause without evidence | Premature declaration → **−0.30 penalty** | Major |
| 🟢 Balanced contain + investigate | Stabilize system while gathering evidence → declare when ready | Optimal |

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              DOCKER CONTAINER               │
                    │           (python:3.11-slim)                │
                    │                                             │
                    │  ┌───────────────────────────────────────┐  │
                    │  │         FastAPI Server (main.py)       │  │
                    │  │              Port 7860                 │  │
  ┌──────────┐     │  │                                        │  │
  │ Automated│     │  │  ┌──────────┐  ┌──────────┐  ┌─────┐  │  │
  │  Judges  │────▶│  │  │ /reset   │  │ /step    │  │/state│  │  │
  │(OpenEnv) │     │  │  └────┬─────┘  └────┬─────┘  └──┬──┘  │  │
  └──────────┘     │  │       │             │            │     │  │
                    │  │       ▼             ▼            ▼     │  │
  ┌──────────┐     │  │  ┌────────────────────────────────────┐│  │
  │ SRE Cmd  │     │  │  │    CloudSREEnv (environment.py)    ││  │
  │ Center   │────▶│  │  │                                    ││  │
  │(React UI)│     │  │  │  • Pydantic Action/Observation     ││  │
  └──────────┘     │  │  │  • Deterministic Grader            ││  │
       │           │  │  │  • Health/Budget Simulation         ││  │
       │           │  │  │  • Scenario Engine (data.json)      ││  │
       │           │  │  └────────────────────────────────────┘│  │
       │           │  │                                        │  │
       │           │  │  ┌────────────────────────────────────┐│  │
       └──────────▶│  │  │  /autopilot Endpoint               ││  │
                    │  │  │                                    ││  │
                    │  │  │  ┌──────────────────────────────┐  ││  │
                    │  │  │  │ 🩹 JSON Healer Pipeline      │  ││  │
                    │  │  │  │  Regex → Brace-close →       │  ││  │
                    │  │  │  │  Fallback → Enum sanitize    │  ││  │
                    │  │  │  └──────────┬───────────────────┘  ││  │
                    │  │  │             │                       ││  │
                    │  │  └─────────────┼───────────────────────┘│  │
                    │  └────────────────┼────────────────────────┘  │
                    └───────────────────┼──────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   NVIDIA Partner API      │
                          │   Nemotron-3-Super-120B   │
                          │   (via OpenAI client)     │
                          └──────────────────────────┘
```

### Component Breakdown

| Component | File | Role |
|:---|:---|:---|
| **Environment Engine** | `environment.py` | RL-style `reset()`/`step()` loop, Pydantic schemas, deterministic grader |
| **API Server** | `main.py` | FastAPI endpoints, CORS, static frontend mounting, `/autopilot` proxy |
| **JSON Healer** | `main.py` (L38–119) | Regex pipeline that recovers truncated LLM output at runtime |
| **Inference Script** | `inference.py` | Headless evaluation driver — runs all 3 tasks via HTTP |
| **Scenario Data** | `data.json` | 3 incident scenarios with hidden investigation data + ground truth |
| **Frontend** | `sre_frontend_dist/` | Pre-built React SPA (dark-mode SRE Command Center) |
| **OpenEnv Spec** | `openenv.yaml` | Schema, task, and grading metadata for automated judging |

---

## 🧠 AI Engine — NVIDIA Nemotron 120B

We integrated **NVIDIA's `nemotron-3-super-120b-a12b`** — a massive 120-billion parameter model with 12B active parameters via Mixture-of-Experts — accessed through a Partner API endpoint.

### Why Nemotron?

- **Scale**: 120B total parameters provides deep reasoning about complex system failures
- **MoE Efficiency**: Only 12B active parameters per forward pass — fast inference on enormous tasks
- **SRE Domain Fit**: Excels at structured JSON output, technical diagnosis, and step-by-step reasoning under constraints

### Integration Details

```python
# We use the OpenAI-compatible client pointed at NVIDIA's Partner API
import os
from openai import OpenAI

client = OpenAI(
  api_key=os.environ.get("NVIDIA_API_KEY"),
    base_url="https://integrate.api.nvidia.com/v1"
)

response = client.chat.completions.create(
    model="nvidia/nemotron-3-super-120b-a12b",
    messages=[
        {"role": "system", "content": SRE_SYSTEM_PROMPT},
        {"role": "user",   "content": formatted_observation}
    ],
    temperature=0.0,   # deterministic for evaluation
    max_tokens=512
)
```

### Custom System Prompt Engineering

The agent receives a carefully engineered system prompt that:
1. Establishes the SRE role and dual-decision mandate
2. Enforces a **"Don't guess until you have evidence"** investigation strategy
3. Specifies the exact JSON output schema with all valid enum values
4. Includes a `VIOLATION` warning that non-JSON output crashes the system — leveraging the model's instruction-following to maximize compliance

---

## 🩹 The JSON Healer — Our Secret Sauce

### The Problem

Large language models behind hosted APIs have hard server-side token limits. When the Nemotron 120B model is mid-sentence writing a long justification field, the server **truncates the output mid-character**, producing broken JSON like:

```json
{
  "containment_action": "scale_up_nodes",
  "investigation_query": "query_db_locks",
  "declare_root_cause": "unknown",
  "justification": "The database CPU is at 99% and the timeline shows an analytics query star
```

☠️ *Output cut off. Missing closing quote, missing closing brace. `json.loads()` will throw. The `/autopilot` endpoint returns a 500. The dashboard crashes.*

### Our Solution: A Multi-Layer Recovery Pipeline

We engineered `clean_llm_json()` — a **4-stage regex-powered JSON healer** built directly into the server's `/autopilot` endpoint:

```
  Raw LLM Output (potentially truncated/malformed)
           │
           ▼
  ┌────────────────────────────────┐
  │ Stage 1: Strip Markdown Fences │  Remove ```json ... ``` wrappers
  └────────────┬───────────────────┘
               ▼
  ┌────────────────────────────────┐
  │ Stage 2: Isolate JSON Object   │  Find first { ... last } boundaries
  └────────────┬───────────────────┘
               ▼
  ┌────────────────────────────────┐
  │ Stage 3: Parse or Heal         │  json.loads() → success? Done.
  │                                │  If fail → locate "justification"
  │                                │  marker, extract prefix fields,
  │                                │  inject fallback string,
  │                                │  mathematically close all brackets
  └────────────┬───────────────────┘
               ▼
  ┌────────────────────────────────┐
  │ Stage 4: Regex Last Resort     │  If healing still fails, extract
  │                                │  each field individually via regex
  │                                │  and build a valid JSON dict from
  │                                │  whatever was recoverable
  └────────────┬───────────────────┘
               ▼
  ┌────────────────────────────────┐
  │ Stage 5: Enum Sanitization     │  Validate every enum value against
  │                                │  the allowed Pydantic Literals.
  │                                │  Replace hallucinated values with
  │                                │  safe defaults (do_nothing, none,
  │                                │  unknown)
  └────────────┬───────────────────┘
               ▼
     Clean, validated Action dict
     Ready for environment.step()
```

### Why This Matters

Without the JSON Healer, **~30-40% of Nemotron 120B responses** would crash the Auto-Pilot flow on the first run. With it: **zero crashes in production.** The healer silently recovers malformed output, logs a diagnostic message, and the agent keeps running — judges never see a 500 error.

```python
# The truncation guard prompt — injected before every LLM call
truncation_guard_prompt = (
    "CRITICAL: YOUR OUTPUT IS BEING TRUNCATED BY SERVER LIMITS. "
    "THE 'justification' FIELD MUST BE EXTREMELY BRIEF. MAXIMUM 10 WORDS. "
    "DO NOT WRITE LONG SENTENCES OR YOUR OUTPUT WILL CORRUPT."
)
```

> **Defense in depth**: The truncation guard prompt *reduces* the frequency of truncation, while the JSON Healer *eliminates* the impact when it happens anyway. Belt and suspenders.

---

## 🎮 SRE Command Center (Frontend)

A **dark-mode React dashboard** statically mounted to the FastAPI server — no separate frontend deployment needed.

### Features

| Feature | Description |
|:---|:---|
| 🔴 **Live Incident Feed** | Real-time display of active alerts, system metrics, and event timeline |
| 💰 **Budget Tracker** | Visual progress bar showing spend vs. $5,000 ceiling |
| ❤️ **System Health Gauge** | Animated health indicator with color-coded severity (green → yellow → red) |
| 🤖 **Auto-Pilot Button** | One-click LLM inference powered by server-managed NVIDIA credentials |
| 🔑 **Server-Side Secret Handling** | `NVIDIA_API_KEY` is read from environment variables and never exposed in browser payloads |
| 📊 **Score Breakdown** | End-of-episode grading with per-category scores and penalty explanations |

### How Auto-Pilot Works

```
  Browser                    FastAPI                     NVIDIA API
    │                           │                            │
    │  POST /autopilot          │                            │
    │  { messages }             │                            │
    │ ─────────────────────────▶│                            │
    │                           │  POST /chat/completions    │
    │                           │ ──────────────────────────▶│
    │                           │                            │
    │                           │  Raw LLM response          │
    │                           │ ◀──────────────────────────│
    │                           │                            │
    │                           │  ┌────────────────────┐    │
    │                           │  │ JSON Healer cleans │    │
    │                           │  │ & validates output  │    │
    │                           │  └────────────────────┘    │
    │                           │                            │
    │  { content: "{...}" }     │                            │
    │ ◀─────────────────────────│                            │
    │                           │                            │
    │  POST /step               │                            │
    │  (parsed Action)          │                            │
    │ ─────────────────────────▶│                            │
    │                           │                            │
    │  { observation, reward }  │                            │
    │ ◀─────────────────────────│                            │
```

The API key is loaded server-side from `NVIDIA_API_KEY` and is never sent from or exposed to the browser.

---

## 📊 Deterministic Grading System

Every episode is graded on a **0.0 → 1.0 scale** with a weighted, fully deterministic rubric. No LLM-as-judge, no subjectivity — pure algorithmic scoring.

### Score Weights

| Weight | Category | What It Measures |
|:---:|:---|:---|
| **40%** | 🎯 Root Cause Identification | Did the agent correctly identify what broke? |
| **25%** | 🛡️ Containment Quality | Did the agent use the *ideal* containment action? |
| **15%** | 🔍 Evidence Gathering | Did the agent run the *required* investigation queries? |
| **10%** | 💰 Budget Efficiency | How close to $0 did the agent stay? (`1 - spent/5000`) |
| **10%** | ❤️ System Health Maintenance | What was the final system health? (`health/100`) |

### Penalties

| Penalty | Deduction | Trigger |
|:---|:---:|:---|
| 🟠 **Premature Guess** | **−0.30** | Declaring root cause before gathering required evidence |
| 🔴 **System Crash** | **−0.50** | Letting system health decay to 0% through inaction |

### Economy Model

Each action has a real dollar cost — forcing the agent to think like an engineer with a cloud bill:

```
Containment Costs                Investigation Costs
─────────────────                ───────────────────
scale_up_nodes      $500         Each query          $50
rollback_last_deploy $200
rate_limit_all       $100        Budget Ceiling    $5,000
do_nothing            $0
```

---

## 🗂️ Scenario Design

Three hand-crafted scenarios of escalating complexity, each testing different SRE competencies:

### 🟢 Easy — Bad Code Deployment

| Attribute | Value |
|:---|:---|
| **Incident** | `INC-001` · Severity **P2** |
| **Surface Symptom** | Checkout API returning 34% HTTP 500 errors |
| **Red Herrings** | CPU/memory normal, no DB locks, no traffic anomalies |
| **Key Evidence** | `check_commit_diffs` → syntax error in `payment_handler.py` |
| **Root Cause** | `bad_code` — missing `await` on async database call |
| **Ideal Containment** | `rollback_last_deploy` |
| **Expected Turns** | 2 |

### 🟡 Medium — Cascading Database Deadlock

| Attribute | Value |
|:---|:---|
| **Incident** | `INC-002` · Severity **P1** |
| **Surface Symptom** | Auth timeouts → API Gateway 502s → 4 microservices failing |
| **Red Herrings** | No recent deploys, no DDoS, traffic is normal |
| **Key Evidence** | `query_db_locks` → 847 blocked transactions, 12-min lock |
| **Root Cause** | `database_lock` — analytics team's full table scan on `users` |
| **Ideal Containment** | `scale_up_nodes` |
| **Expected Turns** | 3 |

### 🔴 Hard — DDoS Disguised as Viral Traffic

| Attribute | Value |
|:---|:---|
| **Incident** | `INC-003` · Severity **P1** |
| **Surface Symptom** | 400% traffic spike, ambiguous origin — CEO asks "Are we under attack?" |
| **The Trap** | A real viral social media post is generating *some* legitimate traffic |
| **Key Evidence** | `analyze_ip_traffic` → 95% botnet from 12,000+ Eastern European IPs |
| **Root Cause** | `ddos_attack` — coordinated botnet using viral event as cover |
| **Ideal Containment** | `rate_limit_all` (not scale — scaling wastes budget on bot traffic) |
| **Expected Turns** | 4 |

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/openenv_sre_arbiter.git
cd openenv_sre_arbiter

# Build and run
docker build -t sre-arbiter .
docker run -p 7860:7860 sre-arbiter
```

Open [http://localhost:7860](http://localhost:7860) to see the SRE Command Center.

### Option 2: Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start the environment server
uvicorn main:app --host 0.0.0.0 --port 7860 --reload
```

### Run the Evaluation Script

```bash
# Set your API key
export NVIDIA_API_KEY=nvapi-your-key-here

# Optional: override model and endpoint
export MODEL_NAME=nvidia/nemotron-3-super-120b-a12b
export NEMOTRON_BASE_URL=https://integrate.api.nvidia.com/v1

# Run the full evaluation (easy → medium → hard)
python inference.py
```

### Sample Output

```
======================================================================
  CLOUD SRE ARBITER — EVALUATION RUN
  Model: nvidia/nemotron-3-super-120b-a12b
  Endpoint: https://integrate.api.nvidia.com/v1
  Environment: http://localhost:7860
======================================================================

──────────────────────────────────────────────────────────────────────
  TASK: EASY
──────────────────────────────────────────────────────────────────────

  Turn 0 | Health: 50.0% | Budget: $0.0
  > Contain:     rollback_last_deploy
  > Investigate: check_commit_diffs
  > Root Cause:  unknown
  > Reason:      Investigating commit diffs due to recent deploy timeline...

  Turn 1 | Health: 65.0% | Budget: $250.0
  > Contain:     do_nothing
  > Investigate: none
  > Root Cause:  bad_code
  > Reason:      Commit diffs reveal syntax error in payment_handler.py...

  RESOLVED — Score: 0.95

======================================================================
  FINAL RESULTS
======================================================================
  EASY      ██████████████████░░  0.95
  MEDIUM    ████████████████░░░░  0.80
  HARD      ██████████████░░░░░░  0.72
──────────────────────────────────────────────────────────────────────
  AVERAGE SCORE: 0.82
======================================================================
```

---

## 📡 API Reference

### `GET /health`

Health check for automated judges and container orchestrators.

```json
// Response
{
  "status": "ok",
  "environment": "Cloud SRE Arbiter",
  "version": "1.0.0"
}
```

---

### `POST /reset`

Initialize a new incident episode.

```json
// Request
{ "task_name": "easy" }    // "easy" | "medium" | "hard"

// Response
{
  "status": 200,
  "observation": {
    "incident_id": "INC-001",
    "severity": "P2",
    "initial_observation": "ALERT STORM: Checkout API returning HTTP 500...",
    "active_alerts": ["Checkout_API_500_Spike", ...],
    "system_metrics": { "cpu": "45%", "error_rate": "34%", ... },
    "timeline": ["T-5m: CI/CD pipeline completed deploy #4821", ...],
    "investigation_results": {},
    "system_health": 50.0,
    "budget_spent": 0.0,
    "turn_number": 0,
    "turns_remaining": 6,
    "available_actions": { ... }
  },
  "state": { ... }
}
```

---

### `POST /step`

Submit the agent's two-pronged decision. Returns the next observation (or `null` if done), a reward, and episode state.

```json
// Request (Action schema)
{
  "containment_action": "rollback_last_deploy",
  "investigation_query": "check_commit_diffs",
  "declare_root_cause": "unknown",
  "justification": "Recent deploy in timeline; checking commit diffs for root cause."
}

// Response
{
  "status": 200,
  "observation": { ... },   // null when done=true
  "reward": {
    "total_score": 0.0,      // interim score (0.0 during investigation)
    "breakdown": { ... }
  },
  "done": false,
  "info": {
    "justification": "...",
    "turn": 1
  },
  "state": { ... }
}
```

---

### `GET /state`

Query current episode metadata without advancing the turn.

```json
// Response
{
  "task_name": "easy",
  "incident_id": "INC-001",
  "turn_number": 1,
  "max_turns": 6,
  "system_health": 65.0,
  "budget_spent": 250.0,
  "is_done": false
}
```

---

### `POST /autopilot`

Server-side LLM proxy — the frontend sends conversation context; the backend reads `NVIDIA_API_KEY` from environment, calls Nemotron, heals the JSON, and returns a validated action.

```json
// Request
{
  "model": "nvidia/nemotron-3-super-120b-a12b",
  "base_url": "https://integrate.api.nvidia.com/v1",
  "messages": [ { "role": "system", "content": "..." }, ... ],
  "temperature": 0.3,
  "max_tokens": 512
}

// Response
{
  "content": "{\"containment_action\": \"scale_up_nodes\", ...}"
}
```

---

## ✅ OpenEnv Compliance

The environment is fully compliant with the [OpenEnv specification](https://openenv.dev):

| Requirement | Implementation |
|:---|:---|
| **Pydantic Schemas** | `Observation`, `Action`, `Reward`, `State` — all in `environment.py` |
| **HTTP API** | `POST /reset`, `POST /step`, `GET /state`, `GET /health` |
| **Deterministic Grading** | Algorithmic scorer — same inputs always produce the same score |
| **Task Difficulty Tiers** | `easy`, `medium`, `hard` with escalating complexity |
| **Docker Entrypoint** | Single `Dockerfile` using `python:3.11-slim` |
| **Spec File** | `openenv.yaml` with full schema, task, and grading metadata |
| **Evaluation Script** | `inference.py` — headless driver through all 3 tasks |

---

## 🐳 Deployment

### Single-Line Dual-Remote CI/CD

We built a deployment pipeline that simultaneously pushes to two remotes with one command:

```bash
# One line. Two deployments. Zero downtime.
git push origin main && git push hf main
```

| Remote | Target | Purpose |
|:---|:---|:---|
| `origin` | **GitHub** | Source of truth, judge review, README showcase |
| `hf` | **Hugging Face Spaces** | Live API endpoint, Docker auto-build, public demo |

### Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

Seven lines. Layer-cached dependency install. Production-ready server. Port 7860 (Hugging Face Spaces standard).

---

## 📁 Project Structure

```
openenv_sre_arbiter/
│
├── 🔧 environment.py          Core RL engine — Pydantic models, CloudSREEnv class,
│                               reset()/step() loop, deterministic grading algorithm
│
├── 🌐 main.py                 FastAPI server — /reset, /step, /state, /health,
│                               /autopilot endpoints + JSON Healer pipeline
│
├── 🧠 inference.py            Headless evaluation script — drives Nemotron-120B
│                               through all 3 tasks via HTTP, reports scores
│
├── 📊 data.json               Hand-crafted scenario dataset — 3 incidents with
│                               hidden investigation data and ground truth
│
├── 📋 openenv.yaml            OpenEnv specification — schemas, tasks, grading
│                               config, evaluation metadata
│
├── 🐳 Dockerfile              Container config — python:3.11-slim, port 7860,
│                               Hugging Face Spaces compatible
│
├── 📦 requirements.txt        Python deps — fastapi, uvicorn, pydantic, openai,
│                               requests (5 packages, all pinned)
│
├── 🧪 test_local.py           Local smoke test — hits /reset and /step to verify
│                               the server is responding correctly
│
└── 🎨 sre_frontend_dist/      Pre-built React SPA (dark-mode SRE Command Center)
    ├── index.html              Entry point with module script + CSS refs
    ├── favicon.svg             Custom SRE-themed favicon
    ├── icons.svg               UI icon sprite sheet
    └── assets/                 Vite-bundled JS + CSS chunks
```

---

## 🔬 Technical Highlights

<table>
<tr>
<td width="50%">

### 🧩 Pydantic-Strict Action Validation
Every agent action is validated through Pydantic `Literal` types — if the LLM hallucinates a value like `"restart_pods"`, the server rejects it with a clear 422 error. No undefined behavior ever reaches the grader.

</td>
<td width="50%">

### ⚖️ Economy-Driven Decision Making
Scaling nodes costs $500. Rate limiting costs $100. Doing nothing costs $0 but bleeds 15% health/turn. The agent must internalize these trade-offs to maximize its efficiency score.

</td>
</tr>
<tr>
<td width="50%">

### 🩺 Hidden Information Architecture
Investigation queries reveal hidden data the agent can't see from surface metrics. The `data.json` structure separates what the agent *sees* (system_metrics, alerts) from what it must *discover* (hidden_data). This mirrors real SRE work where dashboards show symptoms, not causes.

</td>
<td width="50%">

### 🎲 Deterministic Reproducibility
Same actions → same score. Always. No randomness in the grader, no LLM-as-judge variability. The grading algorithm is a pure function of the agent's action history against the ground truth — making results comparable across different models and runs.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|:---|:---|:---|
| **Runtime** | Python | 3.11 |
| **API Framework** | FastAPI | ≥0.104 |
| **ASGI Server** | Uvicorn | ≥0.24 |
| **Schema Validation** | Pydantic v2 | ≥2.5 |
| **LLM Client** | OpenAI Python SDK | ≥1.3 |
| **LLM Model** | NVIDIA Nemotron-3-Super-120B-A12B | via Partner API |
| **Frontend** | React + Vite | Pre-built SPA |
| **Container** | Docker | python:3.11-slim |
| **Hosting** | Hugging Face Spaces | Docker SDK |
| **CI/CD** | Git dual-remote push | GitHub + HF |

---

## 👥 Team

**SRE Arbiter Team** — Built for the Meta × OpenEnv Hackathon

---

<div align="center">

### ⭐ If this environment made an AI sweat during an outage, consider giving us a star.

*Built with ☕, 🔥, and an unhealthy number of truncated JSON responses.*

</div>
