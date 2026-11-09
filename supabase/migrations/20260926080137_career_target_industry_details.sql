-- ═══════════════════════════════════════════════════════════════════════════
-- career_targets.industry_details — the real per-industry questionnaire
--
-- Every generator has always had access to the SAME two industry inputs
-- regardless of what field the student is actually in: target_industry (one
-- string) and the generic profile education/experience blocks. That is
-- enough for most fields, but for the ~13 regulated or phase-based industries
-- now in the vocabulary (Healthcare, Law, Education, Engineering,
-- Construction, Social Work, Real Estate, Agriculture and Veterinary, Skilled
-- Trades, Insurance and Actuarial, Aviation and Logistics, Beauty, Finance)
-- there is a single, specific, checkable fact — a registration status, a
-- licence category, an exam stage, an apprenticeship phase — that the
-- industry_intelligence must_have rows in this table already say, over and
-- over, is the single most important thing to name precisely. A student
-- typing free-text "responsibilities" has no reason to think to volunteer
-- "NMBI PIN held" or "Phase 4 Electrical" there, so the generator never sees
-- it and falls back to generic advice instead of the specific fact.
--
-- industry_details is a small jsonb object, keyed by the question's own
-- label ("Registration status", "Trade and current phase") rather than a
-- fixed set of columns — the actual question set lives entirely in
-- src/lib/industryQuestionnaires.js (frontend only; no backend mirror is
-- needed, unlike the controlled industry vocabulary, because this data flows
-- through as self-describing key/value pairs rather than being resolved by
-- logic on both sides). Scoped to career_targets, not career_profiles,
-- because the whole point is per-application accuracy: a student targeting
-- both a Real Estate role and a Skilled Trades apprenticeship at once has two
-- different sets of facts, not one.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.career_targets
  add column if not exists industry_details jsonb not null default '{}'::jsonb;

comment on column public.career_targets.industry_details is
  'Answers to the industry-specific questionnaire (src/lib/industryQuestionnaires.js), keyed by question label. Empty object where the target''s industry has no questionnaire or none has been answered yet.';
