-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen industry_intelligence: a second real_entity per industry
--
-- Every industry but Law (already brought to 2 by an earlier bug-fix
-- migration) has carried exactly one real_entity row since the original seed
-- — a single list mixing professional bodies and notable employers. Rather
-- than pad that list, the second row per industry is a genuinely distinct
-- angle: where a student actually finds these roles — the specific Irish job
-- board, careers portal, or professional-development body for that field —
-- which is directly actionable in a way "more employer names" would not be.
--
-- Every name below was checked to confirm it is real and current before being
-- written — the same discipline as the must_have and red_flag passes. That
-- check caught a real, already-shipped inaccuracy: generate-job-search-
-- support's CHANNELS_BY_INDUSTRY named "TechIreland" as a dedicated tech jobs
-- board for the Technology and Software industry. No such platform was found;
-- the real one is TechJobs.ie. Fixed in that file alongside this migration —
-- the rest of that object's names were checked in the same pass and hold up.
--
-- Law is left untouched (already at 2 rows for this dimension).
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

('Technology and Software', 'real_entity',
 'TechJobs.ie — Ireland''s dedicated tech and digital jobs board, covering engineering, product, AI and delivery roles from Irish tech companies, updated daily.',
 'TechJobs.ie', 'https://www.techjobs.ie/'),

('Engineering', 'real_entity',
 'Engineers Ireland''s own careers portal and regional branch events are a direct route into the profession''s own network; CPL, Sigmar, and Morgan McKinley are the specialist recruitment agencies most active in Irish engineering hiring.',
 'Engineers Ireland', 'https://www.engineersireland.ie/'),

('Healthcare and Nursing', 'real_entity',
 'HSE Career Hub (careerhub.hse.ie) centralises hospital and HSE vacancies with configurable job alerts by grade, staff category and county. Healthcarejobs.ie, launched in the mid-2000s, is Ireland''s longest-running independent healthcare job board and also covers voluntary hospitals, private providers and care homes outside the HSE directly.',
 'Healthcarejobs.ie', 'https://www.healthcarejobs.ie/'),

('Finance and Accounting', 'real_entity',
 'eFinancialCareers is the leading global financial-services careers platform, with a substantial Irish presence covering banking, investment banking, financial analysis, risk and compliance roles across the Dublin-based operations of major domestic and international institutions.',
 'eFinancialCareers Ireland', 'https://www.efinancialcareers.ie/jobs/finance'),

('Education and Teaching', 'real_entity',
 'EducationPosts.ie is Ireland''s longest-established and most widely used education recruitment platform — Department of Education circulars (0062/2008, 0020/2012) formally direct primary and post-primary schools to advertise vacancies there, and it has run since 2002 with over 110,000 active users.',
 'EducationPosts.ie', 'https://www.educationposts.ie/'),

('Business and Management', 'real_entity',
 'CPL, Sigmar, Morgan McKinley and Brightwater are the recruitment agencies most active across Irish commercial and business roles, particularly useful for temp/contract and roles that never reach the structured graduate schemes gradireland lists.',
 'gradireland — graduate recruitment in Ireland', 'https://gradireland.com/'),

('Creative and Media', 'real_entity',
 'IAPI (Institute of Advertising Practitioners in Ireland) is the representative body for Irish advertising agencies and runs its own "Find a Job" service alongside industry events and its Ireland-wide creative showcase.',
 'IAPI — Institute of Advertising Practitioners in Ireland', 'https://iapi.ie/'),

('Science and Research', 'real_entity',
 'EURAXESS Ireland, based at the Irish Universities Association and co-funded by the Department of Further and Higher Education, Research, Innovation and Science, lists research and fellowship vacancies as part of a European network of over 600 centres in 42 countries.',
 'EURAXESS Ireland', 'https://www.euraxess.ie/'),

('Construction and Architecture', 'real_entity',
 'The Construction Industry Federation runs its own dedicated jobs site, CIFjobs.ie, aimed specifically at recruiting into the Irish construction industry — including for Irish construction professionals abroad considering a return.',
 'CIFjobs.ie — Construction Industry Federation', 'https://constructionnews.ie/cif-jobs-website/'),

('Hospitality and Tourism', 'real_entity',
 'Caterer.com lists catering and hospitality roles across the Republic of Ireland by county, alongside its Northern Ireland and wider European listings, and is one of the sector''s established dedicated hiring platforms.',
 'Caterer.com — jobs in Republic of Ireland', 'https://www.caterer.com/jobs/in-republic-of-ireland'),

('Public Sector and Civil Service', 'real_entity',
 'The Institute of Public Administration (IPA) is Ireland''s centre of excellence for Public Service learning and leadership development, running accredited certificate, diploma and degree programmes for civil servants — including the Emerging Leaders Graduate Programme aimed at administrative officers and third secretaries. Distinct from publicjobs.ie, which handles recruitment itself.',
 'Institute of Public Administration', 'https://www.ipa.ie/'),

('Social Work and Community', 'real_entity',
 'Activelink is the established online network for Irish community and non-profit organisations, publishing jobs, volunteering and funding opportunities in weekly bulletins. Boardmatch Ireland, established 2005, separately matches individuals to board and committee vacancies at over 1,500 registered not-for-profits.',
 'Activelink', 'https://www.activelink.ie/'),

('Sports and Fitness', 'real_entity',
 'Sport Ireland and the national governing bodies (GAA, IRFU, FAI, Athletics Ireland, Swim Ireland) generally advertise coaching and development roles directly on their own sites rather than through a shared sector board — checking each body''s own vacancies page directly is more reliable than searching a general jobs board for this field.',
 'Sport Ireland', 'https://www.sportireland.ie/'),

('Marketing and Communications', 'real_entity',
 'IAB Ireland, founded 2010, is the trade body for digital advertising in Ireland and a member of the global IAB network — its events, standards work, and certifications are a genuine way to demonstrate current industry engagement beyond a marketing degree alone.',
 'IAB Ireland', 'https://iabireland.ie/');
