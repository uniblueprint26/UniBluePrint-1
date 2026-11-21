-- Ride shares: extra stops on the way and an optional one off date.
-- The normal carpool stays the only ride share board. Not applied by the build.
alter table public.carpool_routes add column if not exists stops text[] not null default '{}';
alter table public.carpool_routes add column if not exists ride_date date;
alter table public.carpool_routes drop constraint if exists carpool_routes_stops_len;
alter table public.carpool_routes add constraint carpool_routes_stops_len check (coalesce(array_length(stops, 1), 0) <= 5);
create index if not exists carpool_routes_ride_date_idx on public.carpool_routes (ride_date);
