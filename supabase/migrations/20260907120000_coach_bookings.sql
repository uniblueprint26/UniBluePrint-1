-- Elevation Blueprint, Round 2 Phase 3: a real "Book a Coach" flow.
--
-- Reuses the coach_slug identity already established for coach_profiles /
-- coach_enquiries (20260811090000) rather than inventing a new coach
-- identity concept. There is no per-coach availability calendar anywhere in
-- the schema yet (handler_availability / handler_shifts are a distinct
-- concept for the Blueprint Studio ticket-handler rota, not coaches, and
-- CoachStudioScreen's "Upcoming Sessions" is still hardcoded demo data per
-- its own header comment) — so this migration adds the minimal real table
-- a booking REQUEST needs to land somewhere durable. The candidate date/time
-- slots offered on the picker are generated client-side (no coach has
-- published real hours yet); this table is what turns picking one into a
-- real, persisted request a coach or Operations can action, exactly like
-- coach_enquiries already does for freeform messages.

create table if not exists public.coach_bookings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  coach_slug    text not null,
  coach_name    text not null,
  slot_date     date not null,
  slot_label    text not null, -- e.g. "10:00 AM" — display string for the chosen time
  message       text,
  status        text not null default 'requested' check (status in ('requested', 'confirmed', 'declined', 'cancelled')),
  created_at    timestamptz not null default now()
);
alter table public.coach_bookings enable row level security;

create policy "users_read_own_coach_bookings" on public.coach_bookings
  for select to authenticated using (auth.uid() = user_id);
create policy "users_insert_own_coach_bookings" on public.coach_bookings
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users_cancel_own_coach_bookings" on public.coach_bookings
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'cancelled');

create policy "operations_founder_read_all_coach_bookings" on public.coach_bookings
  for select to authenticated using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));
create policy "operations_founder_update_coach_bookings" on public.coach_bookings
  for update to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

create policy "matching_coach_reads_own_coach_bookings" on public.coach_bookings
  for select to authenticated using (
    exists (select 1 from public.coach_profiles cp where cp.coach_slug = coach_bookings.coach_slug and cp.user_id = auth.uid())
  );
create policy "matching_coach_updates_own_coach_bookings" on public.coach_bookings
  for update to authenticated
  using (
    exists (select 1 from public.coach_profiles cp where cp.coach_slug = coach_bookings.coach_slug and cp.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.coach_profiles cp where cp.coach_slug = coach_bookings.coach_slug and cp.user_id = auth.uid())
  );

create or replace function public.notify_on_coach_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, category, title, message)
    select ur.user_id, 'coach_booking', 'New booking request',
           new.coach_name || ' has a new booking request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.'
    from public.user_roles ur where ur.role in ('operations', 'founder');

    insert into public.notifications (user_id, category, title, message)
    select cp.user_id, 'coach_booking', 'New booking request',
           'A student requested ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.'
    from public.coach_profiles cp where cp.coach_slug = new.coach_slug;

  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('confirmed', 'declined') then
    insert into public.notifications (user_id, category, title, message)
    values (new.user_id, 'coach_booking',
            case when new.status = 'confirmed' then 'Booking confirmed' else 'Booking declined' end,
            new.coach_name || (case when new.status = 'confirmed' then ' confirmed' else ' declined' end)
              || ' your request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.');
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_coach_booking on public.coach_bookings;
create trigger trg_notify_coach_booking
  after insert or update on public.coach_bookings
  for each row execute function public.notify_on_coach_booking();
