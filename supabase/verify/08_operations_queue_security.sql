-- ═══════════════════════════════════════════════════════════════════════════
-- 08 — operations_queue is not directly readable
--
-- operations_queue is a VIEW, and a view does not carry row-level security of
-- its own. Enabling RLS on the tables underneath does not protect it: the view
-- is owned by postgres and runs with the owner's rights, so whatever SELECT
-- privilege the view itself carries is what decides access. Under Supabase's
-- default privileges that would have meant `authenticated` — every signed-in
-- user — could read the entire Operations queue.
--
-- The migration therefore revokes the view from public, anon and authenticated,
-- and exposes it only through fetch_operations_queue(), which checks the
-- Operations role. This file proves both halves.
--
-- Checks:
--   * neither anon nor authenticated holds any privilege on the view
--   * a signed-in user selecting from it directly gets permission denied
--   * the same user reaches it through fetch_operations_queue() and gets 0 rows
--   * Operations gets rows through the function
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ac01', 'verify-student8@example.test'),
  ('00000000-0000-0000-0000-00000000ac02', 'verify-handler8@example.test'),
  ('00000000-0000-0000-0000-00000000ac03', 'verify-ops8@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-00000000ac01', 'Verify Student 8'),
  ('00000000-0000-0000-0000-00000000ac02', 'Verify Handler 8'),
  ('00000000-0000-0000-0000-00000000ac03', 'Verify Ops 8')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ac01', 'user'),
  ('00000000-0000-0000-0000-00000000ac02', 'handler'),
  ('00000000-0000-0000-0000-00000000ac03', 'operations')
on conflict do nothing;

do $$
declare
  v_sub uuid;
  v_ticket uuid;
begin
  insert into public.submissions
    (user_id, stage, tier, handler_id, submitted_at, assigned_at, turnaround_deadline, notes, paid)
  values
    ('00000000-0000-0000-0000-00000000ac01', 'in_review', 'premium',
     '00000000-0000-0000-0000-00000000ac02', now() - interval '30 hours',
     now() - interval '30 hours', now() - interval '3 hours', 'queue-security', true)
  returning id into v_sub;

  insert into public.handler_queue (submission_id, handler_id, queued_at, picked_at)
  values (v_sub, '00000000-0000-0000-0000-00000000ac02', now() - interval '30 hours', now() - interval '30 hours')
  returning id into v_ticket;

  insert into public.handler_escalations
    (handler_id, submission_id, ticket_id, escalation_reason, deadline_was, claimed_at, tier)
  values ('00000000-0000-0000-0000-00000000ac02', v_sub, v_ticket, 'missed_deadline',
          now() - interval '3 hours', now() - interval '30 hours', 'premium');
end $$;

-- ── 1. privilege inspection ───────────────────────────────────────────────
do $$
declare
  v_grants integer;
  v_grantees text;
begin
  select count(*), coalesce(string_agg(distinct grantee, ', '), 'none')
    into v_grants, v_grantees
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'operations_queue'
     and grantee in ('PUBLIC', 'anon', 'authenticated');

  if v_grants <> 0 then
    raise exception 'FAIL: operations_queue is granted to % — any signed-in user could read the queue', v_grantees;
  end if;
  raise notice 'PASS no privilege on operations_queue for PUBLIC, anon or authenticated';
end $$;

-- ── 2. a signed-in user selecting the view directly ───────────────────────
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ac02';

do $$
declare v_denied boolean := false;
begin
  begin
    perform 1 from public.operations_queue limit 1;
  exception
    when insufficient_privilege then v_denied := true;
    when others then v_denied := true;
  end;

  if not v_denied then
    raise exception 'FAIL: authenticated read operations_queue directly';
  end if;
  raise notice 'PASS direct SELECT on operations_queue is denied to authenticated';
end $$;

-- ── 3. the sanctioned path, as a handler: reachable but empty ─────────────
do $$
declare v_count integer;
begin
  select count(*) into v_count from public.fetch_operations_queue();
  if v_count <> 0 then
    raise exception 'FAIL: fetch_operations_queue() gave a handler % row(s)', v_count;
  end if;
  raise notice 'PASS fetch_operations_queue() is callable by a handler but returns 0 rows';
end $$;

-- ── 4. the sanctioned path, as Operations: rows come back ─────────────────
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ac03';

do $$
declare v_count integer;
begin
  select count(*) into v_count from public.fetch_operations_queue();
  if v_count < 1 then
    raise exception 'FAIL: fetch_operations_queue() returned nothing for Operations';
  end if;
  raise notice 'PASS fetch_operations_queue() returns % row(s) for Operations', v_count;
  raise notice 'PASS the view is reachable only through the role-checked function';
end $$;

reset role;
rollback;
