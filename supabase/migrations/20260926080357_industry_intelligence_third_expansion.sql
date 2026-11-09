-- ═══════════════════════════════════════════════════════════════════════════
-- industry_intelligence for a third wave of newly added industries
--
-- Human Resources and People Operations, Food and Beverage Manufacturing,
-- Non-Profit and NGO Management, and Telecommunications and Utilities —
-- selected for being genuinely broad, distinct graduate-employer sectors
-- with no prior home, per the user's explicit "generic before niche"
-- guidance carried over from the second wave. Same structure and sourcing
-- discipline as every prior pass: 2 rows per dimension across all 5
-- dimensions, every claim checked against the issuing body or a
-- corroborating source before being written — this table has no provenance
-- filter, so every row here is shown to a student as a real citation.
--
-- One finding worth flagging directly: like Beauty, Hairdressing and
-- Aesthetics, Human Resources has NO statutory licence or legal register in
-- Ireland — CIPD Ireland's membership grades (Foundation, Associate,
-- Chartered Member, Chartered Fellow) are a professional-body credential,
-- not a legal one. The content below says so honestly rather than assuming
-- a registration-gate narrative that fits Healthcare or Law but not this
-- field.
--
-- Facts drawn on directly from research done for this change set: CIPD
-- Ireland's four membership grades and their actual entry requirements
-- (Associate via Level 5 Diploma or an experience-based route; Chartered
-- Member via Level 7 plus a year of recent strategic/operational
-- experience); the Workplace Relations Commission's statutory role
-- (established under the Workplace Relations Act 2015) across information,
-- mediation, adjudication, inspection and enforcement; Bord Bia's Quality
-- Assurance Schemes (ISO 17065:2012-accredited, 58,000+ farmers and 150+
-- processors/packers as members) and BRCGS as the GFSI-benchmarked
-- certification most retailers actually require of food manufacturers; the
-- Charities Regulator's statutory registration requirement (an offence to
-- operate a qualifying charity unregistered) and the Charities Governance
-- Code's annual compliance-reporting obligation; Dóchas as the 58-member
-- network for international development and humanitarian NGOs specifically,
-- distinct from The Wheel's broader community-and-voluntary remit; and
-- ComReg's "general authorisation" regime for telecoms providers (a
-- declaration-and-compliance model, not an individual licence) alongside the
-- CRU's already-established utilities safety remit.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

-- ═══════════════ HUMAN RESOURCES AND PEOPLE OPERATIONS ═══════════════

('Human Resources and People Operations', 'screening_mechanism',
 'CIPD Ireland structures HR practice into four membership grades — Foundation, Associate, Chartered Member (MCIPD), and Chartered Fellow (FCIPD) — and Associate is the level most working HR professionals actually hold, reached either through the CIPD Level 5 Associate Diploma or an experience-based assessment route for those without a formal qualification. Naming the actual grade held, or realistically being worked toward, is a real, checkable credential in a field with no legal licensing requirement.',
 'CIPD — Find the qualification right for you', 'https://www.cipd.org/en/learning/qualifications/find/'),

('Human Resources and People Operations', 'screening_mechanism',
 'There is no legal licensing requirement to practise as an HR professional in Ireland — entry is governed by qualification and CIPD membership grade rather than a statutory register, closer to the pattern in Beauty, Hairdressing and Aesthetics than to Law or Engineering. The credibility marker employers actually screen for is the CIPD grade genuinely held, not a licence that does not exist.',
 'CIPD Ireland', 'https://cipd.ie/'),

('Human Resources and People Operations', 'must_have',
 'The CIPD grade held, or the specific pathway toward Associate membership — the Level 5 Diploma completed, or the experience-based route being pursued — named explicitly. "HR qualified" alone does not distinguish between the genuinely different grades this field actually recognises.',
 'CIPD — Find the qualification right for you', 'https://www.cipd.org/en/learning/qualifications/find/'),

('Human Resources and People Operations', 'must_have',
 'Chartered Member (MCIPD) specifically requires at least one year of recent experience working at a strategic or operational level in the people profession, within the last five years, alongside the Level 7 Advanced Diploma. A graduate is not yet at this stage — naming Associate as the realistic near-term target, rather than overclaiming "Chartered", reads as accurate self-assessment rather than inflation.',
 'CIPD — Chartered Fellow', 'https://cipd.ie/membership/become-member/professional/fellow'),

('Human Resources and People Operations', 'red_flag',
 'Claiming "Chartered" HR status (MCIPD or FCIPD) without actually holding it — these are specific, defined CIPD grades with real entry requirements, not a general description of experience, and misusing them is checkable against CIPD''s own member records.',
 'CIPD Ireland', 'https://cipd.ie/'),

('Human Resources and People Operations', 'red_flag',
 'Generic "people skills" or "good with people" framing with no actual HR process, system, or metric named — in a field this process-driven (recruitment funnels, retention rate, time-to-hire), vague interpersonal claims read as avoiding the operational substance of the role rather than demonstrating it.',
 'CIPD Ireland', 'https://cipd.ie/'),

('Human Resources and People Operations', 'wording_convention',
 'Name the actual CIPD grade precisely — "CIPD Level 5 Associate Diploma, Associate member" rather than "HR qualified" — since the specific grade is what a reviewer is scanning for, and the vaguer phrase could describe anything from a single short course to full Chartered Fellow status.',
 'CIPD — Find the qualification right for you', 'https://www.cipd.org/en/learning/qualifications/find/'),

('Human Resources and People Operations', 'wording_convention',
 'Quantify with the field''s own measures — time-to-hire, retention rate at a stated interval, offer-acceptance rate — rather than "supported the recruitment process", which gives a reviewer nothing to actually calibrate against.',
 'CIPD Ireland', 'https://cipd.ie/'),

('Human Resources and People Operations', 'real_entity',
 'CIPD Ireland (Chartered Institute of Personnel and Development), Workplace Relations Commission, Irish Congress of Trade Unions (ICTU), Ibec, and CPL, Sigmar, Morgan McKinley — the specialist recruitment agencies most active in HR-specific hiring itself, not just general graduate recruitment.',
 'CIPD Ireland', 'https://cipd.ie/'),

('Human Resources and People Operations', 'real_entity',
 'The Workplace Relations Commission (WRC), established under the Workplace Relations Act 2015, is the statutory body responsible for employment rights information, mediation, conciliation, adjudication, inspection and enforcement in Ireland — genuine working knowledge of when a case actually reaches WRC adjudication, rather than assuming every workplace dispute means litigation, is a real credibility marker in HR-specific applications.',
 'Workplace Relations Commission', 'https://www.workplacerelations.ie/'),

-- ═══════════════ FOOD AND BEVERAGE MANUFACTURING ═══════════════

('Food and Beverage Manufacturing', 'screening_mechanism',
 'BRCGS — a global food safety standard benchmarked against the Global Food Safety Initiative (GFSI) — is a certification most retailers and brand owners require before they will accept a food manufacturer as a supplier, covering the HACCP system alongside Good Manufacturing Practice (GMP) and Good Hygiene Practice (GHP). A production or quality role at an exporting Irish food manufacturer is effectively screening for BRCGS literacy even when the job posting does not name it directly.',
 'BRCGS — What Is BRCGS Certification?', 'https://fsns.com/what-is-brcgs/'),

('Food and Beverage Manufacturing', 'screening_mechanism',
 'Bord Bia''s Quality Assurance Schemes, accredited to ISO 17065:2012, cover over 58,000 farmers and more than 150 food processors and packers, built on food safety, traceability, welfare and environmental-protection standards across both farm and factory. With over 90% of Irish meat and dairy exported, overseas buyers expect proof against these standards specifically, which is what actually determines whether an Irish food manufacturer can sell into a given export market.',
 'Bord Bia — Quality Assurance', 'https://www.bordbia.ie/farmers-growers/get-involved/become-quality-assured/'),

('Food and Beverage Manufacturing', 'must_have',
 'HACCP-based food safety training, named explicitly, for any production-floor or quality role — it is a legal requirement for food business staff in Ireland enforced by the FSAI, and its absence (or a vague "food safety aware" claim with no HACCP reference) is a compliance gap, not a preference.',
 'Food Safety Authority of Ireland', 'https://www.fsai.ie/'),

('Food and Beverage Manufacturing', 'must_have',
 'For quality and technical roles specifically, BRCGS or an equivalent GFSI-benchmarked certification (ISO 22000, IFS) named by name, alongside GMP (Good Manufacturing Practice) awareness — "quality control experience" without naming which standard the site was actually certified to gives a reviewer nothing to verify against.',
 'BRCGS — What Is BRCGS Certification?', 'https://fsns.com/what-is-brcgs/'),

('Food and Beverage Manufacturing', 'red_flag',
 'No food safety or quality standard named at all on an application to a manufacturing or production role — "worked in a food factory" says nothing about whether the candidate actually understands the compliance environment the role sits inside.',
 'Food Safety Authority of Ireland', 'https://www.fsai.ie/'),

('Food and Beverage Manufacturing', 'red_flag',
 'Describing production experience purely in terms of output volume with no reference to quality, traceability, or compliance standards — in a sector this export-dependent, a candidate who only talks about throughput reads as missing the actual reason those standards exist commercially.',
 'Bord Bia — Quality Assurance', 'https://www.bordbia.ie/farmers-growers/get-involved/become-quality-assured/'),

('Food and Beverage Manufacturing', 'wording_convention',
 'Name the actual certification and standard — BRCGS, ISO 22000, Bord Bia Quality Assurance — rather than "food safety trained" generically, since the specific standard is what a reviewer in this field is actually scanning for.',
 'BRCGS — What Is BRCGS Certification?', 'https://fsns.com/what-is-brcgs/'),

('Food and Beverage Manufacturing', 'wording_convention',
 'Quantify with the field''s own measures — batch reject rate, first-pass yield, audit non-conformance count closed out — rather than "helped improve quality", which carries no information a technical or QA reviewer can actually calibrate against.',
 'Bord Bia — Quality Assurance', 'https://www.bordbia.ie/farmers-growers/get-involved/become-quality-assured/'),

('Food and Beverage Manufacturing', 'real_entity',
 'Food Safety Authority of Ireland (FSAI), Bord Bia, Food Drink Ireland (Ibec), Kerry Group, Glanbia, Diageo Ireland, Musgrave, Ornua, Dawn Meats, Kepak.',
 'Food Safety Authority of Ireland', 'https://www.fsai.ie/'),

('Food and Beverage Manufacturing', 'real_entity',
 'Food Drink Ireland, Ibec''s dedicated group for the sector, publishes an annual manufacturing report and is the field''s main representative and policy body — a genuine, checkable source of current sector context (export markets, capacity investment) beyond a single employer''s own framing.',
 'Ibec — Food Drink Ireland Manufacturing Report', 'https://www.ibec.ie/connect-and-learn/industries/food-and-drink/food-drink-ireland/publications/food-drink-sector-manufacturing-report'),

-- ═══════════════ NON-PROFIT AND NGO MANAGEMENT ═══════════════

('Non-Profit and NGO Management', 'screening_mechanism',
 'Registration with the Charities Regulator is a legal requirement for any organisation meeting the statutory definition of a charity in Ireland — it is an offence for a charitable organisation to carry out activities while unregistered. This makes registration status a genuine, checkable fact about an employer, not just a formality, and understanding it signals real familiarity with how this sector is actually governed.',
 'Charities Regulator', 'https://www.charitiesregulator.ie/en'),

('Non-Profit and NGO Management', 'screening_mechanism',
 'The Charities Governance Code, in effect since January 2020, sets six minimum standards for managing and controlling a registered Irish charity, and every registered charity must report annually on its compliance with the Code alongside its financial returns. Larger, more established charities and NGOs specifically screen operations and management candidates for genuine governance literacy — knowing the Code exists and what it actually requires — rather than only mission-alignment or passion for the cause.',
 'Charities Regulator — Charities Governance Code', 'https://www.charitiesregulator.ie/en/information-for-charities'),

('Non-Profit and NGO Management', 'must_have',
 'Awareness of the Charities Governance Code''s six principles and the annual compliance-reporting obligation, named specifically where relevant — a candidate who can speak to what governance actually requires reads as ready for operational or board-facing responsibility, not just delivery work.',
 'Charities Regulator — Charities Governance Code', 'https://www.charitiesregulator.ie/en/information-for-charities'),

('Non-Profit and NGO Management', 'must_have',
 'For international development and humanitarian roles specifically, familiarity with Dóchas — the Irish network connecting the sector''s 58 member organisations, from small specialist charities to large international NGOs — named where genuinely relevant, distinct from The Wheel''s broader community-and-voluntary remit.',
 'Dóchas — About', 'https://dochas.ie/about/'),

('Non-Profit and NGO Management', 'red_flag',
 'No reference to registration or governance status for a role at an organisation that is, or should be, a registered charity — an application that shows no awareness of the Charities Regulator or Governance Code framework reads as not having researched the sector''s actual accountability structure.',
 'Charities Regulator', 'https://www.charitiesregulator.ie/en'),

('Non-Profit and NGO Management', 'red_flag',
 'Mission-only framing with no operational substance — describing enthusiasm for a cause without naming a single concrete programme, campaign, fundraising target, or governance responsibility actually handled reads as passion without capability, which is precisely what this sector''s more experienced applicants are differentiated on.',
 'The Wheel', 'https://www.wheel.ie/'),

('Non-Profit and NGO Management', 'wording_convention',
 'Use the correct terminology precisely — "registered charity" only where genuinely registered with the Charities Regulator, "NGO" for the broader non-statutory category, and name the specific network (Dóchas for international development, The Wheel for the wider community-and-voluntary sector) rather than a vague "worked in the non-profit sector".',
 'Charities Regulator', 'https://www.charitiesregulator.ie/en'),

('Non-Profit and NGO Management', 'wording_convention',
 'Quantify with the field''s own measures — funds raised against a stated target, number of beneficiaries reached, volunteer hours coordinated — rather than "helped the community", which carries no information a sector reviewer can actually calibrate against.',
 'The Wheel', 'https://www.wheel.ie/'),

('Non-Profit and NGO Management', 'real_entity',
 'Charities Regulator, The Wheel (Ireland''s national association of community and voluntary organisations), Dóchas (the network for international development and humanitarian organisations, uniting 58 member organisations), Concern Worldwide, GOAL, Trócaire, Barnardos Ireland, St Vincent de Paul.',
 'Dóchas — About', 'https://dochas.ie/about/'),

('Non-Profit and NGO Management', 'real_entity',
 'The Charities Regulator publishes a public register of registered charities, showing registration status, governing documents, and annual reports — a directly useful tool for checking whether a prospective employer is actually registered and compliant, not just a regulatory formality.',
 'Charities Regulator', 'https://www.charitiesregulator.ie/en/information-for-charities'),

-- ═══════════════ TELECOMMUNICATIONS AND UTILITIES ═══════════════

('Telecommunications and Utilities', 'screening_mechanism',
 'ComReg, the statutory regulator for the communications sector, operates a "general authorisation" regime for telecoms providers rather than individual licensing — a provider declares its intention to provide electronic communications networks and services and must comply with the conditions ComReg sets, rather than applying for and being granted a specific licence. Radio spectrum and premium-rate services are the exceptions, which are individually licensed.',
 'ComReg', 'https://www.comreg.ie/industry/licensing/numbering/'),

('Telecommunications and Utilities', 'screening_mechanism',
 'Electrical and gas utility work carries the same statutory registration requirements documented elsewhere in this table for the skilled trades — Safe Electric (operated by RECI on behalf of the CRU) for electrical contracting, and RGII for gas work — since network operators and their contractors are subject to the identical legal framework as any other electrical or gas contractor in Ireland.',
 'Commission for Regulation of Utilities — RGI and Safe Electric', 'https://www.cru.ie/regulations-policy/safety/rgi-and-safe-electric/'),

('Telecommunications and Utilities', 'must_have',
 'For network and field roles specifically, the actual registration status named where it applies — Safe Electric for electrical network work, RGII for gas — rather than a general "utilities experience" claim that leaves the specific legal basis for the work unstated.',
 'Commission for Regulation of Utilities', 'https://www.cru.ie/'),

('Telecommunications and Utilities', 'must_have',
 'For telecoms-specific roles, genuine awareness that provision of services runs on ComReg''s general authorisation model rather than individual licensing — understanding this distinction, rather than assuming telecoms works like a licensed profession, signals real familiarity with how the sector is actually regulated.',
 'ComReg', 'https://www.comreg.ie/industry/licensing/numbering/'),

('Telecommunications and Utilities', 'red_flag',
 'Describing utility network work — electrical or gas specifically — with no registration scheme named or acknowledged, in a context where that registration is a legal requirement under the same statutory framework documented for the skilled trades elsewhere in this table.',
 'Commission for Regulation of Utilities — RGI and Safe Electric', 'https://www.cru.ie/regulations-policy/safety/rgi-and-safe-electric/'),

('Telecommunications and Utilities', 'red_flag',
 'Treating "telecoms" and "utilities" as interchangeable, or assuming both are regulated identically — they sit under genuinely different regulators (ComReg for communications, the CRU for electricity and gas), and conflating them reads as not having researched the sector''s actual structure.',
 'ComReg', 'https://www.comreg.ie/industry/licensing/numbering/'),

('Telecommunications and Utilities', 'wording_convention',
 'Name the actual regulator and mechanism precisely — ComReg''s general authorisation for telecoms, Safe Electric or RGII registration for utility network work — rather than a vague "regulatory compliance" claim, since the specific scheme is what a sector-literate reviewer is actually scanning for.',
 'ComReg', 'https://www.comreg.ie/industry/licensing/numbering/'),

('Telecommunications and Utilities', 'wording_convention',
 'Quantify with the field''s own measures — network uptime percentage, fault resolution time, coverage area or subscriber base affected — rather than "maintained the network", which carries no information a reviewer in this field can actually calibrate against.',
 'ComReg', 'https://www.comreg.ie/'),

('Telecommunications and Utilities', 'real_entity',
 'ComReg (Commission for Communications Regulation), Commission for Regulation of Utilities (CRU), Eir, Vodafone Ireland, Three Ireland, ESB Networks, Gas Networks Ireland, Uisce Éireann.',
 'ComReg', 'https://www.comreg.ie/'),

('Telecommunications and Utilities', 'real_entity',
 'ComReg maintains public registers and decision notices covering authorised providers, spectrum licence holders, and numbering allocations — a genuine, checkable resource for confirming a prospective employer''s actual regulatory standing rather than taking a job listing''s claims at face value.',
 'ComReg', 'https://www.comreg.ie/industry/licensing/numbering/');
