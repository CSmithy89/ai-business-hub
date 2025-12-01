# AgentOS Dockerfile - Story 00-7
# Production-ready Docker image for AI Agent Runtime

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY config.py .
COPY middleware/ ./middleware/

# Copy platform agents (for future use in EPIC-04)
COPY platform/ ./platform/

# Note: crm/ and validation/ directories will be added in future epics
# They are not included in the base image - mount them at runtime if needed

# Expose AgentOS port
EXPOSE 7777

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:7777/health')"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7777"]
