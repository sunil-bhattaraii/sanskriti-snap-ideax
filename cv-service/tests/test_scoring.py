import numpy as np
import pytest

from app.scoring import top_k_mean


def _refs():
    ids = ["a", "b", "c", "d"]
    m = np.array([[1, 0, 0], [0, 1, 0], [0.8, 0.6, 0], [-1, 0, 0]], dtype=np.float32)
    return ids, m


def test_top_k_mean_not_max_not_all():
    ids, m = _refs()
    score, k, ranked = top_k_mean(np.array([1, 0, 0], np.float32), ids, m, 2)
    assert k == 2
    assert score == pytest.approx((1.0 + 0.8) / 2)
    assert [r.reference_id for r in ranked[:2]] == ["a", "c"]


def test_k_larger_than_set_uses_all():
    ids, m = _refs()
    _, k, _ = top_k_mean(np.array([1, 0, 0], np.float32), ids, m, 10)
    assert k == 4


def test_identical_is_one_and_opposite_is_minus_one():
    ids, m = _refs()
    _, _, ranked = top_k_mean(np.array([1, 0, 0], np.float32), ids, m, 1)
    assert ranked[0].score == pytest.approx(1.0)
    assert ranked[-1].score == pytest.approx(-1.0)


def test_unnormalised_inputs_are_handled():
    ids, m = _refs()
    score, _, _ = top_k_mean(np.array([5, 0, 0], np.float32), ids, m * 3, 1)
    assert score == pytest.approx(1.0)
