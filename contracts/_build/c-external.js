/**
 * External commercial agreements:
 *   02 Lifestyle Blueprint Partner Agreement
 *   03 Uni Coach Agreement
 */

const { Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, build } = require('./lib')

const CO = 'UniBlueprint Limited'
const EMAIL = 'uniblueprintoperations@gmail.com'

// ═══════════════════════════════════════════════════════════════════════════
// 02 PARTNER AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const partner = () => build({
  file: '02-Partner-Agreement.docx',
  ref: 'UBP-PARTNER-v1.0',
  title: 'UniBlueprint Partner Agreement',
  children: [
    Title('Partner Agreement'),
    Subtitle('Lifestyle Blueprint: business listing and member offer'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] ("UniBlueprint", "we", "us").`),
    S('(2)', '[PARTNER LEGAL NAME], trading as [TRADING NAME], of [BUSINESS ADDRESS], [company/VAT number if applicable] (the "Partner", "you").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Complete before sending',
      'Fill every bracketed field. Complete Schedule 1 (the offer) and Schedule 2 (fees after the Free Trial Month) before this is sent for signature. An agreement issued with Schedule 2 blank leaves the price open and is not enforceable as to price.'),

    H('Background'),
    P('A.  UniBlueprint operates a platform for young people in Ireland comprising a website and a mobile application, including a section known as Lifestyle Blueprint on which partner businesses list offers available to UniBlueprint members.'),
    P('B.  The Partner wishes to list an offer on Lifestyle Blueprint. UniBlueprint has agreed to list the Partner on the terms set out below, beginning with a free trial month.'),
    P('C.  UniBlueprint provides a listing and introduction service only. Every transaction arising from a listing is a contract between the Partner and the member directly.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    L('a', '"Decision Date" means the 20th day of the Free Trial Month.'),
    L('b', '"Free Trial Month" means the period of one calendar month beginning on the Listing Live Date, during which no Listing Fee is payable.'),
    L('c', '"Listing" means the Partner\'s entry on Lifestyle Blueprint, including its name, logo, category, description, and Offer.'),
    L('d', '"Listing Fee" means the fee set out in Schedule 2, payable only in respect of periods after the Free Trial Month.'),
    L('e', '"Listing Live Date" means the date on which the Listing first becomes visible to members, as notified to the Partner in writing.'),
    L('f', '"Member" means a registered user of the UniBlueprint platform.'),
    L('g', '"Offer" means the discount, rate, or benefit the Partner makes available to Members, as set out in Schedule 1.'),
    L('h', '"Partnership Contact" means the UniBlueprint team member assigned to the Partner and named in Schedule 3.'),
    L('i', '"Platform" means the UniBlueprint website and mobile application.'),

    CL('2', 'Free Trial Month'),
    S('2.1', 'The Partner is admitted to Lifestyle Blueprint on a free trial basis. No Listing Fee, commission, or other charge of any kind is payable by the Partner in respect of the Free Trial Month.'),
    S('2.2', 'During the Free Trial Month the Listing carries the same prominence and functionality as a paid listing. UniBlueprint will not restrict or downgrade the Listing by reason only of it being on trial.'),
    S('2.3', 'The Partner may withdraw at any time during the Free Trial Month by written notice, with no charge and no further obligation.'),

    CL('3', 'The Decision Date'),
    S('3.1', 'On or before the Decision Date the Partner must do one of the following:'),
    L('a', 'confirm in writing to UniBlueprint that it wishes to continue on the terms of Schedule 2; or'),
    L('b', 'make contact with its Partnership Contact (by email, telephone, message, or meeting) to discuss continuing, varying, or ending the arrangement.'),
    S('3.2', 'Contact under clause 3.1(b) is sufficient to satisfy the Decision Date requirement. The Partner is not required to make a final commitment by the Decision Date, only to engage.'),
    S('3.3', 'UniBlueprint will send the Partner a written reminder no later than five (5) days before the Decision Date, to the email address in Schedule 3. Failure by UniBlueprint to send that reminder extends the Decision Date by five (5) days.'),
    S('3.4', 'If the Partner does neither of the things in clause 3.1 by the Decision Date, then at the end of the Free Trial Month the Listing will be paused. A paused Listing is hidden from Members. No Listing Fee is payable and no debt arises. Silence does not create a payment obligation.'),
    S('3.5', 'A Listing paused under clause 3.4 may be reactivated at any time within six (6) months by written agreement, without repeating the Free Trial Month.'),

    NOTE('Why silence pauses rather than bills',
      'Auto-converting a non-responding partner onto a paid plan creates a debt you would have to chase, and is the kind of term the CCPC scrutinises. Pausing costs you nothing and keeps the relationship open. If you want auto-conversion instead, that must be flagged prominently before signature and is a commercial decision to take with advice.'),

    CL('4', 'Term after the Free Trial Month'),
    S('4.1', 'If the Partner confirms continuation under clause 3.1(a), or the parties agree terms following contact under clause 3.1(b), the paid term begins on the day after the Free Trial Month ends and continues for the period stated in Schedule 2 (the "Paid Term").'),
    S('4.2', 'The Listing Fee is payable in accordance with Schedule 2. UniBlueprint will issue an invoice; payment is due within thirty (30) days of invoice date.'),
    S('4.3', 'Either party may terminate the Paid Term on thirty (30) days\' written notice. Listing Fees already paid in respect of a period that has not yet elapsed will be refunded pro rata.'),

    CL('5', 'The Offer'),
    S('5.1', 'The Partner will honour the Offer in Schedule 1 for every Member who presents valid proof of UniBlueprint membership, for as long as the Listing is live.'),
    S('5.2', 'The Partner may vary or withdraw the Offer on fourteen (14) days\' written notice. UniBlueprint will update the Listing. The Partner must honour the previous Offer for any Member who relied on it before the change took effect.'),
    S('5.3', 'The Partner warrants that the Offer is genuine, that any "was" or reference price stated is a price at which the product or service was actually available, and that the Offer complies with the Consumer Protection Act 2007 and the European Union (Consumer Protection (Price Indication)) Regulations.'),
    S('5.4', 'The Partner must not make the Offer conditional on anything not disclosed in Schedule 1.'),

    CL('6', 'Relationship with Members: the Partner is the seller'),
    S('6.1', 'Every transaction between the Partner and a Member is a contract between those two parties alone. UniBlueprint is not a party to it, is not the seller, is not the merchant of record, and takes no payment in respect of it.'),
    S('6.2', 'The Partner is solely responsible for the goods or services it supplies, and for all obligations owed to Members as a trader under the Consumer Rights Act 2022, the Sale of Goods and Supply of Services Act 1980, and all other applicable consumer legislation.'),
    S('6.3', 'The Partner is solely responsible for handling its own refunds, returns, complaints, and disputes with Members.'),
    S('6.4', 'The Partner will indemnify UniBlueprint against any claim, loss, or cost arising from the goods or services it supplies to a Member, from any breach of clause 5 or clause 6, or from any statement made by the Partner about its own business.'),

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
    L('e', 'respond to Members who contact it through the Listing within a reasonable time; and'),
    L('f', 'notify UniBlueprint promptly of any complaint by a Member that alleges harm, injury, or misconduct.'),
    S('8.2', 'Where the Partner or its personnel will have access to Members under the age of 18 in the course of providing the Offer, the Partner must hold current Garda vetting for the relevant personnel under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016, and must provide evidence on request. This obligation cannot be waived.'),
    S('8.3', 'The Partner must hold public liability insurance and, where it provides services involving physical activity, treatment, or advice, professional indemnity insurance, each with a reputable insurer and at a level appropriate to its business. Evidence must be provided on request.'),

    CL('9', 'Data protection'),
    S('9.1', 'Each party is an independent controller in respect of personal data it holds about Members. Neither party processes personal data on the other\'s behalf under this Agreement.'),
    S('9.2', 'UniBlueprint does not transfer Member personal data to the Partner. If a Member chooses to contact the Partner or redeem an Offer, any personal data the Member provides is provided by the Member directly and the Partner is the controller of it.'),
    S('9.3', 'The Partner will comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 in respect of all Member personal data it holds, will provide its own privacy notice, and will not use Member data for marketing without a lawful basis.'),
    S('9.4', 'Each party will notify the other without undue delay of any personal data breach that affects the other party or Members introduced under this Agreement.'),

    CL('10', 'Liability'),
    S('10.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything that cannot lawfully be limited.'),
    S('10.2', 'Subject to clause 10.1, UniBlueprint\'s total liability to the Partner under or in connection with this Agreement is limited to the greater of (a) the total Listing Fees paid by the Partner in the twelve (12) months before the claim arose, and (b) €500.'),
    S('10.3', 'UniBlueprint does not guarantee any level of Listing views, enquiries, redemptions, sales, or revenue. Nothing said or written before this Agreement about likely results forms part of it.'),
    S('10.4', 'Neither party is liable to the other for loss of profit, loss of business, or indirect or consequential loss.'),
    S('10.5', 'The limit in clause 10.2 does not apply to the Partner\'s indemnity in clause 6.4.'),

    CL('11', 'Suspension and termination'),
    S('11.1', 'UniBlueprint may suspend or remove the Listing immediately if it reasonably believes the Partner has breached clause 5, 6, 7, or 8, or that the Listing presents a risk to Members. UniBlueprint will notify the Partner and give it a reasonable opportunity to remedy where the breach is capable of remedy.'),
    S('11.2', 'Either party may terminate immediately on written notice if the other commits a material breach that is not remedied within fourteen (14) days of notice, or becomes insolvent, enters examinership, has a receiver appointed, or ceases to trade.'),
    S('11.3', 'On termination the Listing is removed. Clauses 6, 7.2, 9, 10, 12, and 13 survive.'),

    CL('12', 'Confidentiality'),
    S('12.1', 'Neither party will disclose the other\'s confidential information, including commercial terms, fee levels, Member numbers, and business plans, without consent, except where disclosure is required by law or to professional advisers under a duty of confidence.'),
    S('12.2', 'This obligation continues for three (3) years after termination.'),

    CL('13', 'General'),
    S('13.1', 'Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship between the parties. Neither party may bind the other.'),
    S('13.2', 'This Agreement, with its Schedules, is the entire agreement between the parties on its subject matter and supersedes anything said or written before it.'),
    S('13.3', 'Any variation must be in writing and signed by both parties. A change to Schedule 1 made under clause 5.2 may be made by written notice.'),
    S('13.4', 'The Partner may not assign this Agreement without UniBlueprint\'s written consent. UniBlueprint may assign it to a company to which it transfers its business.'),
    S('13.5', 'If any provision is held unenforceable, it is severed and the remainder continues in force.'),
    S('13.6', 'No failure or delay in enforcing a right is a waiver of it.'),
    S('13.7', 'Notices must be in writing and sent to the email addresses in Schedule 3. Notice is deemed given on the next business day after sending.'),
    S('13.8', 'A person who is not a party to this Agreement has no right to enforce it.'),
    S('13.9', 'This Agreement is governed by the laws of Ireland. The parties submit to the exclusive jurisdiction of the courts of Ireland.'),

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

    H('Schedule 2: Fees after the Free Trial Month'),
    P('No fee of any kind is payable in respect of the Free Trial Month. The following applies only to the Paid Term.'),
    TABLE(
      ['Item', 'Amount / term'],
      [
        ['Listing Fee', '€[AMOUNT] per [month / quarter / year]'],
        ['Paid Term length', '[e.g. 12 months from end of Free Trial Month]'],
        ['Payment method', '[bank transfer / card]'],
        ['Payment terms', '30 days from invoice'],
        ['Commission on Member transactions', 'None. UniBlueprint takes no share of Partner sales.'],
        ['Late payment', 'Interest under the European Communities (Late Payment in Commercial Transactions) Regulations 2012'],
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
  ref: 'UBP-COACH-v1.0',
  title: 'UniBlueprint Uni Coach Agreement',
  children: [
    Title('Uni Coach Agreement'),
    Subtitle('Elevation Blueprint: independent contractor services'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] ("UniBlueprint", "we", "us").`),
    S('(2)', '[COACH FULL NAME] of [ADDRESS], [PPS number / business or VAT number] (the "Coach", "you").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Revenue share is already published',
      'The UniBlueprint website states that Coaches "keep 85% of every booking". That is a public commitment. Clause 6 reflects it. If you intend a different split, change the website BEFORE issuing this agreement, or you are contracting against your own published terms.'),

    H('Background'),
    P('A.  UniBlueprint operates a platform on which verified coaches offer one-to-one coaching, mentoring, and strategy services to members under the Elevation Blueprint service.'),
    P('B.  The Coach is an independent professional who wishes to offer services through the Platform. The Coach is not an employee of UniBlueprint.'),
    P('C.  This Agreement sets out the terms on which the Coach is listed and paid.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    L('a', '"Booking" means a Member\'s paid engagement of the Coach through the Platform.'),
    L('b', '"Booking Value" means the amount paid by the Member for a Booking, excluding VAT.'),
    L('c', '"Coach Share" means the Coach\'s share of the Booking Value, calculated under clause 6.'),
    L('d', '"Member" means a registered user of the Platform.'),
    L('e', '"Platform Fee" means UniBlueprint\'s share of the Booking Value, calculated under clause 6.'),
    L('f', '"Rate Confirmation Date" means 25 September 2026.'),
    L('g', '"Services" means the coaching services described in Schedule 1.'),

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
    S('3.3', 'Where the Coach will or may provide Services to any person under the age of 18, the Coach must hold current Garda vetting obtained through UniBlueprint or another relevant organisation under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016. The Coach must not accept a Booking from a person under 18 until vetting is in place. This requirement cannot be waived by either party.'),
    S('3.4', 'The Coach will comply with the UniBlueprint Safeguarding and Code of Conduct Policy, which forms part of this Agreement.'),
    S('3.5', 'The Coach must disclose immediately any charge or conviction for a criminal offence, any professional disciplinary finding, and any civil claim relating to their coaching practice.'),

    CL('4', 'Insurance'),
    S('4.1', 'The Coach must hold and maintain, at their own cost, for the term of this Agreement and for six (6) years afterwards:'),
    L('a', 'professional indemnity insurance of not less than €[AMOUNT]; and'),
    L('b', 'where the Coach delivers any in-person session, or any session involving physical exercise, training, treatment, or nutrition advice, public liability insurance of not less than €[AMOUNT].'),
    S('4.2', 'The Coach will provide a copy of the certificate of insurance before their first Booking and on each renewal. UniBlueprint may suspend the Coach\'s listing while evidence of valid insurance is outstanding.'),
    S('4.3', 'Insurance does not limit the Coach\'s liability under clause 11.'),

    CL('5', 'Prices and listing'),
    S('5.1', 'The Coach sets their own prices for the Services. Those prices are recorded in Schedule 1 and displayed on the Coach\'s Platform profile.'),
    S('5.2', 'The Coach may change their prices on fourteen (14) days\' written notice. A price change does not affect a Booking already made.'),
    S('5.3', 'The Coach is responsible for the accuracy of their profile, including biography, services, pricing, availability, and any claim about qualifications or results. The Coach must not make any claim that is misleading or that cannot be substantiated.'),
    S('5.4', 'UniBlueprint may edit or remove profile content that is inaccurate, misleading, unlawful, or inappropriate for an audience that includes young people, on notice to the Coach.'),

    CL('6', 'Revenue share and payment'),
    S('6.1', 'For each completed Booking the Booking Value is divided as follows:'),
    TABLE(
      ['Party', 'Share', 'Basis'],
      [
        ['Coach', '85%', 'of Booking Value, excluding VAT'],
        ['UniBlueprint (Platform Fee)', '15%', 'of Booking Value, excluding VAT'],
      ],
      [1.4, 0.6, 1.6]
    ),
    S('6.2', 'The Platform Fee covers listing, member acquisition, booking and scheduling infrastructure, payment processing, and support. No other charge is made to the Coach. There is no listing fee, joining fee, or subscription.'),
    S('6.3', 'Payments from Members are collected by UniBlueprint through its payment processor. UniBlueprint holds the Coach Share on the Coach\'s behalf and remits it in accordance with clause 6.4.'),
    S('6.4', 'UniBlueprint will pay the Coach Share for all Bookings completed in a calendar month by the [15th] day of the following month, by bank transfer to the account in Schedule 3, together with a statement showing each Booking, the Booking Value, the Platform Fee, and the amount paid.'),
    S('6.5', 'Where a Member is refunded under the UniBlueprint Refund Policy, the corresponding Coach Share is not payable, or if already paid, is deducted from the next payment. Where the refund arises solely from UniBlueprint\'s act or omission, UniBlueprint bears the cost and no deduction is made.'),
    S('6.6', 'The Coach is responsible for issuing any VAT invoice required and for accounting for VAT on the Coach Share.'),

    CL('7', 'Rate Confirmation Date'),
    S('7.1', 'The shares in clause 6.1 apply from the date of this Agreement.'),
    S('7.2', 'On or before the Rate Confirmation Date, UniBlueprint will confirm to the Coach in writing the revenue share that will apply from 1 October 2026 onwards, together with any Booking-level minimum or fixed fee that will apply.'),
    S('7.3', 'If UniBlueprint confirms a revenue share less favourable to the Coach than clause 6.1, the Coach may terminate this Agreement by written notice given within fourteen (14) days of that confirmation, without penalty and without notice period. Bookings already accepted are honoured and paid at the clause 6.1 rate.'),
    S('7.4', 'If UniBlueprint does not confirm a revised share on or before the Rate Confirmation Date, the shares in clause 6.1 continue to apply until UniBlueprint gives not less than sixty (60) days\' written notice of a change, and clause 7.3 applies to that notice.'),
    S('7.5', 'No change to the revenue share applies retrospectively to a Booking already made.'),

    CL('8', 'Delivery standards'),
    S('8.1', 'The Coach will deliver the Services with the reasonable skill and care expected of a competent professional in their field.'),
    S('8.2', 'The Coach will respond to a Member enquiry or Booking request within forty-eight (48) hours, and will confirm session arrangements in advance through the Platform.'),
    S('8.3', 'The Coach will apply the cancellation terms in the UniBlueprint Refund Policy: a Member cancelling more than twenty-four (24) hours before a session receives a full refund; a Member cancelling within twenty-four (24) hours receives a fifty per cent (50%) refund; a Member who does not attend is not refunded.'),
    S('8.4', 'If the Coach cancels or fails to attend a session, the Member is refunded in full and no Coach Share is payable. Repeated cancellation by the Coach is a material breach.'),
    S('8.5', 'The Coach will keep appropriate records of sessions delivered and will co-operate with any reasonable quality review by UniBlueprint.'),

    CL('9', 'Conduct'),
    S('9.1', 'The Coach will treat every Member with respect and will not discriminate on any ground protected by the Equal Status Acts 2000 to 2018.'),
    S('9.2', 'The Coach will maintain appropriate professional boundaries with Members at all times, will not pursue a personal or romantic relationship with a Member met through the Platform, and will not contact a Member for any purpose unrelated to the Services.'),
    S('9.3', 'The Coach will not give advice outside their competence. In particular the Coach will not provide medical, psychological, psychiatric, financial, or legal advice unless qualified and insured to do so, and will refer a Member to an appropriate professional where the Member\'s needs fall outside the Coach\'s scope.'),
    S('9.4', 'If a Member discloses risk of harm to themselves or another person, the Coach will follow the escalation steps in the Safeguarding and Code of Conduct Policy and notify UniBlueprint immediately.'),
    S('9.5', 'The Coach will not bring UniBlueprint into disrepute.'),

    CL('10', 'Intellectual property'),
    S('10.1', 'The Coach retains ownership of coaching materials they created before this Agreement or independently of it.'),
    S('10.2', 'The Coach grants UniBlueprint a non-exclusive, royalty-free licence to use their name, image, profile content, and biography to list and promote them on the Platform and in UniBlueprint marketing, for the term of this Agreement and for archived material afterwards.'),
    S('10.3', 'Where UniBlueprint specifically commissions and pays for material to be created for the Platform, that material and all intellectual property in it belongs to UniBlueprint, and the Coach assigns it with full title guarantee and waives any moral rights in it so far as the law allows.'),
    S('10.4', 'The Coach will not use UniBlueprint\'s name, logo, or content except to identify themselves as a UniBlueprint coach.'),

    CL('11', 'Liability and indemnity'),
    S('11.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud, or for anything that cannot lawfully be limited.'),
    S('11.2', 'The Coach is solely responsible for the Services they deliver and for any advice they give. The Coach will indemnify UniBlueprint against any claim, loss, cost, or expense arising from the Services, from any breach of clauses 3, 4, 8, or 9, or from any injury or loss suffered by a Member in connection with a session.'),
    S('11.3', 'Subject to clause 11.1, UniBlueprint\'s total liability to the Coach under this Agreement is limited to the total Coach Share paid or payable to the Coach in the three (3) months before the claim arose.'),
    S('11.4', 'UniBlueprint gives no guarantee of any number of Bookings, level of income, or continued listing.'),

    CL('12', 'Data protection'),
    S('12.1', 'Where the Coach processes Member personal data on UniBlueprint\'s instructions through the Platform, the Coach acts as a processor and will comply with the Data Processing Terms issued by UniBlueprint.'),
    S('12.2', 'Where the Coach holds Member data for their own records, including session notes and client files, the Coach is an independent controller and must comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 in its own right.'),
    S('12.3', 'The Coach will keep Member information confidential, will not disclose it except as required by law or to prevent serious harm, and will notify UniBlueprint of any personal data breach without undue delay and in any event within twenty-four (24) hours of becoming aware of it.'),

    CL('13', 'Confidentiality'),
    S('13.1', 'The Coach will not disclose UniBlueprint\'s confidential information, including commercial terms, Member numbers, product plans, and the terms of this Agreement, without consent.'),
    S('13.2', 'This obligation continues for three (3) years after termination.'),

    CL('14', 'Non-solicitation'),
    S('14.1', 'For twelve (12) months after termination, the Coach will not deliberately induce a Member first introduced to the Coach through the Platform to take services from the Coach outside the Platform, where the purpose is to avoid the Platform Fee.'),
    S('14.2', 'Clause 14.1 does not prevent the Coach from continuing to work with a Member who approaches them independently, from working with anyone the Coach knew before the introduction, or from advertising generally.'),
    S('14.3', 'The Coach is free to work for any competitor at any time, during and after this Agreement. Nothing in this Agreement restricts the Coach\'s trade.'),

    CL('15', 'Term and termination'),
    S('15.1', 'This Agreement begins on the date above and continues until terminated.'),
    S('15.2', 'Either party may terminate on thirty (30) days\' written notice. The Coach may also terminate under clause 7.3.'),
    S('15.3', 'UniBlueprint may terminate or suspend immediately if the Coach:'),
    L('a', 'breaches clause 3 (vetting or qualifications), clause 4 (insurance), or clause 9 (conduct);'),
    L('b', 'commits any other material breach not remedied within fourteen (14) days of notice;'),
    L('c', 'is the subject of a safeguarding concern, pending investigation; or'),
    L('d', 'becomes insolvent or ceases to trade.'),
    S('15.4', 'On termination the Coach will complete or hand over Bookings already accepted, as UniBlueprint reasonably directs, and will be paid the Coach Share for those Bookings.'),
    S('15.5', 'Clauses 2.3, 10, 11, 12, 13, 14, and 16 survive termination.'),

    CL('16', 'General'),
    S('16.1', 'This Agreement, with its Schedules and the Safeguarding and Code of Conduct Policy, is the entire agreement between the parties on its subject matter.'),
    S('16.2', 'Any variation must be in writing and signed, except a revenue share change made under clause 7.'),
    S('16.3', 'The Coach may not assign this Agreement. UniBlueprint may assign it to a company to which it transfers its business.'),
    S('16.4', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('16.5', 'Notices must be in writing to the addresses in Schedule 3.'),
    S('16.6', 'This Agreement is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),

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
        ['Will work with under-18s?', '[YES: vetting required before first Booking / NO]'],
      ],
      [1, 1.6]
    ),

    H('Schedule 2: Insurance held'),
    TABLE(
      ['Cover', 'Insurer', 'Policy number', 'Limit', 'Renewal date'],
      [
        ['Professional indemnity', '[INSURER]', '[NUMBER]', '€[AMOUNT]', '[DATE]'],
        ['Public liability', '[INSURER]', '[NUMBER]', '€[AMOUNT]', '[DATE]'],
      ],
      [1.2, 1, 1, 0.8, 0.9]
    ),

    H('Schedule 3: Payment and contact details'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Coach bank account name', '[NAME]'],
        ['IBAN', '[IBAN]'],
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
