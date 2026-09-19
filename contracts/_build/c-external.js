/**
 * External commercial agreements:
 *   02 Lifestyle Blueprint Partner Agreement
 *   03 Uni Coach Agreement
 */

const { Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, FILL, build } = require('./lib')

const CO = 'UniBlueprint Limited'
const EMAIL = 'uniblueprintoperations@gmail.com'

// ═══════════════════════════════════════════════════════════════════════════
// 02 PARTNER AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const partner = () => build({
  file: '02-Partner-Agreement.docx',
  ref: 'UBP-PARTNER-v2.0',
  title: 'UniBlueprint Partner Agreement',
  children: [
    Title('Partner Agreement'),
    Subtitle('Lifestyle Blueprint: business listing, tiers, and payment options'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] ("UniBlueprint", "we", "us").`),
    S('(2)', '[PARTNER LEGAL NAME], trading as [TRADING NAME], of [BUSINESS ADDRESS], [company/VAT number if applicable] (the "Partner", "you").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Complete before sending',
      'Fill every bracketed field. Complete Schedule 1 (the Offer) and Schedule 2 (Tier and Payment Option) before this is sent for signature. The Partner must also have a live Stripe Connect account before the Listing goes live, so payments under clause 6.5 can be routed to it. An agreement issued with Schedule 2 blank, or without a working Connected Account, leaves the price and payment mechanism open and is not enforceable as to price.'),

    H('Background'),
    P('A.  UniBlueprint operates a platform for young people in Ireland comprising a website and a mobile application, including a section known as Lifestyle Blueprint on which partner businesses list offers available to UniBlueprint members.'),
    P('B.  The Partner wishes to list an offer on Lifestyle Blueprint. UniBlueprint has agreed to list the Partner on the terms set out below, beginning with a free trial month and followed by a Tier and Payment Option chosen or assigned under clause 4.'),
    P('C.  The Partner remains the seller of everything supplied under a Listing. UniBlueprint provides a listing and introduction service and, from the Listing Live Date, collects payment from Members on the Partner\'s behalf through its payment processor, retaining a Commission as set out in clause 6 and Schedule 2.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    L('a', '"Commission" means the percentage of the redemption value UniBlueprint retains under clause 6, at the rate set out in Schedule 2 for the Partner\'s Tier and Payment Option.'),
    L('b', '"Connected Account" means the Partner\'s account with UniBlueprint\'s payment processor (Stripe Connect or its successor), to which payments due to the Partner are remitted under clause 6.5.'),
    L('c', '"Decision Date" means the 20th day of the Free Trial Month.'),
    L('d', '"Founding Partner Badge" means the recognition described in clause 4.6.'),
    L('e', '"Free Trial Month" means the period of one calendar month beginning on the Listing Live Date, during which no Tier Fee or Commission is payable.'),
    L('f', '"Listing" means the Partner\'s entry on Lifestyle Blueprint, including its name, logo, category, description, and Offer.'),
    L('g', '"Listing Live Date" means the date on which the Listing first becomes visible to members, as notified to the Partner in writing.'),
    L('h', '"Member" means a registered user of the UniBlueprint platform.'),
    L('i', '"Offer" means the discount, rate, or benefit the Partner makes available to Members, as set out in Schedule 1.'),
    L('j', '"Payment Option A" means the fixed monthly Tier Fee plus reduced Commission structure set out in Schedule 2.'),
    L('k', '"Payment Option B" means the nil (or reduced) monthly Tier Fee with an individually negotiated Commission structure set out in Schedule 2.'),
    L('l', '"Partnership Contact" means the UniBlueprint team member assigned to the Partner and named in Schedule 3.'),
    L('m', '"Platform" means the UniBlueprint website and mobile application.'),
    L('n', '"Public Launch Date" means the date UniBlueprint publicly launches the Platform, as notified on the Platform.'),
    L('o', '"Tier" means the classification (Access, Plus, or Signature) assigned to the Partner under clause 4.1.'),
    L('p', '"Tier Fee" means the fixed monthly fee, if any, payable under the Partner\'s Tier and Payment Option, as set out in Schedule 2.'),

    CL('2', 'Free Trial Month'),
    S('2.1', 'The Partner is admitted to Lifestyle Blueprint on a free trial basis. No Tier Fee, Commission, or other charge of any kind is payable by the Partner in respect of the Free Trial Month.'),
    S('2.2', 'During the Free Trial Month the Listing carries the same prominence and functionality as a paid listing. UniBlueprint will not restrict or downgrade the Listing by reason only of it being on trial.'),
    S('2.3', 'The Partner may withdraw at any time during the Free Trial Month by written notice, with no charge and no further obligation.'),

    CL('3', 'The Decision Date'),
    S('3.1', 'On or before the Decision Date the Partner must do one of the following:'),
    L('a', 'confirm in writing to UniBlueprint that it wishes to continue, selecting Payment Option A or Payment Option B under clause 4; if the Partner confirms continuation without specifying an Option, Payment Option A applies; or'),
    L('b', 'make contact with its Partnership Contact (by email, telephone, message, or meeting) to discuss continuing, varying, or ending the arrangement.'),
    S('3.2', 'Contact under clause 3.1(b) is sufficient to satisfy the Decision Date requirement. The Partner is not required to make a final commitment by the Decision Date, only to engage.'),
    S('3.3', 'UniBlueprint will send the Partner a written reminder no later than five (5) days before the Decision Date, to the email address in Schedule 3. Failure by UniBlueprint to send that reminder extends the Decision Date by five (5) days.'),
    S('3.4', 'If the Partner does neither of the things in clause 3.1 by the Decision Date, then at the end of the Free Trial Month the Listing will be paused. A paused Listing is hidden from Members. No Tier Fee or Commission is payable and no debt arises. Silence does not create a payment obligation.'),
    S('3.5', 'A Listing paused under clause 3.4 may be reactivated at any time within six (6) months by written agreement, without repeating the Free Trial Month.'),

    NOTE('Why silence pauses rather than bills',
      'Auto-converting a non-responding partner onto a paid Tier creates a debt you would have to chase, and is the kind of term the CCPC scrutinises. Pausing costs you nothing and keeps the relationship open. If you want auto-conversion instead, that must be flagged prominently before signature and is a commercial decision to take with advice.'),

    CL('4', 'Tier, Payment Option and Fees'),
    S('4.1', 'UniBlueprint classifies the Partner into one of three Tiers — Access, Plus, or Signature — based on the joint judgment of UniBlueprint and the Partner as to the size of the Partner\'s business, the scope of the goods or services covered by the Listing, and the Partner\'s own pricing under Schedule 1. Tier classification is a categorisation only and does not itself create a fee; fees arise only from the Tier Fee and Commission set out below.'),
    TABLE(
      ['Tier', 'Payment Option A', 'Payment Option B'],
      [
        ['Access', '€15/month + 10% Commission', '€0/month + individually negotiated Commission (uncapped, confidential — clause 11)'],
        ['Plus', '€45/month + 8% Commission', '€0/month + individually negotiated Commission (uncapped, confidential — clause 11)'],
        ['Signature', FILL('TIER FEE / COMMISSION % — TO BE CONFIRMED'), '€0/month + individually negotiated Commission (uncapped, confidential — clause 11)'],
      ],
      [0.7, 1.3, 1.6]
    ),
    S('4.2', 'Commission is calculated on the redemption value of the transaction, excluding VAT, and is deducted at the time of the transaction under clause 6.5.'),
    S('4.3', 'The Paid Term begins on the day after the Free Trial Month ends and continues for the period stated in Schedule 2. Either party may terminate the Paid Term on thirty (30) days\' written notice. Any Tier Fee already paid in respect of a period that has not yet elapsed will be refunded pro rata.'),
    S('4.4', `UniBlueprint may reassess the Partner's Tier from time to time to reflect changes in the size of the Partner's business, the scope of its Listing, or its pricing. UniBlueprint will give the Partner ${FILL('NOTICE PERIOD — TO BE CONFIRMED BY FINANCE')} written notice before a change of Tier takes effect.`),
    S('4.5', `Where the Partner selects Payment Option B, the negotiated Commission rate is recorded and dated in Schedule 2 and is confidential under clause 11. ${FILL('GOVERNANCE PROCESS — TO BE CONFIRMED')} governs who at UniBlueprint has authority to agree a Payment Option B rate.`),
    S('4.6', `A Partner that signs this Agreement before the Public Launch Date is awarded the Founding Partner Badge. The Badge is a timing-based recognition and is independent of the Partner's Tier or Payment Option. ${FILL('REVOCABILITY — TO BE CONFIRMED WITH SOLICITOR')} governs whether the Badge is retained if the Partner later leaves and rejoins the Platform.`),

    CL('5', 'The Offer'),
    S('5.1', 'The Partner will honour the Offer in Schedule 1 for every Member who presents valid proof of UniBlueprint membership, for as long as the Listing is live.'),
    S('5.2', 'The Partner may vary or withdraw the Offer on fourteen (14) days\' written notice. UniBlueprint will update the Listing. The Partner must honour the previous Offer for any Member who relied on it before the change took effect.'),
    S('5.3', 'The Partner warrants that the Offer is genuine, that any "was" or reference price stated is a price at which the product or service was actually available, and that the Offer complies with the Consumer Protection Act 2007 and the European Union (Consumer Protection (Price Indication)) Regulations.'),
    S('5.4', 'The Partner must not make the Offer conditional on anything not disclosed in Schedule 1.'),
    S('5.5', 'The Partner\'s own pricing recorded in Schedule 1 forms part of the basis on which UniBlueprint classifies the Partner\'s Tier under clause 4.1.'),

    CL('6', 'Relationship with Members, payment, and commission'),
    S('6.1', 'The Partner remains the seller of everything supplied under the Listing. Every transaction between the Partner and a Member is a contract between those two parties alone. UniBlueprint is not a party to that underlying supply of goods or services and is not the seller or the supplier of them, notwithstanding that UniBlueprint processes payment for the transaction under clause 6.5.'),
    S('6.2', 'The Partner is solely responsible for the goods or services it supplies, and for all obligations owed to Members as a trader under the Consumer Rights Act 2022, the Sale of Goods and Supply of Services Act 1980, and all other applicable consumer legislation.'),
    S('6.3', 'The Partner is solely responsible for handling its own refunds, returns, complaints, and disputes with Members.'),
    S('6.4', 'The Partner will indemnify UniBlueprint against any claim, loss, or cost arising from the goods or services it supplies to a Member, from any breach of clause 5 or clause 6, or from any statement made by the Partner about its own business.'),
    S('6.5', 'Where a Member pays through the Platform\'s checkout, UniBlueprint processes that payment through its payment processor and remits it into the Partner\'s Connected Account, deducting the Commission due under Schedule 2 as an application fee before remittance. This payment mechanism is one of administration and collection only; it does not make UniBlueprint the seller of the underlying goods or services and does not affect the allocation of responsibility in clauses 6.1 to 6.4.'),
    S('6.6', 'The Partner must keep its Connected Account in good standing, including keeping its verification, banking, and tax details current with the payment processor. UniBlueprint may suspend the Listing under clause 19 if the Connected Account is not kept in good standing and payment cannot be remitted as a result.'),

    CL('7', 'Listing content and brand licence'),
    S('7.1', 'The Partner grants UniBlueprint a non-exclusive, royalty-free licence to use its name, trading name, logo, and Offer details for the purpose of operating and promoting the Listing on the Platform and in UniBlueprint marketing.'),
    S('7.2', 'That licence ends when the Listing ends, except that UniBlueprint may retain the Partner\'s name and logo in archived marketing material already published.'),
    S('7.3', 'The Partner warrants it owns or is licensed to use everything it supplies for the Listing, and that its use by UniBlueprint will not infringe any third party right.'),
    S('7.4', 'The Partner may state that it is a UniBlueprint partner and use the UniBlueprint name and logo for that purpose, in accordance with any brand guidance UniBlueprint provides. The Partner must not suggest that UniBlueprint endorses, guarantees, or is responsible for its goods or services.'),
    S('7.5', 'Listing content that is inaccurate, misleading, unlawful, or inappropriate for an audience that includes young people may be amended or removed by UniBlueprint, acting reasonably, on notice to the Partner.'),

    CL('8', 'Partner obligations'),
    S('8.1', 'The Partner will:'),
    L('a', 'keep its Listing information accurate and tell UniBlueprint promptly if anything changes;'),
    L('b', 'hold and maintain all licences, registrations, insurances, and qualifications required by law for its business;'),
    L('c', 'comply with all applicable law, including consumer, advertising, health and safety, equality, and data protection law;'),
    L('d', 'treat all Members courteously and without discrimination on any ground protected by the Employment Equality Acts 1998 to 2015 or the Equal Status Acts 2000 to 2018;'),
    L('e', 'respond to Members who contact it through the Listing within a reasonable time;'),
    L('f', 'notify UniBlueprint promptly of any complaint by a Member that alleges harm, injury, or misconduct; and'),
    L('g', 'maintain a Connected Account in good standing throughout the term of this Agreement, as required by clause 6.6.'),
    // FLAG: Reinstate full Garda vetting language here if UBP's 18+ eligibility
    // enforcement is not actually live at issue time — confirm with solicitor.
    S('8.2', 'If the Partner or its personnel become aware, in the course of providing the Offer, that an individual they are dealing with is under the age of 18, the Partner must immediately stop dealing with that individual under the Listing and notify UniBlueprint without delay.'),
    S('8.3', 'The Partner must hold public liability insurance of not less than €1,000,000 and, where it provides services involving physical activity, treatment, or advice, professional indemnity insurance of not less than €250,000, each with a reputable insurer. Evidence must be provided on request.'),

    CL('9', 'Off-platform circumvention'),
    S('9.1', 'For twelve (12) months after termination, the Partner will not solicit or deal with a Member first introduced to the Partner through the Platform outside the Platform, where the purpose or effect is to avoid Commission that would otherwise be payable under this Agreement.'),
    S('9.2', 'Clause 9.1 does not apply to a Member the Partner independently approached, or already knew or had a business relationship with, before that Member was introduced to the Partner through the Platform.'),

    CL('10', 'Data protection'),
    S('10.1', 'Each party is an independent controller in respect of personal data it holds about Members. Neither party processes personal data on the other\'s behalf under this Agreement.'),
    S('10.2', 'UniBlueprint does not transfer Member personal data to the Partner. If a Member chooses to contact the Partner or redeem an Offer, any personal data the Member provides is provided by the Member directly and the Partner is the controller of it.'),
    S('10.3', 'The Partner will comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 in respect of all Member personal data it holds, will provide its own privacy notice, and will not use Member data for marketing without a lawful basis.'),
    S('10.4', 'Each party will notify the other without undue delay of any personal data breach that affects the other party or Members introduced under this Agreement.'),

    CL('11', 'Confidentiality'),
    S('11.1', 'Neither party will disclose the other\'s confidential information, including commercial terms, fee levels, Member numbers, and business plans, without consent, except where disclosure is required by law or to professional advisers under a duty of confidence.'),
    S('11.2', 'Without limiting clause 11.1, any Commission rate negotiated under Payment Option B is confidential and must not be disclosed by either party to any other partner, coach, or third party.'),
    S('11.3', 'This obligation continues for three (3) years after termination.'),

    CL('12', 'Records and audit'),
    S('12.1', 'The Partner will keep accurate records of all transactions with Members made under the Listing for six (6) years.'),
    S('12.2', 'UniBlueprint may, on reasonable notice, audit or request evidence of those records to the extent necessary to verify Commission calculated and paid under this Agreement.'),

    CL('13', 'Set-off'),
    S('13.1', 'UniBlueprint may set off any amount owed to it by the Partner under this Agreement against any amount due to the Partner.'),

    CL('14', 'Warranties'),
    S('14.1', 'Each party warrants that it has full power and authority to enter into and perform this Agreement.'),

    CL('15', 'Anti-bribery and corruption'),
    S('15.1', 'Each party will comply with the Criminal Justice (Corruption Offences) Act 2018 and will not offer, give, solicit, or accept any bribe or other corrupt advantage in connection with this Agreement.'),

    CL('16', 'Publicity'),
    S('16.1', 'Neither party will issue a press release or public announcement about the other or this Agreement, beyond the ordinary operation of the Listing, without the other\'s prior consent.'),

    CL('17', 'Liability'),
    S('17.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything that cannot lawfully be limited.'),
    S('17.2', 'Subject to clause 17.1, UniBlueprint\'s total liability to the Partner under or in connection with this Agreement is limited to the greater of (a) the total Tier Fees and Commission paid by the Partner in the twelve (12) months before the claim arose, and (b) €500.'),
    S('17.3', 'UniBlueprint does not guarantee any level of Listing views, enquiries, redemptions, sales, or revenue. Nothing said or written before this Agreement about likely results forms part of it.'),
    S('17.4', 'Neither party is liable to the other for loss of profit, loss of business, or indirect or consequential loss.'),
    S('17.5', 'The limit in clause 17.2 does not apply to the Partner\'s indemnity in clause 6.4.'),

    CL('18', 'Force majeure'),
    S('18.1', 'Neither party is liable for a failure or delay in performing its obligations (other than a payment obligation already due) caused by an event beyond its reasonable control, and that party\'s obligations are suspended for as long as the event continues.'),
    S('18.2', 'If a force majeure event continues for sixty (60) consecutive days, either party may terminate this Agreement by written notice.'),

    CL('19', 'Suspension and termination'),
    S('19.1', 'UniBlueprint may suspend or remove the Listing immediately if it reasonably believes the Partner has breached clause 5, 6, 8, or 9, or that the Listing presents a risk to Members. UniBlueprint will notify the Partner and give it a reasonable opportunity to remedy where the breach is capable of remedy.'),
    S('19.2', 'Either party may terminate immediately on written notice if the other commits a material breach that is not remedied within fourteen (14) days of notice, or becomes insolvent, enters examinership, has a receiver appointed, or ceases to trade.'),
    S('19.3', 'On termination the Listing is removed. Clauses 6.1 to 6.4, 7.2, 9, 10, 11, 12, 17, and 20 survive.'),

    CL('20', 'General'),
    S('20.1', 'Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship between the parties. Neither party may bind the other.'),
    S('20.2', 'This Agreement, with its Schedules, is the entire agreement between the parties on its subject matter and supersedes anything said or written before it.'),
    S('20.3', 'Each party will comply with all applicable law in performing this Agreement.'),
    S('20.4', 'Any variation must be in writing and signed by both parties, except that a change to Schedule 1 made under clause 5.2 or a Tier or Payment Option update made under clause 4 recorded in Schedule 2 may be made by written notice.'),
    S('20.5', 'The Partner may not assign this Agreement without UniBlueprint\'s written consent. UniBlueprint may assign it to a company to which it transfers its business.'),
    S('20.6', 'If any provision is held unenforceable, it is severed and the remainder continues in force.'),
    S('20.7', 'No failure or delay in enforcing a right is a waiver of it.'),
    S('20.8', 'Notices must be in writing and sent to the email addresses in Schedule 3. Notice is deemed given on the next business day after sending.'),
    S('20.9', 'A person who is not a party to this Agreement has no right to enforce it.'),
    S('20.10', 'This Agreement is governed by the laws of Ireland. The parties submit to the exclusive jurisdiction of the courts of Ireland.'),
    S('20.11', 'This Agreement may be signed in counterparts, including by electronic signature, each of which is an original and all of which together form one agreement.'),

    H('Schedule 1: The Offer'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Partner name as listed', '[AS SHOWN ON PLATFORM]'],
        ['Category', '[e.g. Health & Fitness / Beauty / Food & Drink / Services]'],
        ['Offer to Members', '[e.g. 15% off all treatments]'],
        ['Conditions', '[e.g. valid student ID, off-peak only, not with other offers]'],
        ['Proof of membership accepted', '[e.g. in-app member screen]'],
        ['Locations covered', '[ADDRESS(ES) OR "online"]'],
        ['Offer start date', '[DATE]'],
        ['Offer review date', '[DATE]'],
      ],
      [1, 1.6]
    ),

    H('Schedule 2: Tier, Payment Option and Fees'),
    P('No fee or Commission of any kind is payable in respect of the Free Trial Month. The following applies only to the Paid Term.'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Assigned Tier', '[Access / Plus / Signature]'],
        ['Selected Payment Option', '[Option A / Option B]'],
        ['Option A monthly Tier Fee / Commission %', '[AS PER CLAUSE 4.1 TABLE FOR ASSIGNED TIER]'],
        ['Option B negotiated Commission % (confidential) and date agreed', '[% / DATE]'],
        ['Paid Term length', '[e.g. 12 months from end of Free Trial Month]'],
        ['Payment method', 'Via Partner\'s Connected Account; Commission deducted in real time at the point of transaction'],
        ['Late payment', 'Interest under the European Communities (Late Payment in Commercial Transactions) Regulations 2012'],
        ['Founding Partner Badge eligibility', '[YES / NO]'],
      ],
      [1, 1.6]
    ),

    H('Schedule 3: Contacts'),
    TABLE(
      ['Role', 'Name', 'Email / phone'],
      [
        ['Partnership Contact (UniBlueprint)', '[NAME]', '[EMAIL]'],
        ['UniBlueprint operations', 'Operations', EMAIL],
        ['Partner primary contact', '[NAME]', '[EMAIL / PHONE]'],
        ['Partner billing contact', '[NAME]', '[EMAIL]'],
        ['Stripe Connected Account reference', '[CONNECTED ACCOUNT ID]', 'n/a'],
      ],
      [1.1, 1, 1.3]
    ),

    EXECUTION('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature, each of which is an original.'),
    SIG(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    SIG('For and on behalf of the Partner', 'Print name', { position: true }),
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// 03 UNI COACH AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const coach = () => build({
  file: '03-Uni-Coach-Agreement.docx',
  ref: 'UBP-COACH-v2.0',
  title: 'UniBlueprint Uni Coach Agreement',
  children: [
    Title('Uni Coach Agreement'),
    Subtitle('Elevation Blueprint: independent contractor services, tiers, and payment options'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] ("UniBlueprint", "we", "us").`),
    S('(2)', '[COACH FULL NAME] of [ADDRESS], [PPS number / business or VAT number] (the "Coach", "you").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Revenue share is already published',
      'The UniBlueprint website states that Coaches "keep the majority of every booking". That claim must remain true under every Tier and Payment Option combination: the default Payment Option B share is 85%, and the Payment Option A shares are 90% (Access) and 92% (Plus), all consistent with "majority". If any negotiated Payment Option B rate under clause 6.1 would give the Coach less than 50% of Booking Value, that contradicts the public claim and must be confirmed as an intended departure from it before the agreement is issued.'),

    H('Background'),
    P('A.  UniBlueprint operates a platform on which verified coaches offer one-to-one coaching, mentoring, and strategy services to members under the Elevation Blueprint service.'),
    P('B.  The Coach is an independent professional who wishes to offer services through the Platform. The Coach is not an employee of UniBlueprint. The Coach\'s Tier and Payment Option, chosen or assigned under clause 6, determine the Coach Share and Platform Fee that apply.'),
    P('C.  This Agreement sets out the terms on which the Coach is listed and paid.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    L('a', '"Booking" means a Member\'s paid engagement of the Coach through the Platform.'),
    L('b', '"Booking Value" means the amount paid by the Member for a Booking, excluding VAT.'),
    L('c', '"Coach Share" means the Coach\'s share of the Booking Value, determined by the Coach\'s Tier and Payment Option and calculated under clause 6.'),
    L('d', '"Connected Account" means the Coach\'s account with UniBlueprint\'s payment processor (Stripe Connect or its successor), to which the Coach Share is remitted under clause 6.'),
    // FLAG: Founding Coach Badge was not previously explicitly confirmed for
    // coaches — added here for symmetry with the Partner Agreement's Founding
    // Partner Badge. Flag to user for confirmation before issuing.
    L('e', '"Founding Coach Badge" means the recognition described in clause 6.8.'),
    L('f', '"Member" means a registered user of the Platform.'),
    L('g', '"Payment Option A" means the fixed monthly fee plus reduced Platform Fee structure set out in Schedule 2.'),
    L('h', '"Payment Option B" means the nil monthly fee with the default or individually renegotiated Coach Share set out in Schedule 2.'),
    L('i', '"Platform" means the UniBlueprint website and mobile application.'),
    L('j', '"Platform Fee" means UniBlueprint\'s share of the Booking Value, determined by the Coach\'s Tier and Payment Option and calculated under clause 6.'),
    L('k', '"Public Launch Date" means the date UniBlueprint publicly launches the Platform, as notified on the Platform.'),
    L('l', '"Services" means the coaching services described in Schedule 1.'),
    L('m', '"Tier" means the classification (Access, Plus, or Signature) assigned to the Coach under clause 6.1.'),

    CL('2', 'Status: independent contractor'),
    S('2.1', 'The Coach provides the Services as an independent contractor carrying on a business on their own account. This Agreement does not create a contract of employment, an apprenticeship, a partnership, or an agency.'),
    S('2.2', 'The Coach:'),
    L('a', 'decides how, when, and where to deliver the Services, subject only to what is agreed with the Member;'),
    L('b', 'sets their own prices under clause 5;'),
    L('c', 'may accept or decline any Booking, and may work for anyone else, including competitors;'),
    L('d', 'provides their own equipment, premises, and materials; and'),
    L('e', 'may, with UniBlueprint\'s prior written consent, send a suitably qualified and vetted substitute.'),
    S('2.3', 'The Coach is responsible for their own income tax, USC, PRSI, and VAT, and for registering with the Revenue Commissioners as required. The Coach will indemnify UniBlueprint against any tax, social insurance contribution, interest, or penalty assessed on UniBlueprint because of the Coach\'s status or payments under this Agreement, other than any amount arising from UniBlueprint\'s own failure to operate a deduction it was legally obliged to operate.'),
    S('2.4', 'The Coach is not entitled to holiday pay, sick pay, pension contributions, notice, redundancy, or any other employment benefit from UniBlueprint.'),

    NOTE('Status is decided on substance, not labels',
      'Since Revenue Commissioners v Karshan (Midlands) Ltd [2023] IESC 24, Irish law applies a five-question test to employment status and a contractual label carries little weight if the reality differs. Keep the reality consistent with clause 2: do not set coaches\' prices, do not roster them, do not require exclusivity.'),

    CL('3', 'Verification, qualifications, and vetting'),
    S('3.1', 'The Coach warrants that all information provided in their application and profile is true, and that they hold the qualifications, certifications, and registrations listed in Schedule 1.'),
    S('3.2', 'The Coach will provide evidence of those qualifications on request and will notify UniBlueprint immediately if any lapses, is suspended, or is withdrawn.'),
    // FLAG: Reinstate full Garda vetting language here if UBP's 18+ eligibility
    // enforcement is not actually live at issue time — confirm with solicitor.
    S('3.3', 'If the Coach becomes aware, in the course of providing the Services, that a Member or prospective Member is under the age of 18, the Coach must immediately stop providing Services to that individual and notify UniBlueprint without delay.'),
    S('3.4', 'The Coach will comply with the UniBlueprint Safeguarding and Code of Conduct Policy, which forms part of this Agreement.'),
    S('3.5', 'The Coach must disclose immediately any charge or conviction for a criminal offence, any professional disciplinary finding, and any civil claim relating to their coaching practice.'),

    CL('4', 'Insurance'),
    S('4.1', 'The Coach must hold and maintain, at their own cost, for the term of this Agreement and for six (6) years afterwards:'),
    L('a', 'professional indemnity insurance of not less than €250,000; and'),
    L('b', 'where the Coach delivers any in-person session, or any session involving physical exercise, training, treatment, or nutrition advice, public liability insurance of not less than €1,000,000.'),
    S('4.2', 'The Coach will provide a copy of the certificate of insurance before their first Booking and on each renewal. UniBlueprint may suspend the Coach\'s listing while evidence of valid insurance is outstanding.'),
    S('4.3', 'Insurance does not limit the Coach\'s liability under clause 10.'),

    CL('5', 'Prices and listing'),
    S('5.1', 'The Coach sets their own prices for the Services, independently of their Tier, Payment Option, and the Coach Share and Platform Fee under clause 6. Those prices are recorded in Schedule 1 and displayed on the Coach\'s Platform profile.'),
    S('5.2', 'The Coach may change their prices on fourteen (14) days\' written notice. A price change does not affect a Booking already made.'),
    S('5.3', 'The Coach is responsible for the accuracy of their profile, including biography, services, pricing, availability, and any claim about qualifications or results. The Coach must not make any claim that is misleading or that cannot be substantiated.'),
    S('5.4', 'UniBlueprint may edit or remove profile content that is inaccurate, misleading, unlawful, or inappropriate for an audience that includes young people, on notice to the Coach.'),

    CL('6', 'Tier, Payment Option, and revenue share'),
    S('6.1', 'UniBlueprint classifies the Coach into one of three Tiers — Access, Plus, or Signature — based on the Coach\'s own session pricing, the scope of Services they offer, and demonstrated demand for the Coach on the Platform. The Coach Share and Platform Fee for each Tier and Payment Option are:'),
    TABLE(
      ['Tier', 'Payment Option A', 'Payment Option B'],
      [
        ['Access', '€15/month + 10% Platform Fee (90% Coach Share)', '85% Coach Share / 15% Platform Fee by default, unless individually renegotiated (confidential — clause 12.3)'],
        ['Plus', '€45/month + 8% Platform Fee (92% Coach Share)', '85% Coach Share / 15% Platform Fee by default, unless individually renegotiated (confidential — clause 12.3)'],
        ['Signature', FILL('TIER FEE / SHARE — TO BE CONFIRMED'), '85% Coach Share / 15% Platform Fee by default, unless individually renegotiated (confidential — clause 12.3)'],
      ],
      [0.7, 1.3, 1.6]
    ),
    S('6.2', 'The Coach selects Payment Option A or Payment Option B. If the Coach does not specify a Payment Option, Payment Option B applies at the default 85% Coach Share / 15% Platform Fee split, reflecting that 85% is the Coach\'s existing baseline rate.'),
    S('6.3', 'The Coach Share and Platform Fee are calculated on the Booking Value, excluding VAT, and are deducted through the Coach\'s Connected Account (Stripe Connect or its successor) at the time the Member pays.'),
    S('6.4', 'Payments from Members are collected by UniBlueprint through its payment processor. UniBlueprint remits the Coach Share to the Coach\'s Connected Account in accordance with the Coach\'s Tier and Payment Option, together with a statement showing each Booking, the Booking Value, the Platform Fee, and the amount paid.'),
    S('6.5', 'Where a Member is refunded under the UniBlueprint Refund Policy, the corresponding Coach Share is not payable, or if already paid, is deducted from the next payment. Where the refund arises solely from UniBlueprint\'s act or omission, UniBlueprint bears the cost and no deduction is made.'),
    S('6.6', 'The Coach is responsible for issuing any VAT invoice required and for accounting for VAT on the Coach Share.'),
    S('6.7', `UniBlueprint may reassess the Coach's Tier from time to time to reflect changes in the Coach's pricing, scope of Services, or demonstrated demand. UniBlueprint will give the Coach ${FILL('NOTICE PERIOD — TO BE CONFIRMED BY FINANCE')} written notice before a change of Tier takes effect.`),
    S('6.8', `A Coach that signs this Agreement before the Public Launch Date is awarded the Founding Coach Badge. The Badge is a timing-based recognition and is independent of the Coach's Tier or Payment Option. ${FILL('REVOCABILITY — TO BE CONFIRMED WITH SOLICITOR')} governs whether the Badge is retained if the Coach later leaves and rejoins the Platform.`),

    CL('7', 'Delivery standards'),
    S('7.1', 'The Coach will deliver the Services with the reasonable skill and care expected of a competent professional in their field.'),
    S('7.2', 'The Coach will respond to a Member enquiry or Booking request within forty-eight (48) hours, and will confirm session arrangements in advance through the Platform.'),
    S('7.3', 'The Coach will apply the cancellation terms in the UniBlueprint Refund Policy: a Member cancelling more than twenty-four (24) hours before a session receives a full refund; a Member cancelling within twenty-four (24) hours receives a fifty per cent (50%) refund; a Member who does not attend is not refunded.'),
    S('7.4', 'If the Coach cancels or fails to attend a session, the Member is refunded in full and no Coach Share is payable. Repeated cancellation by the Coach is a material breach.'),
    S('7.5', 'The Coach will keep appropriate records of sessions delivered and will co-operate with any reasonable quality review by UniBlueprint.'),

    CL('8', 'Conduct'),
    S('8.1', 'The Coach will treat every Member with respect and will not discriminate on any ground protected by the Equal Status Acts 2000 to 2018.'),
    S('8.2', 'The Coach will maintain appropriate professional boundaries with Members at all times, will not pursue a personal or romantic relationship with a Member met through the Platform, and will not contact a Member for any purpose unrelated to the Services.'),
    S('8.3', 'The Coach will not give advice outside their competence. In particular the Coach will not provide medical, psychological, psychiatric, financial, or legal advice unless qualified and insured to do so, and will refer a Member to an appropriate professional where the Member\'s needs fall outside the Coach\'s scope.'),
    S('8.4', 'If a Member discloses risk of harm to themselves or another person, the Coach will follow the escalation steps in the Safeguarding and Code of Conduct Policy and notify UniBlueprint immediately.'),
    S('8.5', 'The Coach will not bring UniBlueprint into disrepute.'),

    CL('9', 'Intellectual property'),
    S('9.1', 'The Coach retains ownership of coaching materials they created before this Agreement or independently of it.'),
    S('9.2', 'The Coach grants UniBlueprint a non-exclusive, royalty-free licence to use their name, image, profile content, and biography to list and promote them on the Platform and in UniBlueprint marketing, for the term of this Agreement and for archived material afterwards.'),
    S('9.3', 'Where UniBlueprint specifically commissions and pays for material to be created for the Platform, that material and all intellectual property in it belongs to UniBlueprint, and the Coach assigns it with full title guarantee and waives any moral rights in it so far as the law allows.'),
    S('9.4', 'The Coach will not use UniBlueprint\'s name, logo, or content except to identify themselves as a UniBlueprint coach.'),

    CL('10', 'Liability and indemnity'),
    S('10.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud, or for anything that cannot lawfully be limited.'),
    S('10.2', 'The Coach is solely responsible for the Services they deliver and for any advice they give. The Coach will indemnify UniBlueprint against any claim, loss, cost, or expense arising from the Services, from any breach of clauses 3, 4, 7, or 8, or from any injury or loss suffered by a Member in connection with a session.'),
    S('10.3', 'Subject to clause 10.1, UniBlueprint\'s total liability to the Coach under this Agreement is limited to the total Coach Share paid or payable to the Coach in the three (3) months before the claim arose.'),
    S('10.4', 'UniBlueprint gives no guarantee of any number of Bookings, level of income, or continued listing.'),

    CL('11', 'Data protection'),
    S('11.1', 'Where the Coach processes Member personal data on UniBlueprint\'s instructions through the Platform, the Coach acts as a processor and will comply with the Data Processing Terms issued by UniBlueprint.'),
    S('11.2', 'Where the Coach holds Member data for their own records, including session notes and client files, the Coach is an independent controller and must comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 in its own right.'),
    S('11.3', 'The Coach will keep Member information confidential, will not disclose it except as required by law or to prevent serious harm, and will notify UniBlueprint of any personal data breach without undue delay and in any event within twenty-four (24) hours of becoming aware of it.'),

    CL('12', 'Confidentiality'),
    S('12.1', 'The Coach will not disclose UniBlueprint\'s confidential information, including commercial terms, Member numbers, product plans, and the terms of this Agreement, without consent.'),
    S('12.2', 'This obligation continues for three (3) years after termination.'),
    S('12.3', 'Without limiting clause 12.1, any Coach Share or Platform Fee renegotiated under Payment Option B is confidential and must not be disclosed by either party to any other coach, partner, or third party.'),

    CL('13', 'Non-solicitation'),
    S('13.1', 'For twelve (12) months after termination, the Coach will not deliberately induce a Member first introduced to the Coach through the Platform to take services from the Coach outside the Platform, where the purpose is to avoid the Platform Fee.'),
    S('13.2', 'Clause 13.1 does not prevent the Coach from continuing to work with a Member who approaches them independently, from working with anyone the Coach knew before the introduction, or from advertising generally.'),
    S('13.3', 'The Coach is free to work for any competitor at any time, during and after this Agreement. Nothing in this Agreement restricts the Coach\'s trade.'),

    CL('14', 'Records and audit'),
    S('14.1', 'The Coach will keep accurate records of all Bookings for six (6) years.'),
    S('14.2', 'UniBlueprint may, on reasonable notice, audit or request evidence of those records to the extent necessary to verify the Coach Share and Platform Fee calculated and paid under this Agreement.'),

    CL('15', 'Set-off'),
    S('15.1', 'UniBlueprint may set off any amount owed to it by the Coach under this Agreement against any amount due to the Coach.'),

    CL('16', 'Warranties'),
    S('16.1', 'Each party warrants that it has full power and authority to enter into and perform this Agreement.'),

    CL('17', 'Anti-bribery and corruption'),
    S('17.1', 'Each party will comply with the Criminal Justice (Corruption Offences) Act 2018 and will not offer, give, solicit, or accept any bribe or other corrupt advantage in connection with this Agreement.'),

    CL('18', 'Publicity'),
    S('18.1', 'Neither party will issue a press release or public announcement about the other or this Agreement, beyond the ordinary operation of the Coach\'s listing, without the other\'s prior consent.'),

    CL('19', 'Force majeure'),
    S('19.1', 'Neither party is liable for a failure or delay in performing its obligations (other than a payment obligation already due) caused by an event beyond its reasonable control, and that party\'s obligations are suspended for as long as the event continues.'),
    S('19.2', 'If a force majeure event continues for sixty (60) consecutive days, either party may terminate this Agreement by written notice.'),

    CL('20', 'Term and termination'),
    S('20.1', 'This Agreement begins on the date above and continues until terminated.'),
    S('20.2', 'Either party may terminate on thirty (30) days\' written notice.'),
    S('20.3', 'UniBlueprint may terminate or suspend immediately if the Coach:'),
    L('a', 'breaches clause 3 (vetting or qualifications), clause 4 (insurance), or clause 8 (conduct);'),
    L('b', 'commits any other material breach not remedied within fourteen (14) days of notice;'),
    L('c', 'is the subject of a safeguarding concern, pending investigation; or'),
    L('d', 'becomes insolvent or ceases to trade.'),
    S('20.4', 'On termination the Coach will complete or hand over Bookings already accepted, as UniBlueprint reasonably directs, and will be paid the Coach Share for those Bookings.'),
    S('20.5', 'Clauses 2.3 and 9 to 19 survive termination, as applicable.'),

    CL('21', 'General'),
    S('21.1', 'This Agreement, with its Schedules and the Safeguarding and Code of Conduct Policy, is the entire agreement between the parties on its subject matter.'),
    S('21.2', 'Each party will comply with all applicable law in performing this Agreement.'),
    S('21.3', 'Any variation must be in writing and signed, except a Tier or Payment Option update recorded in Schedule 2.'),
    S('21.4', 'The Coach may not assign this Agreement. UniBlueprint may assign it to a company to which it transfers its business.'),
    S('21.5', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('21.6', 'Notices must be in writing to the addresses in Schedule 4.'),
    S('21.7', 'This Agreement is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),
    S('21.8', 'This Agreement may be signed in counterparts, including by electronic signature, each of which is an original and all of which together form one agreement.'),
    S('21.9', 'A person who is not a party to this Agreement has no right to enforce it.'),

    H('Schedule 1: Services, qualifications, and prices'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Coaching category', '[e.g. Personal Training / Trading & Finance / Personal Branding]'],
        ['Services offered', '[LIST]'],
        ['Qualifications held', '[LIST WITH AWARDING BODY AND DATE]'],
        ['Delivery mode', '[online / in person / both]'],
        ['In-person locations', '[ADDRESS(ES) or "not applicable"]'],
        ['Prices set by Coach', '[LIST EACH SERVICE AND PRICE]'],
      ],
      [1, 1.6]
    ),

    H('Schedule 2: Tier, Payment Option and Fees'),
    P('Payment Option B defaults to an 85% Coach Share / 15% Platform Fee split unless individually renegotiated and recorded below.'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Assigned Tier', '[Access / Plus / Signature]'],
        ['Selected Payment Option', '[Option A / Option B]'],
        ['Option A monthly fee / Platform Fee %', '[AS PER CLAUSE 6.1 TABLE FOR ASSIGNED TIER]'],
        ['Option B Coach Share % (confidential) and date agreed', '[% / DATE, or "85% default" if not renegotiated]'],
        ['Payment method', 'Via Coach\'s Connected Account; Coach Share deducted at time of payment'],
        ['Late payment', 'Interest under the European Communities (Late Payment in Commercial Transactions) Regulations 2012'],
        ['Founding Coach Badge eligibility', '[YES / NO]'],
      ],
      [1, 1.6]
    ),

    H('Schedule 3: Insurance held'),
    TABLE(
      ['Cover', 'Insurer', 'Policy number', 'Limit', 'Renewal date'],
      [
        ['Professional indemnity', '[INSURER]', '[NUMBER]', '€250,000', '[DATE]'],
        ['Public liability', '[INSURER]', '[NUMBER]', '€1,000,000', '[DATE]'],
      ],
      [1.2, 1, 1, 0.8, 0.9]
    ),

    H('Schedule 4: Payment and contact details'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Coach bank account name', '[NAME]'],
        ['IBAN', '[IBAN]'],
        ['Stripe Connected Account reference', '[CONNECTED ACCOUNT ID]'],
        ['Tax reference (PPSN / VAT)', '[NUMBER]'],
        ['VAT registered?', '[YES / NO]'],
        ['Coach email', '[EMAIL]'],
        ['Coach phone', '[PHONE]'],
        ['UniBlueprint contact', EMAIL],
      ],
      [1, 1.6]
    ),

    EXECUTION('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature, each of which is an original.'),
    SIG(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    SIG('Signed by the Coach', 'Print name'),
  ],
})

module.exports = { partner, coach }
