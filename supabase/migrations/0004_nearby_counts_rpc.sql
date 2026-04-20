-- RPC function for counting nearby businesses using earthdistance
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

-- Add unique constraint on business_id for upsert support
alter table location_metrics
  add constraint location_metrics_business_id_key unique (business_id);
