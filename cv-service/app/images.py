import io
import logging
from urllib.parse import urlparse

import httpx
from PIL import Image, ImageOps

from .config import get_settings
from .errors import CvError

logger = logging.getLogger("cv.images")


def resolve_image_url(image: str) -> str:
    """Accept an http(s) URL or a Cloudinary public id."""
    s = get_settings()
    if image.lower().startswith(("http://", "https://")):
        return image
    if not s.cloudinary_cloud_name:
        raise CvError("INVALID_IMAGE", 400, "Image is not a URL and CLOUDINARY_CLOUD_NAME is not configured")
    return f"https://res.cloudinary.com/{s.cloudinary_cloud_name}/image/upload/{image.lstrip('/')}"


def _check_url(url: str) -> None:
    s = get_settings()
    parsed = urlparse(url)
    allowed_schemes = {"https", "http"} if s.cv_allow_http_images else {"https"}
    if parsed.scheme not in allowed_schemes or not parsed.hostname:
        raise CvError("INVALID_IMAGE", 400, "Image URL scheme is not allowed")
    hosts = s.allowed_hosts
    if "*" not in hosts and parsed.hostname.lower() not in hosts:
        raise CvError("INVALID_IMAGE", 400, "Image host is not allowed")


def fetch_image(image: str) -> Image.Image:
    """Download (size-capped, no redirects) and decode to an upright RGB image."""
    s = get_settings()
    url = resolve_image_url(image)
    _check_url(url)

    buf = bytearray()
    try:
        with httpx.Client(timeout=s.cv_image_fetch_timeout_s, follow_redirects=False) as client:
            with client.stream("GET", url) as resp:
                if resp.status_code != 200:
                    raise CvError("INVALID_IMAGE", 400, f"Image fetch returned HTTP {resp.status_code}")
                for chunk in resp.iter_bytes():
                    buf.extend(chunk)
                    if len(buf) > s.cv_image_max_bytes:
                        raise CvError("INVALID_IMAGE", 400, "Image exceeds the size limit")
    except httpx.HTTPError as exc:
        logger.warning("image fetch failed: %s", type(exc).__name__)
        raise CvError("INVALID_IMAGE", 400, "Image URL is unreachable") from exc

    return decode_image(bytes(buf))


def decode_image(data: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
        img = ImageOps.exif_transpose(img)  # phone photos are often rotated via EXIF
        return img.convert("RGB")
    except (OSError, ValueError, Image.DecompressionBombError) as exc:
        raise CvError("INVALID_IMAGE", 400, "Image could not be decoded") from exc
