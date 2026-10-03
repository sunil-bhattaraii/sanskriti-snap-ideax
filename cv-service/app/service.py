import logging
import time

import numpy as np

from .config import get_settings
from .embedding import get_registry
from .errors import CvError
from .images import fetch_image
from .references import StoredReference, load_artifact_references
from .schemas import (
    CompareRequest,
    CompareResponse,
    EmbedRequest,
    EmbedResponse,
    PerReference,
)
from .scoring import top_k_mean

logger = logging.getLogger("cv.service")


def run_embed(req: EmbedRequest) -> EmbedResponse:
    registry = get_registry()
    embedder = registry.resolve(req.model)
    vec = registry.embed(embedder, fetch_image(req.image))
    return EmbedResponse(
        embedding=vec.tolist(),
        embeddingDimension=int(vec.size),
        model=embedder.stamp,
    )


def _references_from_request(req: CompareRequest) -> list[StoredReference]:
    out: list[StoredReference] = []
    for r in req.references or []:
        if r.embeddingDimension == 0 or not r.embedding:
            continue  # not-yet-embedded marker
        if len(r.embedding) != r.embeddingDimension:
            raise CvError(
                "INVALID_REQUEST", 400,
                f"reference {r.referenceId}: embedding length does not match embeddingDimension",
            )
        out.append(StoredReference(r.referenceId, np.asarray(r.embedding, dtype=np.float32), None))
    return out


def run_compare(req: CompareRequest) -> CompareResponse:
    t0 = time.perf_counter()
    registry = get_registry()
    embedder = registry.resolve(req.model)
    expected_model = (embedder.stamp.name, embedder.stamp.version)

    # 1. load references first: an empty set should cost no image fetch / GPU time
    from_db = req.artifactId is not None
    refs = load_artifact_references(req.artifactId) if from_db else _references_from_request(req)
    logger.info(
        "compare references source=%s artifact=%s loaded=%d",
        "mongodb" if from_db else "request",
        req.artifactId or "<inline>",
        len(refs),
    )
    if not refs:
        raise CvError("NO_REFERENCES", 404, "No loadable references for this artifact")

    # 2. model + dimension consistency -> typed errors, never a low score
    if from_db and any(r.model != expected_model for r in refs):
        logger.warning(
            "compare rejected artifact=%s reason=reference_model_mismatch expected=%s",
            req.artifactId,
            expected_model,
        )
        raise CvError(
            "UNSUPPORTED_MODEL", 400,
            "Reference set was not embedded with the model used for the submission",
        )
    dims = {r.vector.size for r in refs}
    if dims != {embedder.dimension}:
        logger.warning(
            "compare rejected artifact=%s reason=dimension_mismatch dimensions=%s expected=%d",
            req.artifactId or "<inline>",
            sorted(dims),
            embedder.dimension,
        )
        raise CvError("DIMENSION_MISMATCH", 400, "Reference dimension does not match the model dimension")

    # 3. embed the submission and score
    query = registry.embed(embedder, fetch_image(req.image))
    top_k = req.topK or get_settings().cv_default_top_k
    score, k, ranked = top_k_mean(
        query,
        [r.id for r in refs],
        np.stack([r.vector for r in refs]),
        top_k,
    )

    logger.info(
        "compare artifact=%s refs=%d k=%d score=%.4f ms=%.0f",
        req.artifactId or "<inline>", len(refs), k, score, (time.perf_counter() - t0) * 1000,
    )
    return CompareResponse(
        similarityScore=score,
        topK=k,
        matchedReferenceIds=[s.reference_id for s in ranked[:k]],
        referenceCount=len(refs),
        model=embedder.stamp,
        perReference=[PerReference(referenceId=s.reference_id, score=s.score) for s in ranked],
    )
