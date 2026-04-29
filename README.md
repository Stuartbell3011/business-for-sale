# Next Owner

The fastest way to buy and sell businesses in London — with an interactive map, AI onboarding, and location intelligence.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui
- **Database:** Supabase (Postgres + Auth + RLS)
- **Map:** Mapbox GL JS via react-map-gl
- **AI:** OpenAI API
- **Validation:** Zod
- **Linting/Formatting:** Biome
- **Testing:** Vitest

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase, Mapbox, and OpenAI keys.

3. **Run database migrations:**

   ```bash
   supabase db push
   ```

4. **Start the dev server:**

   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login + Signup pages
│   ├── (marketplace)/       # Map view + listing detail
│   ├── (seller)/            # AI seller onboarding
│   └── api/
│       ├── listings/        # CRUD for business listings
│       ├── ai/onboard/      # AI onboarding endpoint
│       └── location/        # Location intelligence
├── components/
│   ├── ai/                  # Onboarding chat UI
│   ├── listings/            # Listing card + grid
│   ├── map/                 # Mapbox map, markers, filters
│   └── ui/                  # shadcn/ui primitives
├── hooks/
│   ├── use-listings.ts      # Listings + filter state
│   └── use-map.ts           # Map view state
├── lib/
│   ├── ai/                  # OpenAI client
│   ├── map/                 # Mapbox config
│   ├── supabase/            # Browser + server clients
│   └── utils.ts
├── middleware.ts             # Supabase auth + route protection
└── types/
    └── index.ts             # Business, LocationMetrics, filters
supabase/
└── migrations/
    └── 0001_initial_schema.sql
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint with Biome |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Biome |
| `npm run test` | Run unit tests (watch mode) |
| `npm run test:run` | Run unit tests once |
| `npm run db:types` | Generate Supabase TypeScript types |
