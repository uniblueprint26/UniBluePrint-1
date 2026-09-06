-- Phase 4 spec review of the existing Carpooling board turned up several
-- field gaps against the brief: "from/to location, days multi-select,
-- departure time, seats 1-4, contribution yes/no/flexible, contact
-- preference. ... Filter by route/day/time." The original build (Phase 3
-- era) only had a single free-text "schedule" string and an 8-seat cap with
-- no contribution or contact fields. Table has 0 rows, so this is a clean
-- restructure rather than a data migration.
alter table public.carpool_routes add column if not exists days text[] not null default '{}';
alter table public.carpool_routes add column if not exists departure_time text;
alter table public.carpool_routes add column if not exists contribution text;
alter table public.carpool_routes add column if not exists contact_preference text;

update public.carpool_routes set departure_time = coalesce(departure_time, schedule) where departure_time is null;
alter table public.carpool_routes alter column departure_time set not null;
alter table public.carpool_routes alter column contribution set default 'Flexible';
update public.carpool_routes set contribution = 'Flexible' where contribution is null;
alter table public.carpool_routes alter column contribution set not null;
alter table public.carpool_routes add constraint carpool_routes_contribution_check check (contribution in ('Yes', 'No', 'Flexible'));
update public.carpool_routes set contact_preference = 'In-app chat' where contact_preference is null;
alter table public.carpool_routes alter column contact_preference set not null;

alter table public.carpool_routes drop column if exists schedule;

alter table public.carpool_routes drop constraint if exists carpool_routes_seats_available_check;
alter table public.carpool_routes add constraint carpool_routes_seats_available_check check (seats_available between 1 and 4);
