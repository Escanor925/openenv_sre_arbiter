from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from environment import CloudSREEnv, Action

app = FastAPI(title="OpenEnv - Cloud SRE Arbiter")

# Initialize the environment engine
try:
    env = CloudSREEnv(data_path="data.json")
except Exception as e:
    print(f"Warning: Could not load data.json on startup. Ensure it exists. Error: {e}")
    env = None

class ResetRequest(BaseModel):
    task_name: str = "easy"

@app.get("/")
def health_check():
    """Automated judges will ping this to ensure the container is alive."""
    return {"status": "ok", "environment": "Cloud SRE Arbiter API - Running"}

@app.post("/reset")
def reset_env(req: ResetRequest):
    """Initializes a new episode and returns the first observation."""
    if not env:
        raise HTTPException(status_code=500, detail="Environment not initialized properly.")
    
    try:
        obs = env.reset(req.task_name)
        return {
            "status": 200, 
            "observation": obs.dict(), 
            "state": env.state().dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/step")
def step_env(action: Action):
    """Processes the AI's action, updates the budget/state, and returns the reward."""
    if not env:
        raise HTTPException(status_code=500, detail="Environment not initialized properly.")
        
    try:
        obs, reward, done, info = env.step(action)
        return {
            "status": 200,
            "observation": obs.dict() if obs else None,
            "reward": reward.dict(),
            "done": done,
            "info": info,
            "state": env.state().dict()
        }
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
