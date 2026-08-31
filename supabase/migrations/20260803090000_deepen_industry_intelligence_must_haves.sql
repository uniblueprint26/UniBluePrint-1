-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen industry_intelligence: a second must_have per industry
--
-- Every industry has carried exactly one row per dimension since the original
-- seed. Unlike example_library (platform-authored calibration text, never
-- shown to a student as a source), these rows ARE surfaced to students —
-- citableSources() only filters out platform_authored example_library rows;
-- industry_intelligence has no provenance column because every row here is
-- meant to be a real, checkable claim. That sets a higher bar than the last
-- three migrations: every fact below was individually verified against the
-- issuing body or a corroborating source before being written, the same
-- discipline as the original Part 3 seed.
--
-- must_have was chosen over the other four dimensions because it is the one
-- review-cv explicitly checks a CV against by name, and generate-cover-letter
-- explicitly instructs the model to surface where the student's own input
-- supports one — so a second, genuinely distinct fact per industry has direct
-- downstream effect, not just more text in the prompt.
--
-- A pattern worth naming: five of these are continuing-professional-
-- development hour requirements for the field's registering body (Engineers
-- Ireland 35h, SCSI 20h/RIAI 40h, Law Society 25h, CORU 30 credits) — a fact
-- type the original seed didn't capture anywhere, useful because a graduate
-- CV that shows awareness of the post-qualification obligation, not just the
-- entry qualification, reads as more professionally credible. Three are
-- mandatory Garda vetting requirements under the National Vetting Bureau
-- (Children and Vulnerable Persons) Acts 2012–2016 — a legal requirement
-- (criminal offence to work without it since 29 April 2016) that applies
-- across several of these fields but had only been mentioned as a checklist
-- item, never named with its statutory basis.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

('Technology and Software', 'must_have',
 'A live, reachable project — a deployed link, not just a GitHub repository nobody has run — is close to a baseline expectation for a junior developer CV now, because it is the one claim on a technology CV a reviewer can actually verify in under a minute. Pair it with a short technical note on the specific problem it solved, not just a feature list.',
 'ResumeAdapter — software engineer resume keywords (2026 ATS data)', 'https://www.resumeadapter.com/blog/software-engineer-resume-keywords'),

('Engineering', 'must_have',
 'Engineers Ireland requires members to undertake a minimum of 35 hours of Continuing Professional Development per year to maintain and develop their professional knowledge, skills and expertise — the obligation continues well past the entry qualification. A graduate CV that shows awareness of this (e.g. naming a specific short course or standards-committee involvement already completed) signals a longer-term view of the profession than the degree alone does.',
 'Engineers Ireland — CPD Policy', 'https://www.engineersireland.ie/Professionals/CPD-Careers/Record-My-CPD/CPD-policy'),

('Healthcare and Nursing', 'must_have',
 'Garda vetting is a legal requirement under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012–2016 for any role with contact with children or vulnerable adults, which covers essentially every patient-facing healthcare post in Ireland — it has been a criminal offence to work without vetting clearance since 29 April 2016. State Garda vetting status explicitly on the application rather than assuming it is implied by the role; the HSE will not start a new employee in post until clearance is confirmed.',
 'HSE — Garda Vetting (recruitment process)', 'https://about.hse.ie/jobs/hse-recruitment-process/garda-vetting/'),

('Finance and Accounting', 'must_have',
 'Online numerical and verbal reasoning assessments (commonly SHL-format or an equivalent provider) are a standard early screening stage at the Big 4 and the main Irish banks, often run before or alongside CV review rather than after an initial interview. Candidates who prepare for these specifically — timed, data-table-based questions — consistently outperform those who assume strong college grades alone will carry them through.',
 'JobTestPrep — SHL Numerical Reasoning Test practice guidance', 'https://www.jobtestprep.co.uk/shl-numerical-test-examples'),

('Law', 'must_have',
 'Solicitors holding a Practising Certificate must complete 25 hours of Continuing Professional Development per cycle under the Law Society''s CPD Scheme (raised from 20 hours in 2024), with fixed minimums in specific categories — at least 3 hours in Client Care and Professional Standards, at least 5 in Professional Development and Solicitor Wellbeing. A training contract candidate is not yet subject to this, but understanding that qualification is the start of an ongoing obligation, not the end of one, is worth demonstrating awareness of at interview.',
 'Law Society of Ireland — Continuing Professional Development Scheme', 'https://www.lawsociety.ie/globalassets/documents/cpd-scheme/2023-cpd-scheme-booklet.pdf'),

('Education and Teaching', 'must_have',
 'Cosán — the Irish word for "pathway" — is the Teaching Council''s national framework for teachers'' professional learning, which follows on from Droichead once induction is complete. It is built on two standards: quality teaching and learning, and continued professional growth. A newly qualified teacher naming Cosán, correctly, alongside Droichead status signals genuine familiarity with the profession''s actual structures rather than just its entry requirements.',
 'The Teaching Council — Professional Learning (Cosán)', 'https://www.teachingcouncil.ie/professional-learning/cosan/'),

('Business and Management', 'must_have',
 'Graduate schemes at large employers frequently include an online aptitude stage — numerical, verbal, and increasingly situational judgement testing — before or alongside CV screening, not only at interview. Candidates who treat this as a real, preparable stage (rather than an afterthought behind the CV and cover letter) consistently progress further, since a strong application can still be screened out here.',
 'gradireland — graduate recruitment in Ireland', 'https://gradireland.com/'),

('Creative and Media', 'must_have',
 'Alongside a live portfolio link, a compact PDF or case-study deck — a handful of projects each with brief, its constraint, and the outcome — is increasingly what gets opened and actually read during a first screen, where a live site sometimes does not (broken links, slow loads, or simply not being clicked). Having both available, not just the live version, removes a real point of friction in getting the work actually seen.',
 'Design & Crafts Council Ireland', 'https://www.dcci.ie/'),

('Science and Research', 'must_have',
 'Many Level 8 science degrees in Ireland include a mandatory placement or workplace-experience module, typically in third year, running for six or twelve months. Where this was completed, it should be named explicitly with the host organisation and what was actually done there — it is frequently the single strongest piece of evidence a graduate science CV has, and is often under-described relative to academic project work.',
 'University College Cork — Work Placements and Workplace Experience', 'https://www.ucc.ie/en/cacsss/employability/workplacementsandworkplaceexperience/'),

('Construction and Architecture', 'must_have',
 'Both registration bodies require ongoing Continuing Professional Development to maintain chartered status: SCSI members must record 20 hours per calendar year, RIAI-registered architects at least 40 hours per year with 20 of those structured and logged on the MyRIAI platform. As with the equivalent engineering and legal requirements, this is not something a graduate applicant is yet subject to, but naming awareness of it signals a genuine, longer-view interest in the registered professional pathway rather than the qualification alone.',
 'Society of Chartered Surveyors Ireland — CPD Monitoring', 'https://scsi.ie/cpd-monitoring/'),

('Hospitality and Tourism', 'must_have',
 'Responsible Serving of Alcohol (RSA) certification is expected for any role on a licensed premises that involves serving alcohol — pubs, hotels, restaurants — and is a short, specific, checkable credential to name on a CV rather than leave implied by "bar experience". Its absence for a role that clearly requires it reads as a gap a candidate has not thought to close.',
 'RSA Online / Alcohol.ie — Responsible Serving of Alcohol training', 'https://www.alcohol.ie/'),

('Public Sector and Civil Service', 'must_have',
 'The Public Appointments Service runs its online testing stage — typically a critical analysis test and a situational judgement test, at Executive Officer level around 30 minutes — through the TestReach platform, before candidates reach interview. This is a real, preparable stage in its own right, distinct from the competency-based interview that follows, and candidates who treat it as an afterthought behind the application form are frequently screened out before a panel ever sees them.',
 'Public Appointments Service — Test Advice', 'https://www.publicjobs.ie/en/information-hub/our-recruitment-process/test-advice'),

('Social Work and Community', 'must_have',
 'CORU requires registered social workers to achieve 30 CPD credits in every 12-month period, self-determined on the basis that one hour of new or enhanced learning equals one credit, applying equally whether working full-time or part-time. As with the other CORU-regulated and Law/Engineering/Construction equivalents, a graduate applicant is not yet held to this, but demonstrating awareness of the ongoing obligation — not just the entry registration — signals genuine professional understanding.',
 'CORU — Continuing Professional Development for Social Workers', 'https://www.coru.ie/health-and-social-care-professionals/continuing-professional-development/cpd-for-social-workers/'),

('Sports and Fitness', 'must_have',
 'Garda vetting is a legal requirement under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012–2016 for any coaching role involving ongoing contact with under-18s — it has been a criminal offence to work in such a role without vetting clearance since 29 April 2016, and most national governing bodies (e.g. Athletics Ireland) require it to be refreshed periodically, commonly every three years. State vetting status explicitly for any coaching application involving minors rather than leaving it assumed.',
 'Athletics Ireland — Garda Vetting Policy', 'https://www.athleticsireland.ie/child-welfare/garda-vetting-policy/'),

('Marketing and Communications', 'must_have',
 'The Chartered Institute of Marketing (CIM) — the world''s largest professional body for marketers, with an active Ireland regional presence — offers a qualifications pathway toward Chartered Marketer status that progresses from entry-level roles through to senior strategic positions. It is not a hard entry requirement the way registration is in a regulated profession, but naming a CIM qualification held or in progress is a real differentiator few graduate applicants in this field think to include.',
 'CIM Ireland', 'https://regions.cim.co.uk/ireland/home/about/the-committee/');
