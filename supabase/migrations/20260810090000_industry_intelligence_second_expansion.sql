-- ═══════════════════════════════════════════════════════════════════════════
-- industry_intelligence for a second wave of newly added industries
--
-- Skilled Trades and Apprenticeships, Insurance and Actuarial, Retail and
-- E-commerce, and Environmental Sustainability and Renewable Energy were
-- added to the controlled vocabulary in the same change set as this
-- migration, following the same "generic/broad-coverage before niche"
-- selection principle the user set for this round. Same structure and
-- sourcing discipline as every prior industry_intelligence pass: 2 rows per
-- dimension across all 5 dimensions (screening_mechanism, must_have,
-- red_flag, wording_convention, real_entity), every claim checked against
-- the issuing body, statute, or a corroborating source before being written —
-- this table has no provenance filter, so every row here is shown to a
-- student as a real citation.
--
-- Two findings worth flagging directly:
--
--   - Gas work in Ireland is legally restricted to Registered Gas Installers
--     (RGI) under the Energy (Miscellaneous Provisions) Act 2006 — carrying
--     out "gas work" while unregistered is a criminal offence, verified
--     directly against the CRU (the scheme's statutory regulator), matching
--     the standard already set by the Building Control Act 2007 and
--     Property Services Regulation Act 2011 rows elsewhere in this table.
--     Electrical contracting carries the equivalent Safe Electric/RECI
--     requirement, operated by RECI on behalf of the CRU.
--   - The Society of Actuaries in Ireland is explicitly NOT the examining
--     body for actuarial qualifications — the Institute and Faculty of
--     Actuaries (IFoA, UK) is, and SAI says so plainly on its own site. This
--     is exactly the kind of easy-to-get-wrong distinction (the equivalent
--     of confusing SFI and the Irish Research Council, corrected in an
--     earlier pass of this table) that is worth stating precisely rather
--     than assuming the obvious-sounding national body is also the examiner.
--
-- Facts drawn on directly from research done for this change set: SOLAS's
-- statutory apprenticeship structure (7 alternating phases over a minimum 4
-- years, employer registration within 2 weeks); the Central Bank's Minimum
-- Competency Code 2017 and the APA/CIP qualification structure it requires;
-- Retail Ireland (Ibec) and Retail Ireland Skillnet as the sector's
-- representative and training bodies for a field with no formal licensing
-- gate; and the EPA's licensing role (est. under the EPA Act 1992) alongside
-- SEAI's separate promotional/grant role and Wind Energy Ireland (rebranded
-- from IWEA in January 2021).
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

-- ═══════════════ SKILLED TRADES AND APPRENTICESHIPS ═══════════════

('Skilled Trades and Apprenticeships', 'screening_mechanism',
 'Craft apprenticeships run a minimum of 4 years across 7 alternating phases — phases 1, 3, 5 and 7 on-the-job with an approved employer, phases 2, 4 and 6 off-the-job at a training centre or institute. Apprentices are paid a wage by their employer during on-the-job phases and a State training allowance during off-the-job phases. An employer must register a new apprentice with SOLAS within 2 weeks of taking them on — registration, not just informal on-site training, is what actually starts the apprenticeship.',
 'Citizens Information — Apprenticeships', 'https://www.citizensinformation.ie/en/education/further-education-and-training/apprenticeships/'),

('Skilled Trades and Apprenticeships', 'screening_mechanism',
 'Under the Energy (Miscellaneous Provisions) Act 2006, only a Registered Gas Installer (RGI) may legally carry out "gas work" in Ireland — installing or extending gas pipework, or installing gas appliances — and doing so while unregistered is a criminal offence, not a professional lapse. The equivalent applies to electrical contracting under the Safe Electric scheme, operated by RECI on behalf of the Commission for Regulation of Utilities (CRU): it is the law to be registered before trading as an electrical contractor.',
 'Commission for Regulation of Utilities — RGI and Safe Electric', 'https://www.cru.ie/regulations-policy/safety/rgi-and-safe-electric/'),

('Skilled Trades and Apprenticeships', 'must_have',
 'Registration as a SOLAS apprentice through an approved employer — not a privately purchased course — is the actual legal starting point for a craft apprenticeship, and naming the specific trade and phase currently reached (e.g. "Phase 4, Electrical") is a precise, checkable claim in a way "apprenticeship experience" is not.',
 'Citizens Information — Apprenticeships', 'https://www.citizensinformation.ie/en/education/further-education-and-training/apprenticeships/'),

('Skilled Trades and Apprenticeships', 'must_have',
 'For electrical work specifically: Safe Electric registration is the legal requirement to trade as an electrical contractor, but self-certification of completed work is not automatic on registration — a newly registered contractor is inspected within 6 months before gaining full self-certification rights, unless they carry prior RECI registration or equivalent experience. Understanding this distinction, rather than assuming registration alone means immediate self-certification, reads as genuine familiarity with the scheme.',
 'Safe Electric — Membership FAQs', 'https://safeelectric.ie/contractors/faq/what-is-the-membership-process/'),

('Skilled Trades and Apprenticeships', 'red_flag',
 'Claiming to be a registered, self-certifying electrician or a Registered Gas Installer without actually holding that registration is directly checkable against RECI''s and RGII''s own public registers — and for both electrical and gas work, carrying out the work itself while unregistered is a criminal offence, not just a misleading CV line.',
 'RGII — Registered Gas Installers of Ireland', 'https://rgi.ie/'),

('Skilled Trades and Apprenticeships', 'red_flag',
 'No specific trade, employer, or phase named — "trade experience" or "apprenticeship experience" on its own tells an employer nothing checkable, in a system that is itself structured around a named trade and a numbered phase.',
 'SOLAS', 'https://www.solas.ie/'),

('Skilled Trades and Apprenticeships', 'wording_convention',
 'Name the trade and the exact phase or year reached precisely — "Phase 4, Electrical" or "3rd year plumbing apprentice" — rather than "training in a trade". Phase numbers are how this system is actually structured, and using them correctly signals genuine familiarity with it.',
 'Citizens Information — Apprenticeships', 'https://www.citizensinformation.ie/en/education/further-education-and-training/apprenticeships/'),

('Skilled Trades and Apprenticeships', 'wording_convention',
 'Use the correct scheme name for the trade — RECI/Safe Electric for electrical work, RGII for gas work — rather than a vague "certified" or "qualified" claim. Naming the actual regulatory scheme, not just the qualification, is what signals real understanding of how this field is legally structured.',
 'Safe Electric', 'https://safeelectric.ie/'),

('Skilled Trades and Apprenticeships', 'real_entity',
 'SOLAS (the statutory apprenticeship authority), RECI and the Safe Electric scheme (electrical), RGII — the Register of Gas Installers of Ireland (gas), the Commission for Regulation of Utilities (CRU, which oversees both schemes), and the regional Education and Training Boards (ETBs) that deliver off-the-job training phases.',
 'SOLAS', 'https://www.solas.ie/'),

('Skilled Trades and Apprenticeships', 'real_entity',
 'apprenticeship.ie is SOLAS''s own national portal for apprenticeship vacancies and registration — the actual route into a craft apprenticeship, distinct from a general jobs board, and the place employers and SOLAS list real, currently available apprentice positions.',
 'apprenticeship.ie', 'https://www.apprenticeship.ie/'),

-- ═══════════════ INSURANCE AND ACTUARIAL ═══════════════

('Insurance and Actuarial', 'screening_mechanism',
 'The Central Bank of Ireland''s Minimum Competency Code 2017 requires anyone advising on, selling, or arranging specified financial products — including insurance — to hold a recognised qualification and to work under supervision until they do. The Certificate in Insurance Product Advice (APA) is the qualification new entrants complete to meet this requirement and be authorised to advise customers unsupervised. This is a hard regulatory gate, not a general sales credential.',
 'Insurance Institute — Certificate in Insurance Product Advice (APA) Guide', 'https://info.iii.ie/certificate-in-insurance-product-advice-apa-guide'),

('Insurance and Actuarial', 'screening_mechanism',
 'The Society of Actuaries in Ireland (SAI) is explicitly not the examining body for actuarial qualifications — the Institute and Faculty of Actuaries (IFoA), based in the UK, is. Most actuaries in Ireland qualify through IFoA''s professional exams, typically taking 3 to 6 years depending on exemptions claimed from a relevant degree, before transferring to Fellow (FIA). SAI''s own role is setting professional standards, CPD, and research, not running the exams.',
 'Society of Actuaries in Ireland — So how can I become an Actuary?', 'https://web.actuaries.ie/about/so-how-can-i-become-actuary'),

('Insurance and Actuarial', 'must_have',
 'The Accredited Product Advisor (APA) designation, or the fuller Certificate/Diploma in Insurance Practice (CIP), named explicitly for any insurance advisory role — this is the specific Central Bank Minimum Competency Code-compliant qualification, and naming it precisely (including which of the three non-life APA modules — personal general, commercial general, private medical) is far stronger than "insurance qualified".',
 'Insurance Institute — Certificate in Insurance Practice (CIP) Guide', 'https://info.iii.ie/certificate-in-insurance-practice-cip-guide'),

('Insurance and Actuarial', 'must_have',
 'Ongoing annual CPD to maintain an APA or CIP designation under the Minimum Competency Code is a real post-qualification obligation — a graduate applicant is not yet subject to it, but naming awareness of it, in the same way engineering, legal, and property CPD obligations are worth naming elsewhere in this table, signals a genuine view of the qualification as ongoing rather than a one-off exam passed.',
 'Insurance Institute — Certificate in Insurance Product Advice (APA) Guide', 'https://info.iii.ie/certificate-in-insurance-product-advice-apa-guide'),

('Insurance and Actuarial', 'red_flag',
 'Describing an insurance advisory role with no APA, CIP, or equivalent Minimum Competency Code-compliant qualification named, or no acknowledgement that supervision applies until one is held — this is a real regulatory boundary in this field, not a nice-to-have credential.',
 'Insurance Institute — Certificate in Insurance Product Advice (APA) Guide', 'https://info.iii.ie/certificate-in-insurance-product-advice-apa-guide'),

('Insurance and Actuarial', 'red_flag',
 'Naming the Society of Actuaries in Ireland as though it runs the actuarial exams, rather than the Institute and Faculty of Actuaries — a specific, checkable factual error that signals not having actually researched the qualification structure of the field being applied to.',
 'Society of Actuaries in Ireland — So how can I become an Actuary?', 'https://web.actuaries.ie/about/so-how-can-i-become-actuary'),

('Insurance and Actuarial', 'wording_convention',
 'Name the exact IFoA exam stage and any exemptions claimed precisely — "CS1 and CS2 exempted on the basis of my degree, sitting CM1 in April" — rather than "studying actuarial exams" vaguely, which could describe almost any stage of a multi-year qualification.',
 'Society of Actuaries in Ireland — Guide for Student Actuaries in Ireland', 'https://web.actuaries.ie/students/tools-resources/guide-student-actuaries-ireland'),

('Insurance and Actuarial', 'wording_convention',
 'Name the specific designation and product line — APA (personal general, commercial general, or private medical) versus the fuller CIP — rather than "insurance qualified" generically, since the exact designation is what a Minimum Competency Code-literate reviewer is actually scanning for.',
 'Insurance Institute — Certificate in Insurance Practice (CIP) Guide', 'https://info.iii.ie/certificate-in-insurance-practice-cip-guide'),

('Insurance and Actuarial', 'real_entity',
 'Central Bank of Ireland, Insurance Institute (part of the Chartered Insurance Institute network), Society of Actuaries in Ireland, Institute and Faculty of Actuaries (IFoA), Insurance Ireland, AIG, AXA Ireland, FBD, Zurich Ireland, Aon, Willis Towers Watson, Irish Life.',
 'Insurance Institute', 'https://www.iii.ie/'),

('Insurance and Actuarial', 'real_entity',
 'IrishJobs.ie runs a dedicated insurance category, updated daily, alongside the Insurance Institute''s own careers resources — actuarial roles specifically are frequently advertised directly by the insurers and consultancies themselves given the small, specialist size of the profession in Ireland.',
 'IrishJobs.ie — Insurance', 'https://www.irishjobs.ie/jobs/insurance'),

-- ═══════════════ RETAIL AND E-COMMERCE ═══════════════

('Retail and E-commerce', 'screening_mechanism',
 'Retail is Ireland''s largest indigenous private-sector employer, with over 300,000 people working in the sector according to Ibec''s Retail Ireland. Hiring is strongly seasonal — a real spike ahead of Christmas and, for many chains, back-to-school — with roles filled well before peak trading actually begins rather than reactively once it starts.',
 'Ibec — Retail Ireland', 'https://www.ibec.ie/connect-and-learn/industries/retail-and-tourism/retail-ireland'),

('Retail and E-commerce', 'screening_mechanism',
 'With no formal licensing body gating entry to this field, Retail Ireland Skillnet — delivering certified, work-based training to over 20,000 people in Irish retail since 2000 — functions as the sector''s main structured credentialing route, and a named Skillnet programme completed is a real, checkable differentiator in a field most applicants describe only in generic customer-service terms.',
 'Retail Ireland Skillnet', 'https://retailirelandskillnet.com/graduates-look-career-retail'),

('Retail and E-commerce', 'must_have',
 'Concrete commercial metrics named — footfall-to-conversion rate, average transaction value, stock loss or shrinkage percentage, sell-through rate — rather than a general "customer service" claim, which says nothing a retail reviewer can actually calibrate.',
 'Ibec — Retail Ireland', 'https://www.ibec.ie/connect-and-learn/industries/retail-and-tourism/retail-ireland'),

('Retail and E-commerce', 'must_have',
 'For e-commerce roles specifically, the actual platform or system used named explicitly — Shopify, a specific inventory or order-management system — rather than "online retail experience", which tells a reviewer nothing about what was actually operated.',
 'gradireland — Retail careers advice', 'https://gradireland.com/careers-advice/retail'),

('Retail and E-commerce', 'red_flag',
 '"Retail experience" with no store, brand, or department named, and no metric attached — in a field this metrics-literate, unspecific claims read as padding rather than genuine operational competence.',
 'Ibec — Retail Ireland', 'https://www.ibec.ie/connect-and-learn/industries/retail-and-tourism/retail-ireland'),

('Retail and E-commerce', 'red_flag',
 'Overselling a part-time shop-floor role as "management" experience without the actual scope behind it — team size, budget, or KPI ownership — is a real and checkable overstatement, easily probed at interview by anyone who has managed a retail team themselves.',
 'gradireland — Retail careers advice', 'https://gradireland.com/careers-advice/retail'),

('Retail and E-commerce', 'wording_convention',
 'Quantify with the field''s own measures — footfall, conversion rate, average transaction value, shrinkage — rather than "helped customers", which is the phrase every retail application reaches for and calibrates to nothing.',
 'Ibec — Retail Ireland', 'https://www.ibec.ie/connect-and-learn/industries/retail-and-tourism/retail-ireland'),

('Retail and E-commerce', 'wording_convention',
 'Name the actual systems used — the specific point-of-sale system, stock-management or ERP tool, Shopify for e-commerce — rather than leaving them implied. Precise tool names read as real operational competence in the same way naming specific software does in any other field.',
 'gradireland — Retail careers advice', 'https://gradireland.com/careers-advice/retail'),

('Retail and E-commerce', 'real_entity',
 'Retail Ireland (Ibec), Retail Ireland Skillnet, Dunnes Stores, Penneys/Primark, Musgrave Group, Brown Thomas Arnotts, Amazon Ireland, Boots Ireland.',
 'Ibec — Retail Ireland', 'https://www.ibec.ie/connect-and-learn/industries/retail-and-tourism/retail-ireland'),

('Retail and E-commerce', 'real_entity',
 'Retail Ireland Skillnet''s own certified training programmes are the field''s actual professional-development route, distinct from a formal licensing body since none exists for this sector — naming a completed programme is a genuine, checkable credential.',
 'Retail Ireland Skillnet', 'https://retailirelandskillnet.com/graduates-look-career-retail'),

-- ═══════════════ ENVIRONMENTAL SUSTAINABILITY AND RENEWABLE ENERGY ═══════════════

('Environmental Sustainability and Renewable Energy', 'screening_mechanism',
 'The EPA (Environmental Protection Agency), established under the Environmental Protection Agency Act 1992, licenses and regulates industrial and environmental activity in Ireland — including industrial emissions and waste licensing — independently of government. Roles working with regulated industry are screened for genuine awareness of EPA licensing obligations specifically, not a general "passionate about sustainability" framing.',
 'EPA — Who We Are', 'https://www.epa.ie/who-we-are/'),

('Environmental Sustainability and Renewable Energy', 'screening_mechanism',
 'Wind Energy Ireland — rebranded from the Irish Wind Energy Association (IWEA) in January 2021 — is the country''s largest renewable energy representative body, with over 150 members spanning the sector. Its events and reports are where much of the wind sector''s own hiring and policy conversation actually happens, rather than through a general jobs board.',
 'Wind Energy Ireland — IWEA rebrands as Wind Energy Ireland', 'https://windenergyireland.com/latest-news/5307-iwea-rebrands-as-wind-energy-ireland'),

('Environmental Sustainability and Renewable Energy', 'must_have',
 'Fluency with the actual named grant schemes and standards a role touches — the National Retrofit Plan, NZEB (Nearly Zero Energy Building), a specific SEAI grant scheme — rather than vague "green" language, which reads as unfamiliar with how this field is actually structured and funded.',
 'SEAI', 'https://www.seai.ie/'),

('Environmental Sustainability and Renewable Energy', 'must_have',
 'For building-performance-adjacent roles specifically: SEAI states an NFQ Level 7 qualification in a building or construction-related discipline as its minimum requirement to register as a non-domestic BER assessor. Naming this precisely, where that is the actual pathway being pursued, is more credible than a general sustainability qualification claim.',
 'SEAI — Register as a Non-Domestic BER Assessor', 'https://www.seai.ie/contractors-and-suppliers/register-with-seai/ber-assessor/register-non-domestic-ber'),

('Environmental Sustainability and Renewable Energy', 'red_flag',
 'Generic "passionate about sustainability" language with no named scheme, grant, standard, or regulatory body attached — in a field this policy- and regulation-driven, vagueness reads as unfamiliarity with the actual landscape rather than genuine enthusiasm for it.',
 'SEAI', 'https://www.seai.ie/'),

('Environmental Sustainability and Renewable Energy', 'red_flag',
 'Conflating SEAI and the EPA as though they do the same job — they have genuinely distinct roles (SEAI promotes energy efficiency and renewables and administers grants; the EPA licenses and enforces environmental compliance) — and treating them as interchangeable signals not having done basic research into the field''s own institutional structure.',
 'EPA — Who We Are', 'https://www.epa.ie/who-we-are/'),

('Environmental Sustainability and Renewable Energy', 'wording_convention',
 'Name the actual standard or certification scheme precisely — BER, NZEB, the IGBC''s Home Performance Index, LEED, BREEAM — rather than "sustainable design" vaguely, which tells a reviewer nothing about which framework the work was actually assessed against.',
 'Irish Green Building Council — Certification', 'https://www.igbc.ie/certification/'),

('Environmental Sustainability and Renewable Energy', 'wording_convention',
 'Quantify environmental impact claims against a real, stated baseline — a percentage energy reduction against a named starting figure, a stated tonnage of CO2e avoided — rather than an unquantified "reduced carbon footprint" claim. This is the same anti-greenwashing discipline this field''s own credible practitioners hold themselves to, and a reviewer in this space reads for it directly.',
 'SEAI', 'https://www.seai.ie/'),

('Environmental Sustainability and Renewable Energy', 'real_entity',
 'SEAI (Sustainable Energy Authority of Ireland), EPA (Environmental Protection Agency), Wind Energy Ireland, IGBC (Irish Green Building Council), Bord na Móna, ESB, Bord Gáis Energy, SSE Renewables Ireland.',
 'SEAI', 'https://www.seai.ie/'),

('Environmental Sustainability and Renewable Energy', 'real_entity',
 'The Irish Green Building Council''s own certification and membership network (Home Performance Index, LEED, BREEAM, DGNB assessments) is a genuine, checkable professional community distinct from a general jobs board — membership and a named certification are real, verifiable credentials in a field with no single formal licensing body.',
 'Irish Green Building Council — About', 'https://www.igbc.ie/about/');
