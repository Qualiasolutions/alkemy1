# Time-to-Move (TTM) Integration Guide for Alkemy AI Studio

## Overview

Time-to-Move (TTM) is a cutting-edge motion control framework for video generation that has been integrated into Alkemy AI Studio. This guide covers the complete integration architecture, setup process, and usage instructions.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup Instructions](#setup-instructions)
3. [API Reference](#api-reference)
4. [Frontend Integration](#frontend-integration)
5. [Deployment Guide](#deployment-guide)
6. [Performance Considerations](#performance-considerations)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────┐
│           Alkemy Frontend (React)           │
├─────────────────────────────────────────────┤
│  • MotionTrajectoryEditor Component         │
│  • TTM Service (TypeScript)                 │
│  • Scene Assembler Integration              │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│         TTM API Server (FastAPI)            │
├─────────────────────────────────────────────┤
│  • Motion Signal Generation                 │
│  • Dual-Clock Denoising                     │
│  • Job Queue Management                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      TTM Core (PyTorch/Diffusers)           │
├─────────────────────────────────────────────┤
│  • Wan 2.2 Model (14B params)               │
│  • GPU Inference                            │
│  • Video Generation Pipeline                │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **User Input**: Draw motion trajectory or select camera movement
2. **Frontend Processing**: Convert to normalized coordinates
3. **API Request**: Send image + motion data to TTM server
4. **Motion Generation**: Create warped reference and mask
5. **Video Generation**: Apply dual-clock denoising with model
6. **Storage**: Upload to Supabase/S3
7. **Response**: Return video URL to frontend

## Setup Instructions

### Prerequisites

- Python 3.10+
- CUDA-capable GPU (16GB+ VRAM recommended)
- Node.js 18+
- Supabase account (optional, for storage)

### Backend Setup

1. **Clone TTM repository**:
```bash
cd services/ttm
git clone https://github.com/time-to-move/TTM.git ttm-core
```

2. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

3. **Download Wan 2.2 model**:
```bash
# Note: Requires Hugging Face account
huggingface-cli login
python -c "from diffusers import DiffusionPipeline; DiffusionPipeline.from_pretrained('Wan-AI/Wan2.2-I2V-A14B-Diffusers')"
```

4. **Configure environment**:
```bash
export VITE_TTM_API_URL=http://localhost:8100
export VITE_SUPABASE_URL=your_supabase_url
export VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

5. **Start TTM API server**:
```bash
cd services/ttm
python ttm_api.py
```

### Frontend Setup

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Add environment variable**:
```env
VITE_TTM_API_URL=http://localhost:8100
```

3. **Import TTM service**:
```typescript
import ttmService from './services/ttmService';
```

## API Reference

### POST /api/ttm/generate

Generate motion-controlled video from an image.

**Request:**
```typescript
{
  "motionType": "object" | "camera",
  "prompt": string,
  "trajectory": Point2D[],         // For object motion
  "cameraMovement": {               // For camera motion
    "type": "pan" | "zoom" | "orbit",
    "params": {...}
  },
  "tweakIndex": number,             // 0-50
  "tstrongIndex": number,           // 0-50
  "numFrames": number,              // Default: 81
  "guidanceScale": number,          // Default: 3.5
  "seed": number,                   // Optional
  "projectId": string               // Optional
}
```

**Response:**
```typescript
{
  "jobId": string,
  "status": "pending" | "processing" | "completed" | "failed",
  "progress": number,               // 0.0 to 1.0
  "result": {
    "videoUrl": string,
    "thumbnailUrl": string,
    "durationSeconds": number,
    "frames": number,
    "generationTime": number
  }
}
```

### GET /api/ttm/status/{job_id}

Check status of a generation job.

### GET /api/ttm/download/{job_id}

Download generated video.

## Frontend Integration

### Using the Motion Trajectory Editor

```tsx
import MotionTrajectoryEditor from './components/MotionTrajectoryEditor';

function SceneAssembler() {
  const handleTrajectory = (trajectory: Point2D[]) => {
    // Generate video with object motion
    ttmService.generateTTMVideo(imageUrl, {
      motionType: MotionType.OBJECT,
      prompt: "Object moving along path",
      trajectory
    });
  };

  const handleCameraMovement = (movement: CameraMovement) => {
    // Generate video with camera motion
    ttmService.generateTTMVideo(imageUrl, {
      motionType: MotionType.CAMERA,
      prompt: "Camera pan across scene",
      cameraMovement: movement
    });
  };

  return (
    <MotionTrajectoryEditor
      imageUrl={frameImage}
      onTrajectoryComplete={handleTrajectory}
      onCameraMovementComplete={handleCameraMovement}
      motionType={MotionType.OBJECT}
    />
  );
}
```

### Direct API Usage

```typescript
import { generateTTMVideo, createLinearTrajectory } from './services/ttmService';

// Generate with linear motion
const trajectory = createLinearTrajectory(
  { x: 0.2, y: 0.5 },  // Start
  { x: 0.8, y: 0.5 },  // End
  81                     // Frames
);

const response = await generateTTMVideo(imageUrl, {
  motionType: MotionType.OBJECT,
  prompt: "Character walking across frame",
  trajectory,
  seed: 42
});

console.log('Video URL:', response.videoUrl);
```

### Integration with Alkemy Frames

```typescript
// In Scene Assembler
const animateWithTTM = async (frame: Frame) => {
  const { videoUrl } = await ttmService.animateFrameWithTTM(
    frame,
    MotionType.CAMERA,
    {
      cameraMovement: {
        type: CameraMovementType.PAN,
        params: { dx: 0.3, dy: 0 }
      }
    }
  );

  // Update frame with generated video
  frame.media.animated_video_url = videoUrl;
  frame.status = FrameStatus.VideoReady;
};
```

## Deployment Guide

### Option 1: Vercel Functions (Serverless)

**Note**: May hit timeout limits for long generations.

1. Create `api/ttm/[...route].ts`:
```typescript
export default async function handler(req, res) {
  // Proxy to TTM API server
  const response = await fetch(`${TTM_API_URL}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  res.status(response.status).json(await response.json());
}
```

### Option 2: GPU Cloud Instance

**Recommended providers:**
- RunPod.io ($0.50-1.00/hour for A40)
- Modal.com (pay per generation)
- AWS EC2 (g5.xlarge instance)

**Docker deployment:**
```dockerfile
FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ttm-core/ ./ttm-core/
COPY ttm_api.py .

EXPOSE 8100

CMD ["python", "ttm_api.py"]
```

### Option 3: Replicate.com Integration

1. **Deploy model to Replicate**:
```python
# cog.yaml
build:
  gpu: true
  python_version: "3.10"
  python_packages:
    - diffusers
    - torch
    - transformers

predict: "predict.py:Predictor"
```

2. **Update TTM service**:
```typescript
const replicateRun = await replicate.run(
  "your-username/ttm-wan:latest",
  { input: { image, trajectory, prompt } }
);
```

## Performance Considerations

### GPU Requirements

| Model | VRAM Required | Inference Time | Quality |
|-------|---------------|----------------|---------|
| Wan 2.2 | 16GB+ | 30-60s | Best |
| CogVideoX | 8GB+ | 20-40s | Good |
| SVD | 6GB+ | 15-30s | Fair |

### Optimization Tips

1. **Batch Processing**: Queue multiple requests
2. **Lower Resolution**: Reduce max_area for faster generation
3. **Cached Models**: Keep models in GPU memory
4. **Progressive Generation**: Generate preview at low quality first

### Cost Analysis

**Self-hosted GPU**:
- A40 instance: $0.50-1.00/hour
- ~60 videos/hour = $0.01-0.02/video

**Replicate.com**:
- ~$0.05-0.10/video
- No infrastructure management

**Vercel Functions**:
- Not recommended (timeout limitations)

## Troubleshooting

### Common Issues

**1. Out of Memory (OOM)**:
```python
# Reduce batch size
pipe.vae.enable_slicing()
pipe.vae.enable_tiling()
```

**2. Slow Generation**:
- Use lower resolution: `max_area = 320 * 512`
- Reduce frames: `num_frames = 41`
- Use faster model: SVD instead of Wan

**3. API Connection Failed**:
```bash
# Check server is running
curl http://localhost:8100/

# Check CORS settings
# Add your frontend URL to allowed_origins
```

**4. Model Loading Failed**:
```bash
# Verify model downloaded
ls ~/.cache/huggingface/hub/

# Re-download if needed
huggingface-cli download Wan-AI/Wan2.2-I2V-A14B-Diffusers
```

### Debug Mode

Enable debug logging:
```python
# In ttm_api.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check generation logs:
```typescript
// In ttmService.ts
console.log('[TTM Debug]', response);
```

## Best Practices

1. **Always validate input images** (max 20MB, common formats)
2. **Set reasonable timeouts** (60-120 seconds)
3. **Implement retry logic** for failed generations
4. **Cache generated videos** to avoid regeneration
5. **Use progress callbacks** for user feedback
6. **Provide fallback** to Veo 3.1 if TTM unavailable

## Future Enhancements

- [ ] Multi-object motion tracking
- [ ] Depth-aware camera movements
- [ ] Style transfer during motion
- [ ] Real-time preview generation
- [ ] Motion templates library
- [ ] Batch processing queue
- [ ] Cost optimization with quality tiers

## Support

For issues or questions:
- TTM Repository: https://github.com/time-to-move/TTM
- Alkemy Issues: https://github.com/QualiaSound/alkemy/issues
- API Documentation: http://localhost:8100/docs (when server running)

---

**Last Updated**: 2025-11-17
**Integration Version**: 1.0.0
**Compatible with**: Alkemy V2.0 Alpha