-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen industry_intelligence: a second screening_mechanism per industry
--
-- Same discipline as the three previous passes. Every industry had exactly
-- one screening_mechanism row, mostly describing WHO screens and WHAT they
-- check (registration bodies, ATS keyword scanning, portfolio requirements).
-- The second row per industry is a distinct angle within the same
-- dimension — WHEN and via what actual mechanism a decision gets made: the
-- recruitment cycle, the panel or timing structure, the order things
-- actually happen in. Timing mechanics change what a student should do (when
-- to apply, what to expect after interview) in a way "more screening facts"
-- alone would not.
--
-- Three facts came from targeted research and are worth flagging directly:
--
--   - HSE recruitment uses an order-of-merit PANEL system, not direct hire:
--     candidates are ranked at interview, placed on a panel that stays live
--     for a year (extendable), and offered a role as vacancies actually
--     arise — sometimes months after the interview, not immediately after
--     it. Confirmed directly against hse.ie's own recruitment-process pages.
--   - Irish secondary teaching hiring runs in two distinct windows — a
--     May-to-July surge, then a second burst in the final two weeks of
--     August into September — rather than being spread evenly across the
--     year.
--   - Science Foundation Ireland and the Irish Research Council have both
--     been folded into a single body, Research Ireland — the two names
--     given as separate real_entity references elsewhere in this table are
--     accurate as historical/informal usage but the actual current
--     organisation is one. Its postdoctoral and postgraduate funding calls
--     run on a fixed annual cycle (opening September, closing October or
--     November, awards starting the following September) that determines
--     when funded research posts are actually created.
--
-- The Public Sector and Law rows reuse facts already independently verified
-- earlier this session (the PAS order-of-merit system; firms recruiting
-- training contracts up to two years ahead) rather than being freshly
-- researched here.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

('Healthcare and Nursing', 'screening_mechanism',
 'HSE recruitment runs on an order-of-merit panel system rather than direct hire: candidates who pass interview are ranked and placed on a panel, which typically stays active for a year and can be extended. As vacancies actually arise, candidates are offered roles in ranking order — first within their preferred region, then more widely if the role remains unfilled — so an offer can come weeks or months after interview, not immediately after it. This is worth knowing so a strong interview that produces no immediate offer is not misread as a rejection.',
 'HSE.ie — Panels and Panel Management', 'https://www.hse.ie/eng/staff/resources/recruitment-standards/before-you-recruit/panels-and-panel-management.html'),

('Education and Teaching', 'screening_mechanism',
 'Irish secondary teaching hiring runs in two distinct windows rather than year-round: a first surge from May into July as schools plan for September, and a second, sharper burst in the final two weeks of August into the start of September as late resignations and unexpected gaps get filled fast. A candidate not actively watching EducationPosts.ie through both windows can miss the bulk of the year''s actual openings.',
 'EducationPosts.ie', 'https://www.educationposts.ie/posts/second_level'),

('Science and Research', 'screening_mechanism',
 'Science Foundation Ireland and the Irish Research Council have both been folded into a single funding body, Research Ireland — references to either name elsewhere reflect how the bodies are still commonly known, but funding decisions now sit with one organisation. Postdoctoral and postgraduate funding calls run on a fixed annual cycle (recent Government of Ireland calls opened in September, closed in October or November, with awards starting the following September), which is what actually determines when a funded research post exists to apply for — applying "whenever a role is advertised" misses that most posts only exist once a call has been won.',
 'Research Ireland — Government of Ireland Postdoctoral Fellowship Programme', 'https://www.researchireland.ie/funding/government-ireland-postdoctoral/'),

('Law', 'screening_mechanism',
 'Law firms recruit training contracts up to two years ahead of the actual start date, and applying for the wrong intake year is a real, recoverable-only-by-not-making-it mistake — a strong application submitted for a cycle that has already closed, or that opens later than the applicant realises, does not get held over. Checking the specific firm''s current intake year before applying matters as much as the content of the application itself.',
 'Legal Cheek — mistakes that could ruin your training contract application', 'https://www.legalcheek.com/2025/10/7-mistakes-that-could-ruin-your-training-contract-application/'),

('Public Sector and Civil Service', 'screening_mechanism',
 'As with HSE recruitment, Public Appointments Service competitions typically result in an order-of-merit panel rather than a direct offer — candidates are ranked from the assessment stages and interview, then offered roles as vacancies arise across departments over the following months, sometimes over a year or more after the original competition. A candidate who scored well but received no immediate offer may still be contacted much later as a vacancy opens.',
 'Public Appointments Service', 'https://www.publicjobs.ie/'),

('Technology and Software', 'screening_mechanism',
 'Hiring in this field is largely rolling rather than tied to a fixed annual intake — many roles, especially at smaller companies and startups, are filled as soon as a strong candidate is found rather than held open for a batch of applicants to be compared. This rewards applying as soon as a role is posted rather than waiting, since the role can close well before any stated deadline.',
 'ResumeAdapter — software engineer resume keywords (2026 ATS data)', 'https://www.resumeadapter.com/blog/software-engineer-resume-keywords'),

('Engineering', 'screening_mechanism',
 'Large employers'' graduate engineering programmes typically run a single annual intake with a September start, and applications commonly open in autumn of the preceding year — later applicants are competing for a shrinking number of remaining places even before any stated closing date, since these schemes fill on a rolling basis within the application window rather than waiting until it closes to compare every applicant at once.',
 'Engineers Ireland', 'https://www.engineersireland.ie/'),

('Finance and Accounting', 'screening_mechanism',
 'At the Big 4 and the main Irish banks, online numerical and situational judgement assessments frequently run before a human ever reads the CV, not after an initial screen — meaning a strong CV paired with no preparation for the assessment stage can be screened out before anyone sees it. Spring weeks and insight days, run for first- and second-year students, are themselves a screening mechanism as much as an experience: strong performance there is a genuine fast-track into the following year''s graduate programme.',
 'JobTestPrep — SHL Numerical Reasoning Test practice guidance', 'https://www.jobtestprep.co.uk/shl-numerical-test-examples'),

('Business and Management', 'screening_mechanism',
 'Graduate schemes typically open applications in September or October for a start the following summer or autumn, and many process applications and interview slots on a rolling basis within that window rather than waiting for the stated closing date to compare every applicant together — a scheme technically still "open" for another month may already have filled most of its places.',
 'gradireland — graduate recruitment in Ireland', 'https://gradireland.com/'),

('Creative and Media', 'screening_mechanism',
 'Hiring in this field is far less cycle-bound than a corporate graduate scheme — a speculative application with a strong, curated portfolio attached can succeed even with no live vacancy advertised, because creative and studio teams frequently hire reactively when workload increases rather than against a planned annual headcount.',
 'Design & Crafts Council Ireland', 'https://www.dcci.ie/'),

('Construction and Architecture', 'screening_mechanism',
 'Hiring in this field tracks the project pipeline more than a fixed calendar — a firm that has just won a major tender may hire in a genuine burst, while one between projects may not be hiring at all regardless of the time of year. A speculative application timed around a publicly announced project win is a real, underused strategy in this field specifically.',
 'Construction Industry Federation', 'https://cif.ie/'),

('Hospitality and Tourism', 'screening_mechanism',
 'Hiring in this field is strongly seasonal, spiking ahead of summer and again around the Christmas period, when properties and venues staff up well in advance of peak trade rather than reactively once it arrives — applying in the weeks before a season starts, not during its busiest point, is when hiring decisions are actually being made.',
 'Fáilte Ireland', 'https://www.failteireland.ie/'),

('Social Work and Community', 'screening_mechanism',
 'Statutory roles with Tusla and the HSE are recruited through the same order-of-merit panel system used across HSE recruitment generally — an offer can come well after interview, as vacancies arise, rather than immediately. Voluntary and community sector roles, by contrast, are typically recruited on a rolling basis as funding allows, which can move considerably faster than the statutory panel process.',
 'HSE.ie — Panels and Panel Management', 'https://www.hse.ie/eng/staff/resources/recruitment-standards/before-you-recruit/panels-and-panel-management.html'),

('Sports and Fitness', 'screening_mechanism',
 'Coaching hiring is frequently seasonal and tied to the sporting calendar — pre-season is when club and development coaching roles actually open — while gym and fitness instructor hiring often spikes around January and September, when membership numbers rise and facilities staff up to match demand.',
 'Sport Ireland', 'https://www.sportireland.ie/'),

('Marketing and Communications', 'screening_mechanism',
 'Agency hiring tends to be rolling and reactive rather than following a fixed calendar, frequently driven by winning a new client account rather than planned annual headcount — a role can appear and close within weeks of a new piece of client business landing, which rewards candidates who apply quickly once something is posted.',
 'Marketing Institute of Ireland', 'https://www.mii.ie/');
