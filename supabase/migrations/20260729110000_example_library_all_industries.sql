-- ═══════════════════════════════════════════════════════════════════════════
-- example_library — calibration exemplars for every industry
--
-- These are platform-authored (provenance = 'platform_authored'), NOT scraped
-- or copied from published CVs. They exist to show the model what the right
-- level of specificity looks like in each field. They are excluded from
-- benchmarked_against, so no student is ever shown one of these as a citation.
--
-- Every exemplar is written to reflect the must_haves and real_entity rows
-- seeded for the same industry, so the calibration material and the
-- intelligence agree with each other rather than pulling in different
-- directions. All names, numbers and settings are illustrative composites —
-- they describe a plausible Irish student, not a real identifiable one.
--
-- The house style being demonstrated throughout: a concrete setting, the
-- candidate's own action, a named tool or framework where the field expects
-- one, and a number that is specific enough to be checkable.
-- ═══════════════════════════════════════════════════════════════════════════

delete from public.example_library where provenance = 'platform_authored';

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

-- ═══════════ TECHNOLOGY AND SOFTWARE ═══════════
('cv_bullet', 'Technology and Software', 'technical_delivery',
 'Rebuilt the society''s event booking flow in React and Supabase after the previous form lost roughly 30 sign-ups a term to double submissions; added idempotency keys and cut duplicate bookings to zero across the following two semesters.',
 'Names the stack, states the actual failure it fixed, and quantifies both the problem and the result. The fix (idempotency keys) is specific enough that an interviewer can ask a follow-up question about it, which is exactly what a good bullet invites.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Technology and Software', 'problem_solving',
 'Profiled a final-year Django project that was timing out on the college VM, traced it to N+1 queries in the results view, and replaced them with select_related — p95 response fell from 4.2s to 380ms on the same hardware.',
 'Shows the diagnostic path rather than just the outcome. Naming the specific anti-pattern and holding hardware constant makes the improvement credible instead of sounding inflated.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Technology and Software', 'motivation',
 'I have been running my own Raspberry Pi home server since fifth year, and the thing that pulled me toward your platform team was reading your engineering post on cutting cold starts — I had hit a much smaller version of the same problem in my final-year project and solved it far less elegantly.',
 'Opens with real, verifiable evidence of interest that predates the application, then connects it to something specific the company published. The admission that their solution was better reads as genuine engagement rather than flattery.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Technology and Software', 'teamwork',
 'Our four-person group project stalled three weeks before submission because two of us had built incompatible data models. I proposed we spend an evening writing a single shared schema before either branch went further, wrote the migration myself, and set up a shared Postgres instance so we stopped diverging. We submitted on time and the module coordinator used our repository structure as the example in the following year''s briefing.',
 'A real, unglamorous failure with a concrete technical intervention. The outcome is externally validated rather than self-assessed, which is what separates a strong STAR answer from a confident one.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Technology and Software', null,
 'Final-year Computer Science student at UCC, most at home in Python and TypeScript. I spend more time than is reasonable on database performance — my last project went from four-second page loads to under half a second, and I wrote up how. Currently looking for a 2027 graduate software role in Ireland where I would be reviewing and being reviewed on real code.',
 'Has a point of view rather than a skills list. The specific obsession (database performance) plus the evidence makes it memorable to a recruiter scanning fifty profiles, and the ask at the end is concrete.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ ENGINEERING ═══════════
('cv_bullet', 'Engineering', 'technical_delivery',
 'Modelled a 1.2km surface water drainage run in Civil 3D during a nine-month placement with a Cork consultancy, revising the alignment three times against Irish Water''s design criteria until the scheme passed pre-connection review first time.',
 'Names the tool, the scale, the regulator''s criteria, and the outcome. The detail that it passed first time after three iterations shows persistence and standards-awareness rather than just claiming competence.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Engineering', 'problem_solving',
 'Identified that a test rig''s load cell was drifting under thermal load during a final-year project, rebuilt the mounting in SolidWorks with an isolating spacer, and brought repeatability across ten runs from ±8% to ±1.5%.',
 'A genuine engineering diagnosis — root cause, design change, measured improvement. The before-and-after tolerance is the kind of number an engineering reviewer actually reads for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Engineering', 'motivation',
 'My placement year was spent on water infrastructure, and I came away with an uncomfortable respect for how much of Ireland''s network is still asbestos cement pipe laid in the 1960s. That is the specific problem I would like to spend the first years of my career on, which is why I am applying to your networks team rather than a general graduate scheme.',
 'Demonstrates domain knowledge that could only come from real exposure, then narrows to why this employer specifically. Choosing a team over a generic scheme signals genuine intent.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Engineering', 'attention_to_detail',
 'During placement I was checking setting-out drawings for a retaining wall and found a level that did not reconcile with the survey by 150mm. I flagged it to the site engineer rather than assuming the survey was wrong, and we traced it to a transposed benchmark on the original topographic file. Catching it before pour avoided a rebuild that the site manager estimated at roughly two weeks.',
 'Shows judgement, not just carefulness — escalating rather than assuming is the behaviour that matters. The consequence avoided is attributed to someone else''s estimate rather than inflated by the candidate.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Engineering', null,
 'Civil Engineering graduate (UL) | 9-month placement in water infrastructure design | Civil 3D, Revit | Working toward Chartered Engineer with Engineers Ireland',
 'Every segment is a recruiter search term: discipline, evidence of real experience, named tools, and the professional pathway. The chartership mention signals a long-term view without overclaiming current status.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ HEALTHCARE AND NURSING ═══════════
('cv_bullet', 'Healthcare and Nursing', 'clinical_practice',
 'Completed a 12-week clinical placement on a 28-bed surgical ward at Cork University Hospital, supporting a daily caseload of 8–10 post-operative patients within the MDT and taking a lead role in pre-discharge education for hip and knee replacements.',
 'Gives setting, duration, bed base, caseload and specialty — the four things a nursing recruiter needs to picture the placement. Naming a specific responsibility within it is stronger than listing tasks observed.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Healthcare and Nursing', 'patient_safety',
 'Escalated a deteriorating NEWS score to the clinical nurse manager during a night placement shift, having reassessed at 15-minute intervals rather than waiting for the scheduled observation round; patient was reviewed and transferred to HDU within the hour.',
 'Demonstrates escalation judgement and scope-of-practice awareness, which is what values-based nursing panels probe for. Naming the tool (NEWS) and the deviation from routine shows clinical reasoning rather than compliance.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Healthcare and Nursing', 'motivation',
 'I registered with NMBI in June and have spent the three years of placement before that increasingly drawn to older persons'' care — specifically to how much of a patient''s recovery depends on whether anyone has properly explained to them what is happening. Your rehabilitation unit is where I would like to do that work.',
 'Leads with registration status, which is the first thing a nursing recruiter checks. The stated interest is specific and slightly unfashionable, which reads as genuine rather than chosen to impress.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Healthcare and Nursing', 'communication',
 'A patient on my placement ward was refusing a prescribed dressing change and had become distressed with two staff members. I asked the CNM if I could sit with her first without the trolley in the room, and it emerged she had had a painful change two days earlier and nobody had offered analgesia beforehand. We rescheduled for after her pain relief, and the change was completed without distress. I raised it at handover so the pattern would not repeat.',
 'Person-centred practice shown rather than claimed, with the candidate working within scope by checking with the CNM first. Closing the loop at handover demonstrates system awareness, which panels weight heavily.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Healthcare and Nursing', null,
 'Registered General Nurse (NMBI PIN held), graduated from NUI Galway in 2026. Placements across surgical, medical and older persons'' care, with a growing interest in discharge planning and how much of readmission risk is set in the last 48 hours of a stay. Looking for a staff nurse post in an acute setting in the west.',
 'Registration first, then breadth, then a specific professional interest that gives a manager something to talk to. The geographic ask is concrete without being restrictive.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ FINANCE AND ACCOUNTING ═══════════
('cover_letter_opener', 'Finance and Accounting', 'motivation',
 'I spent last summer on a Big 4 insight week and came away most interested in the audit side, which was not what I expected — the part that held my attention was watching a senior push back on a revenue recognition treatment that everyone else had accepted. I hold CAP1 exemptions from my UCD degree and am applying for a training contract to start in September.',
 'Names the concrete experience, states an unexpected preference with a reason, and closes with exemption status and timing. The specific technical moment shows they were paying attention rather than attending.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Finance and Accounting', 'attention_to_detail',
 'Treasurer of a society with a €14,000 annual budget, I found our bank balance diverging from the ledger by €380 over two months. Rather than adjusting to match, I rebuilt the reconciliation from source receipts and found two sponsorship lodgements had been recorded gross while the bank had netted a card fee. I changed the process so all income was recorded net with the fee as a separate line, and the accounts reconciled exactly for the rest of the year.',
 'Refusing to plug the difference is precisely the instinct audit recruiters are testing for. The process change afterwards shows the candidate fixed the cause rather than the symptom.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ LAW ═══════════
('cv_bullet', 'Law', 'legal_research',
 'Researched and drafted a 2,500-word note on the application of the Residential Tenancies Act to licensee arrangements during a FLAC clinic placement, which the supervising solicitor used as the basis for advice to four separate callers.',
 'Names the statute, the deliverable, the setting, and the fact that the work was actually used. Legal CVs are read for whether output met a professional standard, and downstream use is the clearest evidence of that.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Law', 'motivation',
 'I passed six of the eight FE-1 papers in the March sitting and will complete the remaining two in October. My interest in your firm is specific rather than general: I followed the judicial review your team ran on the planning consent last year closely enough to have read the judgment twice, and public law is the area I want to train in.',
 'Leads with FE-1 progress, which is the first screen for a training contract application. The interest is evidenced by a specific matter and an honest admission of how closely they followed it.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Law', 'attention_to_detail',
 'Proofreading a moot court submission the night before filing, I noticed our lead authority had been partially overruled by a Court of Appeal decision six weeks earlier that none of us had picked up. I flagged it immediately, we restructured the second limb of the argument around a different line of authority, and the judge specifically commented that our submission was the only one that had dealt with the newer decision.',
 'Demonstrates the habit of checking whether authority is still good law, which is the single most consequential detail failure in legal practice. External validation from the judge makes the outcome credible.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Law', null,
 'Law graduate (TCD) | FE-1: 6 of 8 passed | Seeking a 2027 training contract | Interest in public and planning law',
 'Exam progress stated plainly, which is what firms filter on. Naming a practice-area interest is a differentiator among applicants who all list "commercial law".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ EDUCATION AND TEACHING ═══════════
('cv_bullet', 'Education and Teaching', 'classroom_practice',
 'Introduced a three-station rotation for a mixed-ability 4th class during a ten-week school placement, differentiating the numeracy task at each station; six of the eight pupils on the support list met their term target and the class teacher retained the model after placement ended.',
 'Names the pedagogical approach, the class context, and a pupil-level outcome. The teacher keeping the model afterwards is the strongest possible evidence that the practice was sound.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Education and Teaching', 'assessment',
 'Redesigned Junior Cycle history assessment for a second-year group around low-stakes weekly retrieval quizzes instead of a single end-of-topic test; average CBA preparation scores rose from 58% to 71% across the term.',
 'Ties a specific assessment-for-learning technique to a measured result within the Irish curriculum framework. Using correct Junior Cycle vocabulary signals real familiarity with the system.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Education and Teaching', 'motivation',
 'I am registered with the Teaching Council (Route 2, post-primary, History and Geography) and completed my PME at DCU this summer. What I want to say about your school specifically is that your DEIS plan''s emphasis on attendance rather than attainment targets is the approach I saw work on placement, and it is why I am applying here first.',
 'Registration route and subjects stated precisely, which is the hard screen. The observation about the school''s own plan proves the application was written for them.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Education and Teaching', 'adaptability',
 'Fifteen minutes before a placement lesson on the Famine, the projector failed and my entire resource set was digital. I switched to a document-based approach using the four printed source extracts I had in my folder for a different group, put students in pairs to annotate them, and ran the comparison discussion I had planned for the second half early. The tutor observing noted the discussion was more substantial than it would have been with the slides.',
 'A real classroom failure handled with a specific pedagogical substitution rather than improvisation. The observer''s comment provides external validation.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Education and Teaching', null,
 'Post-primary teacher of History and Geography, Teaching Council registered, PME (DCU) 2026. School placement across DEIS and non-DEIS settings in north Dublin. Particularly interested in literacy across the curriculum — most of what stops students accessing history is reading, not history.',
 'Registration and subjects lead. The closing observation is a genuine professional position that gives a principal something to ask about at interview.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ BUSINESS AND MANAGEMENT ═══════════
('cv_bullet', 'Business and Management', 'commercial_awareness',
 'Restructured a college society''s sponsorship approach from single-event asks to a three-tier annual package, pitched to eleven local businesses in Galway; secured four partners and grew income from €900 to €4,200 across one academic year.',
 'Shows a commercial decision, the execution volume behind it, an honest conversion rate, and a clean before-and-after number. The 4-from-11 ratio is more credible than reporting only the wins.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Business and Management', 'data_literacy',
 'Built a Power BI dashboard tracking weekly footfall against promotion spend for a family retail business, which showed the Thursday promotion was cannibalising Saturday trade; moving it to Tuesday lifted combined weekly revenue about 6% over the following quarter.',
 'A named tool used to produce a counter-intuitive finding that changed a decision. Hedging with "about" on the result is more trustworthy than a falsely precise figure.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Business and Management', 'motivation',
 'Your last annual report flagged that own-brand penetration was the main margin lever for the year ahead, and that is the part of the business I would want to work on. I spent two summers on the shop floor of a Musgrave-supplied store watching customers make exactly that trade-off at the shelf.',
 'Opens with something specific from the company''s own reporting, then connects it to real, humble experience. This is what commercial awareness looks like in practice rather than as a claimed skill.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Business and Management', 'leadership',
 'As events officer I inherited a flagship event that had lost money two years running. I went through the previous budgets and found the venue was 60% of cost for an event where most attendees left within two hours. I moved it to a campus space, redirected the saving into a better-known speaker, and we went from a €700 loss to a €400 surplus with attendance up by roughly a third.',
 'Leadership shown through analysis and an unpopular structural decision rather than through holding a title. The financial swing is stated in both directions.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Business and Management', null,
 'Commerce graduate (UCG) | Grew society sponsorship income 4.7x in one year | Power BI, SQL | Seeking 2027 graduate roles in retail and FMCG',
 'A concrete achievement in the headline is rare and stops the scroll. Tools and target sector make it searchable.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ CREATIVE AND MEDIA ═══════════
('cv_bullet', 'Creative and Media', 'portfolio_work',
 'Rebranded a 40-year-old Cork food producer for a final-year brief, working inside their existing colour system because retailers had shelf-recognition data on the old packaging; delivered logo, three SKU packaging variants and a one-page brand guide.',
 'States the constraint that shaped the work, which is what separates a designer from someone who makes things they like. The deliverable list is specific enough to picture.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Creative and Media', 'published_work',
 'Wrote and shot a four-part video series on student housing for a college publication; the second piece was picked up by a national outlet and the series passed 40,000 views across platforms.',
 'Names the format, the subject, and independent pickup — the clearest available proof that the work met a professional bar. View count is a supporting figure, not the headline claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Creative and Media', 'motivation',
 'My portfolio is six pieces long and it took cutting about twenty to get there. The three I would point you to first are the ones where the client said no to my first idea — those are the ones I learned anything from, and they are why I want to work somewhere with real art direction rather than freelance alone.',
 'Demonstrates curation judgement, which is the core creative skill, and reframes rejection as development. It tells a hiring director how this person will behave in feedback.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Creative and Media', 'resilience',
 'A client rejected a full identity concept two days before presentation, saying it felt corporate. Rather than defend it, I asked for three brands they admired and found all three used hand-drawn elements. I rebuilt the mark by hand overnight, presented both routes side by side with the reasoning, and they took the new one. I now ask that question at the briefing stage instead of after.',
 'Handles rejection by investigating rather than arguing, and the process change at the end shows the lesson was actually absorbed.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Creative and Media', null,
 'Graphic designer, NCAD 2026. I work best inside constraints — existing colour systems, tiny print budgets, packaging that has to survive a supermarket shelf. Portfolio is deliberately six pieces. Available for junior design roles in Dublin or remote.',
 'A clear point of view about how they work, plus the confidence to state a small portfolio as a choice. Ends with a plain availability line.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ SCIENCE AND RESEARCH ═══════════
('cv_bullet', 'Science and Research', 'laboratory_technique',
 'Optimised an indirect ELISA for a final-year immunology project, reducing inter-assay CV from 18% to 7% across thirty replicates by standardising blocking time and switching to a plate-sealed incubation.',
 'Names the assay, the metric, the sample size, and the two specific changes made. This is the level of detail a research supervisor uses to judge whether someone can actually work independently.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Science and Research', 'data_analysis',
 'Analysed a 400-sample microbiome dataset in R, applying Benjamini-Hochberg correction after finding the initial analysis had not adjusted for multiple comparisons; three of the seven originally significant taxa did not survive correction and the revised finding went into the group''s poster.',
 'Shows statistical literacy and the integrity to report that most of the original finding disappeared. Scientific reviewers read for exactly this kind of self-correction.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Science and Research', 'motivation',
 'My final-year project was on biofilm formation, and the part that stayed with me was how much of the result depended on plate handling nobody documents. I am applying to your QC team because GMP environments are where that documentation discipline is the actual job rather than an afterthought.',
 'Connects genuine lab experience to why a regulated industry role appeals, which is a much stronger motivation than "interested in pharma". Shows they understand what GMP work involves.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Science and Research', 'attention_to_detail',
 'Two weeks into a project I noticed my growth curves were reproducible within a day but not between days. I logged incubator temperature hourly and found it dropped 1.8°C overnight when the building HVAC set back. I moved to a different incubator, re-ran the affected conditions, and flagged the issue to the lab manager, who found two other projects had been affected.',
 'Systematic troubleshooting of an environmental variable most people would never check, plus escalation that helped others. The finding is quantified.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Science and Research', null,
 'Biotechnology graduate (UCC) | ELISA, cell culture, R | Poster presented at the Irish Society for Immunology annual meeting | Seeking QC/QA roles in pharma',
 'Techniques and analysis tools named as searchable terms, plus a conference output that evidences real research contribution. The target role type is explicit.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ CONSTRUCTION AND ARCHITECTURE ═══════════
('cv_bullet', 'Construction and Architecture', 'project_delivery',
 'Assisted cost planning on a €12m residential scheme through RIBA Stages 3–4 during placement with a Dublin PQS practice, preparing measured quantities for the substructure package and tracking three design revisions against the elemental budget.',
 'Places the candidate precisely: project value, work stage, package, and their own scope. A construction reviewer can immediately tell what level they have worked at.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Construction and Architecture', 'technical_delivery',
 'Produced the Revit model and coordinated clash detection in Navisworks for a two-storey community building studio project, resolving 40 services clashes before the structural review rather than during it.',
 'Names both tools in the workflow and states when the clashes were resolved, which is the part that actually matters commercially. Specific count beats "worked with BIM".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Construction and Architecture', 'motivation',
 'I am an architectural graduate rather than a registered architect — I mention that first because the Building Control Act makes the distinction a legal one, and I would rather be precise about it. I hold Safe Pass and spent my placement year on site in Limerick, which is why I am applying to a practice that runs its own site inspections.',
 'Title accuracy handled openly, which demonstrates exactly the professional care the field screens for. Safe Pass and site exposure address two hard requirements immediately.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Construction and Architecture', 'attention_to_detail',
 'Reviewing a subcontractor''s interim valuation on placement, I found the same blockwork area claimed under two separate elements. I re-measured from the drawings, confirmed the duplication was about €18,000, and raised it with the project QS with the measurement sheet attached rather than just the objection. The valuation was corrected before certification.',
 'Shows measurement competence and the professional habit of bringing evidence rather than a complaint. The financial consequence is concrete and verifiable.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Construction and Architecture', null,
 'Quantity surveying graduate (TU Dublin), working toward SCSI chartership. Placement year with a Dublin PQS practice across residential and education schemes up to €12m. Comfortable in CostX and Bluebeam, Safe Pass held. Looking for a graduate QS role with a contractor or consultancy.',
 'Chartership pathway, project scale, named software and safety certification — the four filters this field applies, in one paragraph.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ HOSPITALITY AND TOURISM ═══════════
('cv_bullet', 'Hospitality and Tourism', 'service_delivery',
 'Ran a 14-table section across 120-cover Saturday dinner services in a 4-star Killarney hotel, training two new starters on the section during the summer season while maintaining sub-12-minute starter times.',
 'Covers, section size, property standard, and a service metric. This is the vocabulary a head chef or restaurant manager reads in, and it makes the candidate instantly placeable.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Hospitality and Tourism', 'operations',
 'Took over stock control for a 60-seat Galway restaurant, moving from ad-hoc ordering to a weekly par-level sheet; food cost fell from roughly 34% to 29% over two months without changing suppliers.',
 'A specific operational intervention with a margin outcome, and the note that suppliers stayed the same rules out the obvious alternative explanation.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Hospitality and Tourism', 'motivation',
 'I have worked three summers in Kerry hotels and I know the difference between a property that says it is guest-focused and one where the GM knows the housekeepers'' names. I am applying to you because two people I worked with came from your group and both said the same thing about how you train.',
 'Grounded, specific, and uses genuine industry word-of-mouth as evidence. Reads like someone who has actually done the work rather than someone describing it.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Hospitality and Tourism', 'problem_solving',
 'A coach party of 40 arrived 90 minutes early during a Saturday service with the restaurant already at capacity. I moved them to the function room, got the kitchen to switch them to the set menu we hold for events, and served drinks in the lobby while it was set. They ate 25 minutes after arriving and the à la carte service was not disrupted.',
 'A concrete operational crisis solved with three specific decisions. The outcome protects both parties, which is what hospitality managers are testing for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Hospitality and Tourism', null,
 'Hospitality Management graduate (TU Dublin) | 3 seasons in 4-star Kerry properties | HACCP certified | Seeking F&B supervisory roles',
 'Property standard and seasons worked are the credibility markers in this field; HACCP addresses the compliance screen; the target role is stated plainly.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ PUBLIC SECTOR AND CIVIL SERVICE ═══════════
('star_answer', 'Public Sector and Civil Service', 'delivery_of_results',
 'I volunteered with a Citizens Information outreach service where the intake form was generating a high proportion of incomplete referrals. I audited 200 completed forms, found that two questions accounted for most of the omissions because both asked for information people did not have to hand, and redrafted them to accept partial answers with a follow-up prompt. Incomplete referrals fell by roughly a third over the next two months.',
 'First person singular throughout, one bounded example, and a measured outcome — exactly how PAS competency answers are scored. The public-value framing fits the Drive & Commitment heading without stating it clumsily.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Public Sector and Civil Service', 'interpersonal_communication',
 'Two community groups sharing a council-funded facility had escalated a booking dispute to the point where neither would attend a joint meeting. I met each separately first to establish what they actually needed rather than what they were demanding, found the real conflict was over storage rather than hours, and proposed a partition solution. Both signed a revised usage agreement and the facility manager reported no further complaints that year.',
 'Isolates the candidate''s own actions, shows stakeholder handling under genuine conflict, and closes with an externally reported outcome.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Public Sector and Civil Service', 'analysis_decision_making',
 'Asked to recommend which of four outreach locations to drop when funding was cut, I pulled attendance data for eighteen months rather than relying on staff impressions. The lowest-attended clinic turned out to serve the highest proportion of first-time users, so I recommended cutting a better-attended location with substantial overlap with a nearby service instead. The coordinator accepted the recommendation.',
 'Evidence over impression, and a recommendation that goes against the obvious answer with a public-value justification. This is the reasoning pattern the Analysis & Decision Making heading rewards.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Public Sector and Civil Service', 'motivation',
 'I applied through publicjobs.ie because I want to work somewhere the decisions are accountable to the public rather than to a margin. My clearest experience of that was volunteering on a Citizens Information desk, where the constraint was never budget — it was whether the form made sense to the person filling it in.',
 'Public service values stated through a concrete experience rather than asserted. Naming the actual constraint shows real understanding of front-line public service.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Public Sector and Civil Service', 'stakeholder_engagement',
 'Coordinated a student union response to a proposed campus transport change, gathering 340 survey responses in nine days and presenting a three-option submission to the university''s estates committee; the committee adopted the middle option.',
 'Volume, timeframe, deliverable and outcome. Presenting options rather than a demand is the behaviour public sector assessors look for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ SOCIAL WORK AND COMMUNITY ═══════════
('cv_bullet', 'Social Work and Community', 'practice',
 'Held a placement caseload of nine children in care with Tusla, co-working with school completion officers and CAMHS, and chaired three statutory review meetings under supervision.',
 'Caseload size, statutory context, named partner agencies, and the supervision framing. Every element is what a social work team leader needs to gauge readiness.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Social Work and Community', 'safeguarding',
 'Completed Children First training and applied it in practice during placement by escalating two concerns to the designated liaison person, including one where the young person had asked me not to — and explaining to them beforehand why I had to.',
 'Demonstrates that safeguarding is understood as a duty that can override rapport, and the detail about explaining first shows person-centred practice within that duty.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Social Work and Community', 'motivation',
 'I am CORU registered and completed my final placement in a residential setting. What I took from it is that most of the difficult moments were not about risk at all — they were about young people testing whether an adult would still be there next week. That is the work I am applying to do.',
 'Registration first, then a reflective observation that could only come from real practice. Values-based recruiters read for exactly this kind of grounded insight.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Social Work and Community', 'professional_boundaries',
 'A young person on placement began contacting me on a personal social media account. I did not respond, told my supervisor at the next opportunity rather than waiting for supervision, and we agreed I would address it directly with him. I explained why the boundary existed in terms of his protection rather than rules, and we agreed how he could contact the service properly. He used the correct route afterwards.',
 'Boundary handled correctly and promptly, escalated rather than managed alone, and explained to the young person in terms of their interests. This is precisely what values-based panels probe.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Social Work and Community', null,
 'Social worker, CORU registered, MSW graduate 2026. Placements in statutory child protection with Tusla and in a residential care setting. Interested in the transition out of care — the point where support stops is where most of the outcomes are decided. Seeking a team post in the Dublin region.',
 'Registration, placement breadth, and a specific professional position that shows the candidate thinks beyond their caseload.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ SPORTS AND FITNESS ═══════════
('cv_bullet', 'Sports and Fitness', 'coaching',
 'Delivered a 12-week block-periodised strength programme to a panel of 22 minor hurlers, screening movement quality fortnightly and regressing loading for four players flagged with overhead mobility restrictions; no training-related soft tissue injuries across the block.',
 'Programme structure, squad size, an ongoing assessment process, and an honest safety outcome rather than a performance claim that could not be attributed.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Sports and Fitness', 'client_results',
 'Coached a return-to-running client from post-tibial-stress-fracture clearance to a 10k over 16 weeks, progressing volume by no more than 10% weekly and liaising with her physiotherapist at weeks 4 and 10.',
 'Names the starting point, the timeframe, the progression rule, and the interdisciplinary liaison — which together demonstrate scope-of-practice awareness rather than just a result.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Sports and Fitness', 'motivation',
 'I hold the NCEF Certificate in Exercise and Health Fitness (Level 6, University of Limerick) and current first aid certification. I am applying to your facility rather than a chain because the members I would be working with are the ones least likely to walk into a gym at all, and that is the group I have most experience with.',
 'Qualification named with its awarding body and level — the primary screen in this field — followed by a specific reason for this employer.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Sports and Fitness', 'communication',
 'A new client arrived with a printout of a programme from social media and wanted to start it immediately. Rather than refusing, I ran him through a movement screen and showed him where two of the lifts would load a shoulder restriction he did not know he had. We kept the parts of the programme that were fine and substituted two exercises. He stayed for the full twelve weeks.',
 'Handles a common real scenario without dismissing the client, uses assessment as the persuasion tool, and reports retention as the outcome.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Sports and Fitness', null,
 'Strength & conditioning coach | NCEF Level 6 (UL) | GAA and return-to-play conditioning | First aid current | Limerick',
 'Qualification with awarding body, specialism, safety certification and location — the exact filters a facility manager or club applies.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ MARKETING AND COMMUNICATIONS ═══════════
('cv_bullet', 'Marketing and Communications', 'campaign_delivery',
 'Grew a college society''s Instagram from 1,200 to 6,800 followers over five months through a weekly student-story series, lifting engagement rate from 1.9% to 4.4% on a total spend of €120.',
 'Baseline and endpoint for both audience and engagement, plus the spend that produced it. Percentages with baselines are the standard this field reads for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Marketing and Communications', 'analytics',
 'Set up GA4 event tracking for a small Dublin retailer''s new site and found 40% of mobile sessions dropped at the delivery-cost step; recommending an earlier shipping estimate cut mobile checkout abandonment from 71% to 58% over six weeks.',
 'Names the tool, the specific finding, the recommendation, and the measured change. The chain from data to decision to result is what separates analytics claims from analytics ability.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Marketing and Communications', 'motivation',
 'I have run a small Instagram account for a family business for two years, which mostly taught me how easy it is to grow an audience that never buys anything. That is the distinction I want to keep working on, and it is why your performance side interests me more than the brand side.',
 'A genuinely self-critical opening that demonstrates commercial understanding, then narrows to a specific team with a reason. Far stronger than claiming passion for marketing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Marketing and Communications', 'initiative',
 'Our society''s event posts were reaching about 400 people and we assumed the algorithm was the problem. I checked posting times against our own audience insights and found we were posting at 6pm while our audience peaked at 9:30pm. I moved the schedule, kept everything else identical for four weeks to isolate the variable, and average reach rose to roughly 1,100.',
 'Tests one variable at a time and says so explicitly, which is the discipline that makes a marketing result believable rather than coincidental.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Marketing and Communications', null,
 'Marketing graduate (DCU), most interested in the gap between reach and revenue. GA4 and Meta Ads Manager certified; my last project cut a retailer''s mobile checkout abandonment by 13 points. Looking for a graduate performance marketing role in Dublin.',
 'Leads with a point of view, backs it with a certification and a concrete result, and closes with a specific ask. No adjectives doing work that evidence should do.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
