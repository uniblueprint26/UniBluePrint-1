-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen industry_intelligence: a second red_flag per industry
--
-- Same discipline as the must_have pass: these rows are shown to students as
-- real citations, so every claim was checked before being written. Fourteen
-- industries had exactly one red_flag row; Technology and Software already
-- had two from the original seed (it was one of the first two industries
-- covered) and is left untouched.
--
-- red_flag is the dimension review-cv is explicitly instructed to check a CV
-- against, quoting the offending text into industry_red_flags — so a second,
-- genuinely distinct flag per industry gives the reviewer more to actually
-- catch, not just more prompt text.
--
-- Six of these came from targeted research into what each field's own
-- careers guidance actually calls out (Law Society, Fáilte Ireland, Public
-- Appointments Service, Morgan McKinley's engineering-specific advice), and
-- surfaced two things worth naming:
--
--   - Fáilte Ireland does not accept CVs at all — every application runs
--     through its own online competency-question system. A CV-shaped
--     application for a Fáilte Ireland role is a category error, not a
--     weak one.
--   - The Public Appointments Service explicitly warns against reciting a
--     competency's own definition back as the answer — a specific, checkable
--     failure mode distinct from the generic "no framework reference" flag
--     already on file.
--
-- The other eight are well-established conventions in each field, sourced to
-- the same real professional bodies and publications already cited for that
-- industry elsewhere in this table, rather than freshly searched claims.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

('Hospitality and Tourism', 'red_flag',
 'Fáilte Ireland does not accept CVs at all for its own roles — every application runs through an online system answering structured questions with examples of past experience, so a CV-shaped application submitted where the actual process asks for competency answers is a category error, not just a weak one. Always check the actual application format for the specific employer before assuming a CV is what is wanted.',
 'Fáilte Ireland — How to Apply', 'https://www.join-us.failteireland.ie/application-guide'),

('Public Sector and Civil Service', 'red_flag',
 'Reciting a capability''s own published definition back as the answer, rather than a real example that demonstrates it, is a specifically named failure mode — assessors are explicitly looking for a concrete example, not a restatement of the framework language. Equally, not answering every sub-question in a multi-part application, or ignoring a stated word limit, can disqualify an otherwise strong application outright.',
 'Public Appointments Service — Application Advice', 'https://www.publicjobs.ie/en/information-hub/our-recruitment-process/application-advice'),

('Law', 'red_flag',
 'Naming facts about a firm (a recent deal, a practice area, an office location) without explaining why that fact is actually relevant to the applicant is a specifically flagged weakness — name-dropping research rather than using it. Applying for the wrong intake year is another concrete, avoidable failure, since firms recruit training contracts up to two years in advance and a mismatched application signals the research was not done properly.',
 'Legal Cheek — mistakes that could ruin your training contract application', 'https://www.legalcheek.com/2025/10/7-mistakes-that-could-ruin-your-training-contract-application/'),

('Science and Research', 'red_flag',
 'Listing every piece of equipment or technique ever touched, rather than selecting what is genuinely relevant to the role applied for, reads as padding rather than expertise — a reviewer with a science background can tell the difference between "brilliant at" and "used once" even when both are phrased the same way. This is the opposite failure to generic "laboratory experience" claims, but equally damaging: undiscriminating volume instead of no specificity at all.',
 'Aspiring Professionals Hub — common CV mistakes, an employer''s perspective', 'https://aspiringprofessionalshub.com/2015/09/17/common-cv-mistakes-made-during-job-applications-an-employers-perspective/'),

('Education and Teaching', 'red_flag',
 'Every school in Ireland has a patron body that sets its ethos — Educate Together, an ETB, a Catholic diocese, or another patron — and an application that shows no awareness of the specific school''s ethos reads as a generic application sent everywhere rather than one written for that school. This matters even more than it might in other fields, because ethos genuinely shapes daily practice in an Irish classroom.',
 'Educate Together — Patronage', 'https://www.educatetogether.ie/school-boards/patronage/'),

('Engineering', 'red_flag',
 'Spelling and formatting errors read as a more direct contradiction on an engineering CV than almost anywhere else, precisely because attention to detail is the discipline''s own stated standard — a CV that claims precision while containing avoidable errors is read as evidence against itself, not just untidy.',
 'Morgan McKinley — how to write an engineering CV', 'https://www.morganmckinley.com/ie/article/top-5-tips-how-write-engineering-cv'),

('Business and Management', 'red_flag',
 'An identical application sent unchanged across several graduate schemes — the same cover letter with only the company name swapped — is easy for a recruiter who reads dozens of applications a week to spot, since it never engages with what that specific employer''s business actually does or where the role sits within it.',
 'gradireland — graduate recruitment in Ireland', 'https://gradireland.com/'),

('Construction and Architecture', 'red_flag',
 'Describing project involvement without naming the project''s scale, value, or stage — "worked on construction projects" rather than a specific figure and RIBA/RIAI work stage — leaves a reviewer unable to place the candidate at any particular level of responsibility, which is precisely the information this field''s CVs are read for.',
 'Society of Chartered Surveyors Ireland', 'https://scsi.ie/'),

('Creative and Media', 'red_flag',
 'A portfolio site or file that is slow to load or unreasonably large is a real, practical failure in this field specifically — a reviewer moving quickly through many applications will not wait, and the strongest work in the world does not help if it is never actually opened. Compress and test load time before sending, not after a rejection prompts the question.',
 'Design & Crafts Council Ireland', 'https://www.dcci.ie/'),

('Finance and Accounting', 'red_flag',
 'Stating "studying towards ACA/ACCA/CIMA" with no further detail — no exemptions held, no exam sitting named, no expected completion date — reads as vaguer than it needs to be in a field where exact qualification progress is the single most scanned line on the CV. Precision here costs nothing and is read as evidence the candidate actually understands their own qualification pathway.',
 'Chartered Accountants Ireland', 'https://www.charteredaccountants.ie/'),

('Healthcare and Nursing', 'red_flag',
 'Describing clinical duties in language that oversteps a student or newly qualified nurse''s actual scope of practice — implying independent responsibility for tasks that were in fact performed under supervision — is a recognised concern in nursing CV guidance internationally, and Irish clinical panels are equally alert to the distinction between "assisted with" and "independently performed".',
 'nurse.org — nursing resume mistakes and how to fix them', 'https://nurse.org/articles/nursing-resume-mistakes-how-to-fix-them/'),

('Marketing and Communications', 'red_flag',
 'Quoting a follower count or reach figure with no engagement rate, conversion, or business outcome attached is read as a vanity metric rather than a result — the number on its own says nothing about whether the audience actually did anything, and marketing reviewers specifically read for the metric that shows impact, not just size.',
 'Marketing Institute of Ireland', 'https://www.mii.ie/'),

('Social Work and Community', 'red_flag',
 'Including identifiable details about a specific service user or client in a CV or application — even with good intentions, to make an example concrete — is a real confidentiality breach in a field bound by strict data protection and professional confidentiality obligations, and panels notice it immediately as a professional judgement failure rather than an enthusiasm signal.',
 'CORU — Standards of Proficiency for Social Workers', 'https://coru.ie/health-and-social-care-professionals/education/approved-qualifications/social-workers/'),

('Sports and Fitness', 'red_flag',
 'Using a client''s transformation photos, name, or story as evidence of results without clear consent to use them publicly is both a real ethical problem and, increasingly, something reviewers in this field are alert to when assessing professionalism — results are far more credible, and safer to include, when described anonymised or with explicit permission stated.',
 'National Council for Exercise & Fitness', 'https://www.ncef.ie/');
