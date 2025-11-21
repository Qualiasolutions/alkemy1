# TTM API Deployment Guide

This directory contains the Time-to-Move (TTM) API server for Alkemy AI Studio, providing motion-controlled video generation capabilities.

## Quick Start

### Option 1: Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Clone TTM core repository (if not already done)
git clone https://github.com/time-to-move/TTM.git ttm-core

# Set environment variables
export VITE_SUPABASE_URL=your_supabase_url
export VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Start the server
python ttm_api.py
```

### Option 2: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t ttm-api .
docker run -p 8100:8100 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_SERVICE_ROLE_KEY=your_key \
  --gpus all \
  ttm-api
```

## Deployment Options

### 1. Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. RunPod (GPU Cloud)
```bash
# Deploy to RunPod using the provided template
# See: https://runpod.io/console/templates
```

### 3. Modal (Serverless GPU)
```python
# See modal-deploy.py in this directory
# Deploy with: modal deploy main.py
```

### 4. Vercel Integration
The TTM API cannot run directly on Vercel (no GPU support), but you can use the proxy:

1. Deploy TTM API to a GPU server
2. Set `TTM_SERVER_URL` environment variable in Vercel
3. Use `/api/ttm` proxy endpoint from the frontend

## Environment Variables

Required:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Service role key for storage uploads

Optional:
- `CUDA_VISIBLE_DEVICES`: GPU device index (default: 0)
- `MODEL_ID`: Alternative model ID (default: Wan-AI/Wan2.2-I2V-A14B-Diffusers)

## API Endpoints

- `GET /`: Health check
- `POST /api/ttm/generate`: Generate video from image
- `GET /api/ttm/status/{job_id}`: Check job status
- `GET /api/ttm/download/{job_id}`: Download generated video
- `DELETE /api/ttm/job/{job_id}`: Clean up job files

## Requirements

- Python 3.10+
- CUDA-capable GPU (16GB+ VRAM recommended)
- 10GB+ disk space for model weights
- Docker (for containerized deployment)

## Model Download

The first run will automatically download the Wan 2.2 model (~15GB):
```
Model: Wan-AI/Wan2.2-I2V-A14B-Diffusers
Size: ~15GB
Location: ~/.cache/huggingface/hub/
```

## Performance

- **GPU**: A40 or RTX 4090 recommended
- **Memory**: 16GB+ VRAM for full resolution
- **Generation time**: 30-60 seconds per video
- **Throughput**: ~1 video per minute on A40

## Monitoring

Check server status:
```bash
curl http://localhost:8100/
```

Example response:
```json
{
  "service": "TTM API for Alkemy",
  "status": "running",
  "device": "cuda",
  "pipeline_loaded": true,
  "supabase_configured": true
}
```

## Troubleshooting

### GPU Issues
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Check GPU memory
nvidia-smi
```

### Model Loading Issues
```bash
# Clear Hugging Face cache and re-download
rm -rf ~/.cache/huggingface/hub/
```

### Permission Issues
```bash
# Fix file permissions for temp directories
sudo chown -R $USER:$USER /tmp/ttm_*
```

## Support

- TTM Repository: https://github.com/time-to-move/TTM
- Alkemy Documentation: `/docs/TTM_INTEGRATION_GUIDE.md`
- Issues: https://github.com/QualiaSound/alkemy/issues
