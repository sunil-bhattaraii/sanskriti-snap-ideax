# Sanskriti Snap

Sanskriti Snap is a location-aware cultural discovery platform. Users explore nearby heritage artifacts, navigate to them, capture evidence, earn XP, and redeem rewards.

## Repository layout

| Project | Directory | Purpose |
| --- | --- | --- |
| Mobile app | [`sanskriti-snap-mobile`](./sanskriti-snap-mobile) | Expo/React Native client for Android, iOS, and web |
| Backend API | [`sanskriti-snap-backend`](./sanskriti-snap-backend) | Next.js REST API, authentication, business logic, and MongoDB access |
| CV service | [`cv-service`](./cv-service) | FastAPI image embeddings and artifact-reference similarity |
| Documentation | [`docs`](./docs) | Product, API, database, frontend, and backend specifications |

## Architecture

```text
Mobile app
    │ Clerk bearer token + REST
    ▼
Next.js backend ─── MongoDB
    │
    ├── Cloudinary (media storage)
    └── FastAPI CV service ─── artifact reference vectors in MongoDB
```

The mobile app communicates only with the backend. It does not connect directly to MongoDB or the CV service.

## Quick start

Run each service from its own directory.

1. Configure environment variables from each project's `.env.example` where provided. The mobile project requires a manually created `.env` file; see its README.
2. Start the backend:

   ```bash
   cd sanskriti-snap-backend
   npm install
   npm run dev
   ```

3. Start the CV service when image verification is needed:

   ```bash
   cd cv-service
   python -m venv .venv
   # Windows: .venv\Scripts\Activate.ps1
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

4. Start the mobile app:

   ```bash
   cd sanskriti-snap-mobile
   npm install
   npx expo start
   ```

For project-specific environment variables, scripts, and deployment notes, see the README in each project directory.

## Core services

- **Authentication:** Clerk
- **Database:** MongoDB through Mongoose
- **Media:** Cloudinary
- **Mobile:** Expo, React Native, Expo Router
- **Computer vision:** FastAPI, PyTorch, Transformers, CLIP

## Development notes

- Never commit `.env` files, credentials, or API secrets.
- Keep backend and CV-service secrets aligned where documented, especially `CV_SERVICE_SECRET`.
- Use the API contract and database specifications in [`docs`](./docs) when changing request or response shapes.
