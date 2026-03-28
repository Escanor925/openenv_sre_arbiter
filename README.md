---
title: Cloud SRE Arbiter
emoji: 🚨
colorFrom: red
colorTo: yellow
sdk: docker
pinned: false
---

# 🚨 Cloud SRE Arbiter

**OpenEnv Hackathon Submission** — An RL-style environment that evaluates an AI agent's ability to diagnose and mitigate live server outages.

## The Core Mechanic: "Contain & Investigate"

The agent faces realistic **alert storms**. Each turn, it must make two simultaneous decisions:

| Decision | Domain | Examples |
|----------|--------|----------|
| **Containment** (Ops) | Keep the system online | Scale nodes, rollback deploys, rate-limit |
| **Investigation** (Sec/Data) | Find the root cause | Query DB locks, check commits, analyze traffic |

The episode loops until the agent correctly declares the root cause — or the system crashes.

## Tasks

| Difficulty | Scenario | Root Cause |
|-----------|----------|------------|
| **Easy** | Bad code deploy causing API 500s | Faulty commit in payment handler |
| **Medium** | Cascading microservice failures | Database deadlock on users table |
| **Hard** | Ambiguous traffic spike (DDoS vs viral) | 95% botnet traffic disguised as viral event |

## Grading (Deterministic, 0.0 → 1.0)

| Weight | Category |
|--------|----------|
| 40% | Root cause identification |
| 25% | Containment quality |
| 15% | Evidence gathering |
| 10% | Budget efficiency |
| 10% | System health maintenance |

**Penalties:**
- Premature guess (no evidence): **−0.30**
- System crash (health → 0): **−0.50**

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start the environment server
uvicorn main:app --host 0.0.0.0 --port 7860

# Run the evaluation (in another terminal)
export HF_TOKEN=your_token_here
export MODEL_NAME=gpt-4o-mini
python inference.py
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/reset` | Start new episode `{"task_name": "easy"}` |
| `POST` | `/step` | Send action, receive observation + reward |
| `GET` | `/state` | Current episode metadata |

## File Structure

```
├── data.json          # Scenario dataset (easy/medium/hard)
├── environment.py     # Core engine + Pydantic models + grader
├── main.py            # FastAPI server (/reset, /step, /state)
├── inference.py       # LLM evaluation script
├── openenv.yaml       # OpenEnv specification
├── Dockerfile         # Container config
└── requirements.txt   # Python dependencies
```
