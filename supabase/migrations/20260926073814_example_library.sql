-- Foundation Blueprint: Example Library + matching.
--
-- Every generator up to now wrote from formulas (Harvard bullet formula, STAR
-- timing, etc.) but never actually read a real example. This table is the fix:
-- real, sourced, attributed examples — published by university career services
-- and reputable career-advice sites, not fabricated — tagged by category and
-- industry so each generator can pull a handful of genuine matches before writing.
--
-- Nothing here is presented to a user as their own work: generators are instructed
-- to treat these as "what good looks like in this industry", never to copy them.

create table public.example_library (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('cv_bullet', 'cover_letter_opener', 'linkedin_headline', 'linkedin_about', 'star_answer')),
  industry text not null default 'general',
  competency_tag text,
  excerpt text not null,
  why_it_works text not null,
  source_name text not null,
  source_url text not null,
  created_at timestamptz default now()
);

alter table public.example_library enable row level security;
create policy "Authenticated users can read example library" on public.example_library
  for select to authenticated using (true);

create index example_library_category_industry_idx on public.example_library (category, industry);

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url) values
-- CV bullets
('cv_bullet', 'finance', null, 'Reduced costs by $500,000 through streamlining procurement processes', 'Leads with the result and the number, names the specific mechanism (procurement process change) rather than a vague "improved efficiency".', 'Interactive CV', 'https://www.interactive-cv.com/en/blog/resume-bullet-points-examples'),
('cv_bullet', 'finance', null, 'Achieved a 15% increase in investment portfolio performance through strategic asset allocation', 'Quantifies the outcome and names the actual lever pulled, so the claim is specific enough to be credible and discussable at interview.', 'Interactive CV', 'https://www.interactive-cv.com/en/blog/resume-bullet-points-examples'),
('cv_bullet', 'healthcare', null, 'Managed caseload of 40+ patients daily, maintaining 98% satisfaction scores and reducing average treatment time by 20%', 'Combines scale (40+ patients), a quality metric (satisfaction), and an efficiency metric (treatment time) — three different kinds of evidence in one bullet.', 'GrowthHackYourCareer', 'https://growthhackyourcareer.com/resume-bullet-point-examples/'),
('cv_bullet', 'healthcare', null, 'Trained and supervised 12 nursing staff, improving team efficiency by 30% and reducing patient readmission rates by 18%', 'Shows people-leadership (supervised 12 staff) tied directly to a clinical outcome metric (readmission rate), not just an activity.', 'GrowthHackYourCareer', 'https://growthhackyourcareer.com/resume-bullet-point-examples/'),
('cv_bullet', 'technology', null, 'Led a team of 12 engineers across 3 time zones, delivering 4 major platform releases affecting 2M+ daily active users', 'Scale on three axes at once — team size, geographic complexity, and user impact — without needing extra sentences to explain each.', 'Interactive CV', 'https://www.interactive-cv.com/en/blog/resume-bullet-points-examples'),
('cv_bullet', 'law', null, 'Interviewed witnesses, researched complex areas of law (fraud, racketeering, bankruptcy) and wrote legal briefs helping clients assess and minimize liability', 'Written as clauses, not full sentences, per legal-resume convention — and names the actual legal domains, not just "legal research".', 'Yale Office of Career Strategy', 'https://ocs.yale.edu/resources/writing-impactful-resume-bullets/'),
('cv_bullet', 'education', null, 'Designed a job placement program for the long-term unemployed; included individual counseling and job search classes and workshops, delivering 30+ hours per month of training', 'Shows both the design/creation work and the ongoing delivery commitment (30+ hours/month) — proves it wasn''t a one-off.', 'Columbia Career Education', 'https://www.careereducation.columbia.edu/resources/resumes-impact-creating-strong-bullet-points'),

-- STAR answers
('star_answer', 'general', 'Teamwork', 'Situation: Six weeks into my first graduate role, I was added to a five-person team of senior analysts working on a quarterly client report. Task: Take the data-cleaning workstream, freeing the seniors for analysis. Action: [candidate-specific steps]. Result: The report shipped on time. My script cut the next quarter''s data-prep time by 60%, and the senior lead handed me a small analysis section the following quarter.', 'Result closes the loop twice — once for the immediate outcome (shipped on time) and once for what it earned the candidate afterwards (more responsibility next quarter).', 'MIT Career Advising & Professional Development', 'https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/'),
('star_answer', 'general', 'Leadership', 'A Student Union president was tasked with leading a team of ten organising the Winter Ball. As team leader, they clearly briefed the team on responsibilities, allocating tasks based on each person''s individual strengths and motivations.', 'The leadership evidence isn''t "I was in charge" — it''s the specific mechanism (allocating by strength/motivation) that shows real delegation judgement.', 'University of Alabama Career Center', 'https://career.sa.ua.edu/develop/interview-skills/interview-questions/s-t-a-r-examples/'),
('star_answer', 'general', 'Problem Solving', 'A restaurant server, during a power outage, faced an unexpected rush of customers. The manager asked them to handle the front of house, so they began acting as host while still helping with serving and bussing.', 'A genuinely ordinary, non-corporate example — proves STAR works for part-time/retail experience, not just internships, which matters for candidates with no "professional" story yet.', 'University of Houston Engineering Career Center', 'https://career.egr.uh.edu/sites/career.egr.uh.edu/files/files/STAR-Tech-and-General-Sample-Questions.pdf'),

-- LinkedIn headlines
('linkedin_headline', 'technology', null, 'Senior Product Manager | B2B SaaS and Fintech | Launched 4 products from 0 to $10M ARR', 'Title, then domain, then one hard number — recruiters scan left to right, so the most search-relevant word (the title) comes first.', 'JobSprout', 'https://www.jobsprout.ai/blog/linkedin-profile-guide'),
('linkedin_headline', 'technology', null, 'Data Engineer | AWS and Snowflake | Building pipelines for 100M+ row datasets', 'Names the exact tools a recruiter would search for (AWS, Snowflake) instead of a category word like "cloud experience".', 'JobSprout', 'https://www.jobsprout.ai/blog/linkedin-profile-guide'),
('linkedin_headline', 'finance', null, 'Financial Advisor | Helping tech professionals build wealth beyond their stock options | CFP', 'Names a specific niche client (tech professionals with stock options) rather than "helping people with their finances" — specificity signals real expertise.', 'Resume Worded', 'https://resumeworded.com/linkedin-samples/'),
('linkedin_headline', 'finance', null, 'CPA | Tax strategy for small business owners | Saving clients an average of $30K/year', 'Credential, niche, and a real number in one line — three distinct trust signals.', 'Resume Worded', 'https://resumeworded.com/linkedin-samples/'),
('linkedin_headline', 'healthcare', null, 'Nurse Practitioner | Improving patient outcomes in primary care | Advocate for preventive health', 'Balances the clinical title with a values statement, which matters in healthcare hiring where culture fit is explicitly assessed.', 'Resume Worded', 'https://resumeworded.com/linkedin-samples/'),
('linkedin_headline', 'marketing', null, 'Content Marketing Manager | SEO & Thought Leadership | 2M+ Monthly Organic Visitors', 'The number (2M+ visitors) is the kind of concrete proof marketing hiring managers specifically look for over vaguer claims like "grew traffic".', 'Resume Worded', 'https://resumeworded.com/linkedin-samples/'),

-- LinkedIn About
('linkedin_about', 'technology', null, 'I''m a third-year computer science student... interested in cybersecurity and data analytics. Through my co-op experiences, I''ve developed strong problem-solving and teamwork skills.', 'A real student example — concrete (names the actual interests and experience type) rather than reaching for corporate language a student hasn''t earned yet.', 'University of Cincinnati', 'https://www.uc.edu/blog/linkedin-profile-examples-for-students.html'),

-- Cover letter openers
('cover_letter_opener', 'general', null, 'I increased qualified demo bookings by 28% in six months by rebuilding our outbound sequences, and I''d bring that same test-and-learn approach to your SDR team.', 'Opens with a specific proof point tied directly to the target role''s core activity, instead of "I am writing to apply for..."', 'CareerBldr', 'https://careerbldr.com/blog/cover-letter-opening-lines/');
