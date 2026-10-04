# Sanskriti Snap Backend

The backend is a Next.js App Router application that exposes the Sanskriti Snap REST API. It handles Clerk authentication, user and artifact workflows, discoveries, rewards, media signing, and MongoDB persistence.

## Requirements

- Node.js 20+
- MongoDB/MongoDB Atlas
- Clerk application
- Cloudinary account
- Optional: running CV service for image verification

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`) and set the values before starting the server.

Set the values in `.env` before starting the server. The required configuration includes:

- `MONGODB_URI`
- `CLERK_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

For CV verification, also configure `CV_SERVICE_URL` and `CV_SERVICE_SECRET`. The secret must match the CV service.

## Run and validate

```bash
npm run dev       # development server at http://localhost:3000
npm run build     # production build
npm start         # serve the production build
npm run lint      # ESLint
```

The API is served under `/api/v1`. Authenticated endpoints expect a Clerk bearer token:

```http
Authorization: Bearer <clerk-session-token>
```

## Structure

- `src/app/api/v1` — REST route handlers
- `src/lib` — environment validation, database, auth, Cloudinary, CV, and shared contracts
- `src/models` — Mongoose models
- `scripts` — maintenance and data scripts

The backend owns authorization and DTO shaping. Do not expose raw MongoDB documents or move database access into the mobile app.
