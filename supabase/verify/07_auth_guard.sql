-- ═══════════════════════════════════════════════════════════════════════════
-- 07 — The three-way auth guard on the scheduled functions
--
-- handle_deadline_escalation() and generate_handler_snapshots() are called
-- from two very different places: pg_cron, and an Operations user triggering a
-- manual run. pg_cron executes with no JWT at all, so auth.uid() is NULL there.
--
-- The guard is therefore:
--     if auth.uid() is not null and not has_role(auth.uid(),'operations')
--         then raise
--
-- which has to behave three different ways:
--     NULL uid          (pg_cron)          -> runs
--     authenticated, not Operations        -> blocked
--     authenticated Operations             -> runs
--
-- A guard written the obvious way — `if not has_role(auth.uid(),'operations')`
-- — would pass the second and third case and silently break the scheduled job,
-- which is the case with no user watching it. Hence testing all three.
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ab01', 'verify-student7@example.test'),
  ('00000000-0000-0000-0000-00000000ab02', 'verify-handler7@example.test'),
  ('00000000-0000-0000-0000-00000000ab03', 'verify-ops7@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-00000000ab01', 'Verify Student 7'),
  ('00000000-0000-0000-0000-00000000ab02', 'Verify Handler 7'),
  ('00000000-0000-0000-0000-00000000ab03', 'Verify Ops 7')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ab01', 'user'),
  ('00000000-0000-0000-0000-00000000ab02', 'handler'),
  ('00000000-0000-0000-0000-00000000ab03', 'operations')
on conflict do nothing;

-- ── 1. pg_cron: no JWT, auth.uid() is NULL ────────────────────────────────
do $$
begin
  if auth.uid() is not null then
    raise exception 'FAIL setup: auth.uid() should be NULL with no JWT set, got %', auth.uid();
  end if;

  perform public.handle_deadline_escalation();
  perform public.generate_handler_snapshots();
  raise notice 'PASS scheduled context (auth.uid() NULL) — both functions run';
exception when others then
  raise exception 'FAIL: the scheduled job itself was blocked: %', sqlerrm;
end $$;

-- ── 2. an authenticated handler: blocked ──────────────────────────────────
do $$
declare v_blocked boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ab02', true);

  begin
    perform public.handle_deadline_escalation();
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'FAIL: a handler was allowed to run handle_deadline_escalation()'; end if;
  raise notice 'PASS authenticated handler blocked from handle_deadline_escalation()';

  v_blocked := false;
  begin
    perform public.generate_handler_snapshots();
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'FAIL: a handler was allowed to run generate_handler_snapshots()'; end if;
  raise notice 'PASS authenticated handler blocked from generate_handler_snapshots()';
end $$;

-- ── 3. a student: blocked ─────────────────────────────────────────────────
do $$
declare v_blocked boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ab01', true);
  begin
    perform public.handle_deadline_escalation();
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'FAIL: a student was allowed to run handle_deadline_escalation()'; end if;
  raise notice 'PASS authenticated student blocked';
end $$;

-- ── 4. Operations: allowed ────────────────────────────────────────────────
do $$
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ab03', true);
  perform public.handle_deadline_escalation();
  perform public.generate_handler_snapshots();
  raise notice 'PASS Operations may trigger both functions manually';
exception when others then
  raise exception 'FAIL: Operations was blocked from a manual run: %', sqlerrm;
end $$;

rollback;
