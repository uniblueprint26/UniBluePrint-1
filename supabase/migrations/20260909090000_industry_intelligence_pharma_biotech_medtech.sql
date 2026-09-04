-- ═══════════════════════════════════════════════════════════════════════════
-- industry_intelligence for the 28th industry: Pharmaceuticals, Biotechnology
-- and Medical Devices
--
-- Added as its own industry rather than left folded into Science and
-- Research (where 'pharmaceutical' and 'biotechnology' previously resolved)
-- because it is one of the largest and most distinctive graduate-employer
-- sectors in the country, with its own regulator, its own trade bodies, and
-- a genuinely different hiring/screening pattern from general lab science.
-- Same structure and sourcing discipline as every prior wave: 2 rows per
-- dimension across all 5 dimensions, every claim checked against the
-- issuing body or a corroborating source before being written — this table
-- has no provenance filter, so every row here is shown to a student as a
-- real citation.
--
-- Facts drawn on directly from research done for this change set: the
-- HPRA's (Health Products Regulatory Authority) Manufacturer's/Importer's
-- Authorisation process, which requires demonstrated GMP (Good
-- Manufacturing Practice) compliance and is confirmed by a GMP inspection
-- before a certificate issues; Regulation (EU) 2017/745 (the Medical
-- Device Regulation, MDR) requiring CE marking via a Notified Body for
-- most device classes, and ISO 13485 as the QMS standard nearly every
-- device manufacturer actually holds to demonstrate MDR compliance even
-- though it is formally voluntary; BioPharmaChem Ireland (Ibec's biopharma
-- and chemical sector trade association — 90+ member companies, 80,000+
-- people employed directly and indirectly, over €139bn in annual exports,
-- 8 of the world's top 10 biopharma companies with an Irish base); Irish
-- Medtech Association (Ibec's medtech sector body — 250+ members, 9 of the
-- world's top 10 medtech companies with an Irish base, €13bn in exports,
-- 45,000 people employed, runs apprenticeship/Springboard/Skillnets
-- training); and real named employers and sites — Boston Scientific
-- (7,000+ across Galway, Cork and Clonmel), Pfizer (~5,000 across
-- Ringaskiddy Cork, Grange Castle Dublin and Newbridge Kildare), Stryker
-- (5,000+ across eight Irish sites, 4,100+ of them in Cork), Johnson &
-- Johnson (5,000+ across ten locations, including DePuy's medical device
-- site in Ringaskiddy and the Janssen/J&J Innovative Medicine pharma site
-- in Little Island) — plus CPL Life Sciences and Collins McNicholas as
-- specialist recruiters active in this sector specifically, and DCU's BSc
-- Chemical and Pharmaceutical Sciences and University of Galway's BSc
-- Biopharmaceutical Chemistry as real, named degree routes into it.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.industry_intelligence (industry, dimension, content, source_name, source_url) values

('Pharmaceuticals, Biotechnology and Medical Devices', 'screening_mechanism',
 'For manufacturing and quality roles at medicinal-product sites, the real credibility marker is genuine familiarity with GMP (Good Manufacturing Practice) as HPRA actually enforces it — a Manufacturer''s or Importer''s Authorisation is only granted, and a GMP certificate only issued, after the HPRA inspects the site and confirms compliance. A candidate who can describe a real GMP-compliant environment, not just claim "pharma experience", is screened in ahead of one who cannot.',
 'HPRA — Applications for a Manufacturer''s Authorisation', 'https://www.hpra.ie/homepage/medicines/regulatory-information/manufacturers/applications-for-a-manufacturing-authorisation'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'screening_mechanism',
 'For medical device roles specifically, the equivalent screening signal is familiarity with Regulation (EU) 2017/745 (the Medical Device Regulation) and ISO 13485 — most device classes require CE marking via a Notified Body under the MDR, and ISO 13485 is the quality management system standard nearly every device manufacturer holds to demonstrate that compliance, even though it is formally a voluntary standard rather than a legal requirement in itself.',
 'ISO 13485:2016 — Medical devices, Quality management systems', 'https://www.iso.org/standard/59752.html'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'must_have',
 'A named, specific relevant degree — for example DCU''s BSc in Chemical and Pharmaceutical Sciences or University of Galway''s BSc in Biopharmaceutical Chemistry (CAO code GY318) — stated exactly, rather than a generic "science degree". Both are real, current CAO-listed routes directly into this sector, not adjacent science disciplines.',
 'DCU — BSc in Chemical & Pharmaceutical Sciences', 'https://www.dcu.ie/courses/undergraduate/school-chemical-sciences/chemical-and-pharmaceutical-sciences'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'must_have',
 'Direct exposure to a GMP-regulated manufacturing or quality environment — a placement or internship at a named site, such as Boston Scientific (Galway, Cork or Clonmel), Pfizer (Ringaskiddy, Grange Castle or Newbridge), Stryker (Cork or Limerick), or Johnson & Johnson''s DePuy or Janssen/J&J Innovative Medicine sites — carries far more weight than unnamed "laboratory experience", since hiring in this sector is genuinely site- and regulation-specific.',
 'IDA Ireland — Stryker in Ireland', 'https://www.idaireland.com/success-stories/stryker'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'red_flag',
 'Using "GMP experience" or "quality experience" as a bare phrase with no specific process behind it — batch record review, deviation investigation, CAPA (corrective and preventive action), validation protocol — are the real, checkable operational terms of this field, and using none of them reads as unfamiliarity with the actual day-to-day work rather than genuine exposure to it.',
 'HPRA — Regulation of manufacturing', 'https://www.hpra.ie/regulation/human-medicine/manufacturers/manufacture-of-human-medicines-in-ireland'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'red_flag',
 'Conflating medical device regulation (CE marking under EU MDR 2017/745, assessed by a Notified Body) with medicinal product regulation (an HPRA Manufacturer''s Authorisation and marketing authorisation) — these are two distinct regulatory pathways that happen to sit inside the same broad sector, and mixing them up in a CV or interview answer signals a lack of real sector-specific knowledge rather than adjacent-enough familiarity.',
 'EUR-Lex — Regulation (EU) 2017/745 on medical devices', 'https://eur-lex.europa.eu/eli/reg/2017/745/2025-01-10/eng'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'wording_convention',
 'Name the regulation or standard precisely — "GMP-compliant environment", "ISO 13485-certified site", "EU MDR 2017/745" — rather than the vaguer "regulated industry experience", since these specific terms are exactly what a reviewer familiar with the sector is scanning a CV for.',
 'HPRA — Regulation of manufacturing', 'https://www.hpra.ie/regulation/human-medicine/manufacturers/manufacture-of-human-medicines-in-ireland'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'wording_convention',
 'Quantify with the sector''s own real operational measures — batch yield, deviation or CAPA closure rate, right-first-time percentage — rather than generic "quality-focused" or "detail-oriented" language, which gives a reviewer nothing concrete to calibrate against.',
 'ISO 13485:2016 — Medical devices, Quality management systems', 'https://www.iso.org/standard/59752.html'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'real_entity',
 'HPRA (Health Products Regulatory Authority) as the statutory regulator, and the two real sector trade bodies within Ibec: BioPharmaChem Ireland (90+ member companies, over €139bn in annual exports, 8 of the world''s top 10 biopharma companies with an Irish base) and Irish Medtech Association (250+ members, 9 of the world''s top 10 medtech companies with an Irish base, €13bn in exports).',
 'Ibec — BioPharmaChem Ireland, our industry', 'https://www.ibec.ie/connect-and-learn/industries/life-sciences-and-healthcare/biopharmachem-ireland/about-bpci/our-industry'),

('Pharmaceuticals, Biotechnology and Medical Devices', 'real_entity',
 'Real named employers and sites — Boston Scientific (Galway, Cork, Clonmel), Pfizer (Ringaskiddy Cork, Grange Castle Dublin, Newbridge Kildare), Stryker (over 4,100 of its 5,000+ Irish employees across six Cork sites, plus Limerick), and Johnson & Johnson (DePuy''s medical device site in Ringaskiddy, Janssen/J&J Innovative Medicine''s pharmaceutical site in Little Island) — plus CPL Life Sciences and Collins McNicholas, the specialist recruiters most active in this sector''s hiring specifically, not just general graduate recruitment.',
 'IDA Ireland — Stryker in Ireland', 'https://www.idaireland.com/success-stories/stryker');
