from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Scored:
    reference_id: str
    score: float


def top_k_mean(
    query: np.ndarray,
    reference_ids: list[str],
    reference_matrix: np.ndarray,
    top_k: int,
) -> tuple[float, int, list[Scored]]:
    """Cosine similarity vs every reference, then mean of the K best.

    Returns (score, effective_k, all scores sorted best-first).
    Not the max, not the mean over everything -- see PRD 5.3.
    """
    if reference_matrix.shape[0] == 0:
        raise ValueError("no references")

    q = query.astype(np.float32)
    q = q / (np.linalg.norm(q) or 1.0)
    norms = np.linalg.norm(reference_matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    scores = (reference_matrix / norms) @ q
    scores = np.clip(scores, -1.0, 1.0)

    order = np.argsort(-scores, kind="stable")
    k = max(1, min(top_k, len(order)))
    ranked = [Scored(reference_ids[i], float(scores[i])) for i in order]
    mean = float(np.mean([s.score for s in ranked[:k]]))
    return mean, k, ranked
