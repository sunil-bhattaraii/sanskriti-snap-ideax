# Sanskriti Snap CV Service

Internal FastAPI service for image verification support. It creates CLIP embeddings and compares a submitted image with stored artifact reference vectors. It returns similarity evidence; the Next.js backend owns the final `VERIFIED`/`FLAGGED` decision.

## Layout

```
app/       service modules (relative imports; run as `app.main:app`)
tests/     pytest suite; imports `app.*`
```

## Setup and run

Requirements: Python 3.11+ and a PyTorch installation suitable for the host CPU/GPU.

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
