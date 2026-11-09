-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen example_library: cv_bullet floor of 3, star_answer competency variety
--
-- Two concrete, measured gaps closed:
--
--   cv_bullet — fetchIndustryExamples('cv_bullet', industry, 3) asks for 3.
--   Ten industries had only 2, one (Public Sector) had only 1, so generate-cv
--   and review-cv were topping up from 'general' for those every time —
--   generic transferable-skills material standing in for industry-specific
--   calibration. Every industry now has 3+.
--
--   star_answer variety — every industry but Public Sector had exactly ONE
--   competency covered. fetchCompetencyExamples (as of the previous migration)
--   prefers a student's own industry, but a Law student asked about
--   "Communication" had nothing Law-specific to prefer — only the one
--   "Attention to Detail" row existed for that industry. Every industry now
--   covers a second, distinct competency. Public Sector's addition
--   ("Leading and Empowering") completes coverage of all four current Civil
--   Service capabilities, where two rows previously converged on one.
--
-- Same discipline as the rest of this table: platform-authored, illustrative
-- composites, internally consistent with the must_haves/real_entities already
-- seeded for each industry, excluded from student-facing citations by
-- citableSources().
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

-- ═══════════ cv_bullet — bringing every industry to 3+ ═══════════

('cv_bullet', 'Public Sector and Civil Service', 'evidence_informed_delivery',
 'Compiled and analysed eighteen months of clinic attendance data to support a funding submission, presenting findings by service type and demographic to the steering group rather than as a single headline figure.',
 'Evidence-led rather than assertion-led, which is exactly what the Evidence Informed Delivery capability tests for — breaking a single number into service type and demographic shows the analysis went beyond the surface figure.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Public Sector and Civil Service', 'communicating_and_collaborating',
 'Drafted plain-language guidance replacing a legally-worded eligibility notice that had generated the majority of a service''s phone queries; call volume on that query fell by roughly a third within two months of reissue.',
 'Public-facing communication improved by a measured amount, in a context (plain-language accessibility) that is a live, recognised priority across Irish public service delivery.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Construction and Architecture', 'technical_delivery',
 'Tracked variation orders against the original bill of quantities for a school extension project, flagging a cumulative 6% cost creep to the project QS before it reached the client-facing cost report.',
 'Catching drift before it becomes a client-facing problem is the specific value a junior QS or PM adds, and the percentage makes the scale of the catch legible.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Creative and Media', 'client_work',
 'Delivered social content for a Cork independent retailer''s first paid campaign on a €300 total budget, briefing and directing a single half-day shoot to produce six weeks of usable assets.',
 'Working within a genuinely small, named budget and stretching it is a more relatable and more useful signal for an early-career creative role than a large, unspecified client engagement.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Engineering', 'process_improvement',
 'Rewrote a lab test procedure that had a 22% first-pass fail rate, isolating three unclear steps flagged by every technician who used it; revised procedure ran at a 4% fail rate over the following forty tests.',
 'Root-cause investigation (asking the people who use the procedure) plus a before/after number is the pattern engineering reviewers read as real problem-solving rather than a title change.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Finance and Accounting', 'process_improvement',
 'Automated a monthly variance report that previously took a day to compile by hand, using Excel Power Query to pull from three source systems; freed up roughly a day per month for closer variance analysis instead of data assembly.',
 'A specific tool used to solve a specific, relatable finance-team problem, with the freed time reframed as more time on judgement work rather than just "saved time" as a vague claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Law', 'due_diligence',
 'Reviewed 40 commercial leases during a due diligence exercise for a property acquisition, flagging six with change-of-control clauses the client had not been aware of before the review.',
 'A concrete volume of documents and a specific, consequential finding — the kind of detail that shows real engagement with the material rather than a generic "assisted with due diligence" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Marketing and Communications', 'seo',
 'Rebuilt on-page SEO for a twelve-page local business site with no prior optimisation, targeting long-tail terms from actual search console queries rather than assumed keywords; organic sessions roughly doubled over the following quarter.',
 'Grounding keyword choice in real search data rather than guesswork is the specific competence this claim demonstrates, and the result is stated as a plausible order-of-magnitude rather than a precise, unverifiable figure.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Science and Research', 'method_development',
 'Adapted a published extraction protocol for a sample type it had not been validated against, running a small pilot series to confirm recovery rate before committing the full sample set to it.',
 'Shows scientific caution — validating a method before full deployment — which is exactly the habit of mind a research supervisor is trying to assess from a CV bullet.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Social Work and Community', 'group_work',
 'Co-facilitated an eight-week parenting support group for a community organisation, adapting session content mid-programme after attendance dropped in week 3 and informal feedback pointed to timing rather than content.',
 'Responding to a real signal (attendance drop) with a diagnosis before a fix, rather than assuming the content was wrong, shows the kind of reflective practice this field explicitly recruits for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Sports and Fitness', 'programme_design',
 'Designed a return-to-training block for three athletes recovering from unrelated lower-body injuries, individualising load progression against each physiotherapist''s clearance criteria rather than running one shared protocol.',
 'Naming the interdisciplinary liaison (physiotherapist clearance) and the individualisation shows scope-of-practice awareness, which matters as much as programming skill in this field''s screening.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ star_answer — a second, distinct competency per industry ═══════════

('star_answer', 'Business and Management', 'Problem Solving',
 'Our end-of-year society trip lost its venue booking four days out when the venue double-booked. I called every comparable venue on our list within the budget that evening, found one with availability but no catering included, and negotiated a discount by bringing our own catering supplier instead of theirs. The trip went ahead on the original date with 90% of members still attending.',
 'A genuine time-pressured problem solved through direct action rather than escalation, with a concrete constraint (budget, timeline) shaping the solution rather than an idealised fix.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Construction and Architecture', 'Client / Stakeholder Focus',
 'A client on a small extension project kept requesting changes after drawings had gone to planning, which was putting the timeline at risk. Rather than simply refusing further changes, I set up a single half-hour call to walk through exactly what could still change without a new planning application and what could not, with the reasons explained rather than just the rule stated. They stopped requesting mid-process changes and the application went in on schedule.',
 'Managing a difficult client relationship through explanation rather than refusal is the behaviour this field''s client-facing roles actually need, and the outcome (schedule held) is concrete.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Creative and Media', 'Initiative',
 'Nobody on our student media team had ever covered a live event before our first attempt at a campus festival livestream, and the plan we had would have needed four more people than we had. Three days out, I rewrote the plan around a single-camera, pre-recorded-segment hybrid format that needed two people instead of six, and ran a dry test the night before to catch problems early. The stream ran with no major issues and became the template the team used for the next two events.',
 'Recognising a plan would not work and redesigning it under real time pressure, rather than pushing ahead or cancelling, is initiative shown through a decision rather than claimed as a trait.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Education and Teaching', 'Communication',
 'A parent emailed angrily after their child came home upset about a group project mark, believing their child had been unfairly graded compared to groupmates. Rather than replying by email, I called and asked to hear their child''s account of the group''s process first before explaining the marking. It turned out the child had misunderstood which part of the rubric applied to individual versus group contribution. I clarified this to both the parent and, separately, to the class as a whole before the next group task.',
 'De-escalating a difficult parent interaction by listening first and choosing the right channel (a call, not email) is exactly the communication judgement school leadership looks for, and the class-wide follow-up shows systemic thinking.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Engineering', 'Problem Solving',
 'A structural model I was building for a placement project kept producing an unrealistic deflection result on one specific span. Rather than assuming the software was wrong, I manually recalculated that span by hand from first principles and found I had entered the wrong support condition — pinned instead of fixed — three steps earlier in the model. Correcting it brought the result in line with hand-check expectations across the whole model, not just that span.',
 'Choosing to hand-verify rather than distrust the tool, and finding the actual root cause rather than patching the symptom, is the specific engineering discipline this story demonstrates.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Finance and Accounting', 'Initiative',
 'While shadowing on a college accounting society project, I noticed our treasurer was manually re-entering the same bank export into three different spreadsheets each month. Without being asked, I built a single Excel template with linked tabs so the data was entered once and fed the other views automatically. It cut the treasurer''s monthly admin time roughly in half and the committee kept using the template after I left the role.',
 'Spotting and fixing an inefficiency nobody had asked to have fixed, and the template outliving the candidate''s own involvement, is a stronger initiative signal than a instructed task completed well.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Healthcare and Nursing', 'Teamwork',
 'On a busy placement shift, a colleague was clearly overwhelmed with a high-acuity patient load and falling behind on observations. I flagged it to the CNM rather than either colleague quietly struggling on, and offered to take two of her lower-acuity patients for the rest of the shift so she could focus. All observations were completed on time and she thanked me afterwards for noticing before it became a safety issue.',
 'Noticing a colleague struggling and acting through the proper channel (informing the CNM) rather than either ignoring it or overstepping is exactly the team-safety behaviour clinical panels probe for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Hospitality and Tourism', 'Communication',
 'A guest complained loudly at the front desk about a room that did not match what was booked, drawing attention from other guests in the lobby. I asked her to step to the side desk, apologised without making excuses, and worked through two alternative rooms with her there rather than making her wait while I checked separately. She accepted the upgrade offered and left a positive review that specifically mentioned how the complaint was handled.',
 'Moving a public complaint to a private conversation and solving it collaboratively rather than defensively is the exact behaviour hospitality service-recovery training is built around.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Law', 'Communication',
 'A client called visibly frustrated after not understanding a letter of advice a colleague had sent, full of necessary but dense legal terminology. Rather than simply resending the same letter, I talked her through it clause by clause over the phone in plain language, then followed up with a short plain-English summary alongside the original letter for her records. She confirmed she understood her options and the matter proceeded without further confusion.',
 'Translating necessary legal precision into something a client can actually act on, without losing the precision itself, is a core skill firms explicitly train for and explicitly assess in interviews.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Marketing and Communications', 'Problem Solving',
 'A scheduled product launch campaign was set to go live the same week a competitor announced a very similar product, which would have made our messaging look derivative. With two days before launch, I reworked the campaign angle to lead with a genuine differentiator we had been under-emphasising instead of the original generic benefit-led hook. The campaign launched on schedule and outperformed our previous three campaigns on click-through rate.',
 'Reacting to a real competitive threat by finding the genuine differentiator rather than panicking or delaying is the kind of commercial problem-solving marketing teams actually face under launch pressure.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Public Sector and Civil Service', 'Leading and Empowering',
 'A small team I was informally coordinating on a cross-departmental working group had one member consistently missing deadlines, which was affecting the group''s output. Rather than escalating immediately or doing the work myself, I met with them one-to-one to understand the cause — it turned out they were unclear on the actual scope of what was being asked — and we agreed a clearer, smaller first deliverable together. They met every deadline from that point on and later took on a larger piece of the group''s work.',
 'Empowering a struggling team member by diagnosing the real cause and adjusting scope together, rather than taking the work back or simply pushing harder, is what the Leading and Empowering capability is assessing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Science and Research', 'Problem Solving',
 'Halfway through a semester-long project, the specific reagent lot my protocol depended on was discontinued by the supplier with no direct replacement. I contacted the lab that had originally published the protocol to ask what they had substituted when they faced the same issue, adapted their suggested alternative, and ran a small validation series before continuing the main experiment. The project finished on the original timeline.',
 'Reaching outside the immediate lab for a solution, rather than treating the obstacle as project-ending, and validating the substitute before committing to it, shows real research problem-solving under a genuine external constraint.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Social Work and Community', 'Initiative',
 'During placement I noticed several families I was working with were repeatedly missing appointments because our standard letter went out only in English and several families'' first language was not English. Without being asked, I raised it with my supervisor and, with her sign-off, sourced a translated version through the organisation''s existing interpreter service rather than creating extra unofficial workarounds. Missed appointments among those families dropped noticeably over the following two months.',
 'Identifying a systemic barrier, raising it through the proper channel rather than working around it informally, and following through to a measured result is initiative exercised responsibly within a statutory setting.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Sports and Fitness', 'Adaptability',
 'A client I had programmed a strength block for was diagnosed with a minor but real cardiac irregularity by their GP two weeks into the programme, with a note requiring a lower intensity ceiling until cleared for full training. I redesigned the remaining ten weeks around volume and technique work rather than intensity, kept in contact with the GP''s guidance rather than the client''s own interpretation of it, and cleared the client back to normal programming once the all-clear came through.',
 'Adapting a whole programme around a genuine medical constraint, and deferring to the medical professional''s guidance rather than the client''s preference, shows the scope-of-practice discipline this field screens for directly.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Technology and Software', 'Problem Solving',
 'A production bug was intermittently corrupting user data on save, but it only reproduced roughly one time in fifty and never under a debugger. Rather than guessing, I added structured logging around every write path and waited for it to reproduce in logs, which took two days but pinpointed a race condition between two async writes that only occurred under specific timing. Fixing the race condition eliminated the bug entirely across the following month of monitoring.',
 'Choosing patient, evidence-based diagnosis over guessing at a fix for an intermittent bug — and being honest that it took two days — is the kind of engineering judgement technical interviewers specifically probe for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
