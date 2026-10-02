# Sanskriti Snap CV Service

Internal FastAPI service: image -> CLIP embedding, and top-K-mean similarity against one
artifact's stored reference vectors. It never decides VERIFIED/FLAGGED; Next.js does.

## Layout

```
app/       service modules (relative imports; run as `app.main:app`)
tests/     pytest suite; imports `app.*`
```

## Run
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # install torch for your hardware first if you want GPU
cp .env.example .env                   # set CV_SERVICE_SECRET (same value as the backend)
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend `.env`: `CV_SERVICE_URL=http://127.0.0.1:8000`, `CV_SERVICE_SECRET=<same secret>`.

## Try it
```bash
curl -X POST localhost:8000/embed -H "Authorization: Bearer $CV_SERVICE_SECRET" \
  -H "Content-Type: application/json" -d '{"image":"https://res.cloudinary.com/<cloud>/image/upload/<id>.jpg"}'

curl -X POST localhost:8000/compare -H "Authorization: Bearer $CV_SERVICE_SECRET" \
  -H "Content-Type: application/json" -d '{"image":"<publicId>","artifactId":"<24-hex>","topK":3}'
```

## Test
```bash
pytest   # no torch / Mongo needed; model, fetch and DB are faked
```

## Behaviour notes
- Errors are `{"error":{"code","message"}}` (contract `CvServiceError` shape) with the PRD's codes (+ `UNAUTHORIZED` 401).
- `/compare` skips `embeddingDimension: 0` rows; none left -> `NO_REFERENCES` (404).
- Mixed/mismatched model stamp -> `UNSUPPORTED_MODEL`; dimension mismatch -> `DIMENSION_MISMATCH`.
- Response `topK` is the *effective* K (min of requested K and available references).
- Image fetching: https only, host allowlist (`CV_ALLOWED_IMAGE_HOSTS`), no redirects, 10 MB cap.
- The service is stateless and read-only on Mongo; it persists nothing.
