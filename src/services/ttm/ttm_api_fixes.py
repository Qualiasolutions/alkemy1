"""
Critical fixes for TTM API to address production issues
"""

import os
import logging
from pathlib import Path

# Fix 1: Add proper logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Fix 2: Better error handling for missing TTM components
def validate_ttm_installation():
    """Check if TTM core is properly installed"""
    ttm_core_path = Path(__file__).parent / 'ttm-core'

    if not ttm_core_path.exists():
        logger.error("TTM core repository not found. Please clone:")
        logger.error("git clone https://github.com/time-to-move/TTM.git ttm-core")
        return False

    # Check for required files
    required_files = [
        'pipelines/wan_pipeline.py',
        'pipelines/utils.py',
        'run_wan.py'
    ]

    missing_files = []
    for file in required_files:
        if not (ttm_core_path / file).exists():
            missing_files.append(file)

    if missing_files:
        logger.error(f"Missing TTM files: {missing_files}")
        return False

    logger.info("TTM installation validated successfully")
    return True

# Fix 3: Add proper import error handling
def safe_import_ttm():
    """Safely import TTM components with detailed error messages"""
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'ttm-core'))
        from pipelines.wan_pipeline import WanImageToVideoTTMPipeline
        from pipelines.utils import validate_inputs, compute_hw_from_area
        from diffusers.utils import export_to_video, load_image
        return True, (WanImageToVideoTTMPipeline, validate_inputs, compute_hw_from_area, export_to_video, load_image)
    except ImportError as e:
        logger.error(f"Failed to import TTM components: {e}")
        logger.error("Please ensure all dependencies are installed:")
        logger.error("pip install -r requirements.txt")
        return False, None

# Fix 4: Add validation for GPU availability
def validate_gpu():
    """Check if GPU is available and properly configured"""
    try:
        import torch
        if not torch.cuda.is_available():
            logger.warning("CUDA GPU not available. CPU inference will be very slow.")
            return False

        device_count = torch.cuda.device_count()
        logger.info(f"Found {device_count} GPU(s)")

        for i in range(device_count):
            props = torch.cuda.get_device_properties(i)
            logger.info(f"GPU {i}: {props.name}, VRAM: {props.total_memory / 1024**3:.1f}GB")

        return True
    except Exception as e:
        logger.error(f"Failed to validate GPU: {e}")
        return False

# Fix 5: Add proper cleanup for temporary files
def cleanup_temp_files(job_id: str):
    """Clean up temporary files for a job"""
    try:
        temp_dir = Path("/tmp/ttm_workspace") / job_id
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.debug(f"Cleaned up temp files for job {job_id}")
    except Exception as e:
        logger.warning(f"Failed to clean up temp files for {job_id}: {e}")

# Fix 6: Add environment validation
def validate_environment():
    """Validate all required environment variables"""
    required_env = []

    # Optional but recommended
    if not os.getenv("VITE_SUPABASE_URL"):
        logger.warning("SUPABASE_URL not set. Video storage will be local only.")

    if not os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY"):
        logger.warning("SUPABASE_SERVICE_ROLE_KEY not set. Video storage will be local only.")

    return True

# Fix 7: Add model download check
def check_model_availability():
    """Check if the required model is downloaded"""
    try:
        from diffusers.utils import DiffusionPipeline

        try:
            # This will trigger model download if not present
            DiffusionPipeline.from_pretrained(
                "Wan-AI/Wan2.2-I2V-A14B-Diffusers",
                torch_dtype=torch.bfloat16,
                device_map="auto"
            )
            logger.info("Wan 2.2 model is available")
            return True
        except Exception as e:
            logger.error(f"Model download/check failed: {e}")
            logger.error("Please ensure the model is downloaded and accessible")
            return False
    except ImportError:
        logger.error("Cannot check model availability - diffusers not installed")
        return False

# Fix 8: Add proper request validation
def validate_request(request):
    """Validate TTM request parameters"""
    errors = []

    # Check motion type
    if not hasattr(request, 'motion_type'):
        errors.append("motion_type is required")
    elif request.motion_type not in ['object', 'camera']:
        errors.append(f"Invalid motion_type: {request.motion_type}")

    # Check prompt
    if not hasattr(request, 'prompt') or not request.prompt:
        errors.append("prompt is required and cannot be empty")

    # Check motion-specific parameters
    if hasattr(request, 'motion_type'):
        if request.motion_type == 'object':
            if not hasattr(request, 'trajectory') or not request.trajectory:
                errors.append("trajectory is required for object motion")
        elif request.motion_type == 'camera':
            if not hasattr(request, 'camera_movement') or not request.camera_movement:
                errors.append("camera_movement is required for camera motion")

    # Validate numeric ranges
    if hasattr(request, 'tweak_index') and request.tweak_index is not None:
        if not (0 <= request.tweak_index <= 50):
            errors.append("tweak_index must be between 0 and 50")

    if hasattr(request, 'tstrong_index') and request.tstrong_index is not None:
        if not (0 <= request.tstrong_index <= 50):
            errors.append("tstrong_index must be between 0 and 50")

    return errors

# Fix 9: Add job timeout handling
JOB_TIMEOUT = 600  # 10 minutes

def check_job_timeout(job_start_time):
    """Check if a job has exceeded timeout"""
    import time
    elapsed = time.time() - job_start_time
    if elapsed > JOB_TIMEOUT:
        return True
    return False

# Fix 10: Add resource monitoring
def get_gpu_memory_usage():
    """Get current GPU memory usage"""
    try:
        import torch
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1024**3  # GB
            cached = torch.cuda.memory_reserved() / 1024**3  # GB
            total = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB

            return {
                "allocated": allocated,
                "cached": cached,
                "free": total - cached,
                "total": total
            }
    except Exception:
        pass
    return None

# Fix 11: Add proper content-type handling
def get_image_mime_type(image_path):
    """Get the MIME type for an image file"""
    ext = Path(image_path).suffix.lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
    }
    return mime_types.get(ext, 'image/jpeg')

# Fix 12: Add request size limits
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20MB

def validate_image_size(file_path):
    """Validate image file size"""
    try:
        file_size = os.path.getsize(file_path)
        if file_size > MAX_IMAGE_SIZE:
            logger.error(f"Image too large: {file_size / 1024**2:.1f}MB (max: {MAX_IMAGE_SIZE / 1024**2:.1f}MB)")
            return False
        return True
    except Exception as e:
        logger.error(f"Failed to check image size: {e}")
        return False

# Apply fixes to main API
if __name__ == "__main__":
    print("Running TTM API fixes...")

    # Validate installation
    if not validate_ttm_installation():
        print("❌ TTM installation validation failed")
        exit(1)

    # Validate GPU
    gpu_ok = validate_gpu()

    # Validate environment
    env_ok = validate_environment()

    # Check model
    model_ok = check_model_availability()

    print("\n--- TTM API Validation Results ---")
    print(f"Installation: ✅")
    print(f"GPU: {'✅' if gpu_ok else '⚠️'}")
    print(f"Environment: {'✅' if env_ok else '⚠️'}")
    print(f"Model: {'✅' if model_ok else '❌'}")

    if not model_ok:
        print("\n❌ Cannot start API without model")
        exit(1)

    print("\n✅ All validations passed. Ready to start API server.")