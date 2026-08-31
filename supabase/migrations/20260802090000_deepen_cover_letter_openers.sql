-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen example_library: a second cover_letter_opener per industry
--
-- generate-cover-letter calls fetchIndustryExamples(supabase,
-- 'cover_letter_opener', industry, 2) — asks for 2 per generation. Every
-- industry had exactly 1, and the 'general' bucket it tops up from also had
-- only 1 — so every single cover letter generated so far was calibrating on
-- one industry opener plus one generic opener, never two genuinely different
-- industry-specific approaches to choose a style from.
--
-- Rather than write 15 near-duplicates of what already exists, the new row
-- per industry is a deliberately different opening strategy: the existing set
-- mostly leads with a stated credential or a reflective motivation
-- ("I registered with NMBI...", "My final-year project was on..."); the new
-- set leads with a single concrete achievement instead — a real, established
-- alternative in cover-letter craft, not an arbitrary second example. Giving
-- the model two legitimate, distinct strategies to draw from is more useful
-- than doubling down on one.
--
-- The 'general' bucket every unmapped industry falls back to had the same
-- problem — one row, so a student whose field genuinely doesn't map to any of
-- the 15 got the least variety of anyone. Given a second row here too.
--
-- Same discipline as the rest of this table: platform-authored, illustrative
-- composites, internally consistent with the must_haves/real_entities already
-- seeded per industry, excluded from student-facing citations by
-- citableSources().
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

('cover_letter_opener', 'general', 'achievement_led',
 'As secretary of a college society, I rebuilt our event sign-up process after realising the old paper-sheet system was losing roughly a third of interested members between sign-up and attendance, and switched it to a simple digital form with an automatic reminder the day before; turnout on the next three events rose noticeably. I like finding the unglamorous process problem behind a bigger symptom and actually fixing it, which is the habit I would bring to this role.',
 'A specific, measured process fix that works regardless of field — useful precisely because it demonstrates a transferable habit of mind rather than any industry-specific credential.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Business and Management', 'achievement_led',
 'I grew a college society''s sponsorship income from €900 to €4,200 in one academic year by moving from single-event asks to a three-tier annual package pitched to eleven local businesses. It is the kind of unglamorous commercial problem — turning a relationship into a repeatable, structured deal — that I want your graduate scheme to give me more of, at a larger scale.',
 'Opens with a specific, quantified result rather than a stated interest, then explicitly names the transferable skill behind it and connects it to what the role needs.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Construction and Architecture', 'achievement_led',
 'On placement I tracked variation orders against the original bill of quantities for a school extension and flagged a cumulative 6% cost creep before it reached the client-facing cost report. Catching that kind of drift early, before it becomes someone else''s problem, is the part of quantity surveying I want to keep doing — which is why I am applying to a practice that puts graduates on live cost management from day one.',
 'Leads with a specific, checkable number and a real professional habit (catching drift early) rather than a general statement of interest in construction.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Creative and Media', 'achievement_led',
 'A campus festival livestream I helped run had no realistic staffing for the plan we had three days out, so I rewrote it around a two-person hybrid format instead of the six-person plan on paper and it ran without a hitch. That is roughly how I want to keep working — solving the real production problem in front of me rather than the idealised one — and it is why your production team, not just your design team, is who I am writing to.',
 'A concrete production crisis and a specific fix, closing on a precise statement of which part of the company the letter is actually targeting.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Education and Teaching', 'achievement_led',
 'On placement I introduced a three-station numeracy rotation for a mixed-ability 4th class; six of the eight pupils on the support list met their term target, and the class teacher kept using the model after I left. What I took from that was less about the specific technique and more about how much differentiation actually needs to be planned into the lesson from the start, not added on afterwards for the pupils who struggle.',
 'A specific, measured classroom outcome, followed by a genuine pedagogical reflection rather than a generic statement about "loving teaching".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Engineering', 'achievement_led',
 'A lab test procedure I inherited on placement had a 22% first-pass fail rate; asking the technicians who actually used it daily surfaced three unclear steps nobody had flagged upward, and the revised procedure ran at 4% over the following forty tests. That instinct — go and ask the people closest to the problem before redesigning anything — is what I want to keep applying, at a larger scale than a placement year allows.',
 'A specific before-and-after number tied to a genuine engineering habit (consulting the people who use the process), which is more persuasive than a claim of "strong problem-solving skills".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Finance and Accounting', 'achievement_led',
 'As treasurer of a college society with a €14,000 annual budget, I found our bank balance diverging from the ledger by €380 and rebuilt the reconciliation from source receipts rather than adjusting the books to match. It turned out two sponsorship payments had been recorded gross while the bank had netted a card fee — a small thing, but exactly the kind of discrepancy I would rather chase down than explain away, which is the instinct I understand audit actually requires.',
 'A specific, real discrepancy and the discipline of investigating rather than plugging it — the exact instinct audit and assurance roles are trying to screen for at interview.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Healthcare and Nursing', 'achievement_led',
 'During a night placement shift I reassessed a patient''s NEWS score at 15-minute intervals after noticing it trending upward, rather than waiting for the scheduled round, and escalated to the CNM — the patient was transferred to HDU within the hour. That decision to trust what the numbers were telling me over the routine schedule is the clinical judgement I want to keep building, on a ward where I would be trusted to exercise it.',
 'A specific clinical escalation with a real, non-routine judgement call at its centre, which reads as clinical readiness rather than a general statement of caring about patients.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Hospitality and Tourism', 'achievement_led',
 'Moving a coach party of 40 who arrived 90 minutes early into the function room, switching them to the set menu, and serving drinks in the lobby while it was prepared let a full à la carte service run undisturbed around them the same afternoon. Solving that kind of live operational problem, calmly and without anyone downstream noticing there had been one, is the actual job — and it is why I am applying to a property that runs events and à la carte side by side rather than one or the other.',
 'A specific operational rescue with a clear before/after, and a closing line that shows real understanding of what the target property actually does day to day.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Law', 'achievement_led',
 'Reviewing 40 commercial leases during a due diligence placement, I flagged six with change-of-control clauses the client had not been aware of before the review — the kind of detail that does not show up unless someone actually reads every page rather than skims for the obvious terms. That is the standard of attention I understand this profession runs on, and it is what I would bring to a training contract with your firm.',
 'A specific, consequential finding from real document review work, which demonstrates the exact diligence the profession expects rather than asserting "attention to detail" as a trait.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Marketing and Communications', 'achievement_led',
 'A product launch I worked on was set to go live the same week a competitor announced a near-identical product, so two days out I reworked the campaign angle around a genuine differentiator we had been under-emphasising; it outperformed our previous three campaigns on click-through rate. I would rather be the person finding that angle under real pressure than the person executing a brief someone else wrote, which is why I am applying for a strategy-adjacent role rather than a pure execution one.',
 'A specific competitive crisis solved under real time pressure, with a precise statement of what kind of role the candidate actually wants and why — sharper than a general "passionate about marketing" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Public Sector and Civil Service', 'achievement_led',
 'Auditing 200 completed intake forms for a Citizens Information outreach service, I found two questions accounted for most incomplete referrals because both asked for information people rarely had to hand; redrafting them to accept partial answers with a follow-up prompt cut incomplete referrals by roughly a third within two months. That is the kind of evidence-led, citizen-facing improvement I understand the Capability Framework is actually trying to recruit for, not just describe.',
 'A specific, measured process improvement with a genuine public-value framing, and a direct, correctly-named reference to the actual current assessment framework rather than generic public-sector language.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Science and Research', 'achievement_led',
 'Optimising an ELISA protocol for a final-year project, I brought the inter-assay coefficient of variation from 18% to 7% across thirty replicates by standardising blocking time and switching to plate-sealed incubation — the unglamorous, protocol-level work that most write-ups skip past but that determines whether a result can actually be trusted. That is the level of rigour I want to keep applying in a QC environment, where it is the whole job rather than a section of a thesis.',
 'A specific, quantified methods improvement that demonstrates real technical rigour, connected explicitly to why that rigour matters in the target (QC/regulated) environment.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Social Work and Community', 'achievement_led',
 'Noticing that several families on my caseload were missing appointments because our standard letters went out only in English, I raised it with my supervisor and, with her sign-off, sourced a translated version through the organisation''s existing interpreter service; missed appointments among those families dropped noticeably within two months. Fixing a barrier like that through the proper channel, rather than working around it informally, is the kind of practice I want to keep building within a statutory service.',
 'A specific systemic barrier identified and fixed through appropriate escalation, showing both initiative and correct professional process — both of which values-based recruitment specifically probes for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Sports and Fitness', 'achievement_led',
 'When a client I had programmed a strength block for was diagnosed with a minor cardiac irregularity two weeks in, I redesigned the remaining ten weeks around volume and technique work rather than intensity, deferring to the GP''s guidance rather than the client''s own read of it, and cleared them back to normal programming once given the all-clear. Working within that kind of real medical constraint, rather than around it, is the discipline I want a facility that takes scope of practice seriously to see in me.',
 'A specific scope-of-practice decision under a genuine medical constraint, which is exactly what separates a qualified coach from an enthusiastic one in this field''s screening.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Technology and Software', 'achievement_led',
 'A production bug corrupting user data intermittently — roughly once in fifty saves, never reproducible under a debugger — took two days of structured logging to pin down to a race condition between two async writes, and fixing it eliminated the bug entirely across a month of monitoring. I would rather spend two days on patient, evidence-based diagnosis than guess at a fix, which is the engineering habit I want a team that takes production reliability seriously to see before anything else.',
 'A specific, honestly-timed debugging story (including admitting it took two days) that demonstrates real engineering discipline far more convincingly than a claim of strong problem-solving skills.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
