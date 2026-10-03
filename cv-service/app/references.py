import logging
from dataclasses import dataclass

import numpy as np
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from .config import get_settings
from .errors import CvError

logger = logging.getLogger("cv.references")


@dataclass(frozen=True)
class StoredReference:
    id: str
    vector: np.ndarray
    model: tuple[str, str] | None  # (name, version); None when unknown (request-supplied)


_client: MongoClient | None = None


def _collection():
    global _client
    s = get_settings()
    if _client is None:
        # server selection timeout kept well under the caller's 8s per-attempt budget
        _client = MongoClient(s.mongodb_uri, serverSelectionTimeoutMS=3000, tz_aware=True)
    return _client[s.mongodb_db][s.mongodb_references_collection]


def load_artifact_references(artifact_id: str) -> list[StoredReference]:
    """Single-key lookup by artifactId; dimension-0 (not-yet-embedded) rows are skipped."""
    try:
        docs = _collection().find(
            {"artifactId": ObjectId(artifact_id), "embeddingDimension": {"$gt": 0}},
            {"embedding": 1, "embeddingDimension": 1, "cvModel": 1},
        )
        refs: list[StoredReference] = []
        for doc in docs:
            dim = int(doc.get("embeddingDimension") or 0)
            emb = doc.get("embedding") or []
            if dim <= 0 or len(emb) != dim:
                logger.warning("skipping reference %s: embedding length != embeddingDimension", doc["_id"])
                continue
            vec = np.asarray(emb, dtype=np.float32)
            if not np.all(np.isfinite(vec)):
                logger.warning("skipping reference %s: non-finite values", doc["_id"])
                continue
            m = doc.get("cvModel") or {}
            model = (m["name"], m["version"]) if m.get("name") and m.get("version") else None
            refs.append(StoredReference(id=str(doc["_id"]), vector=vec, model=model))
        return refs
    except PyMongoError as exc:
        logger.exception("reference lookup failed")
        raise CvError("INTERNAL_ERROR", 500, "Reference lookup failed") from exc
