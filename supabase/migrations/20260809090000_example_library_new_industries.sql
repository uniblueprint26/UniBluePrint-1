-- ═══════════════════════════════════════════════════════════════════════════
-- example_library for the four newly added industries
--
-- Brings Agriculture and Veterinary, Beauty/Hairdressing and Aesthetics, Real
-- Estate and Property, and Aviation and Logistics to the same example_library
-- depth as the median existing industry, matched to what each generator
-- actually fetches:
--
--   fetchIndustryExamples('cv_bullet', industry, 3)             -> 3 rows
--   fetchIndustryExamples('cover_letter_opener', industry, 2)   -> 2 rows
--   fetchIndustryExamples('linkedin_headline', industry, 2)     -> 2 rows
--   fetchIndustryExamples('linkedin_about', industry, 1)        -> 2 rows
--   fetchCompetencyExamples(CORE_COMPETENCIES, 3, industry)     -> 2 rows,
--     across two distinct CORE_COMPETENCIES tags (star_answer)
--
-- (linkedin_about and star_answer both over-provision slightly past their bare
-- fetch limit, matching the established pattern across the original 15 —
-- Technology and Software, for instance, carries 2 of each against fetch
-- limits of 1 and effectively-3 respectively.)
--
-- Every row here is a platform-authored composite, not a real published
-- example — same discipline as every prior pass into this table, and every
-- claim about the field it leans on (National Hairdressing Apprenticeship,
-- patch-test timing, PSRA/BER, EASA theory exams, CILT membership) is
-- consistent with what is already sourced in industry_intelligence for that
-- industry, so the calibration content and the intelligence content agree
-- rather than pulling in different directions. All rows are
-- provenance = 'platform_authored' and therefore excluded from
-- benchmarked_against by citableSources() — nothing here is presented to a
-- student as a real, citable source.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

-- ═══════════ AGRICULTURE AND VETERINARY ═══════════

('cv_bullet', 'Agriculture and Veterinary', 'herd_management',
 'Completed a 6-month placement on a 220-ewe lowland sheep enterprise, taking sole responsibility for lambing checks across a 3-week peak period and recording a stillbirth rate 2 points below the previous year''s figure.',
 'A specific, comparable metric (stillbirth rate against the prior year) tied to a real period of sole responsibility is what an agricultural employer reads as genuine, unsupervised competence rather than assisted experience.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Agriculture and Veterinary', 'clinical_support',
 'Assisted a mixed-animal veterinary practice''s theatre list two days a week for a full academic year, prepping instruments and monitoring anaesthesia for over 200 procedures without a recorded drug-calculation error.',
 'Volume (200+ procedures) combined with a zero-error safety claim demonstrates exactly the precision a veterinary employer is screening for in a pre-registration support role.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Agriculture and Veterinary', 'compliance',
 'Compiled a farm-level nutrient management plan as a final-year Teagasc project for a 90-cow suckler herd, identifying a slurry-storage compliance gap the farmer then closed ahead of the next NVZ inspection.',
 'Naming the specific compliance framework (NVZ regulations) and a real consequence avoided is far stronger evidence of applied competence than "completed a farm project".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Agriculture and Veterinary', 'achievement_led',
 'During a lambing placement on a 220-ewe lowland flock, I took sole responsibility for overnight checks across the three-week peak and brought the stillbirth rate down two points on the previous year — the kind of quiet, repetitive vigilance that actually saves lambs, and it is exactly what I want more of in a full-time herd health role.',
 'Opens with a specific, comparable result from real sole responsibility rather than a stated interest in farming, which is what this field''s applications are actually read for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Agriculture and Veterinary', 'achievement_led',
 'Monitoring anaesthesia and prepping instruments for over 200 small-animal procedures across a year in a mixed veterinary practice taught me that the unglamorous checklist work — drug calculations, consent forms, kit counts — is what actually keeps a busy theatre list safe, and it is the discipline I want to keep building toward VCI registration.',
 'Connects a specific volume of real clinical support work to a genuine professional value (checklist discipline) and names the actual registration the candidate is working toward.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Agriculture and Veterinary', null,
 'Agricultural Science graduate (UCD) | Teagasc Green Cert | Suckler and tillage placement experience | Working toward a career in farm advisory',
 'Names the actual qualifying credential (Green Cert) that DAFM and Revenue schemes check for, rather than a vaguer "agriculture graduate" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Agriculture and Veterinary', null,
 'Veterinary Nursing student (final year) | Mixed-practice placement, 200+ procedures assisted | Working toward VCI Register of Veterinary Nurses',
 'States the specific, separate register (Veterinary Nurses, not the vets'' register) this candidate is actually working toward, which reads as precise rather than approximate.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Agriculture and Veterinary', null,
 'Agricultural Science graduate (UCD), Teagasc Green Cert holder. My final-year placement was on a 90-cow suckler and tillage holding, where I built a nutrient management plan that closed a slurry-storage compliance gap before the next inspection — the kind of unglamorous compliance work that actually keeps a farm viable long-term. Looking for farm advisory or agribusiness graduate roles.',
 'A specific compliance result grounds the "graduate" claim in real applied work, and the closing line states precisely what kind of role is being sought.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Agriculture and Veterinary', null,
 'Final-year Veterinary Nursing student. A year assisting theatre lists in a mixed-animal practice — prepping, monitoring anaesthesia, running drug calculations for 200+ procedures — taught me the job is mostly about not letting the small things slip. Working toward registration on the VCI''s Register of Veterinary Nurses.',
 'The closing observation ("not letting the small things slip") is a genuine, field-literate point of view rather than a generic claim of caring about animals.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Agriculture and Veterinary', 'Attention to Detail',
 'During a mixed-practice placement I was prepping a dosage for a small dog ahead of a routine procedure when the weight on the chart looked out of date against what I had just seen on the scales that morning. I flagged it before drawing up the drug rather than assuming the chart was current, and the vet confirmed the dog had in fact lost weight since the last visit — the original dose would have been too high. The practice added a same-day weight check to its pre-med checklist afterwards.',
 'Trusting a direct observation over an existing record, in a context where the consequence of not checking is a real dosing error, is exactly the vigilance a veterinary employer is trying to assess.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Agriculture and Veterinary', 'Resilience',
 'Lambing on a 220-ewe flock during placement meant three weeks of overnight checks on very little sleep, and in the second week a run of three difficult presentations in one night left me exhausted and second-guessing my own judgement. I kept to the same checklist and timing discipline I had used from night one rather than cutting corners out of tiredness, and called the flock''s vet on the third case rather than persisting alone past the point I was confident. The flock finished the season with a stillbirth rate two points below the previous year''s.',
 'Real resilience in this field is not pushing through alone — it is maintaining standards under fatigue and still knowing when to call for help, which is the judgement this story actually demonstrates.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ BEAUTY, HAIRDRESSING AND AESTHETICS ═══════════

('cv_bullet', 'Beauty, Hairdressing and Aesthetics', 'client_retention',
 'Completed Year 2 of the National Hairdressing Apprenticeship (QQI Level 6) in a busy city-centre salon, building a personal rebooking rate of 78% across a 6-month period on the column.',
 'Rebooking rate is the field''s own real measure of client satisfaction, and naming the apprenticeship precisely signals the candidate knows the actual qualification landscape, not just "hairdressing training".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Beauty, Hairdressing and Aesthetics', 'compliance',
 'Ran a patch-test tracking system for a salon''s colour clients after noticing appointment cards weren''t consistently recording test dates, cutting missed or late patch tests to zero across the following three months.',
 'Solving a real compliance gap that protects both client safety and the salon''s insurance is a stronger signal of professionalism than any styling claim alone.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Beauty, Hairdressing and Aesthetics', 'service_delivery',
 'Delivered HD brows and lash treatments to over 300 clients during a beauty therapy placement, maintaining a 4.9-star average across the salon''s online review platform.',
 'Volume plus a real, checkable quality metric (review average) is calibratable in a way "excellent customer feedback" is not.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Beauty, Hairdressing and Aesthetics', 'achievement_led',
 'Noticing that patch-test dates weren''t being consistently recorded on client cards at the salon where I trained, I built a simple tracking system that brought missed or late patch tests to zero within three months — the kind of unglamorous compliance habit that protects both the client and the salon''s insurance, and it is the standard I want to keep working to.',
 'Leads with a specific compliance fix rather than a stated passion for hair, which is a far stronger credibility signal in a field with no licensing gate to point to instead.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Beauty, Hairdressing and Aesthetics', 'achievement_led',
 'Building a personal rebooking rate of 78% over six months on the column during my apprenticeship placement came from something simple — actually asking clients what they didn''t like about their last colour before starting the next one, rather than assuming I already knew. That habit of listening before styling is what I want to bring to a senior stylist role.',
 'A specific, quantified result explained through a genuine behavioural habit is more persuasive than a claim of being "passionate about hair".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Beauty, Hairdressing and Aesthetics', null,
 'Hairdressing apprentice (Year 3, National Hairdressing Apprenticeship, QQI Level 6) | 78% rebooking rate | Colour and balayage specialism',
 'Names the actual statutory apprenticeship and its NFQ level precisely, then a real retention metric and a specific technique — all things a salon owner searches on directly.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Beauty, Hairdressing and Aesthetics', null,
 'Beauty Therapist, CIDESCO diploma | HD brows, lash and skin specialist | 300+ clients, 4.9★ average',
 'Names a real, internationally recognised diploma body rather than "qualified beauty therapist", plus specific techniques and a checkable volume and rating.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Beauty, Hairdressing and Aesthetics', null,
 'Final-year National Hairdressing Apprentice (QQI Level 6), training in a city-centre salon. I built my rebooking rate to 78% over six months mostly by asking clients what they didn''t like about their last colour before starting the next one — a habit I want to keep building as I finish the apprenticeship and move toward a senior stylist role.',
 'A specific, real habit behind a quantified result reads as genuine craft development rather than a generic enthusiasm statement.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Beauty, Hairdressing and Aesthetics', null,
 'CIDESCO-qualified Beauty Therapist, specialising in HD brows and lash treatments — over 300 clients and a 4.9★ average across the salon''s review platform. I also built the salon''s patch-test tracking system after noticing test dates weren''t being recorded consistently, which cut missed tests to zero. Looking for a senior therapist or spa role.',
 'Combines a real qualification, a specialism, a checkable metric, and a genuine compliance initiative — four distinct kinds of evidence in one short paragraph.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Beauty, Hairdressing and Aesthetics', 'Client / Stakeholder Focus',
 'A client came in visibly upset because a colour correction from another salon had left her hair patchy just before a family wedding, four days out. Rather than promising a fix on the spot, I talked her through exactly what was realistically achievable in the time available — an even, slightly darker base rather than her original blonde — and she left with a colour she was genuinely happy with rather than a rushed attempt at the impossible. She rebooked for her original colour six weeks later once her hair had recovered.',
 'Managing expectations honestly under real time pressure, rather than overpromising to please an upset client, is exactly the judgement salons screen senior stylists for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Beauty, Hairdressing and Aesthetics', 'Attention to Detail',
 'A regular client''s patch test on file was over four weeks old when she arrived for a colour appointment, past the point most manufacturers consider a test reliable. Rather than proceeding on the old test to keep the day''s column moving, I explained the risk to her directly and offered a same-day retest with a shorter service instead. She chose the retest, and the salon''s insurer specifically flagged the record-keeping standard as strong during a later review.',
 'Prioritising a genuine safety standard over convenience, and explaining the reasoning rather than just enforcing a rule, is exactly the judgement this field''s insurers and reviewers are watching for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ REAL ESTATE AND PROPERTY ═══════════

('cv_bullet', 'Real Estate and Property', 'lettings_management',
 'Managed viewings and negotiations for a portfolio of 18 rental units during a summer placement with a Dublin letting agency, achieving a 94% occupancy rate across the period.',
 'Portfolio size and occupancy rate are the specific measures a property employer reads a lettings CV against, rather than a general "managed rentals" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Real Estate and Property', 'compliance',
 'Prepared BER-compliant listing packs for 12 residential sale instructions in a single quarter, catching two properties without a valid BER certificate before they were advertised, which would otherwise have exposed the agency to a fine.',
 'Naming the specific legal requirement (a valid BER cert) and the real consequence avoided demonstrates regulatory literacy a generic "prepared listings" claim does not.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Real Estate and Property', 'negotiation',
 'Negotiated three sale-agreed offers within 5% of asking price during a work placement with an estate agency, tracking each negotiation against the agency''s own comparable-sales data rather than relying on the vendor''s initial expectation.',
 'Using the correct Irish stage term ("sale-agreed") and a specific, evidence-based negotiation method is more credible than a vague sales-experience claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Real Estate and Property', 'achievement_led',
 'Preparing listing packs for twelve residential sale instructions in a single quarter, I caught two properties without a valid BER certificate before they went live — a small compliance check that would otherwise have exposed the agency to a fine, and exactly the kind of unglamorous due diligence I want to keep doing on a bigger book of instructions.',
 'A specific, real compliance catch is a far stronger opener for a regulated profession than a general statement of interest in property.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Real Estate and Property', 'achievement_led',
 'Negotiating three sale-agreed offers within 5% of asking price during a placement came from tracking each one against the agency''s own comparable-sales data rather than the vendor''s initial expectation — treating the number as something to be evidenced, not just argued for. That is the standard I want to bring to a PSRA-licensed negotiator role.',
 'Names the actual licence the role sits under and demonstrates a specific, evidence-based negotiating method rather than a general claim of being good with people.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Real Estate and Property', null,
 'Property graduate (TU Dublin) | Placement: 18-unit rental portfolio, 94% occupancy | Working toward PSRA Licence Category C',
 'States the specific PSRA licence category (Letting Agent) being worked toward, rather than a vague "property qualified" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Real Estate and Property', null,
 'Estate agency placement | 3 sale-agreed offers within 5% of asking | IPAV Higher Certificate in Real Estate, in progress',
 'Uses the correct Irish market term ("sale-agreed") and names the actual IPAV qualification pathway rather than a generic "studying real estate" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Real Estate and Property', null,
 'Property Economics graduate (TU Dublin). During a placement managing an 18-unit rental portfolio for a Dublin letting agency I kept occupancy at 94% by chasing renewal conversations six weeks out rather than at lease-end, when there''s no time left to fill a gap. Working toward a PSRA Category C licence. Looking for lettings or property management roles.',
 'A specific timing insight (renewing early rather than reactively) is a genuine operational habit, more persuasive than a general claim of being organised.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Real Estate and Property', null,
 'Real estate placement graduate, IPAV Higher Certificate in Business in Real Estate in progress. Negotiated three sale-agreed offers within 5% of asking price by tracking every negotiation against the agency''s own comparable-sales data rather than the vendor''s opening expectation. Interested in residential sales roles working toward a PSRA licence.',
 'Grounds a negotiation claim in a specific, evidence-based method and states the actual licence pathway rather than leaving it implied.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Real Estate and Property', 'Communication',
 'A vendor was convinced their property was worth considerably more than three separate viewings'' feedback suggested the market would pay, and was becoming frustrated at the lack of offers after four weeks live. Rather than repeating the same asking-price argument, I pulled together the actual comparable sales from the same estate over the previous six months and walked through them property by property rather than as a single average figure. The vendor agreed to a price adjustment the following week and the property went sale agreed within ten days.',
 'Backing a difficult conversation with specific, checkable comparable evidence rather than repeating an opinion is exactly the negotiation skill this field''s screening actually probes for.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Real Estate and Property', 'Attention to Detail',
 'Preparing a listing pack for a semi-detached house ahead of going live, I noticed the BER certificate on file had actually expired the week before under the standard ten-year validity period. Rather than listing on the assumption it was still current, I flagged it to the vendor and arranged a re-assessment before the listing went live, which delayed the launch by four days. Advertising a property without a valid BER is a legal requirement I wasn''t willing to guess around, and the agency''s compliance lead specifically thanked me for catching it.',
 'Catching a real legal-compliance gap before it became a problem, even at the cost of a short delay, shows the kind of regulatory attention this licensed profession actually needs.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

-- ═══════════ AVIATION AND LOGISTICS ═══════════

('cv_bullet', 'Aviation and Logistics', 'flight_training',
 'Logged 65 hours toward a PPL(A) at a flight training organisation while completing a part-time ground-school programme, passing all nine EASA theoretical knowledge exams on the first attempt.',
 'Naming the exact licence stage (PPL) and hours logged, alongside a specific exam-pass claim, is what an aviation reviewer actually reads a training CV against.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Aviation and Logistics', 'warehouse_operations',
 'Coordinated inbound freight scheduling for a 40-pallet daily throughput warehouse during a logistics placement, cutting average dock-to-shelf time by 20% by resequencing unloading order around next-day pick priority rather than arrival order.',
 'A specific operational change with a measured before/after result is the kind of process evidence logistics employers actually screen for, over a general "warehouse experience" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'Aviation and Logistics', 'fleet_performance',
 'Tracked on-time delivery performance across a 12-vehicle distribution fleet during a supply chain placement, identifying a single recurring bottleneck route that, once rerouted, lifted the fleet''s overall on-time rate from 91% to 97%.',
 'A precise fleet-level metric moved by a specific, diagnosed fix demonstrates real operational analysis rather than a general claim of logistics interest.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Aviation and Logistics', 'achievement_led',
 'Passing all nine EASA theoretical knowledge exams on the first attempt while logging 65 hours toward my PPL(A) part-time came from treating ground school as seriously as the flying itself, not as a formality to get through before the interesting part started. That is the standard I want to keep building toward a CPL, and it is why I am applying to a training organisation that takes ground school just as seriously.',
 'A specific, verifiable training result opens the letter with evidence rather than a stated ambition to fly, and names the exact next licence stage being pursued.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cover_letter_opener', 'Aviation and Logistics', 'achievement_led',
 'Resequencing a warehouse''s unloading order around next-day pick priority instead of arrival order — a small, obvious-in-hindsight change — cut dock-to-shelf time by 20% during my logistics placement. I would rather find that kind of unglamorous process fix than manage a process exactly as it was handed to me, which is the operational mindset I want to bring to a logistics graduate role.',
 'A specific, measured process fix demonstrates real operational thinking, which is a stronger opener than a general statement of interest in supply chain.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Aviation and Logistics', null,
 'PPL(A) student, 65 hours logged | All EASA theory exams passed, first attempt | Working toward CPL',
 'States the exact licence stage held and the next one being worked toward, using the correct IAA licence names rather than "aspiring pilot".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_headline', 'Aviation and Logistics', null,
 'Supply Chain graduate (DIT) | Warehouse placement: dock-to-shelf time cut 20% | CILT Ireland student member',
 'Names a specific, measured operational result and real professional-body membership rather than a generic "logistics enthusiast" framing.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Aviation and Logistics', null,
 'PPL(A) student, 65 hours logged, all nine EASA theoretical knowledge exams passed on the first attempt through part-time ground school. Weighing the Ryanair self-funded route against Aer Lingus''s fully-funded cadetship for the CPL stage. Genuinely enjoy the ground-school side as much as the flying.',
 'Naming both real cadetship routes and stating a genuine preference reads as someone who has actually researched the industry''s actual pathways, not just the idea of flying.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('linkedin_about', 'Aviation and Logistics', null,
 'Supply Chain Management graduate (DIT), CILT Ireland student member. On placement I resequenced a warehouse''s unloading order around next-day pick priority instead of arrival order, cutting dock-to-shelf time 20% — the kind of process detail that does not show up on an org chart but changes the whole day''s throughput. Looking for graduate logistics or transport planning roles.',
 'A specific process insight, stated plainly, is more persuasive to a logistics reader than any claim of being "highly organised".',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Aviation and Logistics', 'Problem Solving',
 'A distribution fleet I was tracking on placement had an on-time delivery rate stuck at 91% despite every driver individually performing well, which did not add up. Rather than assuming it was a driver issue, I mapped delivery times against route rather than driver and found one specific route was consistently late regardless of who drove it, due to a level crossing with unpredictable closure times. Rerouting just that one route around the crossing lifted the fleet''s overall on-time rate to 97% within a month.',
 'Looking at the data by route instead of by driver, rather than accepting the first plausible explanation, is exactly the kind of operational diagnosis this field''s roles actually require.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('star_answer', 'Aviation and Logistics', 'Attention to Detail',
 'During ground school I was working through a flight-planning exercise and the fuel calculation I had been taught to trust from a standard template came out lower than my own manual cross-check using the actual aircraft''s performance figures for that day''s conditions. Rather than assuming my manual check was wrong, I brought both to the instructor, and it turned out the template had not been updated for a changed reserve-fuel requirement. The whole class''s templates were corrected as a result.',
 'Trusting a careful manual check over an established template, in a field where a fuel calculation error is a genuine safety issue, is precisely the discipline flight training is trying to instil and assess.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
