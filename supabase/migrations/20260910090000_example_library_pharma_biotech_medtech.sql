-- ═══════════════════════════════════════════════════════════════════════════
-- example_library for the 28th industry: Pharmaceuticals, Biotechnology and
-- Medical Devices
--
-- Matched to each generator's actual fetch limits (cv_bullet 3,
-- cover_letter_opener 2, linkedin_headline 2, linkedin_about 1 — grepped
-- directly from generate-linkedin/index.ts, not trusted from an older
-- migration comment — but seeded at 2 here for variety, matching every
-- other industry's row count in this table; star_answer fetches 3 total
-- across any CORE_COMPETENCIES tag match, seeded here across 2 distinct
-- tags, matching the pattern every prior wave used).
--
-- All rows platform-authored composites, internally consistent with the
-- industry_intelligence facts seeded alongside this migration (GMP,
-- HPRA's Manufacturer's Authorisation and inspection process, CAPA/
-- deviation/batch record vocabulary, ISO 13485, and a named real degree
-- route — Biopharmaceutical Chemistry). No real employer is named in the
-- exemplar text itself, matching the convention every prior wave used
-- (generic "a fill-finish line", "a site's internal GMP audit" rather than
-- a named company) — the real employers and their names belong in
-- industry_intelligence's real_entity rows, not fabricated into a
-- student's example CV bullet. Excluded from student-facing citations by
-- citableSources() via the platform_authored provenance tag.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

('cv_bullet', 'Pharmaceuticals, Biotechnology and Medical Devices', 'quality_control',
 'Investigated a rising batch deviation rate on a fill-finish line during a GMP manufacturing placement, tracing the pattern back to a single seal-integrity check running out of calibration, and closed the resulting CAPA within the site''s 30-day target — bringing the deviation rate down from 2.1% to 0.6% over the following two months.',
 'A specific, comparable deviation-rate metric with a genuine root-cause diagnosis and the real CAPA vocabulary is exactly the evidence a GMP quality reviewer reads a CV for, rather than a general "quality experience" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Pharmaceuticals, Biotechnology and Medical Devices', 'compliance',
 'Prepared batch records and supporting documentation ahead of a site''s internal GMP audit, resolving 5 of 7 open observations from the previous audit before the auditor arrived and briefing the production team on the two that remained open.',
 'Naming the real audit and documentation vocabulary (batch records, open observations) and a specific, checkable audit-prep result demonstrates genuine GMP compliance competence, not just "worked in a regulated environment".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Pharmaceuticals, Biotechnology and Medical Devices', 'process_development',
 'Validated a faster HPLC assay method as part of a final-year Biopharmaceutical Chemistry research project, reducing assay turnaround time from 48 hours to 6 hours without loss of accuracy against the reference method.',
 'A specific analytical technique, a real named degree route, and a comparable before/after turnaround figure make this far stronger evidence than "completed a research project".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Pharmaceuticals, Biotechnology and Medical Devices', 'achievement_led',
 'Tracing a fill-finish line''s rising deviation rate back to a single seal-integrity check running out of calibration, rather than accepting the broader "process variability" explanation already on file, closed the CAPA within the site''s own 30-day target and brought the deviation rate from 2.1% down to 0.6%. That is the root-cause discipline I want to bring to a quality or manufacturing role at a larger GMP site.',
 'A specific, measured deviation-rate result grounded in real root-cause diagnosis is a far stronger opener than a general statement of interest in the pharmaceutical or medtech sector.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Pharmaceuticals, Biotechnology and Medical Devices', 'achievement_led',
 'Validating a faster HPLC assay method during my final-year Biopharmaceutical Chemistry research project — cutting turnaround from 48 hours to 6 without losing accuracy against the reference method — showed me how much a genuinely better method can change what a lab team gets through in a day. That is the process-improvement mindset I want to bring to an analytical or process development role in this sector.',
 'A specific, quantified analytical result tied to a real degree route demonstrates genuine technical capability, stronger than a general claim of "strong lab skills".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Pharmaceuticals, Biotechnology and Medical Devices', null,
 'Biopharmaceutical Chemistry graduate | GMP manufacturing placement | Deviation rate cut 2.1% to 0.6%',
 'A specific, comparable GMP deviation metric and a named degree route are exactly what a pharma or medtech hiring manager scans a profile for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Pharmaceuticals, Biotechnology and Medical Devices', null,
 'Quality placement | GMP audit preparation | Closed 5 of 7 open observations',
 'Names the real GMP audit vocabulary and a specific, checkable result rather than a generic "quality experience" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Pharmaceuticals, Biotechnology and Medical Devices', null,
 'Biopharmaceutical Chemistry graduate. On a GMP manufacturing placement I traced a fill-finish line''s rising deviation rate back to a single seal-integrity check running out of calibration, closing the CAPA within the site''s 30-day target and bringing the rate from 2.1% to 0.6%. I''m most interested in the root-cause side of quality work — finding the actual mechanism behind a deviation rather than writing it off as normal process variability. Looking for quality or manufacturing graduate roles in a GMP-regulated environment.',
 'A specific, quantified deviation result grounded in real diagnostic work is far more persuasive than a general "detail-oriented" self-description.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Pharmaceuticals, Biotechnology and Medical Devices', null,
 'Biopharmaceutical Chemistry graduate. My final-year research project validated a faster HPLC assay method, cutting turnaround from 48 hours to 6 without losing accuracy against the reference method. I like the analytical side of this field as much as the process side — finding a genuinely better method, not just running the existing one faster. Open to analytical, process development or quality graduate roles across pharma, biotech or medtech.',
 'A specific analytical achievement with a real technique named reads as genuine technical grounding, not just interest in the sector.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Pharmaceuticals, Biotechnology and Medical Devices', 'Problem Solving',
 'A fill-finish line''s batch deviation rate had crept up to 2.1% and the standing explanation was general process variability, which nobody had actually tested against the data. Rather than accepting that, I pulled the deviation records by equipment station and found the pattern tracked to a single seal-integrity check that had drifted out of calibration, not the line as a whole. Recalibrating that one station and building a daily check into the shift handover brought the deviation rate down to 0.6% within two months, and the CAPA closed inside the site''s own 30-day target.',
 'Refusing to accept a vague, unverified explanation and finding the actual mechanism in the data is exactly the root-cause thinking quality and manufacturing roles in this field are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Pharmaceuticals, Biotechnology and Medical Devices', 'Attention to Detail',
 'While preparing batch record documentation ahead of a site''s internal GMP audit, I noticed one open observation from the previous audit had been marked resolved in the tracker, but the corrective action it referenced wasn''t actually documented anywhere in the batch records it was meant to cover. Rather than assuming the tracker was right, I checked the physical records directly and confirmed the fix had never actually been implemented on the floor. Flagging it before the audit meant it was closed properly instead of being caught as a repeat finding.',
 'Catching a real, unresolved documentation gap by checking the underlying record rather than trusting the tracker is exactly the vigilance GMP compliance roles require.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
