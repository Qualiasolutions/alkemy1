# TTM API Deployment Instructions

This document provides step-by-step instructions for deploying the TTM (Time-to-Move) API server for Alkemy AI Studio.

## Overview

The TTM API is a **Python FastAPI server** that requires **GPU resources** for AI model inference. It cannot be deployed directly to Vercel's serverless platform due to these requirements.

## Deployment Options

### Option 1: Railway (Recommended)

**Best for:** Production deployments, automatic scaling, managed infrastructure

**Steps:**
1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway project:**
   ```bash
   cd services/ttm
   railway init
   ```

4. **Set environment variables:**
   ```bash
   railway variables set VITE_SUPABASE_URL=your_supabase_url
   railway variables set VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get deployment URL:**
   ```bash
   railway domain
   ```

**Expected URL:** `https://your-app-name.up.railway.app`

### Option 2: RunPod (GPU Cloud)

**Best for:** Cost-effective GPU instances, high performance

**Steps:**
1. **Create RunPod account:** https://runpod.io

2. **Deploy using Docker:**
   ```bash
   cd services/ttm
   
   # Build and push to RunPod
   docker build -t your-registry/alkemy-ttm-api .
   docker push your-registry/alkemy-ttm-api
   ```

3. **Use provided Docker Compose:**
   ```bash
   docker-compose up --build
   ```

**Expected URL:** Your RunPod assigned URL

### Option 3: Modal (Serverless GPU)

**Best for:** Pay-per-generation, no server management

**Steps:**
1. **Install Modal:**
   ```bash
   pip install modal
   ```

2. **Authenticate:**
   ```bash
   modal token new
   ```

3. **Deploy:**
   ```bash
   cd services/ttm
   modal deploy modal-deploy.py
   ```

**Expected URL:** `https://your-org--ttm-api-alkemy.generate.modal.run`

### Option 4: Self-Hosted Docker

**Best for:** Full control, on-premise deployment

**Steps:**
1. **Build Docker image:**
   ```bash
   cd services/ttm
   docker build -t alkemy-ttm-api .
   ```

2. **Run with GPU support:**
   ```bash
   docker run -p 8100:8100 \
     -e VITE_SUPABASE_URL=your_url \
     -e VITE_SUPABASE_SERVICE_ROLE_KEY=your_key \
     -v huggingface_cache:/root/.cache/huggingface \
     --gpus all \
     alkemy-ttm-api
   ```

**Expected URL:** `http://localhost:8100` or your server IP

## Vercel Integration (Required)

After deploying the TTM API to any of the above options, you must configure Vercel to proxy requests:

1. **Set environment variable in Vercel:**
   ```bash
   vercel env add TTM_SERVER_URL production
   # Enter your TTM API URL (e.g., https://your-app.up.railway.app)
   ```

2. **Redeploy Vercel:**
   ```bash
   vercel --prod
   ```

3. **Verify integration:**
   ```bash
   curl https://your-alkemy-app.vercel.app/api/ttm/
   ```

## Environment Variables

### Required for TTM API:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Service role key for storage

### Required for Vercel:
- `TTM_SERVER_URL`: Full URL to your deployed TTM API

## Verification

1. **Check TTM API health:**
   ```bash
   curl https://your-ttm-server.up.railway.app/
   # Should return: {"service": "TTM API for Alkemy", "status": "running", ...}
   ```

2. **Test Vercel proxy:**
   ```bash
   curl https://your-alkemy-app.vercel.app/api/ttm/
   # Should return same response as above
   ```

3. **Test generation endpoint:**
   ```bash
   # Test via Alkemy frontend using MotionTrajectoryEditor component
   # or directly call the API with multipart form data
   ```

## Performance Expectations

| Platform | GPU Type | Generation Time | Cost/Video |
|----------|----------|----------------|-----------|
| Railway | A40 | 30-60s | ~$0.02 |
| RunPod | A100 | 20-40s | ~$0.015 |
| Modal | A100 | 30-50s | ~$0.05 |
| Self-hosted | RTX 4090 | 40-80s | Variable |

## Monitoring

### Health Checks:
```bash
# TTM API Health
curl https://your-ttm-server/status

# Vercel Proxy Health
curl https://your-alkemy-app.vercel.app/api/ttm/
```

### Logs:
- **Railway**: `railway logs`
- **RunPod**: Check instance logs
- **Modal**: `modal logs`
- **Vercel**: `vercel logs`

## Troubleshooting

### Common Issues:

1. **GPU not available:**
   - Ensure GPU instance is selected
   - Check CUDA drivers: `nvidia-smi`

2. **Model download failed:**
   - Clear cache: `rm -rf ~/.cache/huggingface/`
   - Check network connectivity
   - Verify Hugging Face token if needed

3. **CORS errors:**
   - Check TTM API CORS settings
   - Verify Vercel proxy configuration

4. **Timeout errors:**
   - Increase timeout in deployment settings
   - Check GPU memory usage
   - Reduce video resolution if needed

## Security Considerations

1. **API Keys:** Store Supabase keys in environment variables only
2. **Rate Limiting:** Implement rate limiting on the TTM API
3. **Access Control:** Use authentication for production deployments
4. **File Uploads:** Validate uploaded image sizes and formats

## Support

- **TTM Issues:** https://github.com/time-to-move/TTM/issues
- **Alkemy Issues:** https://github.com/QualiaSound/alkemy/issues
- **Documentation:** `/docs/TTM_INTEGRATION_GUIDE.md`
- **Deployment Status:** Check Railway/RunPod/Modal dashboards

---

**Last Updated:** 2025-11-17
**TTM Integration Version:** 1.0.0
