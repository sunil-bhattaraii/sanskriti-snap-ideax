# Sanskriti Snap Mobile

Expo/React Native client for discovering cultural artifacts, viewing maps, navigating to locations, submitting evidence, tracking XP, and redeeming rewards.

## Requirements

- Node.js 20+
- npm
- Expo CLI through `npx`
- Android Studio or an iOS development environment for native builds
- A reachable Sanskriti Snap backend

## Setup

```bash
npm install
```

Create a `.env` file in this directory and configure:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_API_URL=http://<reachable-backend-host>:3000
```

The backend URL must be reachable from the phone or emulator. A localhost or private LAN URL will not work in a released APK unless the device can access that network.

## Run and build

```bash
npx expo start       # development server
npm run android      # local Android native build
npm run ios          # local iOS native build
npm run web          # web client
npm run typecheck    # TypeScript validation
npm run lint         # Expo ESLint
```

EAS profiles are defined in `eas.json`:

```bash
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

Ensure the two `EXPO_PUBLIC_*` values are configured in the EAS environment used for the build. The app displays a startup diagnostic screen when required configuration is missing or invalid.

## Structure

- `src/app` — Expo Router screens and route layouts
- `src/components` — reusable UI
- `src/services` — API, caching, offline queue, media, and location integrations
- `src/store` — client state
- `assets` — bundled icons and images

The mobile app communicates with the Next.js backend through REST and Clerk authentication. It does not connect directly to MongoDB or the CV service.
