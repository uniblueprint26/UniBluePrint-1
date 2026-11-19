-- Priority ticketing: real events, ticket tiers, orders and tickets.
--
-- Priority is a partner events brand. Tickets are for real world events, so
-- people buy on the UniBlueprint website (Stripe Checkout) and the app only
-- links out to it. This migration replaces the invented demo data that used to
-- live in the app.
--
-- Who can do what:
--   - Anyone, signed in or not, can read events and tiers whose status is
--     on_sale, sold_out or ended (the website browses without a login). Drafts
--     are hidden.
--   - A signed in person reads only their own orders and tickets.
--   - Nobody writes to orders or tickets from a client. Only the edge
--     functions (service role) do, through the functions below.
--   - Staff with the operations or outreach role manage events and tiers, and
--     can read every order and ticket and check a ticket at the door.
--
-- Money is in cents. Prices are always read from priority_ticket_tiers on the
-- server. Nothing the client sends is trusted for price or stock.
--
-- Not applied by the build. The founder applies it.

-- ── Events ──────────────────────────────────────────────────────────────────
create table if not exists public.priority_events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title       text not null check (char_length(title) between 1 and 120),
  genre       text not null check (char_length(genre) between 1 and 40),
  city        text not null check (char_length(city) between 1 and 80),
  venue       text not null check (char_length(venue) between 1 and 120),
  address     text,
  starts_at   timestamptz not null,
  doors_at    timestamptz,
  age_min     integer not null default 18 check (age_min >= 18),
  blurb       text check (blurb is null or char_length(blurb) <= 2000),
  lineup      text[] not null default '{}',
  image_url   text,
  status      text not null default 'draft' check (status in ('draft', 'on_sale', 'sold_out', 'ended')),
  created_at  timestamptz not null default now()
);

create index if not exists priority_events_status_starts
  on public.priority_events (status, starts_at);

-- ── Ticket tiers ────────────────────────────────────────────────────────────
create table if not exists public.priority_ticket_tiers (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.priority_events(id) on delete cascade,
  label          text not null check (char_length(label) between 1 and 80),
  -- 50 cents is the smallest charge Stripe accepts in euro.
  price_cents    integer not null check (price_cents >= 50),
  capacity       integer not null check (capacity > 0),
  sale_starts_at timestamptz,
  sale_ends_at   timestamptz,
  sort           integer not null default 0,
  check (sale_ends_at is null or sale_starts_at is null or sale_ends_at > sale_starts_at)
);

create index if not exists priority_ticket_tiers_event_sort
  on public.priority_ticket_tiers (event_id, sort);

-- ── Orders ──────────────────────────────────────────────────────────────────
-- user_id is set null (not cascade) if an account is deleted, so the money
-- record survives for Finance. A pending order holds its tickets until
-- expires_at, then the stock goes back on sale.
create table if not exists public.priority_orders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete set null,
  event_id              uuid not null references public.priority_events(id) on delete restrict,
  tier_id               uuid not null references public.priority_ticket_tiers(id) on delete restrict,
  quantity              integer not null check (quantity between 1 and 6),
  amount_cents          integer not null check (amount_cents >= 0),
  currency              text not null default 'eur',
  stripe_session_id     text unique,
  stripe_payment_intent text,
  status                text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  expires_at            timestamptz,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists priority_orders_user_created
  on public.priority_orders (user_id, created_at desc);
create index if not exists priority_orders_tier_status
  on public.priority_orders (tier_id, status, expires_at);
create index if not exists priority_orders_event
  on public.priority_orders (event_id);
create index if not exists priority_orders_payment_intent
  on public.priority_orders (stripe_payment_intent)
  where stripe_payment_intent is not null;

-- ── Tickets ─────────────────────────────────────────────────────────────────
create table if not exists public.priority_tickets (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.priority_orders(id) on delete cascade,
  event_id   uuid not null references public.priority_events(id) on delete restrict,
  owner_id   uuid references auth.users(id) on delete set null,
  code       text not null unique,
  status     text not null default 'valid' check (status in ('valid', 'used', 'void')),
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists priority_tickets_owner
  on public.priority_tickets (owner_id, created_at desc);
create index if not exists priority_tickets_event_status
  on public.priority_tickets (event_id, status);
create index if not exists priority_tickets_order
  on public.priority_tickets (order_id);

-- ── Row level security ──────────────────────────────────────────────────────
alter table public.priority_events       enable row level security;
alter table public.priority_ticket_tiers enable row level security;
alter table public.priority_orders       enable row level security;
alter table public.priority_tickets      enable row level security;

-- Public browsing: no login needed, drafts stay hidden.
drop policy if exists "Anyone can read public priority events" on public.priority_events;
create policy "Anyone can read public priority events" on public.priority_events
  for select to anon, authenticated
  using (status in ('on_sale', 'sold_out', 'ended'));

drop policy if exists "Anyone can read tiers of public priority events" on public.priority_ticket_tiers;
create policy "Anyone can read tiers of public priority events" on public.priority_ticket_tiers
  for select to anon, authenticated
  using (exists (
    select 1 from public.priority_events e
    where e.id = priority_ticket_tiers.event_id
      and e.status in ('on_sale', 'sold_out', 'ended')
  ));

-- Staff manage events and tiers (and see drafts).
drop policy if exists "Staff manage priority events" on public.priority_events;
create policy "Staff manage priority events" on public.priority_events
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach'));

drop policy if exists "Staff manage priority tiers" on public.priority_ticket_tiers;
create policy "Staff manage priority tiers" on public.priority_ticket_tiers
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach'));

-- Orders and tickets: own rows only, plus read for staff. No client writes.
drop policy if exists "Users read their own priority orders" on public.priority_orders;
create policy "Users read their own priority orders" on public.priority_orders
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Staff read priority orders" on public.priority_orders;
create policy "Staff read priority orders" on public.priority_orders
  for select to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach'));

drop policy if exists "Users read their own priority tickets" on public.priority_tickets;
create policy "Users read their own priority tickets" on public.priority_tickets
  for select to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Staff read priority tickets" on public.priority_tickets;
create policy "Staff read priority tickets" on public.priority_tickets
  for select to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach'));

-- Table privileges. RLS above narrows these further.
revoke all on public.priority_events       from anon, authenticated;
revoke all on public.priority_ticket_tiers from anon, authenticated;
revoke all on public.priority_orders       from anon, authenticated;
revoke all on public.priority_tickets      from anon, authenticated;

grant select on public.priority_events       to anon, authenticated;
grant select on public.priority_ticket_tiers to anon, authenticated;
grant insert, update, delete on public.priority_events       to authenticated;
grant insert, update, delete on public.priority_ticket_tiers to authenticated;
grant select on public.priority_orders  to authenticated;
grant select on public.priority_tickets to authenticated;

-- ── Capacity ────────────────────────────────────────────────────────────────
-- Tickets taken on a tier: paid orders, plus pending orders that have not
-- expired yet. Internal helper, called by the functions below.
create or replace function public.priority_tier_taken(p_tier_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(quantity), 0)::integer
  from public.priority_orders
  where tier_id = p_tier_id
    and (status = 'paid' or (status = 'pending' and expires_at > now()));
$$;

-- Tickets left on a tier. Safe for the website to show (it reveals only a
-- number, never who bought). Never negative.
create or replace function public.priority_tier_remaining(p_tier_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    (select capacity from public.priority_ticket_tiers where id = p_tier_id)
      - public.priority_tier_taken(p_tier_id),
    0
  );
$$;

-- Reserve tickets and create the pending order in one step. The tier row is
-- locked first, so two buyers asking for the last tickets at the same moment
-- are handled one after the other and the second one is told it is sold out.
-- The price is read here from the tier, never from the caller.
--
-- Returns jsonb:
--   { "ok": true,  "order_id", "amount_cents", "currency", "event_title", "tier_label", "expires_at" }
--   { "ok": false, "code": "invalid_quantity" | "tier_not_found" | "not_on_sale" |
--                          "sale_not_open" | "sale_closed" | "event_ended" | "sold_out"
--                          [, "remaining": n] }
create or replace function public.priority_reserve_tickets(
  p_tier_id      uuid,
  p_user_id      uuid,
  p_quantity     integer,
  p_hold_minutes integer default 35
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier      public.priority_ticket_tiers%rowtype;
  v_event     public.priority_events%rowtype;
  v_taken     integer;
  v_remaining integer;
  v_order_id  uuid;
  v_expires   timestamptz;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 6 then
    return jsonb_build_object('ok', false, 'code', 'invalid_quantity');
  end if;

  -- The lock that stops two buyers overselling the same tier.
  select * into v_tier from public.priority_ticket_tiers where id = p_tier_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'tier_not_found');
  end if;

  select * into v_event from public.priority_events where id = v_tier.event_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'tier_not_found');
  end if;

  if v_event.status = 'sold_out' then
    return jsonb_build_object('ok', false, 'code', 'sold_out', 'remaining', 0);
  end if;
  if v_event.status = 'ended' or v_event.starts_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'event_ended');
  end if;
  if v_event.status <> 'on_sale' then
    return jsonb_build_object('ok', false, 'code', 'not_on_sale');
  end if;
  if v_tier.sale_starts_at is not null and v_tier.sale_starts_at > now() then
    return jsonb_build_object('ok', false, 'code', 'sale_not_open');
  end if;
  if v_tier.sale_ends_at is not null and v_tier.sale_ends_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'sale_closed');
  end if;

  v_taken := public.priority_tier_taken(v_tier.id);
  v_remaining := greatest(v_tier.capacity - v_taken, 0);
  if p_quantity > v_remaining then
    return jsonb_build_object('ok', false, 'code', 'sold_out', 'remaining', v_remaining);
  end if;

  v_expires := now() + make_interval(mins => greatest(coalesce(p_hold_minutes, 35), 31));

  insert into public.priority_orders (user_id, event_id, tier_id, quantity, amount_cents, currency, status, expires_at)
  values (p_user_id, v_event.id, v_tier.id, p_quantity, v_tier.price_cents * p_quantity, 'eur', 'pending', v_expires)
  returning id into v_order_id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'amount_cents', v_tier.price_cents * p_quantity,
    'unit_amount_cents', v_tier.price_cents,
    'currency', 'eur',
    'event_title', v_event.title,
    'tier_label', v_tier.label,
    'expires_at', v_expires
  );
end;
$$;

-- ── Webhook helpers (service role only) ─────────────────────────────────────
-- A new, unguessable ticket code: 16 characters from a random uuid, in groups
-- of four. Collisions are caught by the unique constraint on code.
create or replace function public.priority_new_ticket_code()
returns text
language sql
volatile
set search_path = public
as $$
  select upper(
    substr(h, 1, 4) || '-' || substr(h, 5, 4) || '-' || substr(h, 9, 4) || '-' || substr(h, 13, 4)
  )
  from (select replace(gen_random_uuid()::text, '-', '') as h) s;
$$;

-- Mark an order paid and create one ticket per quantity. Safe to run twice for
-- the same Stripe event: the order row is locked, and only the missing tickets
-- are created. Returns the number of tickets created by this call.
create or replace function public.priority_fulfil_order(
  p_order_id       uuid,
  p_payment_intent text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   public.priority_orders%rowtype;
  v_have    integer;
  v_created integer := 0;
  v_i       integer;
begin
  select * into v_order from public.priority_orders where id = p_order_id for update;
  if not found then
    return 0;
  end if;

  -- A refunded order is never brought back to life.
  if v_order.status = 'refunded' then
    return 0;
  end if;

  -- Money has been taken, so a pending order, or one our own hold already
  -- cancelled, is honoured.
  if v_order.status in ('pending', 'cancelled') then
    update public.priority_orders
       set status = 'paid',
           paid_at = now(),
           stripe_payment_intent = coalesce(p_payment_intent, stripe_payment_intent)
     where id = v_order.id;
  end if;

  select count(*) into v_have from public.priority_tickets where order_id = v_order.id;
  for v_i in 1 .. greatest(v_order.quantity - v_have, 0) loop
    insert into public.priority_tickets (order_id, event_id, owner_id, code)
    values (v_order.id, v_order.event_id, v_order.user_id, public.priority_new_ticket_code());
    v_created := v_created + 1;
  end loop;

  return v_created;
end;
$$;

-- An abandoned checkout: free the held tickets. Only a pending order moves.
create or replace function public.priority_cancel_pending_order(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with c as (
    update public.priority_orders
       set status = 'cancelled'
     where id = p_order_id and status = 'pending'
    returning 1
  )
  select exists (select 1 from c);
$$;

-- A full refund: mark the order refunded and void every ticket that has not
-- been used. Matched by the Stripe payment intent. Returns tickets voided.
create or replace function public.priority_refund_order(p_payment_intent text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_voided   integer := 0;
begin
  if p_payment_intent is null then
    return 0;
  end if;

  select id into v_order_id
    from public.priority_orders
   where stripe_payment_intent = p_payment_intent
   for update;
  if not found then
    return 0;
  end if;

  update public.priority_orders set status = 'refunded' where id = v_order_id and status <> 'refunded';

  update public.priority_tickets set status = 'void'
   where order_id = v_order_id and status = 'valid';
  get diagnostics v_voided = row_count;

  return v_voided;
end;
$$;

-- ── Door check (staff) ──────────────────────────────────────────────────────
-- Look a ticket up by its code. Returns nothing for an unknown code.
create or replace function public.priority_check_ticket(p_code text)
returns table (
  code        text,
  status      text,
  used_at     timestamptz,
  event_title text,
  starts_at   timestamptz,
  tier_label  text,
  holder      text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach')) then
    raise exception 'Not allowed';
  end if;

  return query
    select t.code, t.status, t.used_at, e.title, e.starts_at, tr.label, p.full_name
      from public.priority_tickets t
      join public.priority_events e on e.id = t.event_id
      join public.priority_orders o on o.id = t.order_id
      join public.priority_ticket_tiers tr on tr.id = o.tier_id
      left join public.profiles p on p.id = t.owner_id
     where t.code = upper(btrim(p_code));
end;
$$;

-- Let one person in. Marks a valid ticket as used and says what happened:
-- 'ok', 'already_used', 'void' or 'not_found'. It never double admits.
create or replace function public.priority_mark_ticket_used(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'outreach')) then
    raise exception 'Not allowed';
  end if;

  update public.priority_tickets
     set status = 'used', used_at = now()
   where code = upper(btrim(p_code)) and status = 'valid';
  if found then
    return 'ok';
  end if;

  select status into v_status from public.priority_tickets where code = upper(btrim(p_code));
  if not found then
    return 'not_found';
  end if;
  return case when v_status = 'used' then 'already_used' else 'void' end;
end;
$$;

-- ── Function privileges ─────────────────────────────────────────────────────
revoke all on function public.priority_tier_taken(uuid)                       from public, anon, authenticated;
revoke all on function public.priority_reserve_tickets(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.priority_new_ticket_code()                      from public, anon, authenticated;
revoke all on function public.priority_fulfil_order(uuid, text)               from public, anon, authenticated;
revoke all on function public.priority_cancel_pending_order(uuid)             from public, anon, authenticated;
revoke all on function public.priority_refund_order(text)                     from public, anon, authenticated;
revoke all on function public.priority_tier_remaining(uuid)                   from public;
revoke all on function public.priority_check_ticket(text)                     from public, anon;
revoke all on function public.priority_mark_ticket_used(text)                 from public, anon;

grant execute on function public.priority_tier_taken(uuid)                       to service_role;
grant execute on function public.priority_reserve_tickets(uuid, uuid, integer, integer) to service_role;
grant execute on function public.priority_new_ticket_code()                      to service_role;
grant execute on function public.priority_fulfil_order(uuid, text)               to service_role;
grant execute on function public.priority_cancel_pending_order(uuid)             to service_role;
grant execute on function public.priority_refund_order(text)                     to service_role;
grant execute on function public.priority_tier_remaining(uuid)                   to anon, authenticated, service_role;
grant execute on function public.priority_check_ticket(text)                     to authenticated, service_role;
grant execute on function public.priority_mark_ticket_used(text)                 to authenticated, service_role;
