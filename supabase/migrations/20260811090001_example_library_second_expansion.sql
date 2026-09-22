-- ═══════════════════════════════════════════════════════════════════════════
-- example_library for the second wave of newly added industries
--
-- Skilled Trades and Apprenticeships, Insurance and Actuarial, Retail and
-- E-commerce, and Environmental Sustainability and Renewable Energy, matched
-- to each generator's actual fetch limits (cv_bullet 3, cover_letter_opener
-- 2, linkedin_headline 2, linkedin_about 2, star_answer 2 across distinct
-- CORE_COMPETENCIES tags) — same depth and discipline as the first wave.
--
-- All rows platform-authored composites, internally consistent with the
-- industry_intelligence facts seeded alongside this migration (SOLAS phase
-- structure, RECI/Safe Electric and RGII registration, the Central Bank
-- Minimum Competency Code and APA/CIP designations, IFoA vs SAI, Retail
-- Ireland Skillnet, SEAI/EPA/IGBC), and excluded from student-facing
-- citations by citableSources().
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

-- ═══════════ SKILLED TRADES AND APPRENTICESHIPS ═══════════

('cv_bullet', 'Skilled Trades and Apprenticeships', 'trade_progress',
 'Currently in Phase 4 of a 4-year Electrical apprenticeship with a SOLAS-approved contractor, having completed all off-the-job training modules to date without a resit.',
 'Naming the exact phase and a real completion detail (no resits) is a precise, checkable claim in a system built around numbered phases, rather than a vague "training in electrical work" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Skilled Trades and Apprenticeships', 'compliance',
 'Shadowed a Registered Gas Installer across 30+ domestic gas appliance installations during on-the-job phases, learning to complete Declarations of Conformance correctly before being signed off to assist unsupervised on straightforward jobs.',
 'Naming the actual compliance document (Declaration of Conformance) shows real understanding of the legal process behind the trade, not just the physical work.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Skilled Trades and Apprenticeships', 'craft_quality',
 'Built and fitted a full kitchen carpentry run for a residential client during 3rd-year on-the-job training, from cutting list to final fit, with zero callbacks in the six months since handover.',
 'A specific, complete piece of craft work with a real quality metric (zero callbacks) is far stronger evidence than "assisted with carpentry work".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Skilled Trades and Apprenticeships', 'achievement_led',
 'Completing all off-the-job training modules of my Electrical apprenticeship to date without a resit came from treating the theory phases with the same seriousness as the on-site work, not as a formality to get through before the real job started. That is the standard I want to keep building through Phase 4 and toward Safe Electric registration.',
 'A specific, verifiable training result opens the letter with evidence rather than a stated interest in the trade, and names the actual registration being worked toward.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Skilled Trades and Apprenticeships', 'achievement_led',
 'Fitting a full kitchen carpentry run from cutting list to final handover during my 3rd-year on-the-job phase, with no callbacks in the six months since, taught me that the work people don''t see — the cutting list, the sequencing — is what actually determines whether the finish holds up. That attention to the unglamorous planning stage is what I want to bring to a contractor who takes it just as seriously.',
 'A specific, complete piece of craft work with a real quality outcome is a stronger opener than a general statement of enjoying hands-on work.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Skilled Trades and Apprenticeships', null,
 'Electrical apprentice (Phase 4, SOLAS) | All off-the-job modules passed first attempt | Working toward Safe Electric registration',
 'States the exact phase and the specific registration being worked toward, using the real scheme name rather than a vague "qualified electrician soon" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Skilled Trades and Apprenticeships', null,
 'Carpentry apprentice, 3rd year | Full kitchen fit-outs, zero callbacks | SOLAS registered',
 'A specific craft result and a real quality metric are more credible signals to an employer than "skilled tradesperson", and SOLAS registration is named precisely.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Skilled Trades and Apprenticeships', null,
 'Electrical apprentice, currently Phase 4 with a SOLAS-approved contractor. All off-the-job training modules passed first attempt. Working toward Safe Electric registration once I qualify — I want to be able to self-certify my own work, not just carry it out under someone else''s sign-off. Based in Cork, open to relocating.',
 'A specific, honest statement of the actual next professional milestone (self-certification) shows genuine understanding of how this field works, beyond just "becoming an electrician".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Skilled Trades and Apprenticeships', null,
 '3rd-year Carpentry apprentice, SOLAS registered. Built and fitted a full residential kitchen from cutting list to handover with zero callbacks in six months — the kind of quiet reliability I want a reputation for, more than speed. Looking for a contractor doing high-spec residential fit-outs for the final year of my apprenticeship.',
 'A concrete, quantified craft result paired with a genuine professional value (reliability over speed) is a stronger self-description than a list of tools used.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Skilled Trades and Apprenticeships', 'Attention to Detail',
 'While shadowing on a gas appliance installation, I noticed the flue clearance on a boiler didn''t quite match what the manufacturer''s instructions specified, even though it looked close enough at a glance. Rather than letting it go given how minor the difference looked, I flagged it to the RGI I was working under, who checked and confirmed it needed adjusting before the job could be signed off. The installer thanked me afterwards — it''s exactly the kind of thing that gets missed under time pressure.',
 'Catching a small compliance gap through careful checking rather than assuming "close enough" is fine, in a context where the consequence is a genuine safety issue, is exactly the vigilance this trade requires.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Skilled Trades and Apprenticeships', 'Problem Solving',
 'Midway through fitting a kitchen, I found the cabinetry cutting list didn''t account for a stud wall that wasn''t on the original plan, which would have thrown off the whole run if I''d followed it as given. Rather than forcing the original layout to fit, I re-measured the space myself and reworked the cut sequence to absorb the discrepancy into the least visible run of units. The finished kitchen went in on the original schedule with no visible sign anything had changed.',
 'Catching a real discrepancy between the plan and the actual site conditions, and solving it without disrupting the schedule or the finish, is the kind of practical problem-solving this trade actually requires day to day.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ INSURANCE AND ACTUARIAL ═══════════

('cv_bullet', 'Insurance and Actuarial', 'advisory_compliance',
 'Completed the APA (personal general insurance) module during a summer placement with a broker, and began advising walk-in customers unsupervised once the qualification was confirmed under the Minimum Competency Code.',
 'Naming the exact APA module and the regulatory reason it mattered (unsupervised advising under the MCC) is far more precise than "gained insurance experience".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Insurance and Actuarial', 'exam_progress',
 'Passed CS1 and CS2 with exemptions confirmed from a Mathematics degree, and am currently sitting CM1 toward IFoA Fellowship while working as an actuarial trainee.',
 'Naming the exact IFoA exam codes and exemption basis is precise, checkable evidence of real progress, rather than a vague "studying actuarial exams" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Insurance and Actuarial', 'claims_analysis',
 'Reviewed a sample of 60 motor claims for a placement project, identifying a recurring documentation gap in about 1 in 8 files that, once flagged, cut processing delays on new claims of that type by roughly a third.',
 'A specific volume, a concrete finding, and a measured downstream result demonstrate real analytical engagement rather than "assisted with claims processing".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Insurance and Actuarial', 'achievement_led',
 'Passing CS1 and CS2 with exemptions confirmed from my degree, and now sitting CM1 toward IFoA Fellowship, came from treating exam prep as a genuine second workload rather than something to fit in around a placement. That is the discipline I want to keep building in a graduate actuarial role that takes study support seriously.',
 'A specific, verifiable exam-progress claim opens with evidence rather than a stated interest in actuarial work, and names the actual examining body correctly.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Insurance and Actuarial', 'achievement_led',
 'Reviewing 60 motor claims during a placement, I found a documentation gap recurring in around 1 in 8 files — a small thing individually, but flagging it cut processing delays on that claim type by roughly a third once fixed. I would rather be the person who finds that kind of pattern in the data than the person processing files one at a time without stepping back, which is the analytical habit I want a graduate role to give me more room for.',
 'A specific, measured analytical finding is a stronger opener than a general statement of being detail-oriented or good with numbers.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Insurance and Actuarial', null,
 'Actuarial trainee | CS1, CS2 exempted | Sitting CM1 (IFoA) | Motor claims data analysis placement',
 'Names the exact IFoA exam stage and a real placement result, which is what an actuarial recruiter actually scans a profile for, rather than "aspiring actuary".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Insurance and Actuarial', null,
 'Insurance graduate | APA (personal general) | Advising unsupervised under the Minimum Competency Code',
 'States the actual Central Bank-recognised qualification and the specific regulatory milestone it unlocked, rather than a vague "insurance qualified" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Insurance and Actuarial', null,
 'Mathematics graduate, actuarial trainee. CS1 and CS2 exempted, currently sitting CM1 toward IFoA Fellowship while working full-time. I spent a placement reviewing 60 motor claims and found a documentation gap that, once flagged, cut processing delays on that claim type by about a third — the kind of pattern-finding I want to keep doing on a larger dataset. Open to actuarial trainee or analyst roles.',
 'A specific exam-progress claim paired with a real, quantified analytical result is far more credible than a general "passionate about data" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Insurance and Actuarial', null,
 'Insurance graduate, APA (personal general insurance) qualified under the Central Bank''s Minimum Competency Code. Started advising customers unsupervised on personal lines once the qualification was confirmed during my placement. Now working toward the fuller CIP designation. Looking for a broker or insurer graduate role in personal lines.',
 'Precisely naming the qualification, the regulator, and the next designation being pursued (CIP) reads as genuine fluency with how this field is actually structured.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Insurance and Actuarial', 'Attention to Detail',
 'Reviewing a batch of motor claims during a placement, I noticed several files were missing a specific incident-report field that wasn''t obviously required but that I''d seen referenced in a prior claim dispute. Rather than assuming it didn''t matter since the files had already been processed, I raised it with my supervisor, who confirmed it was genuinely needed for a subset of claim types and had been silently causing delays downstream. The team added a check for that field to the standard intake review afterwards.',
 'Noticing a subtle, easy-to-miss gap and raising it rather than assuming it was already covered is exactly the vigilance a claims or underwriting role actually requires.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Insurance and Actuarial', 'Communication',
 'A client was frustrated after being told their claim was still "under review" for the third week running, with no explanation of what that actually meant. Rather than repeating the same holding line, I looked into the actual file, found the specific missing document holding it up, and explained clearly what was needed and why, rather than just the status. The client sent the document that afternoon and the claim was settled within the week.',
 'Translating an opaque internal process into something the client can actually act on, rather than repeating a status update with no substance, is exactly the client communication this field''s advisory roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ RETAIL AND E-COMMERCE ═══════════

('cv_bullet', 'Retail and E-commerce', 'sales_performance',
 'Consistently ranked in the top 3 of a 12-person sales team by average transaction value over a 6-month period, driven mainly by proactively suggesting a complementary product rather than relying on the customer to ask.',
 'A specific, comparable metric (average transaction value, ranked against a real team size) demonstrates genuine commercial performance rather than a general "strong sales" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Retail and E-commerce', 'inventory_management',
 'Reduced stock shrinkage in a menswear department from 2.1% to 1.3% over a quarter by tightening the fitting-room return-count process after noticing most of the gap traced back to that single point.',
 'A specific before/after shrinkage figure and a diagnosed root cause is exactly the kind of operational evidence a retail employer reads a CV for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Retail and E-commerce', 'ecommerce_operations',
 'Managed a Shopify store''s order fulfilment for a small independent brand during a placement, cutting average dispatch time from 3 days to next-day by resequencing the pick-and-pack workflow around delivery courier collection times.',
 'Naming the actual platform (Shopify) and a measured process improvement is far stronger than "helped with online orders".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Retail and E-commerce', 'achievement_led',
 'Reducing stock shrinkage in a menswear department from 2.1% to 1.3% over a quarter came from actually tracing where the gap was coming from — the fitting-room return count — rather than assuming it was theft and moving on. That instinct to diagnose before fixing is what I want to bring to a bigger store with a bigger stock problem to solve.',
 'A specific, measured operational improvement opens the letter with real evidence of commercial thinking, not just enthusiasm for retail.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Retail and E-commerce', 'achievement_led',
 'Cutting a small brand''s average dispatch time from 3 days to next-day during a placement came from resequencing the pick-and-pack workflow around the courier''s actual collection time, rather than accepting the existing process as fixed. I would rather look for that kind of unglamorous operational fix than manage a process exactly as it was handed to me, which is the mindset I want to bring to a bigger e-commerce operation.',
 'A specific, quantified process fix demonstrates real e-commerce operational thinking, which reads stronger than a general interest in online retail.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Retail and E-commerce', null,
 'Retail Management graduate | Top 3 of 12 on average transaction value | Menswear shrinkage cut 2.1% to 1.3%',
 'Two specific, comparable retail metrics in a headline are exactly what a hiring manager scanning candidates in this field is looking for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Retail and E-commerce', null,
 'E-commerce placement | Shopify order fulfilment | Dispatch time cut 3 days to next-day',
 'Names the actual platform and a real, measured operational result rather than a generic "e-commerce experience" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Retail and E-commerce', null,
 'Retail Management graduate. Ranked top 3 of a 12-person team on average transaction value over six months, mostly by suggesting a complementary product proactively rather than waiting to be asked. Also cut department stock shrinkage from 2.1% to 1.3% by tracing it back to the fitting-room return process. Looking for a graduate retail management or buying role.',
 'Two specific, quantified retail results in one short paragraph demonstrate real operational and commercial competence, far more persuasive than "customer-focused".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Retail and E-commerce', null,
 'E-commerce operations placement graduate. Managed order fulfilment on Shopify for a small independent brand, cutting average dispatch time from 3 days to next-day by resequencing the pick-and-pack workflow around courier collection times. Interested in e-commerce operations or supply chain roles at a larger scale.',
 'A specific platform and a measured process result is a stronger self-description than a general claim of being organised or detail-oriented.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Retail and E-commerce', 'Problem Solving',
 'Stock shrinkage in my department had crept up to 2.1% over a quarter and nobody had a clear reason why. Rather than assuming it was theft, I actually broke the losses down by product category and found most of the gap traced to a single point — the fitting-room return count not always being logged accurately during busy periods. Tightening that one process brought shrinkage down to 1.3% the following quarter.',
 'Diagnosing the actual source of a problem through real data rather than jumping to the obvious assumption (theft) is exactly the analytical thinking retail management roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Retail and E-commerce', 'Initiative',
 'During a quiet period on the shop floor, I noticed customers kept asking the same three questions about a new product line that our till system''s product info screen didn''t answer. Without being asked, I put together a one-page cheat sheet for the team covering those questions and left it at the till, and the average time spent on those specific enquiries dropped noticeably over the following weeks. The store manager adopted it for training new starters afterwards.',
 'Spotting and fixing a real, repeated friction point without being asked, and the fix outliving the candidate''s own shift, is a stronger initiative signal than simply following instructions well.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ ENVIRONMENTAL SUSTAINABILITY AND RENEWABLE ENERGY ═══════════

('cv_bullet', 'Environmental Sustainability and Renewable Energy', 'compliance_tracking',
 'Tracked EPA industrial emissions licence conditions for a manufacturing site during a placement, flagging a reporting deadline the site''s existing tracker had missed by two days in the previous cycle, and rebuilding the tracker with automatic reminders to prevent a repeat.',
 'Naming the specific regulatory framework (EPA licence conditions) and a real, prevented compliance failure demonstrates genuine understanding of how this field''s regulation actually works.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Environmental Sustainability and Renewable Energy', 'impact_measurement',
 'Calculated the CO2e reduction from a small business energy-efficiency retrofit against its pre-retrofit baseline for a final-year project, finding a 34% reduction in modelled annual emissions — presented with the baseline shown alongside the result, not the percentage alone.',
 'Stating the baseline alongside the percentage, rather than an unanchored figure, is exactly the anti-greenwashing rigour this field''s credible practitioners are read for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Environmental Sustainability and Renewable Energy', 'stakeholder_liaison',
 'Assisted a wind farm planning application by compiling the environmental impact documentation Wind Energy Ireland''s own guidance recommends, cross-checking each section against the actual planning authority requirements before submission.',
 'Naming a real representative body''s guidance and the actual cross-checking work done shows applied, specific competence rather than a general "worked on a renewable energy project" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Environmental Sustainability and Renewable Energy', 'achievement_led',
 'Rebuilding a manufacturing site''s EPA licence-condition tracker after catching a missed reporting deadline from the previous cycle taught me that in this field, the unglamorous compliance tracking is just as important as the technical work itself — a missed EPA deadline is a real regulatory problem, not an admin inconvenience. That is the standard of attention I want to bring to an environmental compliance role.',
 'A specific, real compliance catch is a far stronger opener for a regulation-heavy field than a general statement of caring about sustainability.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Environmental Sustainability and Renewable Energy', 'achievement_led',
 'Calculating a 34% modelled emissions reduction for a small business retrofit project, and presenting it against its actual pre-retrofit baseline rather than as a bare percentage, is the standard of rigour I think this field needs more of — it is too easy for an impact claim to go unchallenged when the baseline is left out. That is the discipline I want to bring to an impact-measurement or sustainability consulting role.',
 'A specific, correctly-baselined result demonstrates real technical rigour and an awareness of the greenwashing problem this field actively has to guard against.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Environmental Sustainability and Renewable Energy', null,
 'Environmental Sustainability graduate | EPA licence compliance placement | Emissions reduction modelling',
 'Names the actual regulator (EPA) and a specific technical skill (emissions modelling) rather than a generic "sustainability graduate" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Environmental Sustainability and Renewable Energy', null,
 'Renewable energy placement | Wind farm planning support | 34% modelled emissions reduction on a retrofit project',
 'A specific, quantified impact result with a stated context is more credible than a general claim of renewable energy interest.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Environmental Sustainability and Renewable Energy', null,
 'Environmental Sustainability graduate. On placement I rebuilt a manufacturing site''s EPA licence-condition tracker after catching a missed reporting deadline from the previous cycle — the kind of unglamorous compliance work that actually keeps a site operating legally. For my final-year project I modelled a 34% emissions reduction from an energy-efficiency retrofit, always presented against its baseline rather than as a bare percentage. Looking for environmental compliance or impact-measurement roles.',
 'Two specific, technically rigorous results (a compliance catch and a correctly-baselined impact figure) are far more persuasive than a general sustainability enthusiasm statement.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Environmental Sustainability and Renewable Energy', null,
 'Renewable energy graduate, placement supporting wind farm planning applications. Compiled environmental impact documentation against Wind Energy Ireland''s own guidance and the actual planning authority requirements, cross-checked section by section before submission. Interested in renewable energy development or planning support roles.',
 'Naming a real representative body and the specific cross-checking work done shows genuine applied knowledge of how renewable energy projects are actually planned and approved.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Environmental Sustainability and Renewable Energy', 'Attention to Detail',
 'While tracking a manufacturing site''s EPA licence conditions during placement, I noticed the existing spreadsheet tracker had missed a reporting deadline by two days in the previous cycle, with nobody having caught it until after the fact. Rather than just noting it and moving on, I rebuilt the tracker with automatic reminders set well ahead of each deadline, and flagged the gap to my supervisor so the same mistake wouldn''t repeat with a different licence condition. No deadlines were missed for the rest of the placement.',
 'Catching a real, already-occurred compliance failure and fixing the underlying system rather than just noting the individual miss is exactly the vigilance environmental compliance roles are screened for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Environmental Sustainability and Renewable Energy', 'Communication',
 'A small business client was proud of a retrofit that had "cut their carbon footprint" but couldn''t say by how much or against what baseline when I asked, which meant the claim wasn''t actually usable anywhere official. Rather than just accepting their framing, I walked them through why a baselined, quantified figure would actually strengthen their case for grant reporting, then helped them model it properly — landing on a 34% reduction against their pre-retrofit baseline. They used the specific figure in their next funding application instead of the vague claim.',
 'Explaining why an unquantified sustainability claim was actually a weaker asset than a properly baselined one, and helping the client get to the rigorous version, shows genuine technical communication in a field prone to greenwashing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
