-- Rate limiting for the 8 anonymous public-facing forms added in
-- 20260824120000. Every one of them accepts inserts from `anon` with no
-- ownership check by design (a prospective student/business/applicant has
-- no account yet) — which also means nothing stopped a script from
-- submitting the same form hundreds of times. Addresses the TODO already
-- sitting in ContactPage.jsx: "Add rate limiting to contact form
-- submissions — max 3 per IP per hour."
--
-- Not IP-based: a plain client-side insert (anon key, RLS-gated) never
-- reaches Postgres with the caller's IP address — only an Edge Function
-- sees `x-forwarded-for`, and none of these forms go through one. Every
-- one of these forms already requires a real email address, so limiting
-- per-email is the achievable equivalent at the database layer: a bot
-- can spoof an IP far more easily than it can supply 4+ distinct real
-- email addresses to hammer the same form.

create or replace function public.enforce_form_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_count integer;
begin
  execute format(
    'select count(*) from public.%I where email = $1 and created_at > now() - interval ''1 hour''',
    TG_TABLE_NAME
  ) into v_recent_count using new.email;

  if v_recent_count >= 3 then
    raise exception 'Too many submissions from this email address in the last hour. Please try again later.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function public.enforce_form_rate_limit() is
  'Generic per-table, per-email rate limit (max 3/hour) for anonymous public form tables. Reads TG_TABLE_NAME dynamically so one function serves all 8 tables below rather than needing a near-identical copy per table.';

do $$
declare
  t text;
begin
  foreach t in array array[
    'general_enquiries', 'partnership_enquiries', 'team_applications',
    'university_enquiries', 'business_enquiries',
    'handler_applications', 'coach_applications', 'ambassador_applications'
  ]
  loop
    execute format(
      'drop trigger if exists rate_limit_before_insert on public.%I;', t
    );
    execute format(
      'create trigger rate_limit_before_insert before insert on public.%I for each row execute function public.enforce_form_rate_limit();', t
    );
  end loop;
end $$;
