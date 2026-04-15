-- Businesses table
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  industry text not null,
  country text not null,
  city text not null,
  latitude double precision not null,
  longitude double precision not null,
  location_precision text not null default 'approximate' check (location_precision in ('city', 'approximate', 'exact')),
  revenue numeric not null default 0,
  profit numeric not null default 0,
  employees integer not null default 0,
  asking_price numeric not null default 0,
  verified boolean not null default false,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Location metrics table
create table if not exists location_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  competition_score numeric not null default 0,
  footfall_score numeric not null default 0,
  demographic_score numeric not null default 0,
  opportunity_score numeric not null default 0,
  computed_at timestamptz not null default now()
);

-- Indexes for map queries
create index businesses_location_idx on businesses using gist (
  ll_to_earth(latitude, longitude)
);
create index businesses_industry_idx on businesses (industry);
create index businesses_asking_price_idx on businesses (asking_price);
create index businesses_verified_idx on businesses (verified);

-- RLS
alter table businesses enable row level security;
alter table location_metrics enable row level security;

-- Public read for verified listings
create policy "Public can read verified businesses"
  on businesses for select
  using (verified = true);

-- Owners can manage their own listings
create policy "Owners can manage their listings"
  on businesses for all
  using (auth.uid() = owner_id);

-- Location metrics are public read
create policy "Public can read location metrics"
  on location_metrics for select
  using (true);
