"""
Cloud SRE Arbiter — FastAPI Server
====================================
Serves the OpenEnv-compliant HTTP API with /reset, /step, and /state
endpoints.  The GET / health-check is required by automated judges.
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from openai import OpenAI

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


class AutoPilotRequest(BaseModel):
    api_key: str = Field(..., min_length=1, description="Provider API key (e.g., nvapi-...)")
    model: str = Field("nvidia/nemotron-3-super-120b-a12b", min_length=1)
    base_url: str = Field("https://integrate.api.nvidia.com/v1", min_length=1)
    messages: list[dict]
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(512, ge=1, le=4096)


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
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


@app.post("/autopilot", tags=["llm"])
def autopilot(req: AutoPilotRequest):
    """
    Server-side LLM proxy for the dashboard Auto-Pilot flow.
    Avoids browser-side CORS/provider restrictions by calling the model here.
    """
    try:
        client = OpenAI(api_key=req.api_key, base_url=req.base_url)
        response = client.chat.completions.create(
            model=req.model,
            messages=req.messages,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM upstream call failed: {exc}")

    try:
        content = response.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Malformed LLM response: {exc}")

    if not content:
        raise HTTPException(status_code=502, detail="LLM returned empty content")

    return {"content": content}


# ---------------------------------------------------------------------------
# FRONTEND UI ROUTING
# ---------------------------------------------------------------------------

_dist_path = os.path.join(os.path.dirname(__file__), "sre_frontend_dist")

if os.path.exists(_dist_path):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(_dist_path, "assets")),
        name="assets",
    )

    @app.get("/")
    def serve_frontend():
        """Serve the React SRE Command Center UI."""
        return FileResponse(os.path.join(_dist_path, "index.html"))

    @app.get("/favicon.svg")
    def serve_favicon():
        return FileResponse(os.path.join(_dist_path, "favicon.svg"))

    @app.get("/icons.svg")
    def serve_icons():
        return FileResponse(os.path.join(_dist_path, "icons.svg"))
