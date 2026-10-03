import logging
import threading

import numpy as np
from PIL import Image

from .config import get_settings
from .errors import CvError
from .schemas import ModelStamp

logger = logging.getLogger("cv.embedding")


class Embedder:
    """One CLIP model. Heavy imports are lazy so tests don't need torch."""

    def __init__(self, hf_id: str, version: str):
        self.stamp = ModelStamp(name=hf_id, version=version)
        self.dimension = 0
        self._model = None
        self._processor = None
        self._torch = None
        self._device = "cpu"

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def load(self) -> None:
        import torch
        from transformers import CLIPModel, CLIPProcessor

        logger.info("Loading %s ...", self.stamp.name)
        self._torch = torch
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        processor = CLIPProcessor.from_pretrained(self.stamp.name)
        model = CLIPModel.from_pretrained(self.stamp.name).to(self._device).eval()
        self._processor = processor
        try:
            self._model = model
            # readiness probe: a partially working model must never serve /compare
            probe = self.embed(Image.new("RGB", (224, 224), (128, 128, 128)))
            self.dimension = int(probe.size)
        except Exception:
            self._model = None
            raise
        logger.info("Loaded %s on %s (dim=%d)", self.stamp.name, self._device, self.dimension)

    def embed(self, image: Image.Image) -> np.ndarray:
        """Returns an L2-normalised float32 vector."""
        inputs = self._processor(images=image, return_tensors="pt").to(self._device)
        with self._torch.inference_mode():
            out = self._model.get_image_features(**inputs)
        # older transformers return the projected Tensor, newer ones may wrap it
        tensor = getattr(out, "pooler_output", out)
        if not isinstance(tensor, self._torch.Tensor):
            raise TypeError(f"unexpected CLIP output type: {type(out).__name__}")
        vec = tensor.detach().cpu().float().numpy()[0]
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
        with self._sem:  # cap concurrent forward passes; avoids thread/GPU oversubscription
            return embedder.embed(image)


_registry: ModelRegistry | None = None


def get_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry
