-- ═══════════════════════════════════════════════════════════════════════════
-- Two correctness fixes found while auditing what was actually being asked
-- for "deepen the industry intelligence content" — both real, both silent.
--
-- ── Bug 1: every authored STAR-answer example was unreachable ──────────────
-- fetchCompetencyExamples() — the function generate-application-answers and
-- generate-interview-prep actually call — filters star_answer rows by
-- `competency_tag in (...)` against CORE_COMPETENCIES / CIVIL_SERVICE_CAPABILITIES
-- from _shared/competencyBank.ts (exact strings: 'Teamwork', 'Leadership', …).
-- It does NOT filter by industry at all — industry-specific star_answer content
-- was only ever going to be a coincidental match to begin with.
--
-- The 17 star_answer rows seeded in 20260729110000 used ad-hoc snake_case tags
-- ('attention_to_detail', 'delivery_of_results', …) that match none of those
-- strings. Verified by running the actual query used in production against the
-- seeded data: of 15 authored rows, exactly 0 were reachable; only 3
-- pre-existing 'general' rows (correctly cased) were ever returned.
--
-- Fixed by retagging to the canonical vocabulary. Five rows converge on
-- "Attention to Detail" — a real, frequently-tested competency (checking
-- drawings, valuations, reconciliations, growth curves, legal authority) that
-- had no home in the original 8-item list, so it's added as a 9th core
-- competency in competencyBank.ts rather than mis-tagged to something close.
--
-- Three Public Sector rows are retagged to the CURRENT four-capability names
-- (see Bug 2) rather than the superseded six-heading ones they were written
-- against.
--
-- ── Bug 2: the Public Sector industry_intelligence rows cite a superseded
--    framework ──────────────────────────────────────────────────────────────
-- competencyBank.ts already correctly names the current Irish Civil Service
-- framework (Building Future Readiness / Leading and Empowering / Evidence
-- Informed Delivery / Communicating and Collaborating) — a prior session's
-- comment there even notes an earlier mistake was corrected. The Public Sector
-- rows added to industry_intelligence in 20260729090000 were written against a
-- different, older model (Delivery of Results / Interpersonal and
-- Communication Skills / Specialist Knowledge Expertise and Self Development /
-- Drive and Commitment to Public Service Values / People Management / Analysis
-- & Decision Making), sourced to Executive_Officer_Competencies.pdf.
--
-- Verified via web search against gov.ie directly: "The 2024 Capability
-- Framework replaced the older Competency Framework" — so the two files in
-- this codebase were citing two different, non-contemporaneous frameworks to
-- the model at once. Rewritten here to match competencyBank.ts's framework and
-- wording exactly, re-sourced to the current publicjobs.ie framework page.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Bug 1: retag the 17 star_answer rows ────────────────────────────────────

update public.example_library set competency_tag = 'Attention to Detail'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry in ('Construction and Architecture', 'Engineering', 'Finance and Accounting', 'Law', 'Science and Research')
   and competency_tag = 'attention_to_detail';

update public.example_library set competency_tag = 'Leadership'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Business and Management' and competency_tag = 'leadership';

update public.example_library set competency_tag = 'Resilience'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Creative and Media' and competency_tag = 'resilience';

update public.example_library set competency_tag = 'Adaptability'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Education and Teaching' and competency_tag = 'adaptability';

update public.example_library set competency_tag = 'Communication'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry in ('Healthcare and Nursing', 'Sports and Fitness') and competency_tag = 'communication';

update public.example_library set competency_tag = 'Problem Solving'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Hospitality and Tourism' and competency_tag = 'problem_solving';

update public.example_library set competency_tag = 'Initiative'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Marketing and Communications' and competency_tag = 'initiative';

update public.example_library set competency_tag = 'Teamwork'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Technology and Software' and competency_tag = 'teamwork';

-- Social Work: the story is a boundary correctly held in a young person's
-- interest — the closest real competency in the list is client/stakeholder
-- focus, not a bespoke "professional boundaries" tag with no matching prompt
-- vocabulary anywhere.
update public.example_library set competency_tag = 'Client / Stakeholder Focus'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Social Work and Community' and competency_tag = 'professional_boundaries';

-- Public Sector: retagged onto the CURRENT four-capability names (matching
-- competencyBank.ts exactly), not the superseded six-heading model these were
-- originally written against.
update public.example_library set competency_tag = 'Communicating and Collaborating'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Public Sector and Civil Service' and competency_tag = 'interpersonal_communication';

update public.example_library set competency_tag = 'Evidence Informed Delivery'
 where category = 'star_answer' and provenance = 'platform_authored'
   and industry = 'Public Sector and Civil Service'
   and competency_tag in ('delivery_of_results', 'analysis_decision_making');

-- ── Bug 2: correct the Public Sector industry_intelligence framework ───────

update public.industry_intelligence set
  content = 'The Public Appointments Service runs centralised recruitment for the Civil Service and much of the wider public service. The Civil Service Capability Framework, launched February 2024, replaced the older six-heading Competency Framework and now governs how applications and interviews are assessed. At Executive Officer level it defines four capabilities — Building Future Readiness, Leading and Empowering, Evidence Informed Delivery, Communicating and Collaborating — each with published sub-dimensions, assessed alongside strengths, values and motivation rather than competency evidence alone. Applications are scored against these capabilities, so an answer that does not address the capability it sits under scores nothing regardless of how strong the story is.',
  source_name = 'Public Appointments Service — Civil Service Capability Framework, Executive Officer level',
  source_url = 'https://www.publicjobs.ie/en/information-hub/capability-framework/executive-officer'
 where industry = 'Public Sector and Civil Service' and dimension = 'screening_mechanism';

update public.industry_intelligence set
  content = 'One structured, specific example per capability, written against that capability as published for the grade — Building Future Readiness, Leading and Empowering, Evidence Informed Delivery, and Communicating and Collaborating at Executive Officer level. Evidence of public service values — impartiality, accountability, service to the citizen. Any prior public, civil, or voluntary service named. Irish language ability where the role attracts it.',
  source_name = 'Public Appointments Service — Civil Service Capability Framework',
  source_url = 'https://www.publicjobs.ie/en/information-hub/capability-framework/executive-officer'
 where industry = 'Public Sector and Civil Service' and dimension = 'must_have';

update public.industry_intelligence set
  content = 'Private-sector framing with no public value dimension — profit and growth language where accountability and service should be. One generalised answer stretched across several capabilities instead of a distinct example per capability. No reference to the current Capability Framework at all, which reads as not having opened the published model — including citing the old Competency Framework headings, which the 2024 framework replaced. Vague "we" narration that never isolates the applicant''s own contribution.',
  source_name = 'Public Appointments Service — Civil Service Capability Framework',
  source_url = 'https://www.publicjobs.ie/en/information-hub/capability-framework/executive-officer'
 where industry = 'Public Sector and Civil Service' and dimension = 'red_flag';

update public.industry_intelligence set
  content = 'Answer in the first person singular, against the capability, with a bounded example. Assessors score what you personally did, so "I redesigned the intake form after auditing 200 submissions, cutting incomplete applications by a third" scores where "our team improved the process" does not. Name the capability being evidenced explicitly rather than leaving the assessor to infer it.',
  source_name = 'Public Appointments Service — Civil Service Capability Framework',
  source_url = 'https://www.publicjobs.ie/en/information-hub/capability-framework/executive-officer'
 where industry = 'Public Sector and Civil Service' and dimension = 'wording_convention';
