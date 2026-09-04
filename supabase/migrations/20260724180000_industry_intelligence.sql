-- Foundation Blueprint: Industry Intelligence.
--
-- example_library answers "what does a good bullet look like". This answers a
-- different question: "how does this industry actually screen candidates in or
-- out" — the ATS/recruiter mechanics, the exact credentials that must appear,
-- the wording convention, and the specific red flags that get an application
-- binned. Generic CV-advice searches don't surface this; it took searching for
-- how each industry's own recruiters/professional bodies describe their process.

create table public.industry_intelligence (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  dimension text not null check (dimension in ('screening_mechanism', 'must_have', 'wording_convention', 'red_flag', 'real_entity')),
  content text not null,
  source_name text not null,
  source_url text not null,
  created_at timestamptz default now()
);

alter table public.industry_intelligence enable row level security;
create policy "Authenticated users can read industry intelligence" on public.industry_intelligence
  for select to authenticated using (true);

create index industry_intelligence_industry_idx on public.industry_intelligence (industry);

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

-- ─── Technology ───────────────────────────────────────────────────────────────
('technology', 'screening_mechanism', '75% of software engineer CVs are rejected by ATS before a human ever sees them — the #1 cause is missing the exact programming languages, frameworks, and system-design terms the job posting uses. What survives ATS then gets manually screened, including checking GitHub and LinkedIn for real evidence of the claims.', 'ResumeAdapter / JobWizard (2026 ATS data)', 'https://www.resumeadapter.com/blog/software-engineer-resume-keywords'),
('technology', 'must_have', 'Keywords cluster into four groups recruiters and ATS both scan for: (1) skills/tools, (2) technologies/frameworks, (3) competencies — testing, cloud, system design, (4) evidence — metrics and outcomes. Mirror the exact phrasing from the job posting; ATS matches on exact terms, not synonyms.', 'ResumeAdapter', 'https://www.resumeadapter.com/blog/software-engineer-resume-keywords'),
('technology', 'red_flag', 'Buzzwords with zero evidence behind them are an instant credibility hit: "results-driven", "synergy", "leverage", "go-getter", "ninja", "rockstar", "thought leader", "passionate developer", "highly skilled". A bullet is too generic if it could be swapped onto any other candidate''s CV and still make sense.', 'Teamblind — Software Engineer Resume Guide (real advice from tech professionals)', 'https://www.teamblind.com/resources/software-engineer-resume-guide-real-advice-from-tech-professionals-on-blind'),
('technology', 'red_flag', 'Listing basic tools as if they were skills — Microsoft Word, HTML, JSON — reads as padding to engineers reviewing the CV and actively lowers credibility rather than adding to it.', 'Recruiter.com', 'https://www.recruiter.com/recruiting/hiring-a-software-engineer-look-out-for-these-resume-red-flags/'),
('technology', 'real_entity', 'Dublin is a genuine European engineering hub — Google, Stripe, Meta, HubSpot, Workday, Salesforce, Amazon, and Microsoft all run real Dublin engineering teams and actively sponsor the Critical Skills Employment Permit (CSEP) for non-EU candidates. 2026 CSEP threshold: €40,904 (€32,000 with an eligible degree), typically 4-8 weeks processing, issued as a Stamp 1 permit; after 21 months on CSEP a candidate can apply for Stamp 4.', 'Euro Top Tech / NextLevelJobs (2026 visa data)', 'https://www.eurotoptech.com/blog/visa-sponsorship-ireland-software-engineers-2026'),

-- ─── Law (Ireland) ────────────────────────────────────────────────────────────
('law', 'screening_mechanism', 'The Law Society of Ireland publishes its own official CV and cover-letter guidance for trainee solicitor applicants — the single most authoritative source for what Irish law firms actually screen for, direct from the professional body that governs entry to the profession.', 'Law Society of Ireland — Information for Trainee Solicitors on CV Preparation', 'https://www.lawsociety.ie/globalassets/documents/careers/career_support/trainees/trainees-on-cvs.pdf'),
('law', 'must_have', 'Real qualification path a candidate must reference correctly: the FE-1 entrance exam (8 papers — Company Law, Constitutional Law, Contract Law, Criminal Law, Equity, EU Law, Property Law, Torts, candidates have 7 years to pass all 8) is required before the Professional Practice Course (PPC I then PPC II), which requires a registered 2-year Training Contract under a solicitor with 4+ years continuous practice.', 'Law Society of Ireland — Final Examination First Part (FE-1)', 'https://www.lawsociety.ie/becoming-a-solicitor/final-examination---first-part-fe-1/'),
('law', 'wording_convention', 'Written as clauses, not full sentences — legal CVs favour dense, precise phrasing over prose. Achievement verbs the Law Society itself flags as effective: "oversaw", "developed", "improved", "reduced" — chosen to match the actual seniority/impact of the work, not used interchangeably.', 'Law Society of Ireland — CV Preparation guidance', 'https://www.lawsociety.ie/globalassets/documents/careers/career_support/trainees/trainees-on-cvs.pdf'),
('law', 'red_flag', 'Roughly half of all CVs the Law Society reviews contain spelling errors — treated as a major red flag in a profession where precision is the actual job. Subjective, unevidenced claims ("excellent communication skills") and stock clichés ("capable of working on own or as part of a team") are explicitly called out as weak. Any bullet running more than a couple of lines is judged too long.', 'Law Society of Ireland — CV Preparation guidance', 'https://www.lawsociety.ie/globalassets/documents/careers/career_support/trainees/trainees-on-cvs.pdf'),
('law', 'real_entity', 'The Law Society of Ireland is the sole professional body governing solicitors; barristers instead train through King''s Inns. A CV that confuses these two paths, or the FE-1/PPC sequence, signals the candidate hasn''t done basic due diligence on the profession.', 'Law Society of Ireland — Becoming a Solicitor', 'https://www.lawsociety.ie/becoming-a-solicitor/training-contract/');
