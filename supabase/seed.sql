-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Paste everything and click "Run"

-- 1. Extensions
create extension if not exists cube;
create extension if not exists earthdistance;

-- 2. Businesses table
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
  source_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Location metrics
create table if not exists location_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  competition_score numeric not null default 0,
  footfall_score numeric not null default 0,
  demographic_score numeric not null default 0,
  opportunity_score numeric not null default 0,
  computed_at timestamptz not null default now(),
  constraint location_metrics_business_id_key unique (business_id)
);

-- 4. Favorites
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, business_id)
);

-- 5. Inquiries
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'read', 'replied')),
  created_at timestamptz not null default now()
);

-- 6. Indexes
create index if not exists businesses_location_idx on businesses using gist (ll_to_earth(latitude, longitude));
create index if not exists businesses_industry_idx on businesses (industry);
create index if not exists businesses_asking_price_idx on businesses (asking_price);
create index if not exists businesses_verified_idx on businesses (verified);

-- 7. RLS
alter table businesses enable row level security;
alter table location_metrics enable row level security;
alter table favorites enable row level security;
alter table inquiries enable row level security;

-- 8. Policies
create policy "Public can read verified businesses" on businesses for select using (verified = true);
create policy "Owners can manage their listings" on businesses for all using (auth.uid() = owner_id);
create policy "Public can read location metrics" on location_metrics for select using (true);
create policy "Users manage own favorites" on favorites for all using (auth.uid() = user_id);
create policy "Buyers see own inquiries" on inquiries for select using (auth.uid() = buyer_id);
create policy "Buyers create inquiries" on inquiries for insert with check (auth.uid() = buyer_id);
create policy "Sellers see inquiries for their listings" on inquiries for select using (business_id in (select id from businesses where owner_id = auth.uid()));

-- 9. Nearby counts RPC
create or replace function get_nearby_counts(
  target_lat double precision,
  target_lng double precision,
  target_industry text,
  target_id uuid,
  radius_meters double precision
)
returns table (same_industry bigint, total_nearby bigint)
language sql
stable
as $$
  select
    count(*) filter (where industry = target_industry) as same_industry,
    count(*) as total_nearby
  from businesses
  where id != target_id
    and verified = true
    and deleted_at is null
    and earth_distance(
      ll_to_earth(latitude, longitude),
      ll_to_earth(target_lat, target_lng)
    ) < radius_meters;
$$;
