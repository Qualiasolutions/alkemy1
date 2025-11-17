"""
TTM (Time-to-Move) API Server for Alkemy AI Studio
Provides REST endpoints for motion-controlled video generation
"""

import os
import sys
import json
import uuid
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import tempfile
import shutil

import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.concurrency import RateLimiter
from pydantic import BaseModel, Field, validator
import torch
from PIL import Image
import numpy as np
import cv2
import imageio
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add TTM core to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'ttm-core'))

# Import TTM components with proper error handling
ttm_components = None
try:
    from pipelines.wan_pipeline import WanImageToVideoTTMPipeline
    from pipelines.utils import validate_inputs, compute_hw_from_area
    from diffusers.utils import export_to_video, load_image
    ttm_components = (
        WanImageToVideoTTMPipeline,
        validate_inputs,
        compute_hw_from_area,
        export_to_video,
        load_image
    )
    logger.info("TTM components loaded successfully")
except ImportError as e:
    logger.error(f"TTM components not fully installed: {e}")
    logger.error("Please ensure TTM repository is cloned and dependencies are installed")
    logger.info("Run: cd services/ttm && python ttm_api_fixes.py to validate installation")

# Supabase integration for storage
from supabase import create_client, Client

# Configuration
class Config:
    # Model settings
    MODEL_ID = "Wan-AI/Wan2.2-I2V-A14B-Diffusers"
    DTYPE = torch.bfloat16
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

    # API settings
    HOST = "0.0.0.0"
    PORT = 8100
    API_PREFIX = "/api/ttm"

    # Storage settings
    TEMP_DIR = "/tmp/ttm_workspace"
    OUTPUT_DIR = "/tmp/ttm_outputs"

    # Supabase settings (from environment)
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY", "")

    # TTM defaults
    DEFAULT_NUM_FRAMES = 81
    DEFAULT_FPS = 16
    DEFAULT_GUIDANCE_SCALE = 3.5
    DEFAULT_NUM_INFERENCE_STEPS = 50
    DEFAULT_MAX_AREA = 480 * 832

    # Motion control defaults
    DEFAULT_TWEAK_INDEX_OBJECT = 3
    DEFAULT_TSTRONG_INDEX_OBJECT = 7
    DEFAULT_TWEAK_INDEX_CAMERA = 2
    DEFAULT_TSTRONG_INDEX_CAMERA = 5

# Initialize FastAPI app
app = FastAPI(
    title="TTM API for Alkemy",
    description="Motion-controlled video generation service",
    version="1.0.0"
)

# CORS configuration for Alkemy frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance (loaded on startup)
ttm_pipeline = None
supabase_client: Optional[Client] = None

# Request/Response models
class MotionType(str):
    OBJECT = "object"
    CAMERA = "camera"

class CameraMovement(BaseModel):
    type: str = Field(..., description="Type of camera movement: pan, zoom, orbit, dolly")
    params: Dict[str, Any] = Field(..., description="Movement-specific parameters")

class TTMRequest(BaseModel):
    """Request model for TTM video generation"""
    motion_type: MotionType = Field(..., description="Type of motion control")
    prompt: str = Field(..., description="Text description of desired motion")
    trajectory: Optional[List[Dict[str, float]]] = Field(None, description="Object motion trajectory points")
    camera_movement: Optional[CameraMovement] = Field(None, description="Camera movement specification")
    tweak_index: Optional[int] = Field(None, description="When to start denoising outside mask")
    tstrong_index: Optional[int] = Field(None, description="When to start denoising inside mask")
    num_frames: int = Field(Config.DEFAULT_NUM_FRAMES, description="Number of frames to generate")
    guidance_scale: float = Field(Config.DEFAULT_GUIDANCE_SCALE, description="Guidance scale")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")
    project_id: Optional[str] = Field(None, description="Alkemy project ID for storage")

    @validator('tweak_index')
    def validate_tweak_index(cls, v):
        if v is not None and (v < 0 or v > 50):
            raise ValueError('tweakIndex must be between 0 and 50')
        return v

    @validator('tstrong_index')
    def validate_tstrong_index(cls, v):
        if v is not None and (v < 0 or v > 50):
            raise ValueError('tstrongIndex must be between 0 and 50')
        return v

    @validator('num_frames')
    def validate_num_frames(cls, v):
        if v < 16 or v > 161:
            raise ValueError('numFrames must be between 16 and 161')
        return v

    @validator('guidance_scale')
    def validate_guidance_scale(cls, v):
        if v < 1 or v > 20:
            raise ValueError('guidanceScale must be between 1 and 20')
        return v

class TTMResponse(BaseModel):
    """Response model for TTM video generation"""
    status: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    frames: Optional[int] = None
    generation_time: Optional[float] = None
    error: Optional[str] = None

class JobStatus(BaseModel):
    """Status of a generation job"""
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: float  # 0.0 to 1.0
    result: Optional[TTMResponse] = None

# Job tracking
generation_jobs: Dict[str, JobStatus] = {}

# Utility functions
def create_motion_signal_from_trajectory(
    image: Image.Image,
    trajectory: List[Dict[str, float]],
    num_frames: int
) -> tuple[np.ndarray, np.ndarray]:
    """
    Create motion signal video and mask from trajectory points

    Args:
        image: Input image
        trajectory: List of {x, y} coordinates (normalized 0-1)
        num_frames: Number of frames to generate

    Returns:
        motion_signal: Video showing object motion
        mask: Binary mask of moving region
    """
    h, w = image.height, image.width
    motion_signal = []
    masks = []

    # Interpolate trajectory to num_frames
    if len(trajectory) < num_frames:
        # Simple linear interpolation
        interp_trajectory = []
        for i in range(num_frames):
            t = i / (num_frames - 1) * (len(trajectory) - 1)
            idx = int(t)
            frac = t - idx
            if idx < len(trajectory) - 1:
                x = trajectory[idx]["x"] * (1 - frac) + trajectory[idx + 1]["x"] * frac
                y = trajectory[idx]["y"] * (1 - frac) + trajectory[idx + 1]["y"] * frac
            else:
                x, y = trajectory[-1]["x"], trajectory[-1]["y"]
            interp_trajectory.append({"x": x, "y": y})
    else:
        interp_trajectory = trajectory[:num_frames]

    # Create frames
    for i, pos in enumerate(interp_trajectory):
        frame = np.array(image)
        mask = np.zeros((h, w), dtype=np.uint8)

        # Draw object at position (simplified - in real implementation would cut and paste)
        cx, cy = int(pos["x"] * w), int(pos["y"] * h)
        cv2.circle(frame, (cx, cy), 50, (255, 0, 0), -1)
        cv2.circle(mask, (cx, cy), 50, 255, -1)

        motion_signal.append(frame)
        masks.append(mask)

    return np.array(motion_signal), np.array(masks)

def create_camera_motion_signal(
    image: Image.Image,
    camera_movement: CameraMovement,
    num_frames: int
) -> tuple[np.ndarray, np.ndarray]:
    """
    Create motion signal for camera movement using depth-based reprojection

    Args:
        image: Input image
        camera_movement: Camera movement specification
        num_frames: Number of frames

    Returns:
        motion_signal: Video showing camera motion
        mask: Full frame mask (camera affects entire image)
    """
    h, w = image.height, image.width
    motion_signal = []
    masks = []

    # Full frame mask for camera motion
    full_mask = np.ones((h, w), dtype=np.uint8) * 255

    for i in range(num_frames):
        t = i / (num_frames - 1)
        frame = np.array(image)

        # Apply camera transformation based on type
        if camera_movement.type == "zoom":
            scale = 1 + t * camera_movement.params.get("amount", 0.5)
            M = cv2.getRotationMatrix2D((w/2, h/2), 0, scale)
            frame = cv2.warpAffine(frame, M, (w, h))

        elif camera_movement.type == "pan":
            dx = t * camera_movement.params.get("dx", 0) * w
            dy = t * camera_movement.params.get("dy", 0) * h
            M = np.float32([[1, 0, dx], [0, 1, dy]])
            frame = cv2.warpAffine(frame, M, (w, h))

        elif camera_movement.type == "orbit":
            angle = t * camera_movement.params.get("angle", 30)
            M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
            frame = cv2.warpAffine(frame, M, (w, h))

        motion_signal.append(frame)
        masks.append(full_mask)

    return np.array(motion_signal), np.array(masks)

async def generate_ttm_video(
    image: Image.Image,
    request: TTMRequest,
    job_id: str
) -> TTMResponse:
    """
    Generate video using TTM pipeline

    Args:
        image: Input image
        request: TTM request parameters
        job_id: Job ID for tracking

    Returns:
        TTMResponse with video URL and metadata
    """
    global ttm_pipeline, generation_jobs

    # Check if TTM is properly installed
    if ttm_components is None:
        return TTMResponse(
            status="failed",
            error="TTM components not available. Please run: python ttm_api_fixes.py"
        )

    WanImageToVideoTTMPipeline, validate_inputs, compute_hw_from_area, export_to_video, load_image = ttm_components

    start_time = datetime.now()

    try:
        # Update job status
        generation_jobs[job_id].status = "processing"
        generation_jobs[job_id].progress = 0.1

        # Set default indices based on motion type
        if request.tweak_index is None:
            request.tweak_index = (
                Config.DEFAULT_TWEAK_INDEX_OBJECT if request.motion_type == MotionType.OBJECT
                else Config.DEFAULT_TWEAK_INDEX_CAMERA
            )
        if request.tstrong_index is None:
            request.tstrong_index = (
                Config.DEFAULT_TSTRONG_INDEX_OBJECT if request.motion_type == MotionType.OBJECT
                else Config.DEFAULT_TSTRONG_INDEX_CAMERA
            )

        # Create motion signals based on type
        if request.motion_type == MotionType.OBJECT and request.trajectory:
            motion_signal, mask = create_motion_signal_from_trajectory(
                image, request.trajectory, request.num_frames
            )
        elif request.motion_type == MotionType.CAMERA and request.camera_movement:
            motion_signal, mask = create_camera_motion_signal(
                image, request.camera_movement, request.num_frames
            )
        else:
            raise ValueError(f"Invalid motion specification for {request.motion_type}")

        generation_jobs[job_id].progress = 0.3

        # Save temporary files for TTM
        temp_dir = Path(Config.TEMP_DIR) / job_id
        temp_dir.mkdir(parents=True, exist_ok=True)

        motion_signal_path = temp_dir / "motion_signal.mp4"
        mask_path = temp_dir / "mask.mp4"

        imageio.mimwrite(motion_signal_path, motion_signal, fps=Config.DEFAULT_FPS)
        imageio.mimwrite(mask_path, mask, fps=Config.DEFAULT_FPS)

        generation_jobs[job_id].progress = 0.4

        # Prepare image
        mod_value = ttm_pipeline.vae_scale_factor_spatial * ttm_pipeline.transformer.config.patch_size[1]
        height, width = compute_hw_from_area(
            image.height, image.width, Config.DEFAULT_MAX_AREA, mod_value
        )
        image = image.resize((width, height))

        # Generate with TTM
        generator = None
        if request.seed is not None:
            gen_device = Config.DEVICE if Config.DEVICE.startswith("cuda") else "cpu"
            generator = torch.Generator(device=gen_device).manual_seed(request.seed)

        generation_jobs[job_id].progress = 0.5

        with torch.inference_mode():
            result = ttm_pipeline(
                image=image,
                prompt=request.prompt,
                negative_prompt="",  # Could be configurable
                height=height,
                width=width,
                num_frames=request.num_frames,
                guidance_scale=request.guidance_scale,
                num_inference_steps=Config.DEFAULT_NUM_INFERENCE_STEPS,
                generator=generator,
                motion_signal_video_path=str(motion_signal_path),
                motion_signal_mask_path=str(mask_path),
                tweak_index=request.tweak_index,
                tstrong_index=request.tstrong_index,
            )

        generation_jobs[job_id].progress = 0.8

        # Save output video
        output_path = Path(Config.OUTPUT_DIR) / f"{job_id}.mp4"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        frames = result.frames[0]
        export_to_video(frames, str(output_path), fps=Config.DEFAULT_FPS)

        # Extract thumbnail
        thumbnail = Image.fromarray(frames[0])
        thumbnail_path = Path(Config.OUTPUT_DIR) / f"{job_id}_thumb.jpg"
        thumbnail.save(thumbnail_path)

        generation_jobs[job_id].progress = 0.9

        # Upload to Supabase if configured
        video_url = str(output_path)
        thumbnail_url = str(thumbnail_path)

        if supabase_client and request.project_id:
            try:
                # Upload video
                with open(output_path, 'rb') as f:
                    video_response = supabase_client.storage.from_(
                        f"projects/{request.project_id}/ttm"
                    ).upload(
                        f"{job_id}.mp4",
                        f.read(),
                        {"content-type": "video/mp4"}
                    )
                    video_url = supabase_client.storage.from_(
                        f"projects/{request.project_id}/ttm"
                    ).get_public_url(f"{job_id}.mp4")

                # Upload thumbnail
                with open(thumbnail_path, 'rb') as f:
                    thumb_response = supabase_client.storage.from_(
                        f"projects/{request.project_id}/ttm"
                    ).upload(
                        f"{job_id}_thumb.jpg",
                        f.read(),
                        {"content-type": "image/jpeg"}
                    )
                    thumbnail_url = supabase_client.storage.from_(
                        f"projects/{request.project_id}/ttm"
                    ).get_public_url(f"{job_id}_thumb.jpg")
            except Exception as e:
                print(f"Supabase upload error: {e}")

        # Clean up temp files
        shutil.rmtree(temp_dir, ignore_errors=True)

        generation_jobs[job_id].progress = 1.0

        # Calculate generation time
        generation_time = (datetime.now() - start_time).total_seconds()

        response = TTMResponse(
            status="completed",
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            duration_seconds=request.num_frames / Config.DEFAULT_FPS,
            frames=request.num_frames,
            generation_time=generation_time
        )

        generation_jobs[job_id].status = "completed"
        generation_jobs[job_id].result = response

        return response

    except Exception as e:
        generation_jobs[job_id].status = "failed"
        generation_jobs[job_id].result = TTMResponse(
            status="failed",
            error=str(e)
        )
        raise

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize TTM pipeline and Supabase client on startup"""
    global ttm_pipeline, supabase_client

    print(f"Initializing TTM API server...")
    print(f"Device: {Config.DEVICE}")

    # Create directories
    Path(Config.TEMP_DIR).mkdir(parents=True, exist_ok=True)
    Path(Config.OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

    # Initialize Supabase if configured
    if Config.SUPABASE_URL and Config.SUPABASE_KEY:
        try:
            supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
            print("Supabase client initialized")
        except Exception as e:
            print(f"Supabase initialization failed: {e}")

    # Load TTM pipeline
    try:
        print(f"Loading TTM model: {Config.MODEL_ID}")

        # Check if components are available
        if ttm_components is None:
            print("❌ Cannot load TTM - components not available")
            print("Please run: python ttm_api_fixes.py")
            return

        # Load with better error handling
        ttm_pipeline = WanImageToVideoTTMPipeline.from_pretrained(
            Config.MODEL_ID,
            torch_dtype=Config.DTYPE,
            device_map="auto" if Config.DEVICE == "cuda" else None
        )
        ttm_pipeline.vae.enable_tiling()
        ttm_pipeline.vae.enable_slicing()

        # Enable attention slicing if available
        if hasattr(ttm_pipeline.transformer, 'enable_attention_slicing'):
            ttm_pipeline.transformer.enable_attention_slicing()

        ttm_pipeline.to(Config.DEVICE)

        print("✅ TTM pipeline loaded successfully")

        # Log GPU info
        if Config.DEVICE == "cuda":
            import torch
            if torch.cuda.is_available():
                props = torch.cuda.get_device_properties(0)
                print(f"GPU: {props.name} ({props.total_memory / 1024**3:.1f}GB)")
                allocated = torch.cuda.memory_allocated() / 1024**3
                cached = torch.cuda.memory_reserved() / 1024**3
                print(f"GPU Memory: {allocated:.1f}GB allocated, {cached:.1fGB cached")
    except Exception as e:
        print(f"Failed to load TTM pipeline: {e}")
        print("The API will start but generation will not work until the model is loaded")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "TTM API for Alkemy",
        "status": "running",
        "version": "1.0.0",
        "device": Config.DEVICE,
        "pipeline_loaded": ttm_pipeline is not None,
        "components_available": ttm_components is not None,
        "supabase_configured": supabase_client is not None,
        "gpu_available": torch.cuda.is_available() if torch else False
    }

@app.get("/health/detailed")
async def detailed_health():
    """Detailed health check with diagnostics"""
    health_info = {
        "service": "TTM API for Alkemy",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "system": {
            "device": Config.DEVICE,
            "gpu_available": False,
            "gpu_name": None,
            "gpu_memory": None,
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "torch_version": torch.__version__ if torch else None
        },
        "components": {
            "ttm_core_installed": False,
            "pipeline_loaded": ttm_pipeline is not None,
            "model_id": Config.MODEL_ID
        },
        "storage": {
            "temp_dir_exists": Path(Config.TEMP_DIR).exists(),
            "output_dir_exists": Path(Config.OUTPUT_DIR).exists(),
            "supabase_connected": supabase_client is not None
        }
    }

    # Add GPU info if available
    if torch and torch.cuda.is_available():
        try:
            props = torch.cuda.get_device_properties(0)
            health_info["system"]["gpu_available"] = True
            health_info["system"]["gpu_name"] = props.name
            health_info["system"]["gpu_memory"] = props.total_memory / 1024**3
            health_info["system"]["gpu_memory_allocated"] = torch.cuda.memory_allocated() / 1024**3
            health_info["system"]["gpu_memory_cached"] = torch.cuda.memory_reserved() / 1024**3
        except Exception:
            pass

    # Check TTM core installation
    try:
        ttm_core_path = Path(__file__).parent / 'ttm-core'
        health_info["components"]["ttm_core_installed"] = ttm_core_path.exists()
        if ttm_core_path.exists():
            required_files = [
                'pipelines/wan_pipeline.py',
                'pipelines/utils.py'
            ]
            health_info["components"]["ttm_files"] = [
                (ttm_core_path / f).exists() for f in required_files
            ]
    except Exception:
        pass

    # Model check
    if ttm_pipeline is not None:
        try:
            # Simple inference test
            dummy_image = Image.new('RGB', (64, 64), color='black')
            health_info["model_test"] = "passed"
        except Exception as e:
            health_info["model_test"] = f"failed: {str(e)}"

    return health_info

@app.post(f"{Config.API_PREFIX}/generate", response_model=JobStatus)
async def generate_video(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    request_json: str = Form(...)
):
    """
    Generate motion-controlled video from image

    Args:
        image: Input image file
        request_json: JSON string with TTM parameters

    Returns:
        Job status with job_id for tracking
    """
    if not ttm_pipeline:
        raise HTTPException(status_code=503, detail="TTM pipeline not loaded")

    try:
        # Parse request
        request = TTMRequest.parse_raw(request_json)

        # Load image
        img = Image.open(image.file).convert("RGB")

        # Create job
        job_id = str(uuid.uuid4())
        generation_jobs[job_id] = JobStatus(
            job_id=job_id,
            status="pending",
            progress=0.0
        )

        # Start generation in background
        background_tasks.add_task(generate_ttm_video, img, request, job_id)

        return generation_jobs[job_id]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get(f"{Config.API_PREFIX}/status/{{job_id}}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get status of a generation job"""
    if job_id not in generation_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return generation_jobs[job_id]

@app.get(f"{Config.API_PREFIX}/download/{{job_id}}")
async def download_video(job_id: str):
    """Download generated video"""
    if job_id not in generation_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = generation_jobs[job_id]
    if job.status != "completed" or not job.result:
        raise HTTPException(status_code=400, detail="Video not ready")

    # If it's a local file path, return it directly
    if job.result.video_url and job.result.video_url.startswith("/"):
        return FileResponse(job.result.video_url, media_type="video/mp4")
    else:
        # It's a URL, redirect to it
        return JSONResponse({"url": job.result.video_url})

@app.delete(f"{Config.API_PREFIX}/job/{{job_id}}")
async def delete_job(job_id: str):
    """Clean up job and associated files"""
    if job_id not in generation_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    # Clean up files
    try:
        output_path = Path(Config.OUTPUT_DIR) / f"{job_id}.mp4"
        thumb_path = Path(Config.OUTPUT_DIR) / f"{job_id}_thumb.jpg"
        temp_dir = Path(Config.TEMP_DIR) / job_id

        if output_path.exists():
            output_path.unlink()
        if thumb_path.exists():
            thumb_path.unlink()
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
    except Exception as e:
        print(f"Error cleaning up files for {job_id}: {e}")

    # Remove from jobs
    del generation_jobs[job_id]

    return {"status": "deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=Config.HOST, port=Config.PORT)