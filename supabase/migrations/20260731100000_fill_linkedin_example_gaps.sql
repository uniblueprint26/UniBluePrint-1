-- ═══════════════════════════════════════════════════════════════════════════
-- Fill the linkedin_headline / linkedin_about gaps found while auditing what
-- generate-linkedin actually pulls per industry.
--
-- fetchIndustryExamples('linkedin_headline', industry) and the 'linkedin_about'
-- equivalent had zero rows for several industries, meaning generate-linkedin
-- silently fell back to whatever 'general' held for that category (which is
-- itself sparse — 'general' only carries cover_letter_opener and star_answer
-- rows; it has none for either LinkedIn category) rather than to anything
-- calibrated for the field.
--
-- Twelve gaps closed:
--   linkedin_headline: Construction and Architecture, Creative and Media,
--     Education and Teaching, Public Sector and Civil Service,
--     Social Work and Community
--   linkedin_about: Business and Management, Engineering, Finance and
--     Accounting, Hospitality and Tourism, Public Sector and Civil Service,
--     Science and Research, Sports and Fitness
--
-- Grounded in the same must_haves / real_entities already seeded for each
-- industry in industry_intelligence, so the calibration content and the
-- intelligence content agree rather than pulling in different directions.
-- Platform-authored, not sourced — same provenance discipline as the rest of
-- the example library, excluded from benchmarked_against by citableSources().
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

('linkedin_headline', 'Construction and Architecture', null,
 'Quantity Surveying graduate (TU Dublin) | Placement across residential schemes up to €12m | CostX, Bluebeam | Working toward SCSI chartership | Safe Pass held',
 'Chartership pathway and Safe Pass are the two things this field''s recruiters filter on first — both are here, alongside project scale and named software, in a headline a search would actually surface.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Creative and Media', null,
 'Graphic Designer (NCAD) | Rebranded a 40-year-old Cork food producer for final year | Figma, Adobe Creative Suite | Portfolio: 6 pieces, deliberately',
 'Leads with one concrete, specific piece of work rather than a job title, and the "deliberately" on the portfolio size signals curation judgement before a recruiter has even clicked through.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Education and Teaching', null,
 'Post-Primary Teacher — History & Geography | Teaching Council registered | PME (DCU) 2026 | DEIS and non-DEIS placement, north Dublin',
 'Registration status first, because that is the hard screen for this field. Subject specialisation and placement breadth are the two other things a principal actually filters by.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Public Sector and Civil Service', null,
 'Executive Officer candidate | BA Public Administration (UCD) | Citizens Information volunteer, 2 years | Building applications around the Civil Service Capability Framework',
 'Names the exact current framework by its real title rather than the vaguer "public sector experience" — a signal to anyone in Civil Service recruitment that this candidate has actually read the model.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Social Work and Community', null,
 'Social Worker | CORU registered | MSW (UCC) 2026 | Statutory child protection placement with Tusla | Interested in transition-from-care outcomes',
 'CORU registration up front, because unregistered practice is a legal impossibility in this field — then a specific professional interest that gives a hiring manager something concrete to ask about.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Business and Management', null,
 'Commerce graduate (UCG). I grew a college society''s sponsorship income from €900 to €4,200 in one year by moving from single-event asks to a three-tier annual package — the kind of unglamorous commercial problem I want to keep solving. Comfortable in Power BI and Excel to a real working level, not just listed. Looking for 2027 graduate roles in retail or FMCG.',
 'One concrete, quantified story instead of a list of traits, then tools stated with an honest qualifier ("not just listed") that actually builds more credibility than a longer skills list would.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Engineering', null,
 'Civil Engineering graduate (UL), nine months on placement designing water infrastructure for a Cork consultancy — mostly Civil 3D, mostly revising the same alignment against Irish Water''s criteria until it passed review. Working toward Chartered Engineer with Engineers Ireland. I''d rather talk about a specific design trade-off than a list of software.',
 'The closing line is a genuine point of view about how the candidate wants to be evaluated, which is more memorable than any adjective, and the chartership pathway is named precisely rather than implied.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Finance and Accounting', null,
 'Final-year Accounting & Finance student (UCD), CAP1-exempt. Spent last summer on a Big 4 insight week and came away most interested in audit — specifically watching a senior push back on a revenue recognition treatment everyone else had accepted. Applying for a September 2027 training contract.',
 'Exemption status stated plainly (the actual screen for this field), then a specific, slightly unexpected technical detail that proves genuine engagement rather than attendance at the insight week.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Hospitality and Tourism', null,
 'Hospitality Management graduate (TU Dublin), three seasons across 4-star Kerry properties — most recently running a 14-table section through 120-cover Saturday services. HACCP certified. I know the difference between a property that says it''s guest-focused and one where the GM knows the housekeepers'' names, and I want to work at the second kind.',
 'Concrete service metrics establish real competence at the level this field actually screens on (covers, section size, property standard), and the closing line is an honest, field-literate observation rather than a generic enthusiasm claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Public Sector and Civil Service', null,
 'BA Public Administration graduate (UCD), applying through publicjobs.ie for Executive Officer roles. Two years volunteering on a Citizens Information desk taught me the actual constraint in public service work is never budget — it''s whether the form in front of someone makes sense to them. Building every application around the Civil Service Capability Framework rather than generic competency language.',
 'Public service values demonstrated through a specific, lived observation rather than asserted as a trait, and the framework is named correctly and by its current title.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Science and Research', null,
 'Biotechnology graduate (UCC). My final-year project optimised an ELISA protocol, taking inter-assay CV from 18% to 7% across thirty replicates — the unglamorous, protocol-level work that most research write-ups skip past. Comfortable in R for analysis. Poster presented at the Irish Society for Immunology annual meeting. Looking for QC/QA roles in pharma.',
 'A specific, quantified methods result is worth more to a research-literate reader than any adjective, and naming the actual conference output is the credibility marker this field looks for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Law', null,
 'Law graduate (TCD), FE-1: six of eight papers passed, remaining two sitting in October. I followed a judicial review your firm ran on a planning consent closely enough to have read the judgment twice — public law is the area I want to train in, not commercial law by default because it''s the biggest practice group.',
 'Exam progress stated precisely (the actual screen for a training contract application), and the specific matter referenced proves genuine interest rather than a firm-agnostic application.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Sports and Fitness', null,
 'Strength & Conditioning coach, NCEF Level 6 (University of Limerick). Currently running a block-periodised programme for a GAA minor hurling panel, with fortnightly movement screening built in from the start rather than added after an injury. First aid and CPR current. Based in Limerick, open to travel for panels.',
 'Qualification and awarding body stated precisely — the actual screen in this field — and the programming detail shows a real methodology rather than a generic "passionate about fitness" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
