-- ═══════════════════════════════════════════════════════════════════════════
-- industry_intelligence for the four newly added industries
--
-- Agriculture and Veterinary, Beauty/Hairdressing and Aesthetics, Real Estate
-- and Property, and Aviation and Logistics were added to the controlled
-- vocabulary (_shared/industries.ts, src/lib/industries.js) alongside course-
-- inference support (_shared/courseToIndustry.ts) in the same change set as
-- this migration. This brings their industry_intelligence coverage to parity
-- with the original 15 industries in one pass — 2 rows per dimension across
-- all 5 dimensions (screening_mechanism, must_have, red_flag,
-- wording_convention, real_entity) — rather than seeding 1 row per dimension
-- and deepening later, since the 4-industries decision and the depth bar were
-- both set at the same time.
--
-- Same sourcing discipline as every prior pass into this table: it has no
-- provenance column and no filter before being shown to a student as a real
-- citation, so every claim below was checked against the issuing body,
-- statute, or a corroborating source before being written.
--
-- Two findings are worth flagging directly, because they run against the
-- pattern the other 15 industries mostly follow:
--
--   - There is currently NO statutory licence to work as a hairdresser or
--     beauty therapist, or to run a salon, anywhere in Ireland. Unlike
--     nursing, teaching, law, engineering, and now veterinary medicine and
--     property services below, this field is not gated by a legal register.
--     The screening_mechanism and must_have rows for this industry say so
--     honestly rather than forcing it into the same registration-gate
--     narrative used elsewhere in this table — the real credibility marker is
--     the statutory National Hairdressing Apprenticeship (SOLAS, QQI Level 6)
--     or a recognised beauty diploma, not a non-existent licence.
--   - Trading as a property services provider without a PSRA licence is a
--     criminal offence under the Property Services Regulation Act 2011 (up to
--     5 years' imprisonment on indictment) — a materially stronger claim than
--     "registration is expected", verified directly against the PSRA before
--     being written, matching the standard already set by the Building
--     Control Act 2007 rows for Construction and Architecture.
--
-- Facts drawn on directly from research done for this change set: VCI
-- registration under the Veterinary Practice Act 2005; the Teagasc Green Cert
-- as the specific qualification DAFM/Revenue "qualified farmer" schemes check
-- for; PSRA's four licence categories and its 5-hour annual CPD requirement
-- across three accredited bodies (IPAV, Public Affairs Ireland, SCSI); the
-- SEAI BER certificate as a legal precondition to market a property; the IAA's
-- SPL/PPL/CPL/ATPL pilot licence hierarchy; CILT Ireland's role as the
-- appointed examining body for CPC, ADR and DGSA; and Ireland's position as
-- the world's leading aircraft-leasing hub (per Ibec's Aircraft Leasing
-- Ireland group, roughly 65% of the world's leased aircraft fleet is managed
-- from Ireland, with 19 of the world's 20 largest lessors based in Dublin).
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

-- ═══════════════ AGRICULTURE AND VETERINARY ═══════════════

('Agriculture and Veterinary', 'screening_mechanism',
 'Registering with the Veterinary Council of Ireland is a legal precondition to practise veterinary medicine in Ireland under the Veterinary Practice Act 2005 — the Council maintains the Register of Veterinary Practitioners, and a registered vet may only practise from a premises that is itself registered with the Council. Veterinary nursing is registered separately, on the Council''s own Register of Veterinary Nurses, rather than folded into the vets'' register.',
 'Veterinary Practice Act 2005 (Irish Statute Book)', 'https://revisedacts.lawreform.ie/eli/2005/act/22/revised/en/html'),

('Agriculture and Veterinary', 'screening_mechanism',
 'DAFM and Revenue''s farm-support schemes — young farmer top-ups, stamp duty relief, and stock relief among them — gate eligibility on holding "qualified farmer" status, and the Teagasc Green Cert (the QQI Level 6 Specific Purpose Certificate in Farm Administration) is the minimum education standard that satisfies it. This makes the Green Cert less a general qualification and more the specific credential that decides whether a young farmer taking over or starting a holding can actually access the schemes that make it financially viable.',
 'Teagasc — Level 6 Distance Education Green Cert', 'https://teagasc.ie/education/going-to-college/apply-online/agriculture-courses/level-6-distance-education-green-cert/'),

('Agriculture and Veterinary', 'must_have',
 'A VCI PIN stated explicitly for veterinary roles, or — for a student — the year reached in the UCD veterinary medicine programme, Ireland''s only veterinary degree, and the registration route that follows it. For veterinary nursing, registration or documented progress on the Council''s separate Register of Veterinary Nurses, named as such rather than folded into general "vet experience".',
 'Veterinary Council of Ireland — Registration', 'https://www.vci.ie/registration/limited-registration'),

('Agriculture and Veterinary', 'must_have',
 'The Teagasc Green Cert (QQI Level 6 Specific Purpose Certificate in Farm Administration) named explicitly for any farm management, advisory, or agribusiness application — it is the specific qualification DAFM and Revenue schemes actually check for, and "agricultural background" or "grew up on a farm" does not substitute for it where the qualification itself is the gate.',
 'Teagasc — Level 6 Distance Education Green Cert', 'https://teagasc.ie/education/going-to-college/apply-online/agriculture-courses/level-6-distance-education-green-cert/'),

('Agriculture and Veterinary', 'red_flag',
 'Describing veterinary duties in language that oversteps what was actually performed under supervision — implying independent diagnosis or treatment decisions as a student or unregistered graduate is the same failure mode clinical panels in nursing and allied health watch for, and it is checkable against the VCI register in seconds.',
 'Veterinary Council of Ireland', 'https://www.vci.ie/'),

('Agriculture and Veterinary', 'red_flag',
 'Farm or agricultural experience described with no enterprise type or scale attached — "worked on a farm" says nothing to an employer reading for whether the system was dairy, suckler, tillage or mixed, or what herd, flock or acreage was actually being managed. This is precisely the kind of unscalable claim agricultural CVs are read for.',
 'Teagasc', 'https://teagasc.ie/'),

('Agriculture and Veterinary', 'wording_convention',
 'Name the enterprise system precisely — spring-calving dairy, suckler-to-beef, tillage, mixed — and the actual scale, in cows, ewes, hectares or acres. These are not interchangeable descriptions to anyone who has worked a farm, and the right term signals genuine hands-on knowledge in a way "farm work" cannot.',
 'Teagasc', 'https://teagasc.ie/'),

('Agriculture and Veterinary', 'wording_convention',
 'Use veterinary register terms precisely — "large animal" or "food animal" practice is a different specialism from "small animal" or "companion animal" practice, and "TB testing", "herd health" and "calving season" each mean something specific to a reviewer inside the profession. Writing around these terms with vaguer language reads as writing from outside the field looking in.',
 'Veterinary Council of Ireland', 'https://www.vci.ie/'),

('Agriculture and Veterinary', 'real_entity',
 'Teagasc (Agriculture and Food Development Authority), Department of Agriculture, Food and the Marine (DAFM), Veterinary Council of Ireland, Irish Farmers'' Association (IFA), Irish Co-operative Organisation Society (ICOS), Bord Bia, UCD School of Veterinary Medicine — Ireland''s only veterinary degree programme — and UCD Veterinary Hospital.',
 'Teagasc', 'https://teagasc.ie/'),

('Agriculture and Veterinary', 'real_entity',
 'AgriRecruit, run by Agriland Media, is Ireland''s dedicated agricultural jobs board, covering roles from farm operative to agronomist, vet and agribusiness manager, and reaches candidates through its sister publication Agriland.ie''s readership of over 1,000,000 unique monthly visitors.',
 'AgriRecruit — Agriland Media', 'https://www.agrilandmedia.ie/platform/agrirecruit/'),

-- ═══════════════ BEAUTY, HAIRDRESSING AND AESTHETICS ═══════════════

('Beauty, Hairdressing and Aesthetics', 'screening_mechanism',
 'There is currently no statutory licence required to work as a hairdresser or beauty therapist, or to operate a salon, anywhere in Ireland — unlike most of the regulated professions elsewhere in this table, entry here is governed by qualification and reputation rather than a legal register. The credibility marker employers actually screen for is completion of the National Hairdressing Apprenticeship (a SOLAS-run, QQI Level 6 statutory apprenticeship) or a recognised beauty therapy diploma, not a licence that does not exist.',
 'National Institute of Beauty — Ireland Hair & Beauty Regulations', 'https://www.nationalinstituteofbeauty.com/regulations/ireland/'),

('Beauty, Hairdressing and Aesthetics', 'screening_mechanism',
 'Salon hiring commonly runs through a trial or "model" day rather than an interview alone — a prospective stylist or therapist is assessed on client-facing work performed live, which functions as the practical audition a CV and portfolio alone cannot replace in a craft this visual.',
 'Irish Hairdressers Federation — About', 'https://www.irishhairfed.com/about'),

('Beauty, Hairdressing and Aesthetics', 'must_have',
 'The National Hairdressing Apprenticeship (QQI Level 6) or a recognised diploma — CIBTAC, CIDESCO, or an ITEC award, now issued through VTCT — named specifically rather than "trained in hairdressing/beauty". These are the awarding bodies employers and clients actually recognise, and naming the wrong or a vague one reads as not knowing the qualification landscape.',
 'Irish Hairdressers Federation', 'https://www.irishhairfed.com/ihf-star-team-apply-now'),

('Beauty, Hairdressing and Aesthetics', 'must_have',
 'Public liability insurance, named explicitly, for any self-employed, mobile, or chair-rental stylist or therapist — it is a genuine practical precondition to work in most of the field''s self-employed arrangements, and its absence, or a claim of being insured with no detail, is a real gap in an application for that kind of role.',
 'National Institute of Beauty — Ireland Hair & Beauty Regulations', 'https://www.nationalinstituteofbeauty.com/regulations/ireland/'),

('Beauty, Hairdressing and Aesthetics', 'red_flag',
 'No before-and-after work shown anywhere in the application — for a craft this visual, a CV with no portfolio, images, or social media portfolio link attached leaves a reviewer with literally nothing to assess the actual standard of work against.',
 'Irish Hairdressers Federation — About', 'https://www.irishhairfed.com/about'),

('Beauty, Hairdressing and Aesthetics', 'red_flag',
 'Claiming a qualification, diploma, or insurance cover that is not actually held is a real and checkable risk in this field specifically — clients and employers can and do ask to see certificates and insurance documents directly, and a claim that does not hold up is a fast, serious credibility failure rather than a minor exaggeration.',
 'National Institute of Beauty — Ireland Hair & Beauty Regulations', 'https://www.nationalinstituteofbeauty.com/regulations/ireland/'),

('Beauty, Hairdressing and Aesthetics', 'wording_convention',
 'Name the actual technique or product line, not the generic category — "balayage", "HD brows", "microblading", or a specific colour brand and semi-permanent versus permanent process — rather than "hair treatments" or "beauty services", which tells a reviewer nothing about what was actually delivered or what skill it required.',
 'Irish Hairdressers Federation — About', 'https://www.irishhairfed.com/about'),

('Beauty, Hairdressing and Aesthetics', 'wording_convention',
 'Quantify with the field''s own measures — rebooking or retention rate, average column or chair utilisation, retail attachment rate — rather than "built strong client relationships", which is the generic phrase every application in this field reaches for and says nothing calibratable.',
 'Irish Hairdressers Federation — About', 'https://www.irishhairfed.com/about'),

('Beauty, Hairdressing and Aesthetics', 'real_entity',
 'SOLAS (the statutory further education and training authority, which runs the National Hairdressing Apprenticeship), Irish Hairdressers Federation (IHF, established 1974, the sector''s longest-standing representative body), CIBTAC, CIDESCO, and ITEC — now awarded through VTCT — as the beauty therapy diploma bodies most recognised in Ireland.',
 'Irish Hairdressers Federation — About', 'https://www.irishhairfed.com/about'),

('Beauty, Hairdressing and Aesthetics', 'real_entity',
 'IrishJobs.ie runs a dedicated hair-and-beauty category, updated daily, as the field''s main general jobs-board presence — salon-specific and chain vacancies (larger groups, spas, hotel spas) are otherwise found largely through direct applications and word of mouth rather than a single specialist board.',
 'IrishJobs.ie — Hair and Beauty', 'https://www.irishjobs.ie/jobs/hair-and-beauty'),

-- ═══════════════ REAL ESTATE AND PROPERTY ═══════════════

('Real Estate and Property', 'screening_mechanism',
 'Trading as a property services provider without a PSRA licence is a criminal offence under the Property Services Regulation Act 2011, not just a professional lapse — on summary conviction it carries a fine or up to 12 months'' imprisonment, or on indictment a fine or up to 5 years. The PSRA licenses four categories: Auctioneer (A), Estate Agent (B), Letting Agent (C), and Property Management Agent (D), and a provider may hold any combination but may only work within the category it is actually licensed for.',
 'Property Services Regulatory Authority — Engaging a Property Services Provider', 'https://www.psr.ie/consumers-information/engaging-a-property-services-provider/'),

('Real Estate and Property', 'screening_mechanism',
 'PSRA licensees must complete a minimum of 5 verifiable hours of formal CPD each calendar year, across all four licence categories, delivered through one of three accredited bodies — IPAV, Public Affairs Ireland, or SCSI — and retain certificates for four years in case of audit. As with the equivalent obligations elsewhere in this table, this is a post-qualification requirement a graduate is not yet subject to, but naming awareness of it signals a genuine view of the licence as an ongoing professional standing rather than a one-off exam passed.',
 'Property Services Regulatory Authority — Continuous Professional Development', 'https://www.psr.ie/licensees/continuous-professional-development/'),

('Real Estate and Property', 'must_have',
 'A PSRA licence category named specifically — Auctioneer (A), Estate Agent (B), Letting Agent (C), or Property Management Agent (D) — or, for a graduate not yet licensed, the qualification route toward it: IPAV''s Higher Certificate in Business in Real Estate, Valuation, Sale and Management (Level 6) is a specific pathway that also exempts a graduate from IPAV''s application fee if joined within two years of qualifying.',
 'IPAV — Membership', 'https://www.ipav.ie/membership/membership-benefits'),

('Real Estate and Property', 'must_have',
 'A Building Energy Rating (BER) certificate, prepared by a SEAI-registered assessor, is a legal requirement before any property in Ireland can be advertised, sold, or let — failure to comply can carry fines of up to €5,000. Fluency with this requirement, not just awareness that it exists, is a genuine baseline expectation for anyone bringing a property to market.',
 'SEAI — Get a BER Assessment', 'https://www.seai.ie/ber/get-a-ber-assessment'),

('Real Estate and Property', 'red_flag',
 'Describing property sales, lettings, or management work with no PSRA licence category named, or no acknowledgement that one is required — trading without one is a criminal offence under the Property Services Regulation Act 2011, and an application that shows no awareness of the licensing framework at all reads as not having done basic research into the field.',
 'Property Services Regulatory Authority', 'https://www.psr.ie/consumers-information/engaging-a-property-services-provider/'),

('Real Estate and Property', 'red_flag',
 '"Sales experience" claimed with no transaction values, volume, or property type attached — a property CV is read for scale (how many units, what price band, residential or commercial), and a generic sales claim with none of that detail could describe almost any retail job rather than property specifically.',
 'IPAV', 'https://www.ipav.ie/'),

('Real Estate and Property', 'wording_convention',
 '"Sale agreed" is a specific, non-binding stage in the Irish property process — the seller has accepted an offer, but either side can still withdraw without penalty until contracts are signed and exchanged — and it is a distinct term from "sold". Using the two interchangeably, or naming the wrong one for the stage actually reached, is a precision error a property reviewer notices immediately.',
 'Daft.ie — How to Sell Your Home in Ireland', 'https://www.sell.daft.ie/'),

('Real Estate and Property', 'wording_convention',
 'Quantify with the field''s own measures — a portfolio of a stated number of units under management, average days on market, percentage achieved over or under asking price — rather than "strong sales record", which carries no information a property reviewer can actually calibrate against.',
 'SCSI', 'https://scsi.ie/'),

('Real Estate and Property', 'real_entity',
 'Property Services Regulatory Authority (PSRA), Institute of Professional Auctioneers and Valuers (IPAV), Society of Chartered Surveyors Ireland (SCSI), Daft.ie, MyHome.ie, Sherry FitzGerald, DNG, Savills Ireland, CBRE Ireland, Knight Frank Ireland.',
 'Property Services Regulatory Authority', 'https://www.psr.ie/'),

('Real Estate and Property', 'real_entity',
 'The PSRA publishes a public, searchable register of every licensed property services provider, showing the licensee''s name, licence number, category, and expiry date — a directly useful tool for checking whether a prospective employer''s licence is genuine and current, not just a regulatory formality.',
 'Property Services Regulatory Authority — Register of Licensed Property Services Providers', 'https://www.psr.ie/psra-registers/register-of-licensed-property-services-providers/'),

-- ═══════════════ AVIATION AND LOGISTICS ═══════════════

('Aviation and Logistics', 'screening_mechanism',
 'Pilot licensing in Ireland runs through a fixed hierarchy the Irish Aviation Authority issues and regulates — Student Pilot Licence (SPL), Private Pilot Licence (PPL, private use only), Commercial Pilot Licence (CPL, for hire or reward), and Airline Transport Pilot Licence (ATPL, required for command). A candidate''s actual stage in this hierarchy, not just "training to be a pilot", is what a screener is reading for.',
 'Irish Aviation Authority — How to become a pilot', 'https://www.iaa.ie/personnel-licensing/pilot-licences-(eu-regulations)/how-to-become-a-pilot'),

('Aviation and Logistics', 'screening_mechanism',
 'CILT Ireland is the appointed examining body — on behalf of the Department of Transport for the Certificate of Professional Competence (CPC) in road transport and road passenger operations, and on behalf of the Health and Safety Authority for the ADR driver certificate and the Dangerous Goods Safety Adviser (DGSA) qualification. A transport or logistics role that legally requires a CPC-holding transport manager, or ADR-certified drivers, screens against CILT-issued certification specifically, not a general logistics qualification.',
 'CILT Ireland — Education & Exams', 'https://www.cilt.ie/Education-Exams/Exams'),

('Aviation and Logistics', 'must_have',
 'For pilot-track applicants, the actual training route matters as much as the hours logged: Ryanair''s self-funded cadetship costs roughly €48,000–€130,000 depending on the training organisation, while Aer Lingus''s cadet programme is fully funded with no fee to the trainee, in exchange for a conditional job commitment. Naming which route was taken, or is being pursued, and why, reads as a considered decision rather than a vague ambition.',
 'The Irish Times — I would like to become an airline pilot. How do I begin the process?', 'https://www.irishtimes.com/ireland/education/2026/03/30/i-would-like-to-become-an-airline-pilot-how-do-i-begin-the-process/'),

('Aviation and Logistics', 'must_have',
 'For transport and logistics roles specifically, a CPC, ADR, or DGSA certificate named explicitly where the role legally requires one — a transport manager role cannot legally operate without a CPC holder attached to the licence, and dangerous-goods haulage cannot legally operate without ADR-certified drivers and, above a threshold, a DGSA. Naming the actual certificate is what a compliance-literate application looks like in this field.',
 'CILT Ireland — Education & Exams', 'https://www.cilt.ie/Education-Exams/Exams'),

('Aviation and Logistics', 'red_flag',
 'Claiming flight hours, a licence stage, or a rating not actually held — aviation logbooks are formally audited documents, not a self-reported CV line, and a claim that does not match the logged record is a serious, checkable failure in a field where the underlying safety case depends on it being accurate.',
 'Irish Aviation Authority', 'https://www.iaa.ie/'),

('Aviation and Logistics', 'red_flag',
 'Logistics or supply chain experience described with no system named — no WMS, TMS, or ERP platform (SAP, Oracle, or similar) — reads as vague "organisational skills" rather than the operational competence the role is actually screening for, since modern logistics roles are run through named software, not spreadsheets and instinct.',
 'CILT Ireland', 'https://www.cilt.ie/'),

('Aviation and Logistics', 'wording_convention',
 'Quantify with the field''s own operational measures — flight hours logged, on-time performance percentage, fleet or tonnage handled, pallet volume, order fill rate — rather than a general description of busyness, since these are the specific figures a reviewer in aviation or logistics is scanning for.',
 'CILT Ireland', 'https://www.cilt.ie/'),

('Aviation and Logistics', 'wording_convention',
 'Name the exact licence or certificate, not the general activity — SPL, PPL, CPL, or ATPL for pilots; CPC, ADR, or DGSA for transport and logistics — since these are distinct, non-interchangeable credentials with different legal meanings, and "trained in aviation" or "logistics qualified" tells a reviewer nothing they can act on.',
 'Irish Aviation Authority — How to become a pilot', 'https://www.iaa.ie/personnel-licensing/pilot-licences-(eu-regulations)/how-to-become-a-pilot'),

('Aviation and Logistics', 'real_entity',
 'Irish Aviation Authority (IAA), CILT Ireland (Chartered Institute of Logistics & Transport), daa (formerly Dublin Airport Authority, operator of Dublin and Cork airports), Aer Lingus, Ryanair, DHL Ireland.',
 'Irish Aviation Authority', 'https://www.iaa.ie/'),

('Aviation and Logistics', 'real_entity',
 'Ireland is the world''s leading centre for commercial aircraft leasing: per Ibec''s Aircraft Leasing Ireland group, roughly 65% of the world''s leased aircraft fleet is managed from Ireland, with 19 of the world''s 20 largest lessors — including AerCap and Avolon, both headquartered in Dublin — based here. This is directly relevant to aviation finance, leasing, and asset-management career paths, not just flight operations, and is a genuinely distinctive feature of the Irish aviation sector worth naming on an application into it.',
 'Ibec — Ireland a global centre for aircraft leasing', 'https://www.ibec.ie/connect-and-learn/industries/financial-services-leasing-and-professional-services/aircraft-leasing-ireland/ireland-a-global-centre-for-aircraft-leasing');
