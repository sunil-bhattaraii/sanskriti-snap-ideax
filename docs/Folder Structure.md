For Sanskriti Snap, I’d keep the three systems **clearly separated**, but share a small amount of contract/type information rather than trying to create a giant “shared” folder that eventually becomes everyone’s dumping ground.

Assuming:

* **Mobile:** React Native + Expo Router + TypeScript
* **Main backend:** Next.js App Router + REST API + Mongoose
* **CV backend:** FastAPI + PyTorch/OpenCLIP
* **Auth:** Clerk
* **Storage:** Cloudinary

I’d structure the repo like this:

```text
hidden-nepal/
│
├── mobile/                         # React Native / Expo
│
├── backend/                        # Next.js REST API
│
├── cv-service/                     # FastAPI + CV
│
├── shared/                         # Small cross-system contracts
│
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── VERIFICATION.md
│   └── ARCHITECTURE.md
│
├── .env.example
├── .gitignore
├── README.md
└── package.json                    # optional workspace root
```

The important bit is that **`backend` owns the business logic**. FastAPI should remain a specialized CV service, not slowly mutate into a second backend because someone needed one more endpoint at 2 AM.

---

# 1. Mobile

I'd use feature-oriented organization rather than dumping everything into `components/`, `hooks/`, `utils/`, etc.

```text
mobile/
│
├── app/                              # Expo Router
│   ├── _layout.tsx
│   ├── index.tsx
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Home / map
│   │   ├── quests.tsx
│   │   ├── collection.tsx
│   │   └── profile.tsx
│   │
│   ├── artifact/
│   │   └── [id].tsx
│   │
│   ├── discovery/
│   │   ├── [artifactId].tsx
│   │   └── result.tsx
│   │
│   ├── quest/
│   │   └── [id].tsx
│   │
│   ├── contribution/
│   │   └── create.tsx
│   │
│   └── settings/
│       └── index.tsx
│
├── src/
│   │
│   ├── features/
│   │   ├── artifacts/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   ├── discovery/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   ├── verification.ts
│   │   │   └── components/
│   │   │
│   │   ├── quests/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   ├── collection/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   ├── profile/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   ├── contributions/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   └── leaderboard/
│   │       ├── api.ts
│   │       ├── hooks.ts
│   │       └── types.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── map/
│   │   ├── camera/
│   │   └── common/
│   │
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── discovery.store.ts
│   │   └── map.store.ts
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── errors.ts
│   │   ├── clerk.ts
│   │   ├── cloudinary.ts
│   │   ├── location.ts
│   │   ├── camera.ts
│   │   └── query-client.ts
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── config.ts
│   │   └── categories.ts
│   │
│   └── types/
│       └── navigation.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

### Why this structure?

The **route files stay thin**.

For example:

```text
app/artifact/[id].tsx
```

should mostly deal with:

```text
route params
    ↓
feature hook
    ↓
feature component
```

Not 400 lines of API calls, camera logic, Zustand mutations, and prayers to React Native.

The actual feature belongs under:

```text
src/features/artifacts/
```

That makes it much easier for an agent to work on one domain without wandering through the entire application.

---

# 2. Next.js Backend

This is where I'd be more opinionated.

Don't organize it around HTTP endpoints alone. Organize it around **domain modules**.

```text
backend/
│
├── src/
│   │
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           ├── artifacts/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       └── route.ts
│   │           │
│   │           ├── discoveries/
│   │           │   └── route.ts
│   │           │
│   │           ├── verification/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       ├── route.ts
│   │           │       └── review/
│   │           │           └── route.ts
│   │           │
│   │           ├── quests/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       └── route.ts
│   │           │
│   │           ├── collection/
│   │           │   └── route.ts
│   │           │
│   │           ├── leaderboard/
│   │           │   └── route.ts
│   │           │
│   │           ├── users/
│   │           │   └── me/
│   │           │       └── route.ts
│   │           │
│   │           ├── contributions/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       └── route.ts
│   │           │
│   │           └── admin/
│   │               ├── artifacts/
│   │               ├── verification/
│   │               ├── contributions/
│   │               ├── quests/
│   │               ├── badges/
│   │               └── users/
│   │
│   ├── modules/
│   │   │
│   │   ├── artifacts/
│   │   │   ├── artifact.model.ts
│   │   │   ├── artifact.schema.ts
│   │   │   ├── artifact.repository.ts
│   │   │   ├── artifact.service.ts
│   │   │   ├── artifact.validation.ts
│   │   │   └── artifact.types.ts
│   │   │
│   │   ├── verification/
│   │   │   ├── verification.model.ts
│   │   │   ├── verification.service.ts
│   │   │   ├── verification.repository.ts
│   │   │   ├── verification.validation.ts
│   │   │   ├── verification.types.ts
│   │   │   ├── gps.service.ts
│   │   │   └── cv.service.ts
│   │   │
│   │   ├── discoveries/
│   │   │   ├── discovery.model.ts
│   │   │   ├── discovery.repository.ts
│   │   │   ├── discovery.service.ts
│   │   │   └── discovery.types.ts
│   │   │
│   │   ├── quests/
│   │   │   ├── quest.model.ts
│   │   │   ├── quest.service.ts
│   │   │   ├── quest.repository.ts
│   │   │   └── quest.types.ts
│   │   │
│   │   ├── badges/
│   │   │   ├── badge.model.ts
│   │   │   ├── badge.service.ts
│   │   │   └── badge.types.ts
│   │   │
│   │   ├── xp/
│   │   │   ├── xp.model.ts
│   │   │   ├── xp.service.ts
│   │   │   └── xp.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.model.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── contributions/
│   │   │   ├── contribution.model.ts
│   │   │   ├── contribution.service.ts
│   │   │   ├── contribution.repository.ts
│   │   │   └── contribution.types.ts
│   │   │
│   │   ├── community/
│   │   │   ├── community-snap.model.ts
│   │   │   ├── community.service.ts
│   │   │   └── community.types.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── report.model.ts
│   │   │   ├── report.service.ts
│   │   │   └── report.types.ts
│   │   │
│   │   └── admin/
│   │       ├── admin-action.model.ts
│   │       ├── admin.service.ts
│   │       └── admin.types.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── mongoose.ts
│   │   │   └── transaction.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── clerk.ts
│   │   │   ├── require-auth.ts
│   │   │   ├── require-role.ts
│   │   │   └── permissions.ts
│   │   │
│   │   ├── cloudinary/
│   │   │   ├── client.ts
│   │   │   ├── signatures.ts
│   │   │   └── assets.ts
│   │   │
│   │   ├── cv/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── geo/
│   │   │   ├── distance.ts
│   │   │   └── validation.ts
│   │   │
│   │   └── errors/
│   │       ├── app-error.ts
│   │       └── error-handler.ts
│   │
│   ├── middleware.ts
│   └── config.ts
│
├── tests/
│   ├── artifacts/
│   ├── verification/
│   ├── discoveries/
│   ├── quests/
│   └── integration/
│
├── scripts/
│   ├── seed.ts
│   ├── seed-artifacts.ts
│   └── seed-quests.ts
│
├── package.json
└── tsconfig.json
```

## The important separation

I would explicitly enforce:

```text
Route
  ↓
Validation
  ↓
Service
  ↓
Repository
  ↓
Model
```

For example:

```text
POST /api/v1/verification
          │
          ▼
verification/route.ts
          │
          ▼
verification.validation.ts
          │
          ▼
verification.service.ts
          │
          ├── GPS service
          ├── CV client
          ├── Discovery service
          ├── XP service
          ├── Quest service
          └── Badge service
```

The **service layer owns business rules**.

The route handler should not contain things like:

```ts
if (distance <= artifact.verificationRadius) {
   ...
}
```

That belongs in the verification service.

This is particularly important because you will have multiple callers eventually, such as mobile, admin panel, background processing, etc.

---

# 3. FastAPI CV Service

Keep this one **small**.

It does not need to know about users, quests, XP, badges, discoveries, or Clerk.

Its world is basically:

```text
image
  ↓
embedding
  ↓
comparison
  ↓
similarity result
```

Structure:

```text
cv-service/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── embeddings.py
│   │   │   └── verification.py
│   │   │
│   │   └── dependencies.py
│   │
│   ├── schemas/
│   │   ├── embedding.py
│   │   ├── verification.py
│   │   └── responses.py
│   │
│   ├── services/
│   │   ├── embedding_service.py
│   │   ├── similarity_service.py
│   │   └── verification_service.py
│   │
│   ├── models/
│   │   ├── clip.py
│   │   └── model_registry.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   │
│   ├── utils/
│   │   ├── image.py
│   │   ├── vectors.py
│   │   └── validation.py
│   │
│   └── __init__.py
│
├── tests/
│   ├── test_embeddings.py
│   ├── test_similarity.py
│   └── test_verification.py
│
├── models/
│   └── .gitkeep
│
├── requirements.txt
├── Dockerfile
└── README.md
```

### CV service responsibility

It should expose something roughly like:

```text
POST /v1/verify
```

Input:

```json
{
  "imageUrl": "...",
  "referenceEmbeddings": [
    [0.01, 0.02, "..."]
  ],
  "topK": 5
}
```

Output:

```json
{
  "similarityScore": 0.82,
  "topMatches": [
    {
      "referenceId": "...",
      "score": 0.84
    }
  ],
  "model": {
    "name": "CLIP",
    "version": "..."
  }
}
```

Notice what it **doesn't** return:

```text
verified: true
xp: 50
discovery: true
```

That's not its job.

FastAPI says:

> "The image similarity is 0.82."

Next.js decides:

> "0.82 >= this artifact's threshold, therefore CV passes."

That separation is extremely important.

---

# 4. Shared Directory

I'd keep this **very small**.

```text
shared/
│
├── contracts/
│   ├── api/
│   │   ├── artifacts.ts
│   │   ├── verification.ts
│   │   ├── discoveries.ts
│   │   ├── quests.ts
│   │   ├── collection.ts
│   │   ├── contributions.ts
│   │   └── users.ts
│   │
│   └── cv/
│       └── verification.ts
│
├── enums/
│   ├── artifact.ts
│   ├── verification.ts
│   ├── quest.ts
│   └── user.ts
│
└── README.md
```

But there is an important rule:

**Do not put Mongoose models in `shared/`.**

The frontend should not know:

```ts
Schema.Types.ObjectId
```

and FastAPI obviously shouldn't either.

Shared contracts should contain things like:

```ts
export interface ArtifactDTO {
  id: string;
  name: string;
  description: string;
  category: ArtifactCategory;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceMeters?: number;
}
```

The backend converts:

```text
MongoDB document
        ↓
DTO
        ↓
API response
```

The frontend consumes the DTO.

---

# 5. Overall Architecture

The resulting structure is:

```text
                    ┌──────────────────────┐
                    │     React Native     │
                    │        Expo          │
                    └──────────┬───────────┘
                               │
                               │ REST
                               ▼
                    ┌──────────────────────┐
                    │      Next.js API     │
                    │                      │
                    │  Auth                │
                    │  Business Logic      │
                    │  GPS Verification    │
                    │  Gamification        │
                    │  Admin               │
                    └──────┬───────┬───────┘
                           │       │
                  MongoDB  │       │ CV API
                           │       │
                           ▼       ▼
                    ┌──────────┐ ┌──────────────┐
                    │ MongoDB  │ │   FastAPI    │
                    │          │ │              │
                    │ Entities │ │ CLIP/OpenCLIP│
                    │ + Geo    │ │ Embeddings   │
                    └──────────┘ │ Similarity   │
                                 └──────────────┘
```

And externally:

```text
                 ┌─────────────┐
                 │   Clerk     │
                 └──────┬──────┘
                        │
                        ▼
React Native ───────► Next.js
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          MongoDB             Cloudinary
                                  ▲
                                  │
                            Mobile uploads
```

---

# 6. One Important Architectural Decision

I'd make **Next.js the only service the mobile app talks to**.

Not:

```text
Mobile
 ├──→ Next.js
 ├──→ FastAPI
 ├──→ MongoDB
 └──→ Cloudinary
```

Instead:

```text
Mobile
   │
   ├──→ Next.js API
   │       │
   │       ├──→ MongoDB
   │       ├──→ FastAPI
   │       └──→ Cloudinary
   │
   └──→ Cloudinary
       (signed/direct upload only)
```

The only deliberate exception is direct Cloudinary upload using a backend-generated signature.

The mobile app should **never know how to talk to MongoDB or FastAPI**.

That gives you one clean security boundary:

```text
Mobile
  ↓
Next.js
  ↓
Everything else
```

For a hackathon, this is substantially easier to reason about, test, debug, and hand to multiple coding agents without producing three competing versions of reality.
