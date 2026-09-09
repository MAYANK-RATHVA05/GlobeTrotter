# GlobeTrotter

GlobeTrotter is a travel-planning workspace for building multi-city itineraries, scheduling activities, tracking budgets, saving destinations, and sharing trips.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + reusable UI primitives
- Axios + Recharts + Lucide
- MongoDB + Mongoose
- bcryptjs + JWT with an httpOnly cookie

## Architecture

`app/` contains pages and Route Handlers. `components/` contains the shared shell, navigation, cards, forms, and UI primitives. `lib/models.ts` defines MongoDB schemas; `lib/db.ts` owns the cached Mongoose connection; `lib/trips.ts` and `lib/mongo.ts` shape domain documents into the existing frontend API contract.

Trip stops and their scheduled activities are intentionally embedded in a trip document because they are read and reordered together. Catalogue cities and activities remain referenced collections so they can be searched and reused across many trips. Saved cities are references from a user. Community posts reference users/cities/trips while storing likes as user references.

## Environment

Copy `.env.example` to `.env.local` and set:

```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
```

Add your MongoDB connection string to **`MONGODB_URI`**. Never commit `.env.local` or production credentials.

Optional connection tuning:

```env
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
```

## Migrating an existing MySQL database

The repository includes `scripts/migrate-mysql-to-mongo.mjs`. It reads the existing relational tables (`users`, `cities`, `activities`, `trips`, `trip_stops`, `trip_activities`, `trip_costs`, `community_posts`, `post_likes`, and `saved_cities`) and converts them into the MongoDB structure while preserving legacy IDs for compatibility.

The MySQL driver is a development-only dependency used by this one-time migration command; the application runtime uses Mongoose.

```bash
npm install
npm run migrate:mysql
```

Set the old MySQL `DB_*` variables only while running the migration command.

## Quality checks

```bash
npm run type-check
npm run build
```

A GitHub Actions workflow runs these checks on pushes and pull requests. A live MongoDB instance is required for authenticated/database flows.
