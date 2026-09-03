-- ═══════════════════════════════════════════════════════════════════════════
-- example_library for the third wave of newly added industries
--
-- Human Resources and People Operations, Food and Beverage Manufacturing,
-- Non-Profit and NGO Management, and Telecommunications and Utilities,
-- matched to each generator's actual fetch limits (cv_bullet 3,
-- cover_letter_opener 2, linkedin_headline 2, linkedin_about 2, star_answer
-- 2 across distinct CORE_COMPETENCIES tags) — same depth and discipline as
-- every prior wave.
--
-- All rows platform-authored composites, internally consistent with the
-- industry_intelligence facts seeded alongside this migration (CIPD grades,
-- the WRC, BRCGS/Bord Bia QA, the Charities Regulator and Governance Code,
-- Dóchas, ComReg's general authorisation regime), and excluded from
-- student-facing citations by citableSources().
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

-- ═══════════ HUMAN RESOURCES AND PEOPLE OPERATIONS ═══════════

('cv_bullet', 'Human Resources and People Operations', 'recruitment_metrics',
 'Reduced average time-to-hire for graduate roles from 34 days to 21 days over one recruitment cycle by restructuring the interview process from three sequential rounds to two rounds run in parallel with a shared scorecard.',
 'A specific, comparable time-to-hire metric with a diagnosed process fix is exactly the kind of evidence an HR reviewer is scanning a CV for, rather than a general "improved recruitment" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Human Resources and People Operations', 'qualification',
 'Completed the CIPD Level 5 Associate Diploma in People Management while working part-time in a generalist HR role, applying each module''s content directly to live recruitment and onboarding work rather than as a standalone qualification.',
 'Naming the exact CIPD qualification and connecting it to real applied work is far stronger than "studying HR" vaguely.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Human Resources and People Operations', 'employee_relations',
 'Managed the exit interview process for a 40-person department over six months, identifying a recurring theme in three separate exits that led to a change in on-call scheduling policy the department head then adopted.',
 'A specific volume, a real pattern found in qualitative data, and a genuine policy outcome demonstrate real HR analytical work rather than administrative task completion.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Human Resources and People Operations', 'achievement_led',
 'Restructuring a three-round sequential interview process into two parallel rounds with a shared scorecard cut average time-to-hire for graduate roles from 34 days to 21 — the kind of unglamorous process redesign that actually changes whether a strong candidate is still available by offer stage. That is the operational thinking I want to keep applying, at a larger scale than a single recruitment cycle allowed.',
 'A specific, measured process improvement opens the letter with evidence rather than a stated interest in "working with people".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Human Resources and People Operations', 'achievement_led',
 'Noticing the same theme surface across three separate exit interviews in one department led me to flag a scheduling policy problem nobody had connected across individual conversations — and the department head changed the policy as a result. I would rather be the person who spots the pattern across the anecdotes than the person filing them individually, which is the analytical habit I want a generalist HR role to give me more room for.',
 'A specific, real analytical finding from qualitative HR data demonstrates genuine capability, stronger than a general claim of being a good listener.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Human Resources and People Operations', null,
 'HR Graduate | CIPD Level 5 Associate Diploma | Time-to-hire cut 34 to 21 days | Generalist HR placement',
 'States the exact CIPD qualification level and a real, comparable metric rather than a vague "HR professional" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Human Resources and People Operations', null,
 'People Operations placement | Exit interview analysis, 40-person department | Working toward CIPD Associate membership',
 'Names a specific analytical piece of work and the real membership grade being pursued, rather than "aspiring HR professional".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Human Resources and People Operations', null,
 'HR graduate, CIPD Level 5 Associate Diploma. During a placement I restructured a three-round interview process into two parallel rounds with a shared scorecard, cutting time-to-hire for graduate roles from 34 to 21 days. I''m most interested in the operational side of HR — the process design that determines whether a good candidate is still available by the time an offer goes out. Working toward CIPD Associate membership. Looking for generalist HR or people operations graduate roles.',
 'A specific, quantified process result grounds the "graduate" claim in real applied work, and states precisely which CIPD grade is being pursued.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Human Resources and People Operations', null,
 'People Operations placement graduate. Managed exit interviews for a 40-person department over six months and traced a recurring theme across three separate exits back to an on-call scheduling policy, which the department head then changed. I''m interested in the analytical side of HR as much as the process side — reading the pattern across individual conversations, not just recording them. Open to generalist or people analytics graduate roles.',
 'A specific analytical finding with a real policy outcome is far more persuasive than a general claim of caring about employee wellbeing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Human Resources and People Operations', 'Problem Solving',
 'Time-to-hire for graduate roles had crept up to 34 days and nobody could say exactly why, since every individual interviewer felt their own round was efficient. Rather than assuming it was interviewer availability, I mapped the actual calendar gaps between each sequential round and found most of the delay was scheduling dead time between rounds, not the interviews themselves. Restructuring to two parallel rounds with a shared scorecard cut the average to 21 days.',
 'Diagnosing the real bottleneck (scheduling gaps, not interview quality) through actual data rather than accepting the first plausible explanation is exactly the process-thinking HR generalist roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Human Resources and People Operations', 'Communication',
 'An employee came to me upset after being passed over for an internal promotion, feeling the process had been unclear and unfair. Rather than repeating the standard "you weren''t successful this time" line, I walked them through exactly which criteria the successful candidate had met more strongly, with specific examples, and what they could work on for the next round. They thanked me for the honesty and applied again successfully eight months later.',
 'Giving genuinely specific, honest feedback rather than a deflecting standard line is exactly the difficult-conversation skill HR generalist and people partner roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ FOOD AND BEVERAGE MANUFACTURING ═══════════

('cv_bullet', 'Food and Beverage Manufacturing', 'quality_control',
 'Reduced batch reject rate on a dairy processing line from 3.8% to 1.9% over one quarter during a placement, by tracing the majority of rejects back to a single filling-head calibration drift and building a twice-daily calibration check into the shift handover.',
 'A specific, comparable quality metric with a diagnosed root cause is exactly the kind of evidence a food manufacturing employer reads a CV for, rather than a general "quality improvement" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Food and Beverage Manufacturing', 'compliance',
 'Prepared documentation for a site''s BRCGS surveillance audit, closing out 4 of 6 minor non-conformances from the previous audit before the assessor arrived, and briefed the shift floor on the two that remained open.',
 'Naming the actual certification (BRCGS) and a specific, checkable audit outcome demonstrates real compliance competence, not just "worked in a regulated environment".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Food and Beverage Manufacturing', 'haccp',
 'Ran HACCP-based hygiene checks across three production shifts during a food safety placement, flagging a temperature-log gap in the cold storage record that, once corrected, brought the site''s own internal audit score back above its target threshold.',
 'Naming HACCP explicitly and a specific, real compliance catch is far stronger evidence than "completed food safety training".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Food and Beverage Manufacturing', 'achievement_led',
 'Tracing a dairy line''s batch reject rate back to a single filling-head calibration drift, rather than accepting the vaguer "machine variability" explanation everyone had settled on, brought the reject rate from 3.8% down to 1.9% within a quarter. That instinct to keep digging past the first plausible explanation is what I want to bring to a technical or quality role on a bigger production line.',
 'A specific, measured quality result grounded in real root-cause diagnosis is a far stronger opener than a general statement of interest in food manufacturing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Food and Beverage Manufacturing', 'achievement_led',
 'Closing out four of six open non-conformances from a site''s previous BRCGS audit before the next assessor visit taught me that compliance work is really about not letting small gaps sit unresolved, not about passing the audit itself. That is the standard I want to bring to a quality role at a site that takes its certification seriously rather than treating it as a once-a-year exercise.',
 'A specific, real audit-preparation result demonstrates genuine understanding of what compliance work actually is, stronger than a general claim of attention to detail.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Food and Beverage Manufacturing', null,
 'Food Science graduate | Dairy line batch reject rate cut 3.8% to 1.9% | HACCP trained',
 'A specific, comparable production metric and a named credential (HACCP) are exactly what a food manufacturing hiring manager scans a profile for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Food and Beverage Manufacturing', null,
 'Quality placement | BRCGS audit preparation | Closed 4 of 6 open non-conformances',
 'Names the actual certification standard and a real, checkable audit result rather than a generic "quality experience" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Food and Beverage Manufacturing', null,
 'Food Science graduate. On placement I traced a dairy line''s batch reject rate back to a single filling-head calibration drift and built a twice-daily check into shift handover, bringing the reject rate from 3.8% to 1.9% within a quarter. I like the part of this field most people skip past — the unglamorous root-cause work that actually fixes a recurring problem rather than papering over it. Looking for production or technical graduate roles.',
 'A specific, quantified quality result grounded in real diagnostic work is far more persuasive than a general "detail-oriented" self-description.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Food and Beverage Manufacturing', null,
 'Quality placement graduate. Prepared documentation for a site''s BRCGS surveillance audit, closing four of six open non-conformances from the previous audit before the assessor arrived. Compliance work is really about not letting small gaps sit — that is the standard I want to bring to a quality role at a site that treats certification as ongoing discipline, not an annual event. Interested in food safety and quality assurance graduate roles.',
 'A specific audit-preparation result and a genuine point of view about what compliance actually requires reads as real sector understanding.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Food and Beverage Manufacturing', 'Problem Solving',
 'A dairy line''s batch reject rate had drifted up to 3.8% and the standing explanation on the floor was general "machine variability", which nobody had actually tested. Rather than accepting that, I pulled the reject data by time of day and found a pattern tied to a specific filling head rather than the line as a whole. Recalibrating just that head and adding a twice-daily check brought the reject rate down to 1.9% within a quarter.',
 'Refusing to accept a vague, unverified explanation and finding the actual pattern in the data is exactly the diagnostic thinking quality and technical roles in this field are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Food and Beverage Manufacturing', 'Attention to Detail',
 'While running HACCP-based hygiene checks across a shift, I noticed the cold storage temperature log had a two-hour gap the previous night where no reading had been recorded, even though the product inside was still within its acceptable range when I checked it directly. Rather than assuming it was a one-off, I flagged it and the gap turned out to trace back to a shift handover timing issue that had been happening intermittently for weeks. The site''s internal audit score improved once the handover process was corrected.',
 'Catching a real, already-occurred documentation gap and tracing it to a systemic cause rather than dismissing it as a one-off is exactly the vigilance HACCP-based compliance roles require.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ NON-PROFIT AND NGO MANAGEMENT ═══════════

('cv_bullet', 'Non-Profit and NGO Management', 'fundraising',
 'Grew a small charity''s individual-giving programme from €12,000 to €31,000 in one year by moving from a single annual appeal letter to a three-touch campaign (appeal, update, thank-you) sent to the same donor list.',
 'A specific, comparable fundraising figure with a named method demonstrates real development competence, far stronger than "supported fundraising activities".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Non-Profit and NGO Management', 'governance',
 'Compiled the organisation''s first Charities Governance Code compliance self-assessment against all six principles, identifying two gaps in conflict-of-interest documentation that the board then closed before the next annual return.',
 'Naming the actual regulatory framework (the Governance Code) and a real, specific gap closed demonstrates genuine governance literacy, not just general admin support.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Non-Profit and NGO Management', 'programme_delivery',
 'Coordinated a 40-volunteer community programme across 12 weekly sessions, tracking attendance and outcomes against the funder''s own reporting template rather than an internal-only record, cutting the final report''s preparation time by half.',
 'A specific scale (40 volunteers, 12 sessions) and a real operational insight (aligning to the funder''s template) shows genuine programme management competence.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Non-Profit and NGO Management', 'achievement_led',
 'Growing a small charity''s individual-giving programme from €12,000 to €31,000 in a year came from something simple — sending donors a genuine update and thank-you between appeals, not just an annual ask. That instinct to treat donors as an ongoing relationship rather than a once-a-year transaction is what I want to bring to a development role with a larger donor base to build.',
 'A specific, measured fundraising result opens the letter with evidence rather than a stated passion for the cause.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Non-Profit and NGO Management', 'achievement_led',
 'Building an organisation''s first Charities Governance Code self-assessment surfaced two real gaps in conflict-of-interest documentation that the board then closed before the annual return was due. Governance work like that rarely gets noticed, but it is what actually keeps an organisation accountable to the people who fund and trust it — which is the standard I want to bring to an operations role that takes compliance as seriously as programme delivery.',
 'A specific, real governance finding demonstrates operational substance beyond mission-alignment language, which is exactly what more experienced non-profit applicants are differentiated on.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Non-Profit and NGO Management', null,
 'Non-Profit graduate | Individual giving grown €12k to €31k in one year | Charities Governance Code literate',
 'A specific, comparable fundraising figure and genuine governance literacy are what a non-profit hiring manager actually scans a profile for, over generic mission language.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Non-Profit and NGO Management', null,
 'Programme Coordinator placement | 40-volunteer community programme | 12 weekly sessions delivered',
 'A specific scale and delivery record demonstrates real operational capability, stronger than a general "passionate about community work" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Non-Profit and NGO Management', null,
 'Non-profit management graduate. I grew a small charity''s individual-giving programme from €12,000 to €31,000 in one year by treating donors as an ongoing relationship — a genuine update and thank-you between appeals, not just an annual ask. I also built the organisation''s first Charities Governance Code self-assessment, closing two real gaps in conflict-of-interest documentation. Looking for development or operations roles in the non-profit sector.',
 'Two specific, quantified results — one fundraising, one governance — demonstrate real operational range beyond a single skill.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Non-Profit and NGO Management', null,
 'Programme coordination placement graduate. Ran a 40-volunteer community programme across 12 weekly sessions, tracking outcomes against the funder''s own reporting template rather than an internal-only record, which cut final report preparation time in half. I''m interested in the operational side of programme delivery — the parts that make a funder''s reporting relationship actually work, not just the programme content itself. Open to programme coordinator or operations roles.',
 'A specific operational insight (aligning to the funder''s template) is more persuasive than a general claim of being organised or community-minded.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Non-Profit and NGO Management', 'Initiative',
 'Preparing a funder report, I noticed we had been tracking programme attendance in our own internal spreadsheet format rather than the funder''s actual reporting template, which meant every report took hours of manual reformatting. Without being asked, I rebuilt our attendance tracking to match the funder''s template directly from the start of the next programme cycle. The following report took roughly half the time to prepare, and my manager adopted the new format for all funder reporting going forward.',
 'Spotting and fixing a real, recurring inefficiency without being asked, with the fix outliving the candidate''s own involvement, is a stronger initiative signal than simply completing assigned reporting tasks well.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Non-Profit and NGO Management', 'Client / Stakeholder Focus',
 'A long-standing individual donor called upset after receiving what felt like a generic mass appeal letter despite having given consistently for six years. Rather than sending a standard apology template, I called her directly, thanked her specifically for her history of support, and asked what kind of update she would actually find meaningful going forward. She increased her annual gift the following year and specifically mentioned the personal call when she did.',
 'Treating a long-term donor as an individual relationship rather than a line in a mailing list, and acting on what she actually said she wanted, is exactly the stakeholder judgement development and donor-relations roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ TELECOMMUNICATIONS AND UTILITIES ═══════════

('cv_bullet', 'Telecommunications and Utilities', 'network_performance',
 'Tracked fault resolution time across a regional broadband network during a placement, identifying a single recurring cabinet fault type responsible for 30% of repeat call-outs, which once addressed cut average resolution time from 6 hours to 3.5.',
 'A specific, comparable network metric with a diagnosed root cause is exactly the kind of evidence a telecoms employer reads a CV for, rather than a general "network support" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Telecommunications and Utilities', 'compliance',
 'Assisted a utility contractor''s Safe Electric compliance process across 15 domestic network connection jobs, checking each Declaration of Conformance against the actual site work before submission and catching two documentation mismatches before they reached audit.',
 'Naming the actual compliance scheme (Safe Electric) and a real, specific catch demonstrates genuine regulatory literacy, not just "worked on utility connections".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Telecommunications and Utilities', 'customer_operations',
 'Reduced average call-handling time for a telecoms customer operations team by 90 seconds per call over one quarter by rewriting the team''s fault-triage script around the three most common repeat issues rather than a single generic flowchart.',
 'A specific, measured operational metric with a named process fix is far stronger than "worked in customer service for a telecoms company".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Telecommunications and Utilities', 'achievement_led',
 'Tracking fault resolution time across a regional broadband network, I found a single recurring cabinet fault type responsible for 30% of repeat call-outs — a pattern nobody had connected across individual jobs. Fixing that one fault type cut average resolution time from 6 hours to 3.5. That instinct to look for the pattern across many small jobs, rather than solving each one in isolation, is what I want to bring to a network operations role at a larger scale.',
 'A specific, measured network result grounded in real pattern-finding is a far stronger opener than a general statement of interest in telecoms.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Telecommunications and Utilities', 'achievement_led',
 'Checking each Declaration of Conformance against the actual site work on 15 domestic connection jobs, rather than assuming the paperwork matched what was physically done, caught two real mismatches before they reached audit. That standard of not taking compliance documentation on trust is what I want to bring to a utilities role where Safe Electric and RGII registration are the law, not a formality.',
 'A specific, real compliance catch demonstrates genuine understanding of why these registration schemes matter, stronger than a general claim of being thorough.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Telecommunications and Utilities', null,
 'Telecoms graduate | Broadband fault resolution time cut 6hrs to 3.5hrs | Network operations placement',
 'A specific, comparable network metric is exactly what a telecoms hiring manager scans a profile for, over a generic "telecoms interested" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Telecommunications and Utilities', null,
 'Utilities placement | Safe Electric compliance support, 15 connection jobs | 2 documentation mismatches caught pre-audit',
 'Names the actual compliance scheme and a real, checkable result rather than a generic "utilities experience" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Telecommunications and Utilities', null,
 'Telecoms graduate. On placement I tracked fault resolution time across a regional broadband network and found a single recurring cabinet fault type responsible for 30% of repeat call-outs — fixing it cut average resolution time from 6 hours to 3.5. I like the pattern-finding side of network operations as much as the fault-fixing itself. Looking for network operations or technical graduate roles.',
 'A specific, quantified network result grounded in real diagnostic work is far more persuasive than a general "technically minded" self-description.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Telecommunications and Utilities', null,
 'Utilities placement graduate. Supported a contractor''s Safe Electric compliance process across 15 domestic connection jobs, checking each Declaration of Conformance against the actual site work and catching two mismatches before audit. Compliance here isn''t paperwork — it''s the law, and I take checking it that seriously. Interested in utility network or compliance-adjacent graduate roles.',
 'A specific compliance catch and a genuine point of view about why it matters is stronger than a general claim of attention to detail.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Telecommunications and Utilities', 'Problem Solving',
 'A broadband network I was monitoring on placement had a fault resolution time that looked fine on average but with a long tail of repeat call-outs nobody had explained. Rather than accepting "some faults just recur", I broke the repeat call-outs down by cabinet and fault type and found one specific fault type, tied to a single cabinet model, accounted for nearly a third of them. Addressing that one fault type specifically cut average resolution time from 6 hours to 3.5.',
 'Refusing to accept a vague explanation for a recurring pattern and finding the actual specific cause in the data is exactly the diagnostic thinking network operations roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Telecommunications and Utilities', 'Attention to Detail',
 'Reviewing Declarations of Conformance for a batch of domestic connection jobs, I noticed one document described a socket location that didn''t match what I''d actually seen photographed on site. Rather than assuming it was a typo and moving on, I flagged it to the contractor, who confirmed the paperwork had been copied from a template and not actually updated for that specific job. It was corrected before submission, and the contractor added a photo-cross-check step to their process afterwards.',
 'Catching a real mismatch between documentation and the actual site work, in a context where that documentation is a legal compliance record, is exactly the vigilance utilities compliance work requires.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
