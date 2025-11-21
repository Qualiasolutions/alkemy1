"""
Modal deployment for TTM API
Deploy TTM as a serverless GPU function on Modal
"""

import os
import json
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

import modal

# Define Modal image with GPU support
image = modal.Image.debian_slim().run_commands(
    # Install system dependencies
    "apt-get update && apt-get install -y git curl libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1",
    # Install Python dependencies
    "pip install torch torchvision diffusers transformers accelerate opencv-python numpy imageio imageio-ffmpeg Pillow fastapi uvicorn python-multipart aiofiles pydantic supabase"
).pip_install(
    "torch>=2.0.0",
    "diffusers>=0.21.0",
    "transformers>=4.30.0",
    "accelerate>=0.20.0"
)

# Define Modal app
app = modal.App("ttm-api-alkemy")

# Mount the TTM repository
ttm_repo = modal.GitRepo.from_url(
    "https://github.com/time-to-move/TTM.git",
    mount_path="/root/ttm-core"
)

# GPU-enabled stub for the model
@app.function(
    image=image,
    gpu=modal.gpu.A100(size="40GB"),
    timeout=600,  # 10 minutes timeout
    mounts=[ttm_repo],
    volumes={"/tmp/ttm_cache": modal.Volume.from_name("ttm-cache")},
    container_idle_timeout=300  # Keep warm for 5 minutes
)
class TTMPipeline:
    def __init__(self):
        """Initialize TTM pipeline on first use"""
        import sys
        import torch
        from diffusers import WanImageToVideoTTMPipeline
        
        # Add TTM to path
        sys.path.append("/root/ttm-core")
        
        # Model configuration
        self.MODEL_ID = "Wan-AI/Wan2.2-I2V-A14B-Diffusers"
        self.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        self.DTYPE = torch.bfloat16
        
        print(f"Loading TTM model: {self.MODEL_ID}")
        
        # Load pipeline
        self.pipeline = WanImageToVideoTTMPipeline.from_pretrained(
            self.MODEL_ID,
            torch_dtype=self.DTYPE
        )
        self.pipeline.vae.enable_tiling()
        self.pipeline.vae.enable_slicing()
        self.pipeline.to(self.DEVICE)
        
        print("TTM pipeline loaded successfully")
    
    @modal.method
    def generate_video(
        self,
        image_data: bytes,
        motion_type: str,
        prompt: str,
        trajectory: Optional[List[Dict[str, float]]] = None,
        camera_movement: Optional[Dict[str, Any]] = None,
        num_frames: int = 81,
        guidance_scale: float = 3.5,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate video using TTM pipeline"""
        import torch
        from PIL import Image
        import numpy as np
        import cv2
        from datetime import datetime
        import tempfile
        import imageio
        from diffusers.utils import export_to_video
        from pipelines.utils import compute_hw_from_area
        
        start_time = datetime.now()
        
        # Load image
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Create motion signals (simplified version)
        if motion_type == "object" and trajectory:
            motion_signal, mask = self._create_object_motion_signal(image, trajectory, num_frames)
        elif motion_type == "camera" and camera_movement:
            motion_signal, mask = self._create_camera_motion_signal(image, camera_movement, num_frames)
        else:
            raise ValueError("Invalid motion specification")
        
        # Prepare image
        mod_value = self.pipeline.vae_scale_factor_spatial * self.pipeline.transformer.config.patch_size[1]
        height, width = compute_hw_from_area(
            image.height, image.width, 480 * 832, mod_value
        )
        image = image.resize((width, height))
        
        # Generate with TTM
        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.DEVICE).manual_seed(seed)
        
        with torch.inference_mode():
            result = self.pipeline(
                image=image,
                prompt=prompt,
                negative_prompt="",
                height=height,
                width=width,
                num_frames=num_frames,
                guidance_scale=guidance_scale,
                num_inference_steps=50,
                generator=generator,
                motion_signal_video_path=motion_signal_path,
                motion_signal_mask_path=mask_path,
                tweak_index=3 if motion_type == "object" else 2,
                tstrong_index=7 if motion_type == "object" else 5,
            )
        
        # Save output video
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            frames = result.frames[0]
            export_to_video(frames, f.name, fps=16)
            video_path = f.name
        
        # Create thumbnail
        thumbnail = Image.fromarray(frames[0])
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            thumbnail.save(f.name)
            thumbnail_path = f.name
        
        # Calculate metrics
        generation_time = (datetime.now() - start_time).total_seconds()
        
        # Read video data
        with open(video_path, "rb") as f:
            video_data = f.read()
        
        with open(thumbnail_path, "rb") as f:
            thumbnail_data = f.read()
        
        # Clean up
        import os
        os.unlink(video_path)
        os.unlink(thumbnail_path)
        os.unlink(motion_signal_path)
        os.unlink(mask_path)
        
        return {
            "video_data": video_data,
            "thumbnail_data": thumbnail_data,
            "duration_seconds": num_frames / 16,
            "frames": num_frames,
            "generation_time": generation_time,
            "status": "completed"
        }
    
    def _create_object_motion_signal(self, image, trajectory, num_frames):
        """Create motion signal for object motion"""
        # Simplified implementation - would use full TTM logic
        h, w = image.height, image.width
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            motion_signal_path = f.name
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            mask_path = f.name
        
        # Create simple motion signal (placeholder)
        motion_signal = []
        mask = []
        
        for i in range(num_frames):
            frame = np.array(image)
            frame_mask = np.zeros((h, w), dtype=np.uint8)
            
            # Simple circle motion based on trajectory
            if i < len(trajectory):
                cx, cy = int(trajectory[i]["x"] * w), int(trajectory[i]["y"] * h)
                cv2.circle(frame, (cx, cy), 50, (255, 0, 0), -1)
                cv2.circle(frame_mask, (cx, cy), 50, 255, -1)
            
            motion_signal.append(frame)
            mask.append(frame_mask)
        
        # Save motion signals
        imageio.mimwrite(motion_signal_path, np.array(motion_signal), fps=16)
        imageio.mimwrite(mask_path, np.array(mask), fps=16)
        
        return motion_signal_path, mask_path
    
    def _create_camera_motion_signal(self, image, camera_movement, num_frames):
        """Create motion signal for camera motion"""
        # Similar implementation for camera motion
        h, w = image.height, image.width
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            motion_signal_path = f.name
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            mask_path = f.name
        
        motion_signal = []
        full_mask = np.ones((h, w), dtype=np.uint8) * 255
        
        for i in range(num_frames):
            frame = np.array(image)
            t = i / (num_frames - 1)
            
            # Apply camera transformation
            if camera_movement.get("type") == "zoom":
                scale = 1 + t * camera_movement.get("amount", 0.5)
                M = cv2.getRotationMatrix2D((w/2, h/2), 0, scale)
                frame = cv2.warpAffine(frame, M, (w, h))
            
            motion_signal.append(frame)
        
        # Save signals
        imageio.mimwrite(motion_signal_path, np.array(motion_signal), fps=16)
        imageio.mimwrite(mask_path, np.array([full_mask] * num_frames), fps=16)
        
        return motion_signal_path, mask_path

# FastAPI wrapper for Modal
@app.function(image=image, keep_warm=1)
@modal.web_endpoint(method="POST")
def generate(request_data: Dict[str, Any]):
    """Web endpoint for video generation"""
    try:
        # Parse request
        image_data = request_data.get("image")
        motion_type = request_data.get("motion_type")
        prompt = request_data.get("prompt")
        
        # Call pipeline
        pipeline = TTMPipeline()
        result = pipeline.generate_video(
            image_data=image_data,
            motion_type=motion_type,
            prompt=prompt,
            trajectory=request_data.get("trajectory"),
            camera_movement=request_data.get("camera_movement"),
            num_frames=request_data.get("num_frames", 81),
            guidance_scale=request_data.get("guidance_scale", 3.5),
            seed=request_data.get("seed")
        )
        
        return result
        
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }

# Health check endpoint
@app.function(image=image)
@modal.web_endpoint(method="GET")
def health():
    """Health check endpoint"""
    return {
        "service": "TTM API on Modal",
        "status": "running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    # For local testing
    import subprocess
    subprocess.run(["modal", "serve", "main.py"])
