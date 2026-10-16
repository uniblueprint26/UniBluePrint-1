/**
 * External commercial agreements:
 *   02 Lifestyle Blueprint Business Partner Agreement
 *   03 Uni Coach Agreement
 *
 * Both .docx files were hand-rewritten directly (not regenerated through this
 * file) on 2026-10-15: real company incorporation details replaced the
 * placeholder registered-number/office, both documents were restructured
 * around a free-trial / "UniBlueprint Ecosystem" framing, and clause
 * numbering changed throughout. This file was resynced to match afterwards.
 *
 * KNOWN, DELIBERATELY UNRECONCILED DIFFERENCE — flagged rather than forced:
 * every table in the real 02/03 .docx files (every NOTE box and every data
 * table) carries extra, unused "phantom" <w:gridCol> entries in its
 * <w:tblGrid> — e.g. a 1-column NOTE box's grid lists widths [9746, 9360]
 * instead of just [9360], and an N-column data table's grid lists N extra
 * equal-width phantom columns ahead of the real N. This is a well-known
 * python-docx/Word artifact from editing a table's cell widths after the
 * table already has rows (resizing a column updates each cell's tcW but
 * leaves the original equal-split tblGrid entries in place) — it is exactly
 * what you'd expect from this doc having been hand-edited directly with
 * python-docx after being generated. It is purely cosmetic: Word renders the
 * tables from each cell's own explicit width, so the phantom columns are
 * invisible and have no effect on layout, column widths, or content. docx.js's
 * Table()/TableCell() API has no way to emit an extra unused gridCol entry
 * without hand-editing the generated .docx's raw XML after the fact, which
 * would be far more fragile than the artifact it reproduces — so this
 * generator's tables have a plain, correctly-sized <w:tblGrid> with no
 * phantom entries, and that one structural detail will always show up as a
 * (non-blocking) diff against the real files. Every other aspect of every
 * table below — row/column count, cell text, cell widths, header shading,
 * fonts — matches the real documents exactly.
 */

const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require('docx')
const { Title, H, S, P, L, TABLE, NOTE, FILL, build, NAVY, GREY } = require('./lib')

const CO = 'UniBlueprint Limited'
const EMAIL = 'uniblueprintoperations@gmail.com'
const TOTAL_W = 9360

// ═══════════════════════════════════════════════════════════════════════════
// Local rich-text helpers.
//
// Everything above lib.js's existing CL/H/S/L/P/TABLE/NOTE covers most of
// both documents unchanged. But a handful of paragraphs in the real .docx
// files carry inline bold defined terms (e.g. "(a)  Foundation Blueprint —
// AI-assisted career documents...") or multi-paragraph NOTE boxes with
// inline bold, which lib.js's single-run S()/L()/P()/NOTE() don't support.
// Rather than extend the shared lib.js (used by every other generator) for
// two documents' worth of one-off rich text, these small helpers live here
// and mirror lib.js's own spacing/indent/font conventions exactly.
// ═══════════════════════════════════════════════════════════════════════════

/** Marks a segment as bold inside RS()/RL()/RP()/RNOTE(). */
function BOLD(text) { return { bold: true, text } }

function segRun(part, extra) {
  const text = typeof part === 'string' ? part : part.text
  const bold = typeof part === 'object' && !!part.bold
  return new TextRun({ text, bold, size: 22, font: 'Calibri', ...extra })
}

/** Rich (mixed bold/plain) numbered sub-clause, e.g. RS('4.1', [...]).
 *  The "num\t" prefix is always its own plain run, independent of whether
 *  the first content segment happens to be bold. */
function RS(num, segs) {
  const runs = [new TextRun({ text: `${num}\t`, size: 22, font: 'Calibri' })]
  segs.forEach(part => runs.push(segRun(part)))
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: 720, hanging: 720 },
    children: runs,
  })
}

/** Rich (mixed bold/plain) lettered sub-item, e.g. RL('a', [...]).
 *  The "(letter)\t" prefix is always its own plain run, independent of
 *  whether the first content segment happens to be bold. */
function RL(letter, segs, level = 0) {
  const runs = [new TextRun({ text: `(${letter})\t`, size: 22, font: 'Calibri' })]
  segs.forEach(part => runs.push(segRun(part)))
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 1440 + level * 360, hanging: 360 },
    children: runs,
  })
}

/** Rich (mixed bold/plain) plain body paragraph, e.g. a recital. */
function RP(segs) {
  return new Paragraph({
    spacing: { after: 120 },
    children: segs.map(part => segRun(part)),
  })
}

/** Borderless intro line under the title (lib's Subtitle() adds a border
 *  the real documents don't have). */
function Intro(text) {
  return new Paragraph({
    spacing: { after: 300 },
    children: [new TextRun({ text, size: 22, color: GREY, font: 'Calibri' })],
  })
}

/** Small bold front-matter heading ("Parties" / "Dated: ...") — smaller and
 *  differently spaced than lib's H()/CL(), and not navy. */
function MiniHead(text, after) {
  return new Paragraph({
    spacing: { after },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Calibri' })],
  })
}

/** Empty spacer paragraph matching the real documents' blank line after a
 *  table/schedule (lib's GAP() leaves spacing unset; these set after:120). */
function BLANK() {
  return new Paragraph({ spacing: { after: 120 } })
}

/** Numbered top-level clause heading. Real documents use a single space
 *  after the number ("1. Definitions"); lib's CL() uses two ("1.  ..."). */
function CL(num, text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    keepNext: true,
    children: [new TextRun({ text: `${num}. ${text}`, bold: true, size: 24, color: NAVY, font: 'Calibri' })],
  })
}

/**
 * Multi-paragraph amber NOTE box with optional inline bold, for the few
 * notes that carry more than one body paragraph. `paragraphs` is an array
 * of segment-arrays (each segment a string or BOLD(text)). Styling matches
 * lib.js's NOTE() exactly; only the multi-paragraph / inline-bold body differs.
 */
function RNOTE(title, paragraphs) {
  const bodyParas = paragraphs.map((segs, idx) => new Paragraph({
    spacing: idx === paragraphs.length - 1 ? undefined : { after: 120 },
    children: segs.map(part => segRun(part, { color: '78350F' })),
  }))
  return new Table({
    columnWidths: [TOTAL_W],
    width: { size: TOTAL_W, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: TOTAL_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'FFF4E5', color: 'auto' },
        margins: { top: 140, bottom: 140, left: 180, right: 180 },
        borders: {
          left: { style: BorderStyle.SINGLE, size: 18, color: 'F59E0B' },
          top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL },
        },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: title, bold: true, size: 20, font: 'Calibri', color: '92400E' })],
          }),
          ...bodyParas,
        ],
      })],
    })],
  })
}

/** "Signed by the parties..." execution line (plain italic, no border,
 *  unlike lib's EXECUTION(), which adds a top rule and different spacing). */
function Exec(text) {
  return new Paragraph({
    spacing: { after: 280 },
    children: [new TextRun({ text, italics: true, size: 22, color: GREY, font: 'Calibri' })],
  })
}

function sigLine() {
  // Real docs use a fixed 60 non-breaking spaces for every blank line
  // (signature, name, position, and date alike), not a width-scaled count.
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: ' '.repeat(60), size: 22, font: 'Calibri', underline: { type: 'single' } })],
  })
}
function sigCaption(t) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: t, size: 18, color: GREY, font: 'Calibri' })],
  })
}
/** Signature block (party label spacing differs from lib's SIG(); the
 *  line/caption styling underneath is identical to it). */
function Sig(partyLabel, nameLabel, opts = {}) {
  const out = [new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: partyLabel, bold: true, size: 22, font: 'Calibri' })],
  })]
  out.push(sigLine(), sigCaption('Signature'))
  out.push(sigLine(), sigCaption(nameLabel || 'Print name'))
  if (opts.position) out.push(sigLine(), sigCaption('Position / title'))
  out.push(sigLine(), sigCaption('Date'))
  return out
}

// ═══════════════════════════════════════════════════════════════════════════
// 02 LIFESTYLE BLUEPRINT BUSINESS PARTNER AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const partner = () => build({
  file: '02-Lifestyle-Blueprint-Business-Partner-Agreement.docx',
  ref: 'UBP-PARTNER-v3.0',
  title: 'Lifestyle Blueprint Business Partner Agreement',
  children: [
    Title('Lifestyle Blueprint Business Partner Agreement'),
    Intro('Your free trial period with UniBlueprint — before any fuller, ongoing agreement'),

    MiniHead('Parties', 160),
    P('(1)\tUniBlueprint Limited, a company incorporated in Ireland (registered number 826545) whose registered office is at Ballyhaunis Road, Claremorris, Co. Mayo, F12 V0F9, Ireland (“UniBlueprint”, “we”, “us”).'),
    P('(2)\t[PARTNER LEGAL NAME], trading as [TRADING NAME], of [BUSINESS ADDRESS], [company/VAT number if applicable] (the “Partner”, “you”).'),
    MiniHead('Dated: [DATE]', 200),

    RNOTE('What this document is', [
      ['This is the agreement for your ', BOLD('free trial period'), ' on Lifestyle Blueprint. It is ', BOLD('not'), ' the final, long-term contract between us. It sets out, honestly and in both directions, what you can expect from UniBlueprint during the trial and what we ask of you in return — not just our terms imposed on you.'],
      ['If, by the end of the trial, you want to carry on listing with us, we will send you a fuller ', BOLD('Business Partner Agreement'), ' covering the ongoing, paid relationship, built on everything already in this document — nothing here is thrown away, only added to.'],
      ['Fill in every bracketed field and complete Schedule 1 (the Offer) before this is sent for signature. If anything in here is unclear, contact your Partnership Contact in Schedule 3 before you need to decide anything — we would rather explain it now than have you find out later.'],
    ]),

    H('The UniBlueprint Ecosystem'),
    P('Before narrowing into what this means for your business specifically, here is what UniBlueprint actually is, so you are joining with a real picture of the whole platform — not just the one section that concerns you.'),
    P('UniBlueprint is a platform for young people in Ireland, built around six parts that work together:'),
    RL('a', [BOLD('Foundation Blueprint'), ' — AI-assisted career documents (CV, cover letters, LinkedIn profiles, interview preparation, CAO personal statements, scholarship and grant applications, and more), where every output is reviewed and delivered by a real, trained Campus Handler before it reaches the member. It is not a chatbot handing over raw AI text unchecked.']),
    RL('b', [BOLD('Elevation Blueprint'), ' — a marketplace of verified Uni Coaches offering one-to-one coaching, mentoring and strategy sessions. This is a different part of the platform from the one you are joining, mentioned here only so you understand the whole ecosystem.']),
    RL('c', [BOLD('Campus Connect'), ' — fourteen community discussion boards where members in different courses, colleges and interest areas talk to each other.']),
    RL('d', [BOLD('Course Connect and Course Compass'), ' — tools that help members choose a course and navigate the CAO and college application process.']),
    RL('e', [BOLD('Lifestyle Blueprint'), ' — the deals and discounts section this Agreement is about. Partner businesses like yours list an Offer that members can browse, follow, and redeem. This is covered in full below.']),
    RL('f', [BOLD('The Pro subscription and member accounts'), ' — members can use UniBlueprint for free, or subscribe to Pro (currently €6.99/month, or €49.99/year) for extra benefits across the platform, including the ability to claim deals outside the Mental Health & Wellbeing category — see clause 6.3 below, because it affects who can redeem your Offer. Every member, business, coach and staff member interacts with the platform through a role-based account; yours is a Business Partner account.']),

    H('What This Means for You as a Lifestyle Blueprint Business Partner'),
    P('Your part of this is straightforward: you offer UniBlueprint members a genuine discount or benefit (your “Offer”), we list it, members discover it through the app, and they redeem it with you directly — in person, or however you normally do business. You do not need to understand Foundation Blueprint, Elevation Blueprint or Course Connect to follow the rest of this Agreement; they are listed above only so you can see the wider platform your Listing sits inside.'),

    H('Background'),
    P('A.  UniBlueprint operates a platform for young people in Ireland comprising a website and a mobile application, including a section known as Lifestyle Blueprint on which partner businesses list offers available to UniBlueprint members, described further above.'),
    RP(['B.  The Partner wishes to list an Offer on Lifestyle Blueprint. ', BOLD('This Agreement covers only the Free Trial Period'), ' described in clause 2. It is not the agreement that applies if the Partner continues beyond the trial — if the Partner wants to continue, UniBlueprint will issue a further, fuller Business Partner Agreement covering the ongoing paid relationship, including a confirmed Tier and Payment Option under clause 4.']),
    P('C.  The Partner remains the seller of everything supplied under a Listing, in person or however the Partner normally transacts with its own customers. UniBlueprint provides a listing, discovery and introduction service only. UniBlueprint does not process payment for what the Partner sells under the Listing — see clause 7 for how this works today, and how billing is expected to work once a fuller agreement is in place.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    RL('a', ['“', BOLD('Business Partner Agreement'), '” means the further, fuller agreement UniBlueprint will issue under clause 3.4 if the Partner continues beyond the Free Trial Period, covering the ongoing paid relationship.']),
    RL('b', ['“', BOLD('Commission'), '” means the percentage of the value of a redeemed Offer that UniBlueprint would retain under a Business Partner Agreement, at the rate for the Partner’s Tier and Payment Option. No Commission of any kind is payable during the Free Trial Period covered by this Agreement.']),
    RL('c', ['“', BOLD('Decision Point'), '” means the 30th day after the Listing Live Date, or such later date as UniBlueprint confirms in writing under clause 3.3.']),
    RL('d', ['“', BOLD('Founding Partner Badge'), '” means the recognition described in clause 4.6.']),
    RL('e', ['“', BOLD('Free Trial Period'), '” means the period beginning on the Listing Live Date and ending at the Decision Point (or later, if extended under clause 3), during which no Tier Fee, Commission, or other charge of any kind is payable by the Partner.']),
    RL('f', ['“', BOLD('Listing'), '” means the Partner’s entry on Lifestyle Blueprint, including its name, logo, category, description, and Offer.']),
    RL('g', ['“', BOLD('Listing Live Date'), '” means the date on which the Listing first becomes visible to members, as notified to the Partner in writing.']),
    RL('h', ['“', BOLD('Member'), '” means a registered user of the UniBlueprint platform.']),
    RL('i', ['“', BOLD('Offer'), '” means the discount, rate, or benefit the Partner makes available to Members, as set out in Schedule 1.']),
    RL('j', ['“', BOLD('Payment Option A'), '” means the fixed monthly Tier Fee plus reduced Commission structure that will apply under a Business Partner Agreement, as set out in clause 4.2.']),
    RL('k', ['“', BOLD('Payment Option B'), '” means the nil (or reduced) monthly Tier Fee with an individually negotiated Commission structure that will apply under a Business Partner Agreement, as set out in clause 4.2.']),
    RL('l', ['“', BOLD('Partnership Contact'), '” means the UniBlueprint team member assigned to the Partner and named in Schedule 3.']),
    RL('m', ['“', BOLD('Platform'), '” means the UniBlueprint website and mobile application.']),
    RL('n', ['“', BOLD('Public Launch Date'), '” means the date UniBlueprint publicly launches the Platform, as notified on the Platform.']),
    RL('o', ['“', BOLD('Tier'), '” means the classification (Access, Plus, or Signature) that will be assigned to the Partner under clause 4.1 if the Partner continues beyond the Free Trial Period.']),
    RL('p', ['“', BOLD('Tier Fee'), '” means the fixed monthly fee, if any, payable under the Partner’s Tier and Payment Option once a Business Partner Agreement is in place.']),

    CL('2', 'The Free Trial Period'),
    S('2.1', 'The Partner is admitted to Lifestyle Blueprint for a Free Trial Period. No Tier Fee, Commission, or other charge of any kind is payable by the Partner for anything happening during the Free Trial Period.'),
    S('2.2', 'During the Free Trial Period the Listing carries the same prominence and functionality as a paid Listing. UniBlueprint will not restrict or downgrade the Listing by reason only of it being on trial.'),
    S('2.3', 'Members discover and engage with the Listing in the same way regardless of trial status: by browsing Lifestyle Blueprint, by following the Partner under clause 6 to be notified of new Offers, and by redeeming the Offer using the Platform’s redemption code described in clause 6.'),
    S('2.4', 'UniBlueprint records, for the Partner’s own Listing and for its category generally, how many Members view the Listing, how many claim or redeem the Offer, and how many distinct Members engage with it, through the Platform’s partner performance tracking. The Partner can see its own figures, and how they compare to the category average and median, through its Partner Portal account. This real usage data — not how much the Partner spends — is what UniBlueprint uses to classify the Partner’s Tier under clause 4.'),
    S('2.5', 'The Partner may withdraw at any time during the Free Trial Period by written notice, with no charge and no further obligation.'),

    CL('3', 'What Happens at the Decision Point'),
    S('3.1', 'On or before the Decision Point the Partner must do one of the following:'),
    L('a', 'confirm in writing to UniBlueprint that it wishes to continue, selecting Payment Option A or Payment Option B under clause 4; if the Partner confirms continuation without specifying an Option, Payment Option A applies; or'),
    L('b', 'make contact with its Partnership Contact (by email, telephone, message, or meeting) to discuss continuing, varying, or ending the arrangement.'),
    S('3.2', 'Contact under clause 3.1(b) is sufficient to satisfy the Decision Point requirement. The Partner is not required to make a final commitment by the Decision Point, only to engage.'),
    S('3.3', 'UniBlueprint will send the Partner a written reminder no later than five (5) days before the Decision Point, to the email address in Schedule 3. Failure by UniBlueprint to send that reminder extends the Decision Point by five (5) days.'),
    S('3.4', 'If the Partner confirms it wishes to continue under clause 3.1(a), or confirms continuing after contact under clause 3.1(b), UniBlueprint will issue the Business Partner Agreement — the fuller, ongoing contract — confirming the Partner’s Tier and Payment Option under clause 4, before any Tier Fee or Commission becomes payable. Nothing in this Agreement itself commits the Partner to a Tier, a Payment Option, or a paid term; that is fixed only by signing the Business Partner Agreement.'),
    S('3.5', 'If the Partner does neither of the things in clause 3.1 by the Decision Point, then the Listing will be paused. A paused Listing is hidden from Members. No Tier Fee or Commission is payable and no debt arises. Silence does not create a payment obligation.'),
    S('3.6', 'A Listing paused under clause 3.5 may be reactivated at any time within six (6) months by written agreement, without repeating the Free Trial Period.'),

    NOTE('Why silence pauses rather than bills',
      'Auto-converting a non-responding partner onto a paid Tier creates a debt you would have to chase, and is the kind of term the CCPC scrutinises. Pausing costs you nothing and keeps the relationship open. If you want auto-conversion instead, that must be flagged prominently before signature and is a commercial decision to take with advice.'),

    CL('4', 'Tier, Payment Option and the Fuller Agreement'),
    RS('4.1', ['If the Partner continues beyond the Free Trial Period, UniBlueprint classifies the Partner into one of three Tiers — Access, Plus, or Signature — based on the joint judgment of UniBlueprint and the Partner as to the size of the Partner’s business (', BOLD('Size'), '), what the Listing actually covers (', BOLD('Service'), '), and the Partner’s own pricing recorded in Schedule 1 (', BOLD('Pricing'), '). Tier classification is a categorisation only and does not itself create a fee; fees arise only from the Tier Fee and Commission under a Business Partner Agreement.']),
    TABLE(
      ['Tier', 'Payment Option A', 'Payment Option B'],
      [
        ['Access', '€15/month + 10% Commission', '€0/month + individually negotiated Commission (uncapped, confidential — clause 12)'],
        ['Plus', '€45/month + 8% Commission', '€0/month + individually negotiated Commission (uncapped, confidential — clause 12)'],
        ['Signature', 'To be confirmed — no Signature-scale partner has joined yet to calibrate this against', '€0/month + individually negotiated Commission (uncapped, confidential — clause 12)'],
      ],
      [1820, 3380, 4160]
    ),
    BLANK(),
    S('4.2', 'Commission, once a Business Partner Agreement is in place, is calculated on the value of the redeemed Offer, excluding VAT. As of the date of this Agreement, UniBlueprint does not operate an in-app checkout for Lifestyle Blueprint purchases — Members pay Partners directly, in person or however the Partner normally transacts (see clause 7). Until UniBlueprint’s billing and invoicing mechanism for Partner Commission is fully built, Commission will be invoiced to, or settled directly with, the Partner by UniBlueprint’s Finance team on the cadence set out in the Business Partner Agreement, rather than deducted automatically at the point of sale. UniBlueprint already tracks what it owes and has paid to partners through its internal payout records, visible to its Operations and Finance teams, and will tell the Partner plainly if and when a faster, automatic mechanism replaces this.'),
    S('4.3', `UniBlueprint may reassess the Partner’s Tier from time to time to reflect changes in the size of the Partner’s business, the scope of its Listing, or its pricing. UniBlueprint will give the Partner thirty (30) days’ written notice before a change of Tier takes effect.`),
    S('4.4', `Where the Partner selects Payment Option B, the negotiated Commission rate is recorded, dated, and kept in UniBlueprint’s append-only negotiation log together with a documented reason for the rate — visible only to UniBlueprint’s Finance and Founder roles — so that every Option B rate stays defensible and consistent rather than a private arrangement. It is confidential under clause 12. ${FILL('GOVERNANCE PROCESS — TO BE CONFIRMED')} governs who at UniBlueprint has authority to agree a Payment Option B rate.`),
    S('4.5', `A Partner that signs a Business Partner Agreement before the Public Launch Date is awarded the Founding Partner Badge. The Badge is a timing-based recognition and is independent of the Partner’s Tier or Payment Option. The Badge is retained for as long as the Partner maintains a live Listing on the Platform. If the Listing lapses or is removed and the Partner later rejoins the Platform, the Badge is retained if the Partner rejoins within six (6) months of leaving, and is not retained if the Partner rejoins after that six (6) month period.`),
    S('4.6', 'Once a Tier, Payment Option, and (if applicable) negotiated Commission rate are assigned under a Business Partner Agreement, the Partner can see its own current figures at any time through its Partner Portal account. During the Free Trial Period itself, these are typically not yet assigned.'),

    CL('5', 'The Offer'),
    S('5.1', 'The Partner will honour the Offer in Schedule 1 for every Member who presents valid proof of UniBlueprint membership, for as long as the Listing is live.'),
    S('5.2', 'The Partner may vary or withdraw the Offer on fourteen (14) days’ written notice. UniBlueprint will update the Listing. The Partner must honour the previous Offer for any Member who relied on it before the change took effect.'),
    S('5.3', 'The Partner warrants that the Offer is genuine, that any “was” or reference price stated is a price at which the product or service was actually available, and that the Offer complies with the Consumer Protection Act 2007 and the European Union (Consumer Protection (Price Indication)) Regulations.'),
    S('5.4', 'The Partner must not make the Offer conditional on anything not disclosed in Schedule 1.'),
    S('5.5', 'The Partner’s own pricing recorded in Schedule 1 forms part of the basis on which UniBlueprint classifies the Partner’s Tier under clause 4.1.'),

    CL('6', 'How Members Find and Redeem Your Offer'),
    S('6.1', 'Members can “follow” the Partner’s Listing to be notified when the Partner adds a new Offer. This is the Member’s own choice; UniBlueprint does not share who follows the Partner with the Partner.'),
    S('6.2', 'To redeem the Offer, a Member generates a short, time-limited redemption code in the app — shown alongside the Member’s own name and photo — and shows it on their phone to the Partner’s staff at the point of sale. The code is numeric, regenerates on request, and currently expires after around ninety seconds, so a screenshot shared with someone else is of no use to them. The Partner is not required to, and currently cannot, verify the code against any UniBlueprint system — it is a visible, time-limited proof the Partner’s own staff check by eye, in the same way the Partner would check any other proof of membership or identity.'),
    S('6.3', 'Depending on the Offer’s category, some Members may need to be UniBlueprint Pro subscribers to redeem the Offer; Mental Health & Wellbeing category Offers are always free to redeem for every Member, with no subscription required, as a matter of UniBlueprint policy. This does not change what the Partner receives for the Offer — it only affects which Members can redeem it.'),
    S('6.4', 'This redemption mechanism is separate from, and does not affect, any advertising listing fees charged elsewhere on the Platform (for example on the Advertisement Board), which are a different product and not a term of this Agreement.'),

    CL('7', 'Relationship with Members, Payment and Commission'),
    S('7.1', 'The Partner remains the seller of everything supplied under the Listing. Every transaction between the Partner and a Member is a contract between those two parties alone. UniBlueprint is not a party to that underlying supply of goods or services and is not the seller or the supplier of them.'),
    S('7.2', 'The Partner is solely responsible for the goods or services it supplies, and for all obligations owed to Members as a trader under the Consumer Rights Act 2022, the Sale of Goods and Supply of Services Act 1980, and all other applicable consumer legislation.'),
    S('7.3', 'The Partner is solely responsible for handling its own refunds, returns, complaints, and disputes with Members.'),
    S('7.4', 'The Partner will indemnify UniBlueprint against any claim, loss, or cost arising from the goods or services it supplies to a Member, from any breach of clause 5 or clause 7, or from any statement made by the Partner about its own business.'),
    S('7.5', 'Clause 4.2 explains how Commission is calculated and collected once a Business Partner Agreement is in place. Nothing in this Agreement requires the Partner to hold or connect any UniBlueprint payment account. As of the date of this Agreement, UniBlueprint does not operate a Stripe Connect or equivalent payment-splitting account for Lifestyle Blueprint partners, and Members pay Partners directly for whatever they redeem.'),

    CL('8', 'Listing content and brand licence'),
    S('8.1', 'The Partner grants UniBlueprint a non-exclusive, royalty-free licence to use its name, trading name, logo, and Offer details for the purpose of operating and promoting the Listing on the Platform and in UniBlueprint marketing.'),
    S('8.2', 'That licence ends when the Listing ends, except that UniBlueprint may retain the Partner’s name and logo in archived marketing material already published.'),
    S('8.3', 'The Partner warrants it owns or is licensed to use everything it supplies for the Listing, and that its use by UniBlueprint will not infringe any third party right.'),
    S('8.4', 'The Partner may state that it is a UniBlueprint partner and use the UniBlueprint name and logo for that purpose, in accordance with any brand guidance UniBlueprint provides. The Partner must not suggest that UniBlueprint endorses, guarantees, or is responsible for its goods or services.'),
    S('8.5', 'Listing content that is inaccurate, misleading, unlawful, or inappropriate for an audience that includes young people may be amended or removed by UniBlueprint, acting reasonably, on notice to the Partner.'),

    CL('9', 'Partner obligations'),
    S('9.1', 'The Partner will:'),
    L('a', 'keep its Listing information accurate and tell UniBlueprint promptly if anything changes;'),
    L('b', 'hold and maintain all licences, registrations, insurances, and qualifications required by law for its business;'),
    L('c', 'comply with all applicable law, including consumer, advertising, health and safety, equality, and data protection law;'),
    L('d', 'treat all Members courteously and without discrimination on any ground protected by the Employment Equality Acts 1998 to 2015 or the Equal Status Acts 2000 to 2018;'),
    L('e', 'respond to Members who contact it through the Listing within a reasonable time; and'),
    L('f', 'notify UniBlueprint promptly of any complaint by a Member that alleges harm, injury, or misconduct.'),
    S('9.2', 'If the Partner or its personnel become aware, in the course of providing the Offer, that an individual they are dealing with is under the age of 18, the Partner must immediately stop dealing with that individual under the Listing and notify UniBlueprint without delay. UniBlueprint’s membership is intended for members aged 18 and over, though some UniBlueprint services are used by younger students — see the age and vetting note in Document 03, the Uni Coach Agreement, which is the more relevant place for it given the nature of Elevation Blueprint coaching; this clause exists for the same reason, as a safeguard for Lifestyle Blueprint redemptions too.'),
    S('9.3', 'The Partner must hold public liability insurance of not less than €1,000,000 and, where it provides services involving physical activity, treatment, or advice, professional indemnity insurance of not less than €250,000, each with a reputable insurer. Evidence must be provided on request.'),
    S('9.4', 'The Partner will comply with the UniBlueprint Safeguarding and Code of Conduct Policy, which forms part of this Agreement, where the Partner or its personnel have direct contact with Members in the course of providing the Offer.'),

    CL('10', 'Off-platform circumvention'),
    S('10.1', 'For twelve (12) months after termination, the Partner will not solicit or deal with a Member first introduced to the Partner through the Platform outside the Platform, where the purpose or effect is to avoid Commission that would otherwise be payable under a Business Partner Agreement.'),
    S('10.2', 'Clause 10.1 does not apply to a Member the Partner independently approached, or already knew or had a business relationship with, before that Member was introduced to the Partner through the Platform.'),

    CL('11', 'Data protection'),
    S('11.1', 'Each party is an independent controller in respect of personal data it holds about Members. Neither party processes personal data on the other’s behalf under this Agreement.'),
    S('11.2', 'UniBlueprint does not transfer Member personal data to the Partner. If a Member chooses to contact the Partner or redeem an Offer, any personal data the Member provides is provided by the Member directly and the Partner is the controller of it.'),
    S('11.3', 'The Partner will comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 in respect of all Member personal data it holds, will provide its own privacy notice, and will not use Member data for marketing without a lawful basis. Document 13 (Data Processing Terms), where UniBlueprint has provided the Partner with a copy of it, sets out further terms that apply where relevant.'),
    S('11.4', 'Each party will notify the other without undue delay of any personal data breach that affects the other party or Members introduced under this Agreement.'),

    CL('12', 'Confidentiality'),
    S('12.1', 'Neither party will disclose the other’s confidential information, including commercial terms, fee levels, Member numbers, and business plans, without consent, except where disclosure is required by law or to professional advisers under a duty of confidence.'),
    S('12.2', 'Without limiting clause 12.1, any Commission rate negotiated under Payment Option B is confidential and must not be disclosed by either party to any other partner, coach, or third party.'),
    S('12.3', 'This obligation continues for three (3) years after termination.'),

    CL('13', 'Records and audit'),
    S('13.1', 'The Partner will keep accurate records of all transactions with Members made under the Listing for six (6) years.'),
    S('13.2', 'UniBlueprint may, on reasonable notice, audit or request evidence of those records to the extent necessary to verify Commission calculated and paid under a Business Partner Agreement.'),

    CL('14', 'Set-off'),
    S('14.1', 'Once a Business Partner Agreement is in place, UniBlueprint may set off any amount owed to it by the Partner under that agreement against any amount due to the Partner.'),

    CL('15', 'Warranties'),
    S('15.1', 'Each party warrants that it has full power and authority to enter into and perform this Agreement.'),

    CL('16', 'Anti-bribery and corruption'),
    S('16.1', 'Each party will comply with the Criminal Justice (Corruption Offences) Act 2018 and will not offer, give, solicit, or accept any bribe or other corrupt advantage in connection with this Agreement.'),

    CL('17', 'Publicity'),
    S('17.1', 'Neither party will issue a press release or public announcement about the other or this Agreement, beyond the ordinary operation of the Listing, without the other’s prior consent.'),

    CL('18', 'Liability'),
    S('18.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything that cannot lawfully be limited.'),
    S('18.2', 'Subject to clause 18.1, UniBlueprint’s total liability to the Partner under or in connection with this Agreement is limited to the greater of (a) the total Tier Fees and Commission paid by the Partner in the twelve (12) months before the claim arose, and (b) €500. During the Free Trial Period, that first figure will ordinarily be nil, so the €500 floor applies.'),
    S('18.3', 'UniBlueprint does not guarantee any level of Listing views, enquiries, redemptions, sales, or revenue. Nothing said or written before this Agreement about likely results forms part of it.'),
    S('18.4', 'Neither party is liable to the other for loss of profit, loss of business, or indirect or consequential loss.'),
    S('18.5', 'The limit in clause 18.2 does not apply to the Partner’s indemnity in clause 7.4.'),

    CL('19', 'Force majeure'),
    S('19.1', 'Neither party is liable for a failure or delay in performing its obligations (other than a payment obligation already due) caused by an event beyond its reasonable control, and that party’s obligations are suspended for as long as the event continues.'),
    S('19.2', 'If a force majeure event continues for sixty (60) consecutive days, either party may terminate this Agreement by written notice.'),

    CL('20', 'Suspension and termination'),
    S('20.1', 'UniBlueprint may suspend or remove the Listing immediately if it reasonably believes the Partner has breached clause 5, 7, 9, or 10, or that the Listing presents a risk to Members. UniBlueprint will notify the Partner and give it a reasonable opportunity to remedy where the breach is capable of remedy.'),
    S('20.2', 'Either party may terminate this Agreement immediately on written notice if the other commits a material breach that is not remedied within fourteen (14) days of notice, or becomes insolvent, enters examinership, has a receiver appointed, or ceases to trade.'),
    S('20.3', 'On termination during the Free Trial Period, the Listing is removed, no Tier Fee or Commission is payable, and no debt arises — consistent with clause 3.5. Clauses 7.1 to 7.4, 8.2, 10, 11, 12, 13, 18, and 21 survive.'),

    CL('21', 'General'),
    S('21.1', 'Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship between the parties. Neither party may bind the other.'),
    S('21.2', 'This Agreement, with its Schedules and, where clause 9.4 applies, the Safeguarding and Code of Conduct Policy, is the entire agreement between the parties for the Free Trial Period and supersedes anything said or written before it. It does not constitute, and should not be read as, the Business Partner Agreement referred to throughout.'),
    S('21.3', 'Each party will comply with all applicable law in performing this Agreement.'),
    S('21.4', 'Any variation must be in writing and signed by both parties, except that a change to Schedule 1 made under clause 5.2 may be made by written notice.'),
    S('21.5', 'The Partner may not assign this Agreement without UniBlueprint’s written consent. UniBlueprint may assign it to a company to which it transfers its business.'),
    S('21.6', 'If any provision is held unenforceable, it is severed and the remainder continues in force.'),
    S('21.7', 'No failure or delay in enforcing a right is a waiver of it.'),
    S('21.8', 'Notices must be in writing and sent to the email addresses in Schedule 3. Notice is deemed given on the next business day after sending.'),
    S('21.9', 'A person who is not a party to this Agreement has no right to enforce it.'),
    S('21.10', 'This Agreement is governed by the laws of Ireland. The parties submit to the exclusive jurisdiction of the courts of Ireland.'),
    S('21.11', 'This Agreement may be signed in counterparts, including by electronic signature, each of which is an original and all of which together form one agreement.'),

    H('Schedule 1: The Offer'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Partner name as listed', '[AS SHOWN ON PLATFORM]'],
        ['Category', '[e.g. Health & Fitness / Beauty / Food & Drink / Services]'],
        ['Offer to Members', '[e.g. 15% off all treatments]'],
        ['Conditions', '[e.g. valid student ID, off-peak only, not with other offers]'],
        ['Proof of membership accepted', '[e.g. in-app redemption code, as described in clause 6.2]'],
        ['Locations covered', '[ADDRESS(ES) OR “online”]'],
        ['Offer start date', '[DATE]'],
        ['Offer review date', '[DATE]'],
      ],
      [3600, 5760]
    ),
    BLANK(),

    H('Schedule 2: Indicative Tier Assessment (informational only — not binding until confirmed in a Business Partner Agreement)'),
    P('Nothing in this Schedule creates a Tier Fee, Commission, or other payment obligation. It records UniBlueprint’s provisional, non-binding read of the Partner’s likely Tier during the Free Trial Period, for transparency.'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Partner name', '[AS SHOWN ON PLATFORM]'],
        ['Category', '[CATEGORY]'],
        ['Provisional Tier read (non-binding)', '[Access / Plus / Signature / Not yet assessed]'],
        ['Basis for provisional read', '[Size / Service / Pricing notes]'],
        ['Founding Partner Badge eligibility', '[YES, if live before Public Launch Date / NO]'],
        ['Listing Live Date', '[DATE]'],
        ['Decision Point', '[DATE — 30 days after Listing Live Date]'],
      ],
      [3600, 5760]
    ),
    BLANK(),

    H('Schedule 3: Contacts'),
    TABLE(
      ['Role', 'Name', 'Email / phone'],
      [
        ['Partnership Contact (UniBlueprint)', '[NAME]', '[EMAIL]'],
        ['UniBlueprint operations', 'Operations', EMAIL],
        ['Partner primary contact', '[NAME]', '[EMAIL / PHONE]'],
        ['Partner billing contact', '[NAME]', '[EMAIL]'],
      ],
      [3000, 2800, 3560]
    ),
    BLANK(),

    Exec('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature, each of which is an original.'),
    Sig(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    Sig('For and on behalf of the Partner', 'Print name', { position: true }),
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// 03 UNI COACH AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const coach = () => build({
  file: '03-Uni-Coach-Agreement.docx',
  ref: 'UBP-COACH-v3.0',
  title: 'UniBlueprint Uni Coach Agreement',
  children: [
    Title('Uni Coach Agreement'),
    Intro('Elevation Blueprint: your free trial period as a Uni Coach — before any fuller, ongoing agreement'),

    MiniHead('Parties', 160),
    P('(1)\tUniBlueprint Limited, a company incorporated in Ireland (registered number 826545) whose registered office is at Ballyhaunis Road, Claremorris, Co. Mayo, F12 V0F9, Ireland (“UniBlueprint”, “we”, “us”).'),
    P('(2)\t[COACH FULL NAME] of [ADDRESS], [PPS number / business or VAT number] (the “Coach”, “you”).'),
    MiniHead('Dated: [DATE]', 200),

    RNOTE('What this document is', [
      ['This is the agreement for your ', BOLD('free trial period'), ' as a Uni Coach on Elevation Blueprint. It is ', BOLD('not'), ' the final, long-term contract between us. It sets out, honestly and in both directions, what you can expect from UniBlueprint during the trial and what we ask of you — not just our terms imposed on you.'],
      ['If, by the end of the trial, you want to carry on coaching through UniBlueprint, we will send you a fuller ', BOLD('Coach Agreement'), ' covering the ongoing relationship, including a confirmed Tier and Payment Option, built on everything already in this document — nothing here is thrown away, only added to.'],
      ['Read this all the way through before you reply, including Schedule 1. If anything is unclear, contact us at the address in Schedule 4 and we will explain it before you need to decide anything.'],
    ]),

    H('The UniBlueprint Ecosystem'),
    P('Before narrowing into what this means for you specifically, here is what UniBlueprint actually is, so you are joining with a real picture of the whole platform — not just the one part you will work in.'),
    P('UniBlueprint is a platform for young people in Ireland, built around six parts that work together:'),
    RL('a', [BOLD('Foundation Blueprint'), ' — AI-assisted career documents (CV, cover letters, LinkedIn profiles, interview preparation, CAO personal statements, scholarship and grant applications, and more), reviewed and delivered by a trained Campus Handler before reaching the member.']),
    RL('b', [BOLD('Elevation Blueprint'), ' — the coaching marketplace this Agreement is about: verified Uni Coaches offering one-to-one coaching, mentoring and strategy sessions to members. Described in full below.']),
    RL('c', [BOLD('Campus Connect'), ' — fourteen community discussion boards where members in different courses, colleges and interest areas talk to each other.']),
    RL('d', [BOLD('Course Connect and Course Compass'), ' — tools that help members choose a course and navigate the CAO and college application process, including CAO personal statement support used by many members who are still in secondary school. This matters to you — see the note on age and vetting immediately below.']),
    RL('e', [BOLD('Lifestyle Blueprint'), ' — a marketplace of local business deals and discounts for members, separate from Elevation Blueprint, mentioned here only for context.']),
    RL('f', [BOLD('The Pro subscription and member accounts'), ' — members can use UniBlueprint for free, or subscribe to Pro (currently €6.99/month, or €49.99/year). Booking an Elevation Blueprint coach is currently a Pro feature, so most Members who can book you are already paying UniBlueprint subscribers, not cold browsers. Every member, business, coach and staff member interacts with the platform through a role-based account; yours is a Coach account with its own Coach Portal, referred to in this Agreement.']),

    H('What This Means for You as a Uni Coach'),
    P('Your part of this is straightforward: you offer coaching, mentoring or strategy sessions of your own design, at your own prices, through your Elevation Blueprint profile; Members book and (where there is a price) pay through the Platform; you deliver the session. You do not need to understand Foundation Blueprint, Lifestyle Blueprint or Course Connect in detail to follow the rest of this Agreement; they are listed above only so you can see the wider platform your coaching sits inside.'),

    RNOTE('An open question we want you to know about: age and vetting', [
      ['UniBlueprint’s Terms of Service currently require every member to be 18 or over. In practice, some UniBlueprint services — including Course Connect, Course Compass, and CAO personal statement support — are used by Leaving Cert-aged students who are realistically under 18, and the platform has a real “Leaving Cert student” account type. UniBlueprint has not yet completed Garda (National Vetting Bureau) vetting for coaches, and has not yet fully resolved the tension between its stated 18-plus policy and who may actually be using parts of the platform.'],
      ['We are telling you this plainly, not hiding it, because it is genuinely still open. Until it is resolved: if you become aware, or reasonably suspect, that someone you are coaching or a prospective client is under 18, you must stop providing Services to them immediately and tell us straight away — see clause 3.3. Please do not treat “members must be 18+” as a guarantee about who you might actually encounter through the Platform.'],
    ]),

    H('Background'),
    P('A.  UniBlueprint operates a platform on which verified coaches offer one-to-one coaching, mentoring, and strategy services to members under the Elevation Blueprint service, described further above.'),
    RP(['B.  The Coach is an independent professional who wishes to offer Services through the Platform. The Coach is not an employee of UniBlueprint. ', BOLD('This Agreement covers only the Coach’s Free Trial Period'), ' described in clause 6. It is not the agreement that applies if the Coach continues beyond the trial — if the Coach wants to continue, UniBlueprint will issue a further, fuller Coach Agreement covering the ongoing relationship, including a confirmed Tier and Payment Option.']),
    P('C.  This Agreement sets out the terms on which the Coach is listed during the trial, including how payment for any priced Booking is currently collected — see clause 7.4, which explains this honestly because it is a genuinely new part of how the Platform works.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    RL('a', ['“', BOLD('Booking'), '” means a Member’s paid or free engagement of the Coach through the Platform.']),
    RL('b', ['“', BOLD('Booking Value'), '” means the amount paid by the Member for a chargeable Booking, excluding VAT.']),
    RL('c', ['“', BOLD('Coach Agreement'), '” means the further, fuller agreement UniBlueprint will issue under clause 6.4 if the Coach continues beyond the Free Trial Period, covering the ongoing relationship.']),
    RL('d', ['“', BOLD('Coach Share'), '” means the Coach’s share of the Booking Value that will apply under a Coach Agreement, determined by the Coach’s Tier and Payment Option and calculated under clause 7.']),
    RL('e', ['“', BOLD('Decision Point'), '” means the 30th day after the Coach’s profile first becomes visible to Members, or such later date as UniBlueprint confirms in writing under clause 6.3.']),
    RL('f', ['“', BOLD('Founding Coach Badge'), '” means the recognition described in clause 7.8.']),
    RL('g', ['“', BOLD('Free Trial Period'), '” means the period beginning when the Coach’s profile first becomes visible to Members and ending at the Decision Point (or later, if extended under clause 6), during which no Tier Fee or Platform Fee of any kind is payable by the Coach to UniBlueprint.']),
    RL('h', ['“', BOLD('Member'), '” means a registered user of the Platform.']),
    RL('i', ['“', BOLD('Payment Option A'), '” means the fixed monthly fee plus reduced Platform Fee structure that will apply under a Coach Agreement, as set out in clause 7.1.']),
    RL('j', ['“', BOLD('Payment Option B'), '” means the nil monthly fee with the default or individually renegotiated Coach Share that will apply under a Coach Agreement, as set out in clause 7.1.']),
    RL('k', ['“', BOLD('Platform'), '” means the UniBlueprint website and mobile application.']),
    RL('l', ['“', BOLD('Platform Fee'), '” means UniBlueprint’s share of the Booking Value that will apply under a Coach Agreement, determined by the Coach’s Tier and Payment Option and calculated under clause 7.']),
    RL('m', ['“', BOLD('Public Launch Date'), '” means the date UniBlueprint publicly launches the Platform, as notified on the Platform.']),
    RL('n', ['“', BOLD('Services'), '” means the coaching services described in Schedule 1.']),
    RL('o', ['“', BOLD('Tier'), '” means the classification (Access, Plus, or Signature) that will be assigned to the Coach under clause 7.1 if the Coach continues beyond the Free Trial Period.']),

    CL('2', 'Status: independent contractor'),
    S('2.1', 'The Coach provides the Services as an independent contractor carrying on a business on their own account. This Agreement does not create a contract of employment, an apprenticeship, a partnership, or an agency.'),
    S('2.2', 'The Coach:'),
    L('a', 'decides how, when, and where to deliver the Services, subject only to what is agreed with the Member;'),
    L('b', 'sets their own prices under clause 5, including, if they choose, their own self-service Intro Call offer under clause 5.5;'),
    L('c', 'may accept or decline any Booking, and may work for anyone else, including competitors;'),
    L('d', 'provides their own equipment, premises, and materials; and'),
    L('e', 'may, with UniBlueprint’s prior written consent, send a suitably qualified and vetted substitute.'),
    S('2.3', 'The Coach is responsible for their own income tax, USC, PRSI, and VAT, and for registering with the Revenue Commissioners as required. The Coach will indemnify UniBlueprint against any tax, social insurance contribution, interest, or penalty assessed on UniBlueprint because of the Coach’s status or payments under this Agreement, other than any amount arising from UniBlueprint’s own failure to operate a deduction it was legally obliged to operate.'),
    S('2.4', 'The Coach is not entitled to holiday pay, sick pay, pension contributions, notice, redundancy, or any other employment benefit from UniBlueprint.'),

    NOTE('Status is decided on substance, not labels',
      'Since Revenue Commissioners v Karshan (Midlands) Ltd [2023] IESC 24, Irish law applies a five-question test to employment status and a contractual label carries little weight if the reality differs. Keep the reality consistent with clause 2: do not set coaches’ prices, do not roster them, do not require exclusivity. The Coach’s own self-service pricing tools — including the Intro Call offer in clause 5.5, which only the Coach can turn on and price — are a real, current example of this, not just a clause on paper.'),

    CL('3', 'Verification, qualifications, and vetting'),
    S('3.1', 'The Coach warrants that all information provided in their application and profile is true, and that they hold the qualifications, certifications, and registrations listed in Schedule 1.'),
    S('3.2', 'The Coach will provide evidence of those qualifications on request and will notify UniBlueprint immediately if any lapses, is suspended, or is withdrawn.'),
    S('3.3', 'If the Coach becomes aware, in the course of providing the Services, that a Member or prospective Member is under the age of 18, the Coach must immediately stop providing Services to that individual and notify UniBlueprint without delay. See the note on age and vetting above — this is an open issue UniBlueprint is actively working through, not a settled policy, and the Coach’s prompt action and notification under this clause matters while it remains open.'),
    S('3.4', 'The Coach will comply with the UniBlueprint Safeguarding and Code of Conduct Policy, which forms part of this Agreement.'),
    S('3.5', 'The Coach must disclose immediately any charge or conviction for a criminal offence, any professional disciplinary finding, and any civil claim relating to their coaching practice.'),

    CL('4', 'Insurance'),
    S('4.1', 'The Coach must hold and maintain, at their own cost, for the term of this Agreement and for six (6) years afterwards:'),
    L('a', 'professional indemnity insurance of not less than €250,000; and'),
    L('b', 'where the Coach delivers any in-person session, or any session involving physical exercise, training, treatment, or nutrition advice, public liability insurance of not less than €1,000,000.'),
    S('4.2', 'The Coach will provide a copy of the certificate of insurance before their first Booking and on each renewal. UniBlueprint may suspend the Coach’s listing while evidence of valid insurance is outstanding.'),
    S('4.3', 'Insurance does not limit the Coach’s liability under clause 11.'),

    CL('5', 'Prices and listing'),
    S('5.1', 'The Coach sets their own prices for the Services, independently of their Tier, Payment Option, and the Coach Share and Platform Fee under clause 7. Those prices are recorded in Schedule 1 and displayed on the Coach’s Platform profile.'),
    S('5.2', 'The Coach may change their prices on fourteen (14) days’ written notice. A price change does not affect a Booking already made.'),
    S('5.3', 'The Coach is responsible for the accuracy of their profile, including biography, services, pricing, availability, and any claim about qualifications or results. The Coach must not make any claim that is misleading or that cannot be substantiated.'),
    S('5.4', 'UniBlueprint may edit or remove profile content that is inaccurate, misleading, unlawful, or inappropriate for an audience that includes young people, on notice to the Coach.'),
    S('5.5', 'The Coach may, through their own Coach Portal account, opt in to offering a short introductory or taster session (an “Intro Call”) at a price — including free — and duration the Coach sets entirely themselves. This is switched off by default and is never set or priced by UniBlueprint. Turning it on, and any price or duration the Coach chooses, is logged and visible to UniBlueprint’s Operations and Founder teams, consistent with clause 5.3, but the decision itself is the Coach’s alone.'),

    CL('6', 'What Happens at the Decision Point'),
    S('6.1', 'On or before the Decision Point the Coach must do one of the following:'),
    L('a', 'confirm in writing to UniBlueprint that they wish to continue, selecting Payment Option A or Payment Option B under clause 7; if the Coach confirms continuation without specifying an Option, Payment Option B applies, as set out in clause 7.3; or'),
    L('b', 'make contact with UniBlueprint (by email, telephone, message, or meeting), using the contact details in Schedule 4, to discuss continuing, varying, or ending the arrangement.'),
    S('6.2', 'Contact under clause 6.1(b) is sufficient to satisfy the Decision Point requirement. The Coach is not required to make a final commitment by the Decision Point, only to engage.'),
    S('6.3', 'UniBlueprint will send the Coach a written reminder no later than five (5) days before the Decision Point, to the Coach’s email address in Schedule 4. Failure by UniBlueprint to send that reminder extends the Decision Point by five (5) days.'),
    S('6.4', 'If the Coach confirms they wish to continue under clause 6.1(a), or confirms continuing after contact under clause 6.1(b), UniBlueprint will issue the Coach Agreement — the fuller, ongoing contract — confirming the Coach’s Tier and Payment Option under clause 7, before any Tier Fee or Platform Fee becomes payable. Nothing in this Agreement itself commits the Coach to a Tier, a Payment Option, or a paid term; that is fixed only by signing the Coach Agreement.'),
    S('6.5', 'If the Coach does neither of the things in clause 6.1 by the Decision Point, then the Coach’s profile will be paused. A paused profile is hidden from Members. No Tier Fee or Platform Fee is payable and no debt arises. Silence does not create a payment obligation.'),
    S('6.6', 'A profile paused under clause 6.5 may be reactivated at any time within six (6) months by written agreement, without repeating the Free Trial Period.'),

    NOTE('Why silence pauses rather than bills',
      'Auto-converting a non-responding coach onto a paid Tier creates a debt you would have to chase, and is the kind of term the CCPC scrutinises. Pausing costs you nothing and keeps the relationship open. If you want auto-conversion instead, that must be flagged prominently before signature and is a commercial decision to take with advice.'),

    CL('7', 'Tier, Payment Option and the Fuller Agreement'),
    S('7.1', 'If the Coach continues beyond the Free Trial Period, UniBlueprint classifies the Coach into one of three Tiers — Access, Plus, or Signature — based on the Coach’s own session pricing, the scope of Services they offer, and demonstrated demand for the Coach on the Platform. The Coach Share and Platform Fee that will apply for each Tier and Payment Option are:'),
    TABLE(
      ['Tier', 'Payment Option A', 'Payment Option B'],
      [
        ['Access', '€15/month + 10% Platform Fee (90% Coach Share)', '85% Coach Share / 15% Platform Fee as UniBlueprint’s starting reference point — individually negotiated, uncapped, confidential — clause 14.3'],
        ['Plus', '€45/month + 8% Platform Fee (92% Coach Share)', '85% Coach Share / 15% Platform Fee as UniBlueprint’s starting reference point — individually negotiated, uncapped, confidential — clause 14.3'],
        ['Signature', 'To be confirmed — no Signature-scale coach has joined yet to calibrate this against', '85% Coach Share / 15% Platform Fee as UniBlueprint’s starting reference point — individually negotiated, uncapped, confidential — clause 14.3'],
      ],
      [1820, 3380, 4160]
    ),
    BLANK(),
    S('7.2', 'The figures above are consistent with UniBlueprint’s public statement that Coaches “keep the majority of every booking” — every figure shown is above 50%. If a negotiated Payment Option B rate under clause 7.1 would give the Coach less than half of the Booking Value, UniBlueprint will confirm this with the Coach in writing as a deliberate, acknowledged departure from that public statement before it takes effect, not silently.'),
    S('7.3', `Under a Coach Agreement, if the Coach does not specify a Payment Option, Payment Option B applies at the default 85% Coach Share / 15% Platform Fee reference point described above. ${FILL('GOVERNANCE PROCESS — TO BE CONFIRMED')} governs who at UniBlueprint has authority to agree a Payment Option B rate that departs from this default reference point.`),
    S('7.4', 'As of the date of this Agreement, when a Member pays for a chargeable Booking through the Platform’s checkout, UniBlueprint’s payment processor (Stripe) collects the full Booking Value and it is paid to UniBlueprint. There is currently no Stripe Connect or similar mechanism that splits or routes any part of a payment directly to the Coach at the time the Member pays. Once the Coach’s Tier and Payment Option are confirmed under a Coach Agreement, UniBlueprint will calculate the Coach Share due and settle it with the Coach directly. For now this is expected to be administered manually by UniBlueprint’s Finance team, with a clear statement for each Booking, until an automatic payment-splitting mechanism is built — UniBlueprint will tell the Coach plainly, before it affects them, once that changes. A Booking with no price — an enquiry-only Coach, or a free Intro Call under clause 5.5 — involves no payment of any kind, so nothing is owed to or by anyone under this clause.'),
    S('7.5', 'Where a Member is refunded under the UniBlueprint Refund Policy, the corresponding Coach Share is not payable, or if already paid, is deducted from the amount next due to the Coach. Where the refund arises solely from UniBlueprint’s act or omission, UniBlueprint bears the cost and no deduction is made.'),
    S('7.6', 'The Coach is responsible for issuing any VAT invoice required and for accounting for VAT on the Coach Share.'),
    S('7.7', `UniBlueprint may reassess the Coach’s Tier from time to time to reflect changes in the Coach’s pricing, scope of Services, or demonstrated demand. UniBlueprint will give the Coach ${FILL('NOTICE PERIOD — TO BE CONFIRMED BY FINANCE')} written notice before a change of Tier takes effect.`),
    S('7.8', `A Coach that signs a Coach Agreement before the Public Launch Date is awarded the Founding Coach Badge. The Badge is a timing-based recognition and is independent of the Coach’s Tier or Payment Option. ${FILL('REVOCABILITY — TO BE CONFIRMED WITH SOLICITOR')} governs whether the Badge is retained if the Coach later leaves and rejoins the Platform.`),
    S('7.9', 'Once a Tier, Payment Option, and (if applicable) negotiated Coach Share are assigned under a Coach Agreement, the Coach can see their own current figures at any time through their Coach Portal account. During the Free Trial Period itself, these are typically not yet assigned.'),

    CL('8', 'Delivery standards'),
    S('8.1', 'The Coach will deliver the Services with the reasonable skill and care expected of a competent professional in their field.'),
    S('8.2', 'The Coach will respond to a Member enquiry or Booking request within forty-eight (48) hours, and will confirm session arrangements in advance through the Platform.'),
    S('8.3', 'The Coach will apply the cancellation terms in the UniBlueprint Refund Policy: a Member cancelling more than twenty-four (24) hours before a session receives a full refund; a Member cancelling within twenty-four (24) hours receives a fifty per cent (50%) refund; a Member who does not attend is not refunded.'),
    S('8.4', 'If the Coach cancels or fails to attend a session, the Member is refunded in full and no Coach Share is payable. Repeated cancellation by the Coach is a material breach.'),
    S('8.5', 'The Coach will keep appropriate records of sessions delivered and will co-operate with any reasonable quality review by UniBlueprint.'),

    CL('9', 'Conduct'),
    S('9.1', 'The Coach will treat every Member with respect and will not discriminate on any ground protected by the Equal Status Acts 2000 to 2018.'),
    S('9.2', 'The Coach will maintain appropriate professional boundaries with Members at all times, will not pursue a personal or romantic relationship with a Member met through the Platform, and will not contact a Member for any purpose unrelated to the Services.'),
    S('9.3', 'The Coach will not give advice outside their competence. In particular the Coach will not provide medical, psychological, psychiatric, financial, or legal advice unless qualified and insured to do so, and will refer a Member to an appropriate professional where the Member’s needs fall outside the Coach’s scope.'),
    S('9.4', 'If a Member discloses risk of harm to themselves or another person, the Coach will follow the escalation steps in the Safeguarding and Code of Conduct Policy and notify UniBlueprint immediately.'),
    S('9.5', 'The Coach will not bring UniBlueprint into disrepute.'),

    CL('10', 'Intellectual property'),
    S('10.1', 'The Coach retains ownership of coaching materials they created before this Agreement or independently of it.'),
    S('10.2', 'The Coach grants UniBlueprint a non-exclusive, royalty-free licence to use their name, image, profile content, and biography to list and promote them on the Platform and in UniBlueprint marketing, for the term of this Agreement and for archived material afterwards.'),
    S('10.3', 'Where UniBlueprint specifically commissions and pays for material to be created for the Platform, that material and all intellectual property in it belongs to UniBlueprint, and the Coach assigns it with full title guarantee and waives any moral rights in it so far as the law allows.'),
    S('10.4', 'The Coach will not use UniBlueprint’s name, logo, or content except to identify themselves as a UniBlueprint coach.'),

    CL('11', 'Liability and indemnity'),
    S('11.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud, or for anything that cannot lawfully be limited.'),
    S('11.2', 'The Coach is solely responsible for the Services they deliver and for any advice they give. The Coach will indemnify UniBlueprint against any claim, loss, cost, or expense arising from the Services, from any breach of clauses 3, 4, 8, or 9, or from any injury or loss suffered by a Member in connection with a session.'),
    S('11.3', 'Subject to clause 11.1, UniBlueprint’s total liability to the Coach under this Agreement is limited to the total Coach Share paid or payable to the Coach in the twelve (12) months before the claim arose, or €500 if greater, reflecting that no Coach Share is payable at all during the Free Trial Period itself.'),
    S('11.4', 'UniBlueprint gives no guarantee of any number of Bookings, level of income, or continued listing.'),

    CL('12', 'Data protection'),
    S('12.1', 'Where the Coach processes Member personal data on UniBlueprint’s instructions through the Platform, the Coach acts as a processor and will comply with the Data Processing Terms issued by UniBlueprint (Document 13).'),
    S('12.2', 'Where the Coach holds Member data for their own records, including session notes and client files, the Coach is an independent controller and must comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 in its own right.'),
    S('12.3', 'The Coach will keep Member information confidential, will not disclose it except as required by law or to prevent serious harm, and will notify UniBlueprint of any personal data breach without undue delay and in any event within twenty-four (24) hours of becoming aware of it.'),

    CL('13', 'Confidentiality'),
    S('13.1', 'The Coach will not disclose UniBlueprint’s confidential information, including commercial terms, Member numbers, product plans, and the terms of this Agreement, without consent.'),
    S('13.2', 'This obligation continues for three (3) years after termination.'),

    CL('14', 'Non-solicitation'),
    S('14.1', 'For twelve (12) months after termination, the Coach will not deliberately induce a Member first introduced to the Coach through the Platform to take services from the Coach outside the Platform, where the purpose is to avoid a Platform Fee that would otherwise be payable under a Coach Agreement.'),
    S('14.2', 'Clause 14.1 does not prevent the Coach from continuing to work with a Member who approaches them independently, from working with anyone the Coach knew before the introduction, or from advertising generally.'),
    S('14.3', 'Without limiting clause 13.1, any Coach Share or Platform Fee renegotiated under Payment Option B is confidential and must not be disclosed by either party to any other coach, partner, or third party.'),
    S('14.4', 'The Coach is free to work for any competitor at any time, during and after this Agreement. Nothing in this Agreement restricts the Coach’s trade.'),

    CL('15', 'Records and audit'),
    S('15.1', 'The Coach will keep accurate records of all Bookings for six (6) years.'),
    S('15.2', 'UniBlueprint may, on reasonable notice, audit or request evidence of those records to the extent necessary to verify the Coach Share and Platform Fee calculated and paid under a Coach Agreement.'),

    CL('16', 'Set-off'),
    S('16.1', 'Once a Coach Agreement is in place, UniBlueprint may set off any amount owed to it by the Coach under that agreement against any amount due to the Coach.'),

    CL('17', 'Warranties'),
    S('17.1', 'Each party warrants that it has full power and authority to enter into and perform this Agreement.'),

    CL('18', 'Anti-bribery and corruption'),
    S('18.1', 'Each party will comply with the Criminal Justice (Corruption Offences) Act 2018 and will not offer, give, solicit, or accept any bribe or other corrupt advantage in connection with this Agreement.'),

    CL('19', 'Publicity'),
    S('19.1', 'Neither party will issue a press release or public announcement about the other or this Agreement, beyond the ordinary operation of the Coach’s listing, without the other’s prior consent.'),

    CL('20', 'Force majeure'),
    S('20.1', 'Neither party is liable for a failure or delay in performing its obligations (other than a payment obligation already due) caused by an event beyond its reasonable control, and that party’s obligations are suspended for as long as the event continues.'),
    S('20.2', 'If a force majeure event continues for sixty (60) consecutive days, either party may terminate this Agreement by written notice.'),

    CL('21', 'Term and termination'),
    S('21.1', 'This Agreement begins on the date above and covers the Free Trial Period only, as described in clause 1.1(g).'),
    S('21.2', 'Either party may terminate on thirty (30) days’ written notice, or immediately during the Free Trial Period with no charge and no debt arising, consistent with clause 1.1(g).'),
    S('21.3', 'UniBlueprint may terminate or suspend immediately if the Coach:'),
    L('a', 'breaches clause 3 (vetting or qualifications), clause 4 (insurance), or clause 9 (conduct);'),
    L('b', 'commits any other material breach not remedied within fourteen (14) days of notice;'),
    L('c', 'is the subject of a safeguarding concern, pending investigation; or'),
    L('d', 'becomes insolvent or ceases to trade.'),
    S('21.4', 'On termination the Coach will complete or hand over Bookings already accepted, as UniBlueprint reasonably directs, and will be paid the Coach Share (if any) for those Bookings, in accordance with clause 7.4.'),
    S('21.5', 'Clauses 2.3 and 10 to 20 survive termination, as applicable.'),

    CL('22', 'General'),
    S('22.1', 'This Agreement, with its Schedules and the Safeguarding and Code of Conduct Policy, is the entire agreement between the parties for the Free Trial Period. It does not constitute, and should not be read as, the Coach Agreement referred to throughout.'),
    S('22.2', 'Each party will comply with all applicable law in performing this Agreement.'),
    S('22.3', 'Any variation must be in writing and signed.'),
    S('22.4', 'The Coach may not assign this Agreement. UniBlueprint may assign it to a company to which it transfers its business.'),
    S('22.5', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('22.6', 'Notices must be in writing to the addresses in Schedule 4.'),
    S('22.7', 'This Agreement is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),
    S('22.8', 'This Agreement may be signed in counterparts, including by electronic signature, each of which is an original and all of which together form one agreement.'),
    S('22.9', 'A person who is not a party to this Agreement has no right to enforce it.'),

    H('Schedule 1: Services, qualifications, and prices'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Coaching category', '[e.g. Personal Training / Trading & Finance / Personal Branding]'],
        ['Services offered', '[LIST]'],
        ['Qualifications held', '[LIST WITH AWARDING BODY AND DATE]'],
        ['Delivery mode', '[online / in person / both]'],
        ['In-person locations', '[ADDRESS(ES) or “not applicable”]'],
        ['Prices set by Coach', '[LIST EACH SERVICE AND PRICE]'],
        ['Intro Call offer (if enabled, clause 5.5)', '[PRICE / DURATION, or “not enabled”]'],
      ],
      [3600, 5760]
    ),
    BLANK(),

    H('Schedule 2: Indicative Tier Assessment (informational only — not binding until confirmed in a Coach Agreement)'),
    P('Nothing in this Schedule creates a fee, Coach Share, or Platform Fee. It records UniBlueprint’s provisional, non-binding read of the Coach’s likely Tier during the Free Trial Period, for transparency.'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Provisional Tier read (non-binding)', '[Access / Plus / Signature / Not yet assessed]'],
        ['Basis for provisional read', '[pricing / scope of Services / demonstrated demand notes]'],
        ['Founding Coach Badge eligibility', '[YES, if live before Public Launch Date / NO]'],
        ['Profile first live date', '[DATE]'],
        ['Free Trial Period ends', '[DATE — 30 days after profile first live]'],
      ],
      [3600, 5760]
    ),
    BLANK(),

    H('Schedule 3: Insurance held'),
    TABLE(
      ['Cover', 'Insurer', 'Policy number', 'Limit', 'Renewal date'],
      [
        ['Professional indemnity', '[INSURER]', '[NUMBER]', '€250,000', '[DATE]'],
        ['Public liability', '[INSURER]', '[NUMBER]', '€1,000,000', '[DATE]'],
      ],
      [1900, 1900, 1800, 1700, 2060]
    ),
    BLANK(),

    H('Schedule 4: Payment and contact details'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Coach bank account name', '[NAME — used once Finance settles any Coach Share under clause 7.4]'],
        ['IBAN', '[IBAN]'],
        ['Tax reference (PPSN / VAT)', '[NUMBER]'],
        ['VAT registered?', '[YES / NO]'],
        ['Coach email', '[EMAIL]'],
        ['Coach phone', '[PHONE]'],
        ['UniBlueprint contact', EMAIL],
      ],
      [3600, 5760]
    ),
    BLANK(),

    Exec('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature, each of which is an original.'),
    Sig(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    Sig('Signed by the Coach', 'Print name'),
  ],
})

module.exports = { partner, coach }
