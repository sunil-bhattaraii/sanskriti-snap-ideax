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
        logger.info(
            "mongodb client configured database=%s collection=%s",
            s.mongodb_db,
            s.mongodb_references_collection,
        )
    return _client[s.mongodb_db][s.mongodb_references_collection]


def load_artifact_references(artifact_id: str) -> list[StoredReference]:
    """Load usable vectors while reporting pending or malformed references."""
    try:
        collection = _collection()
        query = {"artifactId": ObjectId(artifact_id)}
        logger.info(
            "reference lookup started database=%s collection=%s artifact=%s",
            collection.database.name,
            collection.name,
            artifact_id,
        )
        docs = collection.find(
            query,
            {"embedding": 1, "embeddingDimension": 1, "cvModel": 1},
        )
        refs: list[StoredReference] = []
        total = 0
        skipped = 0
        for doc in docs:
            total += 1
            dim = int(doc.get("embeddingDimension") or 0)
            emb = doc.get("embedding") or []
            if dim <= 0 or len(emb) != dim:
                skipped += 1
                logger.warning(
                    "reference failed id=%s reason=embedding_missing_or_wrong_length dimension=%d values=%d",
                    doc["_id"],
                    dim,
                    len(emb),
                )
                continue
            vec = np.asarray(emb, dtype=np.float32)
            if not np.all(np.isfinite(vec)):
                skipped += 1
                logger.warning("reference failed id=%s reason=non_finite_values", doc["_id"])
                continue
            m = doc.get("cvModel") or {}
            model = (m["name"], m["version"]) if m.get("name") and m.get("version") else None
            refs.append(StoredReference(id=str(doc["_id"]), vector=vec, model=model))
        logger.info(
            "reference results artifact=%s total=%d passed=%d failed=%d",
            artifact_id,
            total,
            len(refs),
            skipped,
        )
        return refs
    except PyMongoError as exc:
        logger.exception("reference lookup failed")
        raise CvError("INTERNAL_ERROR", 500, "Reference lookup failed") from exc
