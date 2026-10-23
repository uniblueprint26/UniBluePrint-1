-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Director Hub (Studio Phase 6), part 3 of 3 -- the ONE genuinely new
-- query this phase adds: a company-wide "what needs a decision" rollup
-- across the four tables the brief named (legal_contracts.needs_fix,
-- money_requests.pending, tech_ideas.brought_to_founder, plus a real,
-- computed "stuck" definition for team_tasks and outreach_contacts).
-- Everything else the Co-Director Dashboard shows reuses the existing
-- Finance/Legal/Tech/Outreach/Marketing RPCs via src/lib/studioMetrics.js --
-- no other new SQL.
--
-- Checked live before writing this (2026-10-23), same diligence every
-- Studio phase has used before trusting a table:
--   - legal_contracts: 0 needs_fix today (25 not_sent, 2 sent).
--   - money_requests: 0 rows at all today -- genuinely empty table.
--   - tech_ideas: exactly 1 row flagged brought_to_founder, and it is NOT a
--     real decision -- its title/description read "QA verification pass 2
--     - 1792693785108" / "Created by Playwright QA script (re-run after
--     fixing ambiguous captured_at bug)", i.e. leftover scratch data from a
--     PRIOR Studio phase's own Playwright QA run against the Tech Hub that
--     was never cleaned up. Same kind of contamination every prior phase
--     found and excluded in its own data (Phase 5's demo-account/partner-
--     name exclusion is the direct precedent) -- excluded here by pattern
--     (title/description mentioning "QA"/"Playwright") rather than
--     presented as a genuine pending founder decision. Flagged in the
--     handback report; not deleted here (today's scope is additive).
--   - team_tasks: has no "blocked"/"stuck" status and target_date is null
--     on every row today, so "stuck" is defined the same real, honest way
--     an overdue flag works elsewhere in this codebase (Legal Hub's GDPR
--     is_overdue) -- status <> 'done' AND target_date is in the past. That
--     resolves to a real, computed 0 today (no row has a target_date at
--     all yet), not a fabricated flag.
--   - outreach_contacts: 1 row, status 'responded' -- not stuck. "Stuck" is
--     defined the same real way: status = 'contacted' with no status
--     change for 14+ days. Also a real, computed 0 today.
--
-- The honest result right now is genuinely 0 across every category -- a
-- clean "nothing pending" first screen for Daniel, not an invented item.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_co_director_pending_decisions()
returns table (
  category    text,
  label       text,
  detail      text,
  flagged_at  timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'co_director') or public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'admin')) then
    raise exception 'not authorized';
  end if;

  return query

  -- Legal: contracts register rows explicitly flagged needs_fix. Column
  -- aliases on this FIRST branch only -- a UNION ALL's output column names
  -- (what the trailing ORDER BY below resolves against) come from the
  -- first SELECT's own aliases, not from the function's RETURNS TABLE
  -- declaration. Without these, `order by flagged_at` fails live with
  -- "invalid UNION/INTERSECT/EXCEPT ORDER BY clause" -- caught via actual
  -- Playwright QA against this page, not assumed.
  select
    'legal_contract_needs_fix'::text as category,
    lc.contract_name as label,
    initcap(lc.entity_type) || ' contract' || coalesce(' -- ' || lc.notes, ' needs a fix') as detail,
    lc.updated_at as flagged_at
  from public.legal_contracts lc
  where lc.status = 'needs_fix'

  union all

  -- Finance: money requests from other teams still awaiting a decision.
  select
    'money_request_pending'::text,
    '€' || to_char(mr.amount_cents / 100.0, 'FM999999990.00') || ' -- ' || mr.requesting_role,
    mr.reason,
    mr.requested_at
  from public.money_requests mr
  where mr.status = 'pending'

  union all

  -- Tech: ideas explicitly escalated to the founder for a call, excluding
  -- leftover QA-script scratch rows (see migration header).
  select
    'tech_idea_escalated'::text,
    ti.title,
    coalesce(ti.description, 'No further detail recorded.'),
    ti.created_at
  from public.tech_ideas ti
  where ti.status = 'brought_to_founder'
    and ti.title not ilike '%qa %'
    and ti.title not ilike '%playwright%'
    and coalesce(ti.description, '') not ilike '%playwright%'
    and coalesce(ti.description, '') not ilike '%qa script%'

  union all

  -- Any team: real tasks past their own target date, not yet done.
  select
    'team_task_overdue'::text,
    tt.title,
    initcap(tt.team) || ' team -- was due ' || to_char(tt.target_date, 'DD Mon YYYY'),
    tt.updated_at
  from public.team_tasks tt
  where tt.status <> 'done'
    and tt.target_date is not null
    and tt.target_date < current_date

  union all

  -- Outreach: contacts logged as "contacted" with no status change in 14+
  -- days -- a real, computed staleness check, not a guess.
  select
    'outreach_contact_stalled'::text,
    oc.entity_name,
    initcap(oc.entity_type) || ' -- contacted ' || to_char(oc.contacted_at, 'DD Mon YYYY') || ', no response logged since',
    oc.contacted_at
  from public.outreach_contacts oc
  where oc.status = 'contacted'
    and oc.contacted_at < now() - interval '14 days'

  order by flagged_at desc nulls last;
end; $$;

revoke execute on function public.get_co_director_pending_decisions() from public, anon;
grant execute on function public.get_co_director_pending_decisions() to authenticated;

comment on function public.get_co_director_pending_decisions() is
  'Co-Director Dashboard''s one new query -- a company-wide rollup of real items genuinely flagged for leadership sign-off: Legal contracts needing a fix, open Finance money requests, Tech ideas escalated to the founder (excluding leftover Playwright-QA scratch rows from a prior phase, see this migration''s header), and a real computed "stuck" check on team_tasks (overdue by target_date) and outreach_contacts (contacted 14+ days ago, no status change since). Returns zero rows, not a placeholder, when genuinely nothing is pending -- checked live 2026-10-23, that is the honest answer today.';
