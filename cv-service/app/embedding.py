import logging
import os
import threading
from pathlib import Path

import numpy as np
from PIL import Image

from .config import get_settings
from .errors import CvError
from .schemas import ModelStamp

logger = logging.getLogger("cv.embedding")

SERVICE_ROOT = Path(__file__).resolve().parent.parent

# CLIPImageProcessor defaults (kept in sync manually: runtime has no transformers dep)
_INPUT = 224
_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)


def _preprocess(image: Image.Image) -> np.ndarray:
    """Bicubic resize (shortest edge 224) -> centre crop -> rescale -> normalise -> NCHW."""
    image = image.convert("RGB")
    w, h = image.size
    scale = _INPUT / min(w, h)
    # HF truncates (int), rounding differently would shift the centre crop by a pixel
    image = image.resize((int(w * scale), int(h * scale)), Image.BICUBIC)
    left = (image.width - _INPUT) // 2
    top = (image.height - _INPUT) // 2
    image = image.crop((left, top, left + _INPUT, top + _INPUT))
    arr = np.asarray(image, dtype=np.float32) / 255.0
    arr = (arr - _MEAN) / _STD
    return arr.transpose(2, 0, 1)[None]  # NCHW


class Embedder:
    """One CLIP model served from a build-time exported int8 ONNX file (see scripts/export_onnx.py)."""

    def __init__(self, hf_id: str, version: str):
        self.stamp = ModelStamp(name=hf_id, version=version)
        self.dimension = 0
        self._session = None
        self._onnx_path = self._resolve_path(hf_id)

    @staticmethod
    def _resolve_path(hf_id: str) -> Path:
        override = os.environ.get("CV_ONNX_PATH")
        if override:
            return Path(override)
        return SERVICE_ROOT / "model" / f"{hf_id.replace('/', '__')}_int8.onnx"

    @property
    def loaded(self) -> bool:
        return self._session is not None

    def load(self) -> None:
        import onnxruntime as ort

        if not self._onnx_path.is_file():
            raise RuntimeError(
                f"ONNX model not found at {self._onnx_path}. "
                "Run `python scripts/export_onnx.py` first (see README)."
            )
        logger.info("Loading %s from %s ...", self.stamp.name, self._onnx_path.name)
        session = ort.InferenceSession(self._onnx_path.as_posix(), providers=["CPUExecutionProvider"])
        self._session = session
        try:
            # readiness probe: a partially working model must never serve /compare
            probe = self.embed(Image.new("RGB", (224, 224), (128, 128, 128)))
            self.dimension = int(probe.size)
        except Exception:
            self._session = None
            raise
        logger.info("Loaded %s on onnxruntime (dim=%d)", self.stamp.name, self.dimension)

    def embed(self, image: Image.Image) -> np.ndarray:
        """Returns an L2-normalised float32 vector."""
        if self._session is None:
            raise RuntimeError("embedder is not loaded")
        (raw,) = self._session.run(None, {"pixel_values": _preprocess(image)})
        vec = np.asarray(raw, dtype=np.float32).reshape(-1)
        norm = float(np.linalg.norm(vec))
        if norm == 0 or not np.isfinite(norm):
            raise ValueError("embedding has zero or non-finite norm")
        return (vec / norm).astype(np.float32)


class ModelRegistry:
    def __init__(self) -> None:
        s = get_settings()
        self._default = s.cv_service_model
        names = {self._default, *s.extra_models}
        self._embedders = {n: Embedder(n, s.cv_model_version) for n in names}
        self._lock = threading.Lock()
        self._sem = threading.BoundedSemaphore(s.cv_max_concurrent_inferences)

    def preload(self) -> None:
        self._embedders[self._default].load()

    @property
    def ready(self) -> bool:
        return self._embedders[self._default].loaded

    def resolve(self, stamp: ModelStamp | None = None) -> Embedder:
        if stamp is None:
            emb = self._embedders[self._default]
        else:
            emb = self._embedders.get(stamp.name)
            if emb is None or emb.stamp.version != stamp.version:
                raise CvError("UNSUPPORTED_MODEL", 400, "Model is not supported by this service")
        if not emb.loaded:
            with self._lock:
                if not emb.loaded:
                    emb.load()
        return emb

    def embed(self, embedder: Embedder, image: Image.Image) -> np.ndarray:
        with self._sem:  # cap concurrent forward passes; avoids thread oversubscription
            return embedder.embed(image)


_registry: ModelRegistry | None = None


def get_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry
