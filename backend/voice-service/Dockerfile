FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Render (and others) set PORT at runtime
ENV PORT=3002
EXPOSE 3002

# Use PORT from environment so Render can assign a dynamic port
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
