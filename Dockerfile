FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install the project itself (resolves [project.scripts] and openenv-core)
RUN pip install --no-cache-dir .

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Run the FastAPI server via the new package layout
CMD ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "7860"]
