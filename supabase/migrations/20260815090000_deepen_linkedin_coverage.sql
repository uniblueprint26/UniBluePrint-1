-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen example_library: close the real LinkedIn coverage gap
--
-- Auditing what generate-linkedin actually fetches against what exists
-- turned up a genuine defect, not just thin coverage:
--
--   fetchIndustryExamples('linkedin_headline', industry, 2) and the
--   linkedin_about equivalent top up from industry = 'general' whenever the
--   student's own industry has fewer rows than the fetch limit. The
--   'general' bucket had ZERO rows for either category — so a student whose
--   industry could not be resolved at all (no stated industry, no course
--   match) got NO calibration example for their LinkedIn headline or About
--   section, not even generic filler. That is a hard gap, not a depth
--   preference.
--
--   Separately, 13 of the original 15 industries had exactly 1
--   linkedin_headline row against a fetch limit of 2, and 14 had exactly 1
--   linkedin_about row (limit 1, so technically "meeting" the floor, but
--   every one of the 12 industries added this session already carries 2 of
--   each) — the original 15 were quietly the shallowest-covered industries
--   in the table for this specific category, an artefact of when they were
--   seeded rather than any judgement that they need less.
--
-- This migration: 2 general-bucket rows per category (industry-agnostic,
-- concrete composites — same bar as the existing general cover_letter_opener
-- rows, not vague filler), plus a second linkedin_headline row for the 13
-- industries below the fetch limit and a second linkedin_about row for the
-- 14 industries at the bare floor, bringing every industry in the table to
-- parity on both categories.
--
-- Same discipline as the rest of this table: platform-authored, illustrative
-- composites, internally consistent with the must_haves/wording_conventions
-- already seeded per industry, excluded from student-facing citations by
-- citableSources().
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

-- ═══════════ general — closing the zero-coverage gap ═══════════

('linkedin_headline', 'general', null,
 'Final-year student (UCD) | Rebuilt a college society''s sign-up process, cut drop-off by a third | Open to graduate roles',
 'A specific, measured process fix works as a headline regardless of field, which is exactly what the general fallback needs to demonstrate real competence without any industry-specific credential to lean on.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'general', null,
 'Recent graduate | Delivered a 6-person capstone project on time after losing two team members with 3 weeks left | Seeking first graduate role',
 'A real, specific delivery story under genuine pressure is legible to any reader regardless of industry, unlike a generic "hardworking graduate" headline.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'general', null,
 'Final-year student. I rebuilt my college society''s event sign-up process after noticing the old paper-sheet system was losing roughly a third of interested members between sign-up and attendance — a simple digital form with an automatic reminder fixed most of the drop-off. I like finding the unglamorous process problem behind a bigger symptom and actually fixing it, and that is the habit I want a graduate role to give me more room for.',
 'A specific, measured process fix that works regardless of field — useful precisely because it demonstrates a transferable habit of mind rather than any industry-specific credential.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'general', null,
 'Recent graduate. My final-year capstone project needed six people to deliver a working prototype in eight weeks, and two members dropped out with three weeks left. Rather than forcing the original scope, I restructured the remaining work around what could realistically still be finished properly, and we delivered a smaller but fully working version on time. I would rather deliver something real and scoped down than something ambitious and late — open to graduate roles wherever that instinct is useful.',
 'A real project-rescue story under genuine constraint is a transferable, concrete signal of judgement, which is what a fully unresolved industry fallback most needs to carry.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ linkedin_headline — second row for the 13 industries below the fetch limit ═══════════

('linkedin_headline', 'Business and Management', null,
 'Commerce graduate (UCC) | Grew a college society''s sponsorship income €900 to €4,200 in one year | Open to 2027 graduate schemes',
 'A specific, quantified commercial result is exactly what a business graduate scheme recruiter scans a headline for, over a generic "commerce graduate" framing alone.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Construction and Architecture', null,
 'Civil Engineering placement graduate | €12m residential scheme, through RIBA Stages 3–4 | Safe Pass held',
 'Project scale and the actual work stage reached are the specific things this field''s recruiters filter on, named precisely rather than "construction experience".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Creative and Media', null,
 'Motion Designer (IADT) | After Effects, Cinema 4D | 3 short-form campaigns shipped for real clients',
 'Named tools and a real, shipped client outcome are more credible to a creative reviewer than a general "creative and passionate" self-description.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Education and Teaching', null,
 'Primary Teaching graduate (Marino) | B.Ed 2026 | Teaching Council registration in progress',
 'States the actual qualification and registration status precisely, the hard screen for this field, rather than a generic "aspiring teacher" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Engineering', null,
 'Mechanical Engineering graduate (UL) | HVAC retrofit design, 40% modelled energy reduction | Working toward Engineers Ireland',
 'A specific, quantified engineering result and the real registration pathway are what this field''s recruiters actually filter on.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Healthcare and Nursing', null,
 'General Nursing student, final year (UCD) | 400+ clinical placement hours | NMBI registration application in progress',
 'States clinical volume and actual registration status precisely, which is what a clinical recruiter is scanning for over a generic "caring nursing student" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Hospitality and Tourism', null,
 'Hotel Management graduate (TU Dublin) | Ran 120-cover Saturday service, 4-star property | HACCP certified',
 'Real scale (120 covers) and property standard (4-star) are the specific measures this field''s recruiters read a headline for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Law', null,
 'Law graduate (UCC) | FE-1: 5 of 8 papers passed | Interested in commercial litigation',
 'Exact exam progress and a specific practice-area interest read as genuine focus, stronger than a generic "aspiring solicitor" headline.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Marketing and Communications', null,
 'Digital Marketing graduate (DCU) | Grew Instagram engagement rate 1.9% to 4.4% | Google Ads certified',
 'A specific, comparable engagement metric and a named platform certification are what a marketing recruiter actually scans a headline for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Public Sector and Civil Service', null,
 'Local authority placement graduate | Housing services casework | publicjobs.ie Executive Officer applications in progress',
 'A specific placement setting (local authority housing) is a distinct, real signal alongside the actual application route, rather than repeating the same framework reference in every headline.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Science and Research', null,
 'Biochemistry graduate (NUIG) | Final-year project: enzyme kinetics assay optimisation | Seeking QC/QA pharma roles',
 'A specific technical project and a stated target role read as genuine direction, stronger than a generic "science graduate" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Social Work and Community', null,
 'Youth Work graduate (NUIG) | 2 years community programme coordination | Pursuing CORU registration (Social Care Worker)',
 'Real coordination experience and the actual registration pathway being pursued are precise, checkable signals in a values-based field.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Sports and Fitness', null,
 'GAA Strength & Conditioning coach | NCEF Level 6 | Currently programming for a minor hurling panel',
 'Names the real qualifying body (NCEF) and its level precisely, plus a specific, current coaching context, over a generic "fitness enthusiast" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ linkedin_about — second row for the 14 industries at the bare floor ═══════════

('linkedin_about', 'Business and Management', null,
 'International Business graduate (DCU). My final-year consultancy project was for a real Dublin SME — I recommended a pricing change the owner actually implemented, which taught me more about seeing a recommendation survive contact with a real decision-maker than any case study did. Comfortable in Power BI and SQL to a working level. Looking for 2027 graduate schemes in FMCG or retail.',
 'A recommendation that was actually implemented by a real business owner is a far stronger credibility signal than a hypothetical case-study project, and the closing line states precisely what is being sought.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Construction and Architecture', null,
 'Architectural Technology graduate (TU Dublin). My final-year project redesigned a community centre''s accessibility layout after auditing it against Part M building regulations myself, rather than relying on the original drawings. Working toward RIAI registration. I want to keep working on projects where accessibility is designed in from the brief, not added on as an afterthought.',
 'A specific regulatory audit performed independently, plus a genuine point of view about design priorities, reads as real professional judgement rather than a general interest in architecture.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Creative and Media', null,
 'Motion Design graduate (IADT). I shipped three short-form campaigns for real clients during a studio placement, one under a genuinely tight 48-hour turnaround from brief to delivery. I would rather talk through a specific creative constraint I solved than a portfolio of unconstrained personal work. Looking for junior motion or brand design roles.',
 'A specific, real production constraint (48 hours, real clients) demonstrates studio-readiness far more than a general claim of creativity.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Education and Teaching', null,
 'B.Ed graduate (Marino Institute), final placement in a DEIS school. I redesigned a phonics station rotation after noticing three pupils on the SEN support list weren''t engaging with the whole-class format — all three were reading at grade level by the end of term. Teaching Council registration application submitted. Looking for a mainstream or SEN-supportive primary post.',
 'A specific, measured pupil outcome tied to a real differentiation decision is what this field''s applications are actually read for, stronger than a general statement of loving teaching.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Engineering', null,
 'Mechanical Engineering graduate (UL). On placement I redesigned an HVAC system for a retrofit project, cutting modelled energy use by 40% against the building''s existing baseline — the kind of number I want to be able to point to, not just describe. Working toward Chartered Engineer with Engineers Ireland. Looking for graduate roles in building services or renewable-adjacent engineering.',
 'A specific, baselined result is worth more to an engineering reviewer than any adjective, and the chartership pathway is named precisely.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Finance and Accounting', null,
 'Finance graduate (UCD), CAP1 exempt. A summer insight day at a Big 4 firm left me most interested in transaction advisory — specifically watching a senior model three different acquisition scenarios live and explain which assumptions actually mattered to the outcome. Applying for a September 2027 training contract.',
 'A specific, slightly unexpected technical detail from the insight day proves genuine engagement rather than attendance alone, and exemption status is stated plainly.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Healthcare and Nursing', null,
 'General Nursing student, final year (UCD). Across 400+ clinical placement hours, the shift that taught me the most was escalating a patient''s deteriorating NEWS score against the scheduled round timing — the CNM later used it as a teaching example for the ward. NMBI registration application in progress. Looking for a graduate staff nurse post, medical or surgical.',
 'A specific clinical judgement call, later validated by a senior clinician, reads as genuine clinical readiness rather than a general statement of caring about patients.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Hospitality and Tourism', null,
 'Hotel Management graduate (TU Dublin), three placements across 4-star Irish properties. Running a 120-cover Saturday service as section lead in my final placement taught me that the difference between a smooth service and a chaotic one is almost entirely in the prep, not the service itself. HACCP certified. Looking for a graduate management programme with a hotel group.',
 'A specific operational insight from real, named-scale service work is far more credible than a general claim of thriving under pressure.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Law', null,
 'Law graduate (UCC), FE-1: five of eight papers passed. I followed a competition law matter closely enough to read the judgment twice — commercial litigation is the area I want to train in, not the broadest practice group by default. Applying for September 2027 training contracts.',
 'Exam progress stated precisely, and a specific matter referenced, proves genuine interest rather than a firm-agnostic application.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Marketing and Communications', null,
 'Digital Marketing graduate (DCU). I grew a college society''s Instagram engagement rate from 1.9% to 4.4% over one semester by switching from polished single-image posts to a weekly behind-the-scenes series — the less polished content consistently outperformed the polished version. Google Ads certified. Looking for graduate digital marketing or performance roles.',
 'A specific, counterintuitive result (less-polished content winning) demonstrates real platform understanding, not just a stated metric.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Public Sector and Civil Service', null,
 'BA Politics graduate (UCD), applying through publicjobs.ie for Executive Officer roles. A placement in a local authority''s housing section taught me that most citizen frustration isn''t with the policy itself but with not knowing where their own case stands — which is why I build every application around the Communicating and Collaborating capability specifically, not the framework in general.',
 'A specific, lived observation from real placement work is more persuasive than an asserted public-service value, and the exact capability named shows real framework literacy.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Science and Research', null,
 'Biochemistry graduate (NUIG). My final-year project optimised an enzyme kinetics assay with an inconsistent baseline between runs, tracing it back to inconsistent substrate pre-incubation timing — a small protocol fix that made the whole dataset usable. Comfortable in GraphPad Prism for analysis. Looking for QC/QA roles in the pharma or medtech sector.',
 'A specific, real protocol diagnosis is worth more to a research-literate reader than any adjective, and demonstrates the habit of mind QC/QA roles actually need.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Social Work and Community', null,
 'Youth Work graduate (NUIG), two years coordinating a community after-school programme. The most useful thing I learned wasn''t a specific intervention — it was how much a programme''s actual attendance depends on transport and timing logistics that have nothing to do with the programme content itself. Pursuing CORU registration as a Social Care Worker. Looking for community development or youth work roles.',
 'A genuine, slightly counterintuitive practice insight reads as real operational experience rather than an asserted passion for helping young people.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Sports and Fitness', null,
 'Strength & Conditioning coach, NCEF Level 6 (University of Limerick). Currently programming for a minor hurling panel, building fortnightly movement screening into the block from week one rather than adding it after an injury forces the question. First aid and CPR current. Based in Limerick, open to travel for panels.',
 'Qualification and awarding body stated precisely, and the programming detail shows a real methodology rather than a generic "passionate about fitness" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
