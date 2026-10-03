import os

os.environ.setdefault("CV_SERVICE_SECRET", "test-secret")

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import auth, service
from app.errors import CvError
from app.main import app
from app.references import StoredReference
from app.schemas import ModelStamp

AUTH = {"Authorization": "Bearer test-secret"}
ART = "a" * 24


class FakeEmbedder:
    stamp = ModelStamp(name="fake", version="1")
    dimension = 3

    def embed(self, image):
        return np.array([1, 0, 0], dtype=np.float32)


class FakeRegistry:
    def __init__(self):
        self.e = FakeEmbedder()

    def resolve(self, stamp=None):
        if stamp is not None and (stamp.name, stamp.version) != ("fake", "1"):
            raise CvError("UNSUPPORTED_MODEL", 400, "x")
        return self.e

    def embed(self, embedder, image):
        return embedder.embed(image)


@pytest.fixture(autouse=True)
def fakes(monkeypatch):
    monkeypatch.setattr(service, "get_registry", lambda: FakeRegistry())
    monkeypatch.setattr(service, "fetch_image", lambda _: Image.new("RGB", (8, 8)))


client = TestClient(app)  # lifespan not run -> no real model load


def ref(i, v, dim=None):
    return {"referenceId": i, "embedding": v, "embeddingDimension": len(v) if dim is None else dim}


def test_requires_auth():
    r = client.post("/embed", json={"image": "x"})
    assert r.status_code == 401 and r.json()["error"]["code"] == "UNAUTHORIZED"
    r = client.post("/compare", json={}, headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_test_environment_bypasses_auth(monkeypatch):
    class TestSettings:
        environment = "test"
        cv_service_secret = "test-secret"

    monkeypatch.setattr(auth, "get_settings", lambda: TestSettings())
    r = client.post("/embed", json={"image": "x"})
    assert r.status_code == 200


def test_error_envelope_matches_contract():
    """cv-contract.ts 155: errors nest under "error". Next.js does not parse
    this body today (any non-2xx is a technical failure), so nothing else would
    catch the shape drifting back to flat."""
    r = client.post("/compare", json={"image": "x"}, headers=AUTH)
    body = r.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message"}


def test_embed_round_trip():
    r = client.post("/embed", json={"image": "https://x/y.jpg"}, headers=AUTH)
    body = r.json()
    assert r.status_code == 200
    assert body["embeddingDimension"] == len(body["embedding"]) == 3
    assert body["model"] == {"name": "fake", "version": "1"}


def test_embed_unsupported_model():
    r = client.post("/embed", json={"image": "x", "model": {"name": "nope", "version": "1"}}, headers=AUTH)
    assert r.status_code == 400 and r.json()["error"]["code"] == "UNSUPPORTED_MODEL"


def test_compare_top_k_mean_and_skips_dim_zero():
    refs = [ref("a", [1, 0, 0]), ref("b", [0, 1, 0]), ref("c", [0.8, 0.6, 0]), ref("d", [], 0)]
    r = client.post("/compare", json={"image": "x", "references": refs, "topK": 2}, headers=AUTH)
    body = r.json()
    assert r.status_code == 200
    assert body["similarityScore"] == pytest.approx(0.9)
    assert body["matchedReferenceIds"] == ["a", "c"]
    assert body["referenceCount"] == 3


def test_compare_only_dim_zero_is_no_references():
    r = client.post("/compare", json={"image": "x", "references": [ref("d", [], 0)]}, headers=AUTH)
    assert r.status_code == 404 and r.json()["error"]["code"] == "NO_REFERENCES"


def test_compare_dimension_mismatch_is_error_not_low_score():
    r = client.post("/compare", json={"image": "x", "references": [ref("a", [1, 0])]}, headers=AUTH)
    assert r.status_code == 400 and r.json()["error"]["code"] == "DIMENSION_MISMATCH"


@pytest.mark.parametrize("payload", [
    {"image": "x"},
    {"image": "x", "artifactId": ART, "references": [ref("a", [1, 0, 0])]},
    {"image": "x", "artifactId": "not-an-id"},
    {"artifactId": ART},
])
def test_compare_invalid_requests(payload):
    r = client.post("/compare", json=payload, headers=AUTH)
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_REQUEST"


def test_compare_by_artifact_id_and_model_mismatch(monkeypatch):
    v = np.array([1, 0, 0], dtype=np.float32)
    monkeypatch.setattr(service, "load_artifact_references",
                        lambda _: [StoredReference("r1", v, ("fake", "1"))])
    r = client.post("/compare", json={"image": "x", "artifactId": ART}, headers=AUTH)
    assert r.status_code == 200 and r.json()["similarityScore"] == pytest.approx(1.0)

    monkeypatch.setattr(service, "load_artifact_references",
                        lambda _: [StoredReference("r1", v, ("other", "1"))])
    r = client.post("/compare", json={"image": "x", "artifactId": ART}, headers=AUTH)
    assert r.status_code == 400 and r.json()["error"]["code"] == "UNSUPPORTED_MODEL"
