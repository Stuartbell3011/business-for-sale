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

-- Add soft delete to businesses
alter table businesses add column if not exists deleted_at timestamptz;

-- RLS
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
