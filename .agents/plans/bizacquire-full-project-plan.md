# BizAcquire — Full Project Plan

> The following plan is comprehensive but you must validate codebase patterns and task sanity before implementing each sprint. Read every referenced file before touching it.

---

## Feature Description

Build an AI-powered SMB acquisition platform where buyers can discover and evaluate small businesses on an interactive map, and sellers can onboard their business via a guided AI chat flow that produces a structured, verified listing.

## User Stories

**Buyer**
> As a buyer, I want to browse businesses on an interactive map with filters and AI location insights, so that I can make confident, location-aware acquisition decisions.

**Seller**
> As a seller, I want to onboard my business through an AI conversation that extracts and structures my financial data, so that I can create a high-quality listing without filling in forms.

## Problem Statement

SMB transactions are opaque, slow, and lack location context. Buyers cannot answer "is this a good location?" from a list view. Sellers don't know how to present their business. The gap is structured data + spatial intelligence + AI-assisted process.

## Solution Statement

Structured database with RLS + AI seller intake (OpenAI streaming) + Mapbox interactive map with clustering, filters, and location scoring, all served by a Next.js 15 App Router + Supabase backend.

## Feature Metadata

**Feature Type**: New Capability (greenfield)
**Estimated Complexity**: High
**Primary Systems Affected**: Auth, Listings API, Map, AI Onboarding, Location Intelligence
**Dependencies**: Supabase, Mapbox GL JS / react-map-gl, OpenAI API, Google Maps (geocoding)

---

## CONTEXT REFERENCES

### Files to read before implementing each sprint

| File | Relevance |
|------|-----------|
| `src/types/index.ts` | Canonical domain types — Business, LocationMetrics, ListingFilters |
| `src/middleware.ts` | Supabase auth guard pattern — every new protected route follows this |
| `src/lib/supabase/client.ts` | Browser Supabase client factory |
| `src/lib/supabase/server.ts` | Server Supabase client factory — use in Server Components + API routes |
| `src/lib/ai/openai.ts` | OpenAI client singleton |
| `src/lib/map/mapbox.ts` | Mapbox token + default config |
| `src/components/ui/button.tsx` | CVA variant pattern used by all UI components |
| `src/components/ui/card.tsx` | Card primitive used by ListingCard |
| `src/components/listings/listing-card.tsx` | Starting point for listing display |
| `src/hooks/use-listings.ts` | Stub to flesh out with real fetch logic |
| `src/hooks/use-map.ts` | Stub to flesh out with Mapbox viewport state |
| `supabase/migrations/0001_initial_schema.sql` | Full schema — businesses + location_metrics + RLS |
| `biome.json` | Formatting rules: tabs, 100 char width, double quotes, trailing commas |
| `tsconfig.json` | `@/` alias → `./src/*` |
| `vitest.config.mts` | Test runner — fix `environment` to `jsdom` in Sprint 1 |

### Patterns to Follow

**Supabase server client** (always async, always from `next/headers`):
```typescript
// src/lib/supabase/server.ts
const supabase = await createClient(); // async factory
const { data, error } = await supabase.from("businesses").select("*");
```

**Supabase browser client** (client components only):
```typescript
// src/lib/supabase/client.ts
const supabase = createClient(); // sync factory
```

**API route pattern** (Next.js 15 App Router):
```typescript
// src/app/api/listings/route.ts
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("businesses").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data });
}
```

**Biome formatting rules** (enforced):
- Tabs for indentation (not spaces)
- Double quotes for strings
- Trailing commas everywhere
- 100 character line width
- Semicolons always

**Component prop typing**:
```typescript
type Props = { business: Business; onClick: (id: string) => void; };
export function ListingCard({ business, onClick }: Props) { ... }
```

**cn() utility** (from `src/lib/utils.ts`):
```typescript
import { cn } from "@/lib/utils";
className={cn("base-class", conditional && "conditional-class")}
```

**"use client" placement**: Top of file, before imports, for any component using hooks or browser APIs.

---

## SPRINT PLAN

---

## Sprint 1 — Auth + Foundation (Week 1)

**Goal**: Working login/signup with Supabase Auth. Protected routes functional. Test setup fixed. Type-check script added.

### Why first
Everything else depends on knowing who the user is. The middleware already guards `/seller/*` — it just needs real auth UI to back it up.

### Tasks

#### 1.1 FIX `vitest.config.mts` — change environment to jsdom
- **UPDATE** `vitest.config.mts`
- **CHANGE** `environment: "node"` → `environment: "jsdom"`
- **ADD** `setupFiles: ["./src/test/setup.ts"]`
- **CREATE** `src/test/setup.ts` with `import "@testing-library/jest-dom"`
- **VALIDATE**: `npm run test:run` (no failures)

#### 1.2 ADD type-check script to `package.json`
- **UPDATE** `package.json`
- **ADD** `"type-check": "tsc --noEmit"` to scripts
- **VALIDATE**: `npm run type-check`

#### 1.3 EXTEND `src/types/index.ts` with auth + pagination types
- **ADD** to `src/types/index.ts`:
```typescript
export type AuthUser = {
  id: string;
  email: string;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
};

export type ApiError = {
  error: string;
  status: number;
};
```

#### 1.4 EXTEND Supabase clients with database type safety
- **RUN** `npm run db:types` (generates `src/types/supabase.ts` from live Supabase schema — requires project to be linked)
- **UPDATE** `src/lib/supabase/client.ts` + `src/lib/supabase/server.ts`
- **ADD** generic type param: `createBrowserClient<Database>(...)` and `createServerClient<Database>(...)`
- **IMPORT** `Database` from `@/types/supabase`
- **GOTCHA**: `supabase.ts` is gitignored — always regenerate from schema
- **VALIDATE**: `npm run type-check`

#### 1.5 CREATE `src/lib/supabase/admin.ts` — service-role client for server-only operations
```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```
- **GOTCHA**: Never import this in client components or expose to browser
- **VALIDATE**: `npm run type-check`

#### 1.6 CREATE `src/hooks/use-auth.ts`
```typescript
"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signOut };
}
```
- **VALIDATE**: `npm run type-check`

#### 1.7 IMPLEMENT `src/app/(auth)/login/page.tsx`
- Email + password form with Supabase `signInWithPassword`
- Show toast (Sonner) on error
- Redirect to `/marketplace` on success
- Link to `/signup`
- Use `Input`, `Label`, `Button` from shadcn/ui
- **Pattern**: Server Action or client-side submit — use client-side for now (simpler)
- **VALIDATE**: Manual — login with test account redirects to marketplace

#### 1.8 IMPLEMENT `src/app/(auth)/signup/page.tsx`
- Email + password + confirm password
- Supabase `signUp` with `emailRedirectTo: /marketplace`
- Show "Check your email" message after submit
- Link to `/login`
- Zod validation: email format, password min 8 chars
- **VALIDATE**: Manual — signup sends confirmation email

#### 1.9 CREATE `src/app/auth/callback/route.ts` — OAuth + email confirm handler
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/marketplace", request.url));
}
```
- **VALIDATE**: Email confirmation link redirects to `/marketplace`

#### 1.10 UPDATE `src/app/layout.tsx` — add nav with auth state
- Add simple top nav: logo + "Browse" + conditional "List Business" / "Sign In" / user avatar
- Use `useAuth()` hook in a `NavBar` client component
- **CREATE** `src/components/nav/nav-bar.tsx`

### Sprint 1 Validation Commands
```bash
npm run type-check
npm run lint
npm run test:run
# Manual: Login/signup flow end-to-end
```

### Sprint 1 Acceptance Criteria
- [ ] Login form authenticates with Supabase, redirects to /marketplace
- [ ] Signup form creates account, sends confirmation email
- [ ] Auth callback route handles email confirmation code
- [ ] Visiting /seller/onboard without auth redirects to /login
- [ ] NavBar shows correct state for logged-in vs logged-out users
- [ ] `npm run type-check` passes with zero errors
- [ ] Vitest configured with jsdom, no test failures

---

## Sprint 2 — Listings API + Marketplace Browse (Week 2)

**Goal**: Real data flows through. Marketplace page shows listings fetched from Supabase. CRUD API is fully functional with auth.

### Tasks

#### 2.1 EXTEND database schema with missing tables
- **CREATE** `supabase/migrations/0002_favorites_inquiries.sql`:
```sql
-- Buyer saved listings
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, business_id)
);

-- Buyer → Seller contact requests
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'read', 'replied')),
  created_at timestamptz not null default now()
);

alter table favorites enable row level security;
alter table inquiries enable row level security;

create policy "Users manage own favorites" on favorites for all using (auth.uid() = user_id);
create policy "Buyers see own inquiries" on inquiries for select using (auth.uid() = buyer_id);
create policy "Buyers create inquiries" on inquiries for insert with check (auth.uid() = buyer_id);
create policy "Sellers see inquiries for their listings"
  on inquiries for select
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
```
- **VALIDATE**: `supabase db push` (or via Studio)

#### 2.2 IMPLEMENT `GET /api/listings/route.ts`
- Parse query params: `industry`, `min_price`, `max_price`, `min_revenue`, `max_revenue`, `country`, `city`, `page`, `pageSize`
- Query Supabase with dynamic filters
- Return paginated `PaginatedResponse<Business>`
- Public (no auth required) — RLS filters to verified only
- **VALIDATE**: `curl http://localhost:3000/api/listings` returns `{ data: [], count: 0, page: 1, pageSize: 20 }`

#### 2.3 IMPLEMENT `POST /api/listings/route.ts`
- Require auth (read user from Supabase server client)
- Return 401 if not authenticated
- Validate body with Zod against `Business` shape
- Insert into `businesses` with `owner_id = user.id`, `verified = false`
- Return created listing
- **VALIDATE**: POST with auth header creates a row in Supabase

#### 2.4 IMPLEMENT `GET /api/listings/[id]/route.ts`
- Fetch single business by ID
- Join with `location_metrics` if available
- Return 404 if not found
- **VALIDATE**: GET /api/listings/{valid-id} returns full listing

#### 2.5 ADD `PUT + DELETE /api/listings/[id]/route.ts`
- `PUT`: Auth required, verify `owner_id === user.id`, update fields
- `DELETE`: Auth required, verify ownership, soft-delete via `deleted_at` field (add to schema)
- **VALIDATE**: Owner can update/delete own listing; 403 for non-owners

#### 2.6 FLESH OUT `src/hooks/use-listings.ts`
- Fetch from `/api/listings` with current filters
- Debounce filter changes (300ms)
- Handle loading + error states
- Support pagination
```typescript
export function useListings(initialFilters: ListingFilters = {}) {
  const [listings, setListings] = useState<Business[]>([]);
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, count: 0 });

  useEffect(() => {
    const params = new URLSearchParams(/* filters to params */);
    setLoading(true);
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(data => { setListings(data.data); setPagination(...); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  return { listings, filters, setFilters, loading, error, pagination };
}
```

#### 2.7 IMPROVE `src/components/listings/listing-card.tsx`
- Add badge for `verified` status
- Format currency (€ / localeString)
- Add profit margin calculation: `((profit / revenue) * 100).toFixed(1)%`
- Add industry badge
- Link to `/marketplace/listings/[id]`
- Hover shadow + transition
- **VALIDATE**: Card renders with all data populated

#### 2.8 IMPLEMENT `src/app/(marketplace)/page.tsx`
- Use `useListings()` hook
- Show `ListingGrid` on right, `MapFilters` sidebar on left (placeholder for now)
- Add view toggle: Map / List
- Loading skeleton when `loading === true`
- Empty state when no listings
- **VALIDATE**: Page loads, shows listings from API

#### 2.9 IMPLEMENT `src/app/(marketplace)/listings/[id]/page.tsx`
- Server Component: fetch listing via `createClient()` (server) directly
- Display: title, industry, location, financials table, profit margin, verified badge
- Display `LocationMetrics` scores if available (visual progress bars)
- CTA: "Request Access" button (opens inquiry form if authed)
- Breadcrumb: Marketplace → Listing title
- **VALIDATE**: Detail page loads with correct data; 404 for invalid ID

#### 2.10 CREATE `src/components/listings/listing-skeleton.tsx`
- Shimmer skeleton matching `ListingCard` dimensions
- Used during loading states
- **VALIDATE**: Shows in marketplace while listings load

### Sprint 2 Validation Commands
```bash
npm run type-check
npm run lint
npm run test:run
curl http://localhost:3000/api/listings
# Manual: Add a listing via Supabase Studio, verify it appears on /marketplace
```

### Sprint 2 Acceptance Criteria
- [ ] `GET /api/listings` returns paginated, filtered results
- [ ] `POST /api/listings` requires auth, creates listing
- [ ] `PUT /DELETE /api/listings/[id]` enforces ownership
- [ ] Marketplace page loads listings from API
- [ ] Listing detail page renders all fields with 404 handling
- [ ] Loading skeletons shown during fetch
- [ ] All type errors resolved

---

## Sprint 3 — Interactive Map (Week 3)

**Goal**: Mapbox map renders listings as interactive markers with clustering, filters, and a listing preview popover.

### Documentation
- react-map-gl v7 docs: https://visgl.github.io/react-map-gl/docs
- Mapbox GL Clustering: https://docs.mapbox.com/mapbox-gl-js/example/cluster/
- Supercluster: https://github.com/mapbox/supercluster

### Tasks

#### 3.1 INSTALL supercluster
```bash
npm install supercluster @types/supercluster
```

#### 3.2 IMPLEMENT `src/components/map/market-map.tsx`
- Replace placeholder `<div>` with full Mapbox implementation
- Use `Map` from `react-map-gl`
- Pass `MAPBOX_TOKEN` from `src/lib/map/mapbox.ts`
- Default viewport from `DEFAULT_MAP_CONFIG`
- Accept `listings: Business[]` + `onSelectBusiness` props
- Use `Source` + `Layer` from react-map-gl for GeoJSON clustering
- Cluster layer: circle with dynamic radius based on point count
- Unclustered layer: custom marker icon
- **GOTCHA**: react-map-gl v7 uses `mapLib` prop to load mapbox-gl — required for SSR compatibility
- **GOTCHA**: Map container needs explicit height (e.g., `h-[calc(100vh-64px)]`)
- **VALIDATE**: Map renders with token, shows Europe/world view

#### 3.3 IMPLEMENT `src/components/map/listing-marker.tsx`
- Custom SVG pin marker (not default Mapbox marker)
- Pulse animation on selected state
- Show price label below pin
- Click triggers `onSelectBusiness` callback
- **VALIDATE**: Clicking a marker fires callback with correct business

#### 3.4 IMPLEMENT `src/components/map/listing-preview-card.tsx`
- **CREATE** new file: `src/components/map/listing-preview-card.tsx`
- Popup card that appears when marker is clicked
- Content: title, city, asking price, revenue, industry badge, profit margin
- "View Details" link → `/marketplace/listings/[id]`
- Close button
- Position: anchored to marker lat/lng via Mapbox `Popup`
- **VALIDATE**: Click marker → preview card appears with correct data

#### 3.5 IMPLEMENT `src/components/map/map-filters.tsx`
- Replace placeholder with working filter UI
- Fields: Industry (select), Price range (min/max), Revenue range (min/max), Country (input)
- Props: `filters: ListingFilters`, `onChange: (filters: ListingFilters) => void`
- Debounce 300ms before calling `onChange`
- "Clear Filters" button resets all fields
- Show active filter count badge
- **VALIDATE**: Changing filter updates listings in parent

#### 3.6 FLESH OUT `src/hooks/use-map.ts`
```typescript
export function useMap() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [viewport, setViewport] = useState({
    longitude: DEFAULT_MAP_CONFIG.center[0],
    latitude: DEFAULT_MAP_CONFIG.center[1],
    zoom: DEFAULT_MAP_CONFIG.zoom,
  });
  return { selectedBusiness, setSelectedBusiness, view, setView, viewport, setViewport };
}
```

#### 3.7 UPDATE `src/app/(marketplace)/page.tsx` — integrate map
- Left panel: `MapFilters`
- Right panel: toggle between `MarketMap` + `ListingGrid`
- Pass `listings` from `useListings()` to both `MarketMap` and `ListingGrid`
- When marker clicked, scroll listing card into view in list mode
- Map view = full width map with filter sidebar overlay
- List view = filter sidebar + listing grid
- **VALIDATE**: Map shows pins for all loaded listings; clicking pin shows preview

#### 3.8 ADD geocoding for location search
- **CREATE** `src/app/api/geocode/route.ts`
- Proxy to Google Maps Geocoding API (keeps API key server-side)
- Returns `{ lat, lng, display_name }` for a text query
- **ADD** search input to `MapFilters` that geocodes and pans map to result
- **VALIDATE**: Typing "London" and searching pans map to London

#### 3.9 ADD `NEXT_PUBLIC_MAPBOX_TOKEN` to env handling
- **UPDATE** `next.config.ts`:
```typescript
const nextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
};
```
- **VALIDATE**: Token loads correctly in client components

### Sprint 3 Validation Commands
```bash
npm run type-check
npm run lint
npm run build  # ensure no SSR issues with Mapbox
# Manual: Map renders, markers visible, clustering works at low zoom, preview card opens
```

### Sprint 3 Acceptance Criteria
- [ ] Map renders with Mapbox tiles
- [ ] Listings appear as pins at their lat/lng
- [ ] Pins cluster when zoomed out
- [ ] Clicking a pin opens preview card with listing data
- [ ] Filter panel updates displayed listings in real time
- [ ] Map/List view toggle works
- [ ] Location search geocodes and pans map
- [ ] `npm run build` passes (no SSR errors)

---

## Sprint 4 — AI Seller Onboarding (Week 4)

**Goal**: Sellers complete a conversational AI intake that extracts structured business data and creates a draft listing.

### Documentation
- OpenAI Streaming (Node.js): https://platform.openai.com/docs/api-reference/streaming
- Next.js streaming responses: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
- Vercel AI SDK (consider as alternative): https://sdk.vercel.ai/docs

### Tasks

#### 4.1 IMPLEMENT `POST /api/ai/onboard/route.ts` — streaming endpoint
- Accept: `{ messages: ChatMessage[], step: "intake" | "followup" | "finalize" }`
- System prompt defines the AI's role:
  ```
  You are a business listing specialist. Extract structured data from seller responses.
  Required fields: title, industry, city, country, revenue, profit, employees, asking_price.
  Ask follow-up questions if any fields are missing or unclear.
  When all fields are complete, respond with JSON: { complete: true, data: {...} }
  ```
- Stream response using `openai.chat.completions.create({ stream: true })`
- Return `ReadableStream` via `new Response(stream)`
- **GOTCHA**: Must set `Content-Type: text/event-stream` header
- **VALIDATE**: `curl -X POST /api/ai/onboard -d '{"messages":[]}' -N` streams tokens

#### 4.2 IMPLEMENT `src/components/ai/onboarding-chat.tsx`
- Multi-turn chat UI (scrollable message list + input)
- "thinking" indicator while streaming
- Parse final `{ complete: true, data }` JSON response and transition to confirmation step
- Show extracted data as a structured form for seller to review/edit
- **CREATE** `src/components/ai/extracted-data-review.tsx` — editable form showing extracted fields
- **VALIDATE**: Can complete a full onboarding conversation

#### 4.3 IMPLEMENT `src/app/(seller)/onboard/page.tsx`
- Step 1: `OnboardingChat` (AI conversation)
- Step 2: `ExtractedDataReview` (review + edit extracted fields)
- Step 3: Location picker (map pin drop or address search)
- Step 4: Submission + confirmation
- Use `useState` for step management
- Require auth (`useAuth()`) — redirect to login if not authenticated
- On final submit: `POST /api/listings` with extracted + reviewed data
- **VALIDATE**: Full flow from chat → review → submit creates a listing in Supabase

#### 4.4 ADD geocoding to seller location step
- Address/city input → calls `/api/geocode` → sets `latitude`, `longitude`
- Show small preview map with draggable pin for precise location
- Respect `location_precision` field: seller chooses city / approximate / exact
- **VALIDATE**: Pin placement stores correct lat/lng

#### 4.5 CREATE `src/components/ai/progress-steps.tsx`
- Visual stepper showing which onboarding step user is on
- Steps: Describe → Review → Location → Done
- **VALIDATE**: Highlights current step, greyed-out future steps

#### 4.6 ADD document upload to onboarding (Phase 1 - optional)
- File input accepting PDF/XLSX
- `POST /api/ai/documents` — parse with OpenAI file API or extract text server-side
- Extracted financials pre-fill chat context
- **GOTCHA**: File size limits — OpenAI file API max 512MB
- **VALIDATE**: Uploading a P&L PDF pre-populates revenue/profit fields

#### 4.7 WRITE unit tests for AI onboard route
- Mock OpenAI client
- Test: complete flow extracts all required fields
- Test: missing fields trigger follow-up questions
- Test: malformed input returns 400
- **VALIDATE**: `npm run test:run`

### Sprint 4 Validation Commands
```bash
npm run type-check
npm run lint
npm run test:run
# Manual: Complete onboarding flow as seller, verify listing appears in Supabase
```

### Sprint 4 Acceptance Criteria
- [ ] `/api/ai/onboard` streams GPT-4 responses
- [ ] Chat UI displays streaming tokens in real time
- [ ] AI extracts all required fields: title, industry, city, country, revenue, profit, employees, asking_price
- [ ] Extracted data shown in editable review form
- [ ] Location step geocodes address and drops pin on map
- [ ] Submission creates a listing in Supabase with `verified = false`
- [ ] Auth required — unauthenticated users redirected to login
- [ ] Unit tests pass for onboard route

---

## Sprint 5 — Location Intelligence (Week 5)

**Goal**: Each listing has competition score, footfall proxy, and opportunity score computed and displayed as AI insight badges.

### Tasks

#### 5.1 EXTEND database schema for PostGIS
- **CREATE** `supabase/migrations/0003_postgis.sql`:
```sql
-- Enable PostGIS extension (required for earth_distance)
create extension if not exists earthdistance cascade;
create extension if not exists cube cascade;

-- Update location index to use proper PostGIS
-- (ll_to_earth used in Sprint 0 migration — earthdistance provides this)
```
- **VALIDATE**: `select ll_to_earth(51.5, -0.1)` works in Supabase SQL editor

#### 5.2 IMPLEMENT `GET /api/location/insights/route.ts`
- Accept: `?business_id=xxx`
- Fetch target business lat/lng
- Query nearby businesses within 2km radius:
```sql
select count(*) filter (where industry = $1) as same_industry_nearby,
       count(*) as total_nearby
from businesses
where earth_distance(ll_to_earth(latitude, longitude), ll_to_earth($2, $3)) < 2000
  and id != $4
  and verified = true
```
- Compute scores (0–100):
  - `competition_score`: same_industry_nearby / max_nearby × 100
  - `footfall_score`: derived from total_nearby density (proxy for area activity)
  - `opportunity_score`: 100 - competition_score (simplified MVP)
- Upsert into `location_metrics` table
- Return metrics JSON
- **VALIDATE**: Returns scores for a business with nearby listings seeded

#### 5.3 CREATE `src/lib/scoring.ts` — scoring algorithms
```typescript
export function computeCompetitionScore(sameIndustryNearby: number, radiusKm: number): number { ... }
export function computeFootfallProxy(totalBusinessesNearby: number): number { ... }
export function computeOpportunityScore(competition: number, footfall: number): number { ... }
```
- **VALIDATE**: Unit tests for each scoring function

#### 5.4 CREATE `src/components/listings/insight-badges.tsx`
- Render AI insight badges based on `LocationMetrics`:
  - `competition_score < 30` → "Low Competition" (green)
  - `footfall_score > 60` → "High Foot Traffic" (blue)
  - `opportunity_score > 70` → "High Opportunity" (gold)
- Each badge has icon + label
- Tooltip with brief explanation
- **VALIDATE**: Renders correct badges for sample metrics

#### 5.5 ADD insight badges to `ListingCard` and listing detail page
- Fetch `location_metrics` for each listing (via JOIN in `/api/listings`)
- Show top 2 badges on `ListingCard`
- Show all badges on listing detail page
- **VALIDATE**: Listings with computed metrics show badges

#### 5.6 ADD competition layer to map
- **CREATE** `src/components/map/competition-layer.tsx`
- When a listing marker is selected, draw circles for nearby same-industry businesses
- Colour: red for competition, blue for complementary businesses
- Toggle show/hide button in map controls
- **VALIDATE**: Selecting a listing shows nearby competition layer

#### 5.7 CREATE background job for batch score computation
- **CREATE** `src/app/api/cron/compute-scores/route.ts`
- Loops all verified businesses, calls scoring logic, upserts `location_metrics`
- Protected by `CRON_SECRET` header check
- Can be triggered manually or via Supabase Edge Functions cron
- **VALIDATE**: Running endpoint updates all location_metrics rows

#### 5.8 WRITE unit tests for scoring functions
- `computeCompetitionScore(0, 2)` → 0
- `computeCompetitionScore(10, 2)` → some value between 0–100
- `computeOpportunityScore(80, 50)` → lower opportunity
- **VALIDATE**: `npm run test:run`

### Sprint 5 Validation Commands
```bash
npm run type-check
npm run lint
npm run test:run
# Seed 10 nearby businesses in Supabase
# GET /api/location/insights?business_id=xxx returns scores
# Listing detail shows insight badges
```

### Sprint 5 Acceptance Criteria
- [ ] `/api/location/insights` computes and stores scores for any listing
- [ ] Competition, footfall, opportunity scores all compute correctly
- [ ] Insight badges render on listing cards and detail page
- [ ] Competition layer visible on map when listing selected
- [ ] Batch score computation endpoint works
- [ ] Unit tests for all scoring functions pass

---

## Sprint 6 — Polish, Performance & Production Readiness (Week 6)

**Goal**: Production-ready. Performance optimised. Fully tested. Zero lint errors.

### Tasks

#### 6.1 SEO + metadata
- Dynamic `generateMetadata` for each listing detail page (title = business name + city)
- OG image generation via `next/og` for listings
- Canonical URLs
- Sitemap via `src/app/sitemap.ts`

#### 6.2 Error handling hardening
- **CREATE** `src/app/error.tsx` (global error boundary)
- **CREATE** `src/app/(marketplace)/error.tsx` (marketplace-specific)
- **CREATE** `src/app/(marketplace)/listings/[id]/not-found.tsx`
- Standardise API error responses: `{ error: string, code: string, status: number }`
- Add Zod validation to all POST/PUT endpoints

#### 6.3 Performance
- `React.lazy` / `dynamic()` import for `MarketMap` (Mapbox is ~700KB)
  ```typescript
  const MarketMap = dynamic(() => import("@/components/map/market-map"), { ssr: false });
  ```
- Image optimisation: use `next/image` for any listing images
- API route caching headers: `Cache-Control: s-maxage=60` for public listing list
- Add `loading.tsx` for marketplace and listing detail routes

#### 6.4 Accessibility
- All interactive elements keyboard navigable
- `aria-label` on map markers
- Colour contrast: insight badge text meets AA standard
- Skip navigation link
- Focus management when modals open/close

#### 6.5 Integration tests
- **CREATE** `src/app/api/listings/__tests__/route.test.ts`
  - GET: returns filtered results
  - POST: creates listing (mock Supabase)
  - POST: rejects unauthenticated request
- **CREATE** `src/hooks/__tests__/use-listings.test.ts`
  - Filters trigger new API call
  - Debounce prevents excess requests
- **CREATE** `src/lib/__tests__/scoring.test.ts`
  - All scoring functions

#### 6.6 Seller dashboard (basic)
- **CREATE** `src/app/(seller)/dashboard/page.tsx`
- List seller's own listings
- Show status: pending review, verified, draft
- Edit / delete actions
- Inquiry count per listing

#### 6.7 Buyer saved listings
- **CREATE** `src/app/(marketplace)/saved/page.tsx`
- Uses `favorites` table from Sprint 2
- Save/unsave button on `ListingCard` (heart icon, `useAuth()` gated)
- **CREATE** `src/hooks/use-favorites.ts`

#### 6.8 Final production checklist
- Supabase RLS audit: verify no unauthorized data leaks
- Environment variables documented in `.env.example`
- `npm run build` passes with zero warnings
- All `console.log` removed
- `npm run lint:fix` applied
- README updated with production deployment steps

### Sprint 6 Validation Commands
```bash
npm run type-check
npm run lint
npm run test:run
npm run build
# Lighthouse audit: Performance > 80, Accessibility > 90
```

### Sprint 6 Acceptance Criteria
- [ ] Dynamic OG images for listing pages
- [ ] Mapbox loaded with dynamic import (no SSR crash, bundle size reduced)
- [ ] All API routes have Zod validation
- [ ] Error boundaries catch runtime errors gracefully
- [ ] Integration tests pass for all API routes
- [ ] `npm run build` produces zero warnings
- [ ] Lighthouse performance > 80, accessibility > 90

---

## FULL SPRINT SUMMARY

| Sprint | Focus | Duration | Key Deliverable |
|--------|-------|----------|-----------------|
| **1** | Auth + Foundation | Week 1 | Login, Signup, NavBar, type safety |
| **2** | Listings API + Browse | Week 2 | Real data on /marketplace, full CRUD |
| **3** | Interactive Map | Week 3 | Mapbox map with markers, clustering, filters |
| **4** | AI Seller Onboarding | Week 4 | Chat flow that creates structured listings |
| **5** | Location Intelligence | Week 5 | Scores, insight badges, competition layer |
| **6** | Polish + Production | Week 6 | Performance, testing, SEO, error handling |

---

## TESTING STRATEGY

### Unit Tests (Vitest + Testing Library)
- All scoring functions in `src/lib/scoring.ts`
- API route handlers (mock Supabase with `vitest.mock`)
- Hook behaviour: `useListings` filter debounce, `useAuth` state transitions

### Integration Tests
- Full API CRUD lifecycle (auth required routes)
- AI onboard route with mocked OpenAI responses

### Manual QA Checklist (Per Sprint)
- Auth flow (Sprint 1)
- Listings CRUD (Sprint 2)
- Map render + clustering (Sprint 3)
- AI onboarding full conversation (Sprint 4)
- Location scoring accuracy (Sprint 5)
- Build + Lighthouse (Sprint 6)

---

## VALIDATION COMMANDS (Run Before Every Commit)

### Level 1: Syntax & Style
```bash
npm run lint        # Biome check
npm run format      # Biome format (tabs, double quotes, trailing commas)
```

### Level 2: Types
```bash
npm run type-check  # tsc --noEmit
```

### Level 3: Unit Tests
```bash
npm run test:run    # Vitest once
```

### Level 4: Build
```bash
npm run build       # Verify no SSR issues, no TS errors in build
```

---

## ACCEPTANCE CRITERIA (Full Product)

- [ ] Seller can complete AI onboarding and create a structured listing
- [ ] Buyer can browse listings on an interactive map with clustering
- [ ] Buyer can filter by industry, price, revenue, location
- [ ] Clicking a map marker shows a listing preview card
- [ ] Each listing shows AI insight badges (competition, footfall, opportunity)
- [ ] Auth guards all seller routes
- [ ] All API routes validate input with Zod
- [ ] RLS prevents unauthorized data access
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes with coverage > 70%
- [ ] Mapbox loaded with dynamic import (no SSR issues)
- [ ] Lighthouse performance > 80 on marketplace page

---

## NOTES

### Key risks
1. **Mapbox SSR crash** — Always dynamic import `MarketMap` with `ssr: false`. Mapbox uses `window` on import.
2. **OpenAI streaming in Next.js** — Use `ReadableStream` + `TransformStream` pattern. Do not buffer full response.
3. **Supabase type gen** — Run `npm run db:types` after every schema migration. The `src/types/supabase.ts` file is gitignored and must be regenerated locally.
4. **Location precision privacy** — Never expose `latitude`/`longitude` directly in API response when `location_precision = "city"` or `"approximate"`. Return a jittered coordinate instead.
5. **Vitest jsdom** — Fix the `environment` setting in Sprint 1 or all React component tests will fail.

### Architecture decisions
- **No tRPC / GraphQL** — REST with Zod validation is sufficient for MVP and keeps the codebase flat
- **No state management library** — React hooks + Supabase real-time subscriptions cover all cases
- **Supabase over bare Postgres** — RLS, Auth, and real-time come for free; removes need for a separate auth service
- **react-map-gl over raw Mapbox GL** — React idioms (hooks, components) for map interactions; same underlying library

**Confidence score: 8/10** — Patterns are established, toolchain is configured, all dependencies are in package.json. Main risk is OpenAI streaming + Mapbox SSR, both of which have well-documented solutions.
