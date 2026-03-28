"""
Cloud SRE Arbiter — FastAPI Server
====================================
Serves the OpenEnv-compliant HTTP API with /reset, /step, and /state
endpoints.  The GET / health-check is required by automated judges.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from environment import (
    CloudSREEnv,
    Action,
    Observation,
    Reward,
    State,
)

# ---------------------------------------------------------------------------
# APP SETUP
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OpenEnv — Cloud SRE Arbiter",
    description=(
        "A multi-step, RL-style environment testing an AI agent's ability to "
        "balance system-uptime containment with root-cause investigation "
        "under severe financial constraints."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the environment engine (loads data.json once at startup)
try:
    env = CloudSREEnv(data_path="data.json")
except FileNotFoundError:
    print("WARNING: data.json not found at startup — will retry on first request.")
    env = CloudSREEnv.__new__(CloudSREEnv)   # placeholder; will fail gracefully


# ---------------------------------------------------------------------------
# REQUEST / RESPONSE SCHEMAS
# ---------------------------------------------------------------------------

class ResetRequest(BaseModel):
    task_name: str = Field(
        "easy",
        description="Difficulty level: easy | medium | hard",
    )


class ResetResponse(BaseModel):
    status: int = 200
    observation: dict
    state: dict


class StepResponse(BaseModel):
    status: int = 200
    observation: Optional[dict] = None
    reward: dict
    done: bool
    info: dict
    state: dict


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def health_check():
    """Automated judges ping this to verify the container is alive."""
    return {
        "status": "ok",
        "environment": "Cloud SRE Arbiter",
        "version": "1.0.0",
    }


@app.post("/reset", response_model=ResetResponse, tags=["environment"])
def reset_env(req: ResetRequest):
    """
    Initialize a new episode for the given task difficulty and return the
    first Observation the agent will see.
    """
    try:
        obs = env.reset(req.task_name)
        return ResetResponse(
            status=200,
            observation=obs.model_dump(),
            state=env.get_state().model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Reset failed: {exc}")


@app.post("/step", response_model=StepResponse, tags=["environment"])
def step_env(action: Action):
    """
    Process the agent's Action (containment + investigation + declaration),
    update internal state, and return (Observation, Reward, done, info).
    """
    try:
        obs, reward, done, info = env.step(action)
        return StepResponse(
            status=200,
            observation=obs.model_dump() if obs else None,
            reward=reward.model_dump(),
            done=done,
            info=info,
            state=env.get_state().model_dump(),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Step failed: {exc}")


@app.get("/state", tags=["environment"])
def get_state():
    """Return current episode metadata."""
    try:
        return env.get_state().model_dump()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"State query failed: {exc}")
