# Sanskriti Snap CV Service

Internal FastAPI service for image verification support. It creates CLIP embeddings and compares a submitted image with stored artifact reference vectors. It returns similarity evidence; the Next.js backend owns the final `VERIFIED`/`FLAGGED` decision.

## Layout

```
app/       service modules (relative imports; run as `app.main:app`)
scripts/   export_onnx.py — builds the int8 ONNX model used at runtime
tests/     pytest suite; imports `app.*`
model/     generated ONNX file (gitignored)
```

## Setup and run

Requirements: Python 3.11+. Runtime uses `onnxruntime` only — no torch needed to serve.

```bash
# Windows
python -m venv .venv
.venv\Scripts\Activate.ps1

# macOS/Linux
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
Copy-Item .env.example .env            # Windows
# cp .env.example .env                 # macOS/Linux
```

Set `CV_SERVICE_SECRET` to the same value used by the backend. Configure MongoDB and Cloudinary values in `.env` when using stored references or Cloudinary public IDs.

Export the CLIP vision tower to an int8 ONNX file (one-time; needs torch — see `requirements-export.txt`):

```bash
pip install -r requirements-export.txt          # servers: install CPU torch first (see file)
python scripts/export_onnx.py
```

Start the service:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend configuration:

```env
CV_SERVICE_URL=http://127.0.0.1:8000
CV_SERVICE_SECRET=<same secret>
```

## Try it
```bash
curl -X POST localhost:8000/embed -H "Authorization: Bearer $CV_SERVICE_SECRET" \
  -H "Content-Type: application/json" -d '{"image":"https://res.cloudinary.com/<cloud>/image/upload/<id>.jpg"}'

curl -X POST localhost:8000/compare -H "Authorization: Bearer $CV_SERVICE_SECRET" \
  -H "Content-Type: application/json" -d '{"image":"<publicId>","artifactId":"<24-hex>","topK":3}'
```

## Deploy (Render, free tier)

```bash
# Build command (installs CPU torch only to export the model, then removes it)
pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir -r requirements.txt -r requirements-export.txt && python scripts/export_onnx.py --purge-cache && pip uninstall -y torch

# Start command
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Health check path: `/health`. The service serves a dynamic-int8 ONNX export of the
CLIP vision tower (~90 MB on disk, ~150 MB at runtime) so it fits a 512 MB instance.

## Test

```bash
pytest
```

## Behaviour notes
- Errors are `{"error":{"code","message"}}` (contract `CvServiceError` shape) with the PRD's codes (+ `UNAUTHORIZED` 401).
- `/compare` skips `embeddingDimension: 0` rows; none left -> `NO_REFERENCES` (404).
- Mixed/mismatched model stamp -> `UNSUPPORTED_MODEL`; dimension mismatch -> `DIMENSION_MISMATCH`.
- Response `topK` is the *effective* K (min of requested K and available references).
- Image fetching: https only, host allowlist (`CV_ALLOWED_IMAGE_HOSTS`), no redirects, 10 MB cap.
- The service is stateless and read-only on Mongo; it persists nothing.
