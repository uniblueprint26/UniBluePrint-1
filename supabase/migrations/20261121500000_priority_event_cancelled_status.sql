-- Priority events: add a 'cancelled' status.
-- Cancelled events stay visible to everyone so buyers see "Cancelled, refunds
-- issued". Buying is already blocked: purchase_priority_tickets only allows
-- status = 'on_sale' (anything else returns not_on_sale), so nothing to change there.
-- Written to run after 20261119120000_priority_ticketing.sql. Safe to run twice.

do $$
declare
  v_con text;
begin
  if to_regclass('public.priority_events') is null then
    raise notice 'priority_events does not exist yet, skipping';
    return;
  end if;

  -- Replace the status check (find it by definition, whatever it is named).
  for v_con in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.priority_events'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
      and pg_get_constraintdef(c.oid) ilike '%on_sale%'
  loop
    execute format('alter table public.priority_events drop constraint %I', v_con);
  end loop;

  alter table public.priority_events
    add constraint priority_events_status_check
    check (status in ('draft', 'on_sale', 'sold_out', 'ended', 'cancelled'));

  -- Public read now includes cancelled events and their tiers.
  drop policy if exists "Anyone can read public priority events" on public.priority_events;
  create policy "Anyone can read public priority events" on public.priority_events
    for select to anon, authenticated
    using (status in ('on_sale', 'sold_out', 'ended', 'cancelled'));

  drop policy if exists "Anyone can read tiers of public priority events" on public.priority_ticket_tiers;
  create policy "Anyone can read tiers of public priority events" on public.priority_ticket_tiers
    for select to anon, authenticated
    using (exists (
      select 1 from public.priority_events e
      where e.id = priority_ticket_tiers.event_id
        and e.status in ('on_sale', 'sold_out', 'ended', 'cancelled')
    ));
end $$;
