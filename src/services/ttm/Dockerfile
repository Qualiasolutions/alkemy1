# Dockerfile for TTM API deployment
FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create TTM directory and clone core repository
RUN mkdir -p ttm-core && \
    cd ttm-core && \
    git init && \
    git remote add origin https://github.com/time-to-move/TTM.git && \
    git pull origin main

# Copy application code
COPY ttm_api.py .

# Create directories for runtime
RUN mkdir -p /tmp/ttm_workspace /tmp/ttm_outputs

# Expose port
EXPOSE 8100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8100/ || exit 1

# Environment variables
ENV PYTHONPATH=/app/ttm-core:$PYTHONPATH
ENV CUDA_VISIBLE_DEVICES=0

# Run the application
CMD ["python", "ttm_api.py"]
