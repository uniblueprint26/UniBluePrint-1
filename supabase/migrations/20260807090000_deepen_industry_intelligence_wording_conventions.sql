-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen industry_intelligence: a second wording_convention per industry
--
-- The last of the five dimensions to reach 2 rows per industry. Every
-- existing wording_convention row makes essentially the same point — quantify,
-- show evidence, don't claim in adjectives — which is real and correct, but a
-- second row repeating it with a different example would add volume without
-- adding a new idea. The second row per industry is a genuinely different
-- angle within the same dimension: REGISTER and TERMINOLOGY — the specific
-- words and naming conventions that signal a candidate actually knows the
-- field, as distinct from writing convincingly generic prose about it.
--
-- Nearly every fact below connects directly to something already verified
-- earlier in this table — the registration terms, qualification names, and
-- capability names established across the must_have and screening_mechanism
-- passes — rather than requiring fresh research. This is deliberate: getting
-- the terminology right is drawing a consistent line through facts already
-- checked once, not a new set of claims needing independent verification.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

('Technology and Software', 'wording_convention',
 'Be precise about the verb: "built", "contributed to", "maintained" and "led" mean different things to a technical reviewer, and inflating a group project into "led development of X" when the role was one contributor among four is the kind of overstatement a technical interview exposes within minutes. Say exactly what was owned.',
 'ResumeAdapter — software engineer resume keywords (2026 ATS data)', 'https://www.resumeadapter.com/blog/software-engineer-resume-keywords'),

('Engineering', 'wording_convention',
 'Name the actual standard or code a design was checked against (an Irish or Eurocode reference, not just "designed to standard"), and use registration terminology precisely — "working toward Chartered Engineer status with Engineers Ireland" is accurate for a graduate; describing oneself simply as "an engineer" pre-registration, in a context where the title carries statutory weight, reads as either unaware of the distinction or careless about it.',
 'Engineers Ireland — Registered Professional Titles', 'https://www.engineersireland.ie/Professionals/Membership/Registered-professional-titles'),

('Healthcare and Nursing', 'wording_convention',
 'Name the actual registration precisely — "NMBI PIN held" or "CORU registered (Social Workers Registration Board)" — rather than the vaguer "qualified nurse" or "registered professional", which leaves a reviewer unable to confirm anything. The specific term is also what a keyword-scanning system is actually matching on.',
 'NMBI — Registration', 'https://www.nmbi.ie/Registration'),

('Finance and Accounting', 'wording_convention',
 'Name the qualifying body and the exact stage precisely — "ACA, CAP2 exemptions held, FAE sitting August 2027" — rather than "studying towards chartered accountancy status", which could describe three different qualification pathways and signals the writer hasn''t yet internalised which one they are actually on.',
 'Chartered Accountants Ireland', 'https://www.charteredaccountants.ie/'),

('Law', 'wording_convention',
 'Use Irish terminology precisely, not the nearest US or UK equivalent — "solicitor" rather than "lawyer" or "attorney" for this jurisdiction''s qualified practitioners, "training contract" rather than "articles", and cite the actual FE-1 subject and PPC stage by name rather than "law exams" generically. A CV that reads as translated from another jurisdiction''s conventions signals limited familiarity with how this one actually works.',
 'Law Society of Ireland', 'https://www.lawsociety.ie/'),

('Education and Teaching', 'wording_convention',
 'Name the registration route precisely — Route 1, 2, or 3, whichever actually applies — and the induction stage by its real name, Droichead, not "teaching probation" or another approximation. Getting Cosán and Droichead the right way round (Droichead is induction; Cosán is the ongoing professional learning framework that follows it) matters, because using them interchangeably signals the distinction hasn''t actually been understood.',
 'The Teaching Council — Droichead', 'https://www.teachingcouncil.ie/i-am-a-registered-teacher/registration-with-conditions/droichead/'),

('Business and Management', 'wording_convention',
 'Use the actual commercial term rather than a vaguer synonym — "grew gross margin" or "reduced cost of acquisition" reads as genuine commercial fluency; "made things more profitable" reads as a description written by someone outside the function. Naming the specific metric moved is itself evidence of understanding the business, before any number attached to it.',
 'gradireland — graduate recruitment in Ireland', 'https://gradireland.com/'),

('Creative and Media', 'wording_convention',
 'Name the actual deliverable format — "brand guidelines", "a six-page pitch deck", "a shot list" — rather than the generic "creative assets" or "design work", which tells a reviewer nothing about what was actually produced or what skill it required. Precision about format is itself a signal of having worked inside a real studio process.',
 'Design & Crafts Council Ireland', 'https://www.dcci.ie/'),

('Public Sector and Civil Service', 'wording_convention',
 'Use "competition" for the recruitment process and the correct grade name (Executive Officer, Higher Executive Officer, Administrative Officer) precisely — these have specific, non-interchangeable meanings in this system. Keep the register measured and evidence-led throughout; the private-sector instinct to reach for "results-driven" or "dynamic" language reads as a mismatch with how this system''s own applications are written and assessed.',
 'Public Appointments Service', 'https://www.publicjobs.ie/'),

('Science and Research', 'wording_convention',
 'Use standard technique and nomenclature conventions correctly and consistently — the exact assay name, correct capitalisation and italicisation conventions for gene or species names where relevant — since inconsistency here reads to a science-literate reviewer the way a spelling error reads to anyone else: a small thing that undermines confidence in everything around it.',
 'Science Foundation Ireland', 'https://www.sfi.ie/'),

('Construction and Architecture', 'wording_convention',
 'Name the actual RIBA or RIAI work stage a project reached — "through Stage 4" rather than "in the design phase" — and never self-describe using a protected title (architect, quantity surveyor) ahead of registration; "architectural graduate" or "graduate quantity surveyor" is both accurate and, under the Building Control Act 2007, the legally correct way to describe the position.',
 'Society of Chartered Surveyors Ireland — Registration Body', 'https://scsi.ie/the-register/registration-body/'),

('Hospitality and Tourism', 'wording_convention',
 'Use the field''s own measurement terms — covers, occupancy, ADR (average daily rate) — rather than a description that could apply to any customer-facing role. "Managed a 60-cover Saturday service" is instantly legible to anyone in the trade; "worked in a busy restaurant" is not calibratable at all.',
 'Fáilte Ireland', 'https://www.failteireland.ie/'),

('Social Work and Community', 'wording_convention',
 'Use the correct statutory terminology — "a child in care" rather than "foster child", "service user" as the standard term of reference, and cite the actual governing legislation (the Child Care Act 1991, Children First) by name where relevant rather than referring to "child protection law" generically. Precision here is itself read as evidence of practice readiness, not just correctness.',
 'Tusla — Child and Family Agency', 'https://www.tusla.ie/'),

('Sports and Fitness', 'wording_convention',
 'Use real programming terminology — periodisation, RPE (rate of perceived exertion), load management — rather than "trained hard" or "pushed clients", which says nothing a qualified reviewer can evaluate. The correct term for a concept is itself part of demonstrating the qualification behind it.',
 'National Council for Exercise & Fitness', 'https://www.ncef.ie/'),

('Marketing and Communications', 'wording_convention',
 'Name the actual metric, not a vague outcome — CTR (click-through rate), CPA (cost per acquisition), ROAS (return on ad spend) — since these are the specific terms a marketing reviewer is scanning for, and "the campaign did well" gives them nothing to evaluate regardless of how the underlying number actually looked.',
 'Marketing Institute of Ireland', 'https://www.mii.ie/');
