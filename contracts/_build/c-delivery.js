/**
 * Delivery-role agreements:
 *   04 Campus Handler Agreement
 *   05 Campus Ambassador Agreement
 */

const { Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, build } = require('./lib')

const CO = 'UniBlueprint Limited'
const EMAIL = 'uniblueprintoperations@gmail.com'

// ═══════════════════════════════════════════════════════════════════════════
// 04 CAMPUS HANDLER AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const handler = () => build({
  file: '04-Campus-Handler-Agreement.docx',
  ref: 'UBP-HANDLER-v1.0',
  title: 'UniBlueprint Campus Handler Agreement',
  children: [
    Title('Campus Handler Agreement'),
    Subtitle('Foundation Blueprint: review and delivery services'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] ("UniBlueprint", "we", "us").`),
    S('(2)', '[HANDLER FULL NAME] of [ADDRESS], PPS number [PPSN] (the "Handler", "you").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Read this before issuing: employment status risk',
      'This role carries the highest employment-status risk in the suite. You train Handlers, set the review process, quality-check their output, and supply the systems. Under the Karshan five-question test a court or the WRC could find this is employment despite clause 2. Mitigations are built into clause 2 (genuine right to refuse work, no set hours, substitution). Have this specific agreement reviewed by an Irish employment solicitor before the first Handler signs.'),

    H('Background'),
    P('A.  UniBlueprint operates a platform through which members submit career documents and applications for review under the Foundation Blueprint service.'),
    P('B.  The Handler will review member submissions and produce written outputs and feedback on a per-assignment basis.'),
    P('C.  The Handler will have access to personal information about members and must treat it in confidence.'),

    CL('1', 'Definitions'),
    S('1.1', 'In this Agreement:'),
    L('a', '"Assignment" means a single member submission offered to the Handler for review and completion.'),
    L('b', '"Deliverable" means the completed output and written feedback produced for an Assignment.'),
    L('c', '"Member" means a registered user of the Platform.'),
    L('d', '"Quality Standard" means the review checklist and output standard issued by UniBlueprint and updated from time to time.'),
    L('e', '"Service Fee" means the amount payable to the Handler for a completed Assignment, as set out in Schedule 1.'),

    CL('2', 'Status and how work is offered'),
    S('2.1', 'The Handler provides services as an independent contractor. This Agreement does not create a contract of employment, an apprenticeship, or a partnership.'),
    S('2.2', 'UniBlueprint is under no obligation to offer any Assignment, and the Handler is under no obligation to accept any Assignment offered. There is no minimum or maximum volume of work and no guaranteed income.'),
    S('2.3', 'The Handler may decline any Assignment for any reason and without explanation. Declining an Assignment has no consequence under this Agreement and will not affect future offers.'),
    S('2.4', 'The Handler has no set hours and no obligation to be available at any time. The Handler chooses when and where to complete an accepted Assignment, subject only to the deadline for that Assignment.'),
    S('2.5', 'The Handler is free to work for anyone else, including competitors, at any time.'),
    S('2.6', 'With UniBlueprint\'s prior written consent, which will not be unreasonably withheld, the Handler may arrange for another trained and vetted person to complete an accepted Assignment. The Handler remains responsible for the Deliverable and for paying any substitute.'),
    S('2.7', 'The Handler is responsible for their own income tax, USC, and PRSI, and will register with the Revenue Commissioners as required. The Handler will indemnify UniBlueprint against any tax or social insurance liability assessed on UniBlueprint in respect of payments under this Agreement, other than any amount arising from UniBlueprint\'s own failure to operate a deduction it was legally obliged to operate.'),
    S('2.8', 'The Handler is not entitled to holiday pay, sick pay, pension contributions, notice, or redundancy from UniBlueprint.'),

    CL('3', 'Eligibility and vetting'),
    S('3.1', 'The Handler warrants that they are aged 18 or over and that the information in their application is true.'),
    S('3.2', 'The Handler will complete UniBlueprint\'s Handler training before accepting a first Assignment, and any refresher training reasonably required.'),
    S('3.3', 'Where the Handler will or may review submissions from a person under the age of 18, the Handler must hold current Garda vetting under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016, obtained through UniBlueprint. The Handler must not accept such an Assignment until vetting is in place. This requirement cannot be waived.'),
    S('3.4', 'The Handler will comply with the UniBlueprint Safeguarding and Code of Conduct Policy, which forms part of this Agreement.'),
    S('3.5', 'The Handler must disclose immediately any charge or conviction for a criminal offence and any finding of academic misconduct or professional misconduct.'),

    CL('4', 'Standards and delivery'),
    S('4.1', 'For each accepted Assignment the Handler will:'),
    L('a', 'complete the Deliverable to the Quality Standard;'),
    L('b', 'deliver it through the Platform by the deadline shown when the Assignment was accepted, which will be no less than the standard turnaround of forty-eight (48) hours from acceptance, or the same day where the Member has purchased the premium tier;'),
    L('c', 'produce original work, and not plagiarise, copy from another Member\'s submission, or reuse another Handler\'s output;'),
    L('d', 'not fabricate any qualification, experience, or achievement in a Member\'s document; and'),
    L('e', 'tell UniBlueprint promptly if they cannot meet a deadline.'),
    S('4.2', 'The Handler may use generative artificial intelligence tools only where UniBlueprint has expressly permitted it in writing for the relevant service, and never by uploading a Member\'s personal data to a tool that is not on UniBlueprint\'s approved list. Undisclosed use of an unapproved tool is a material breach.'),
    S('4.3', 'UniBlueprint reviews Deliverables against the Quality Standard before release to the Member. Where a Deliverable does not meet the Quality Standard, UniBlueprint will return it with reasons and the Handler will revise it once at no additional fee within the time reasonably specified.'),
    S('4.4', 'Where a Member raises an upheld quality issue under the Refund Policy, the Handler will provide one revision at no additional fee. If a full refund is then made to the Member, the Service Fee for that Assignment is not payable, or if already paid, is deducted from the next payment. No deduction is made where the issue arose from incomplete information supplied by the Member or from an act or omission of UniBlueprint.'),

    CL('5', 'Confidentiality and member information'),
    S('5.1', 'Member submissions contain personal and sometimes sensitive information. The Handler will:'),
    L('a', 'access only the information needed for the Assignment they are working on;'),
    L('b', 'not copy, download, screenshot, store, or transmit Member information outside the Platform, except where the Platform expressly provides for it;'),
    L('c', 'not discuss a Member\'s submission with anyone, including other Handlers, except through UniBlueprint\'s supervision channels;'),
    L('d', 'not contact a Member outside the Platform;'),
    L('e', 'not use Member information for any purpose other than completing the Assignment; and'),
    L('f', 'delete any local copy immediately on completion of the Assignment.'),
    S('5.2', 'The Handler will not disclose UniBlueprint\'s confidential information, including the Quality Standard, training materials, member numbers, commercial terms, and the terms of this Agreement.'),
    S('5.3', 'Clause 5.1 continues indefinitely. Clause 5.2 continues for three (3) years after termination.'),
    S('5.4', 'If the Handler personally knows a Member whose submission they are offered, the Handler must decline that Assignment and tell UniBlueprint.'),

    CL('6', 'Data protection'),
    S('6.1', 'In handling Member personal data the Handler acts as a processor on behalf of UniBlueprint and will process it only on UniBlueprint\'s documented instructions.'),
    S('6.2', 'The Handler will comply with the Data Processing Terms issued by UniBlueprint, which form part of this Agreement, and with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018.'),
    S('6.3', 'The Handler will notify UniBlueprint immediately, and in any event within twenty-four (24) hours, of any actual or suspected personal data breach, including any lost or stolen device on which Member information was held.'),
    S('6.4', 'The Handler will use a device that is password-protected and kept up to date, and will not work on Assignments on a shared or public computer.'),

    CL('7', 'Intellectual property'),
    S('7.1', 'All intellectual property in each Deliverable belongs to UniBlueprint from the moment it is created. The Handler assigns to UniBlueprint, with full title guarantee, all present and future rights in every Deliverable, including copyright under the Copyright and Related Rights Act 2000.'),
    S('7.2', 'The Handler waives all moral rights in the Deliverables so far as the law allows.'),
    S('7.3', 'The Handler will not retain, reuse, publish, or include any Deliverable, or any part of a Member\'s submission, in a portfolio or sample of work.'),
    S('7.4', 'The Handler may state factually that they work or have worked as a UniBlueprint Campus Handler.'),

    CL('8', 'Payment'),
    S('8.1', 'The Handler is paid the Service Fee for each Assignment that is completed, accepted against the Quality Standard, and released to the Member. Service Fees are set out in Schedule 1.'),
    S('8.2', 'UniBlueprint will pay Service Fees for Assignments completed in a calendar month by the [15th] day of the following month, by bank transfer to the account in Schedule 2, with a statement listing each Assignment and fee.'),
    S('8.3', 'No fee is payable for an Assignment that the Handler accepts and does not complete, or that is withdrawn by the Member before the Handler begins work.'),
    S('8.4', 'UniBlueprint will reimburse expenses only where agreed in writing in advance.'),
    S('8.5', 'UniBlueprint will keep Service Fee levels under review and will give not less than thirty (30) days\' written notice of any change. A change does not affect an Assignment already accepted.'),

    CL('9', 'Conduct'),
    S('9.1', 'The Handler will treat every Member with respect and will not discriminate on any ground protected by the Equal Status Acts 2000 to 2018.'),
    S('9.2', 'The Handler will not solicit or accept any payment, gift, or benefit directly from a Member.'),
    S('9.3', 'The Handler will not offer a Member any service outside the Platform that competes with a UniBlueprint service, for the term of this Agreement and for six (6) months afterwards, where the Member was first introduced through the Platform.'),
    S('9.4', 'If a Member\'s submission discloses risk of harm to themselves or another person, the Handler will follow the escalation steps in the Safeguarding and Code of Conduct Policy and notify UniBlueprint immediately. The Handler will not attempt to counsel or advise the Member on that matter.'),
    S('9.5', 'The Handler will not bring UniBlueprint into disrepute.'),

    CL('10', 'Liability'),
    S('10.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, for fraud, or for anything that cannot lawfully be limited.'),
    S('10.2', 'The Handler will indemnify UniBlueprint against any claim, loss, or cost arising from a breach of clause 4.1(c), 4.1(d), 4.2, 5, 6, or 7.'),
    S('10.3', 'Subject to clause 10.1 and 10.2, and except in the case of wilful misconduct, the Handler\'s total liability under this Agreement is limited to the total Service Fees paid to the Handler in the six (6) months before the claim arose.'),
    S('10.4', 'UniBlueprint\'s total liability to the Handler is limited to Service Fees properly due and unpaid.'),

    CL('11', 'Term and termination'),
    S('11.1', 'This Agreement begins on the date above and continues until terminated.'),
    S('11.2', 'Either party may terminate on fourteen (14) days\' written notice, without reason.'),
    S('11.3', 'UniBlueprint may terminate or suspend immediately if the Handler breaches clause 3, 4.1(c), 4.1(d), 4.2, 5, 6, 7, or 9, commits any other material breach not remedied within seven (7) days of notice, or is the subject of a safeguarding concern pending investigation.'),
    S('11.4', 'On termination the Handler will complete any Assignment already accepted, or return it promptly if unable, will return or delete all Member information, and will be paid for Assignments completed and accepted.'),
    S('11.5', 'Clauses 2.7, 5, 6, 7, 9.3, 10, and 12 survive termination.'),

    CL('12', 'General'),
    S('12.1', 'This Agreement, with its Schedules, the Quality Standard, the Data Processing Terms, and the Safeguarding and Code of Conduct Policy, is the entire agreement between the parties on its subject matter.'),
    S('12.2', 'Any variation must be in writing, except a Service Fee change made under clause 8.5 or an update to the Quality Standard.'),
    S('12.3', 'The Handler may not assign this Agreement.'),
    S('12.4', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('12.5', 'Notices must be in writing to the addresses in Schedule 2.'),
    S('12.6', 'This Agreement is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),

    H('Schedule 1: Service Fees'),
    P('Complete one row per service the Handler is approved to deliver. Fees are per completed and accepted Assignment.'),
    TABLE(
      ['Service', 'Member price (standard)', 'Handler Service Fee'],
      [
        ['CV Optimisation', '€20', '€[AMOUNT]'],
        ['LinkedIn Optimisation', '€20', '€[AMOUNT]'],
        ['Cover Letter Assistance', '€20', '€[AMOUNT]'],
        ['Application Form Assistance', 'From €20', '€[AMOUNT]'],
        ['Interview Preparation', 'From €20', '€[AMOUNT]'],
        ['Job Search Support', '€15', '€[AMOUNT]'],
        ['CAO Personal Statement', '€20', '€[AMOUNT]'],
        ['College Interview Prep', '€20', '€[AMOUNT]'],
        ['Scholarship and Grants', '€20', '€[AMOUNT]'],
        ['Course Selection Guidance', '€15', '€[AMOUNT]'],
        ['Premium tier uplift (same-day)', '+50%', '€[AMOUNT] or +[X]%'],
      ],
      [1.4, 1, 1]
    ),
    P('Note: during September 2026 Member prices are discounted by 50%. Handler Service Fees are not reduced by that promotion.', { italic: true }),

    H('Schedule 2: Handler details'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Institution', '[UNIVERSITY / COLLEGE]'],
        ['Course and year', '[COURSE], [YEAR]'],
        ['Services approved to deliver', '[LIST]'],
        ['Will review under-18 submissions?', '[YES: vetting required first / NO]'],
        ['Garda vetting reference', '[NUMBER / date / "not applicable"]'],
        ['Bank account name', '[NAME]'],
        ['IBAN', '[IBAN]'],
        ['PPS number', '[PPSN]'],
        ['Email', '[EMAIL]'],
        ['UniBlueprint contact', EMAIL],
      ],
      [1, 1.6]
    ),

    EXECUTION('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature, each of which is an original.'),
    SIG(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    SIG('Signed by the Handler', 'Print name'),
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// 05 CAMPUS AMBASSADOR AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════

const ambassador = () => build({
  file: '05-Campus-Ambassador-Agreement.docx',
  ref: 'UBP-AMBASSADOR-v1.0',
  title: 'UniBlueprint Campus Ambassador Agreement',
  children: [
    Title('Campus Ambassador Agreement'),
    Subtitle('Campus representation and promotion'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] ("UniBlueprint", "we", "us").`),
    S('(2)', '[AMBASSADOR FULL NAME] of [ADDRESS] (the "Ambassador", "you").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Disclosure is a legal requirement, not a courtesy',
      'The Ambassador receives benefits in exchange for promotion. Every promotional post must be clearly identifiable as advertising under the Consumer Protection Act 2007 and the ASAI Code. Clause 5 covers this. Undisclosed promotion exposes both the Ambassador and UniBlueprint to enforcement by the CCPC.'),

    H('Background'),
    P('A.  UniBlueprint is building a community of young people across Ireland ahead of its September 2026 launch.'),
    P('B.  The Ambassador is a member of the community at their institution and has agreed to represent and promote UniBlueprint there.'),
    P('C.  The Ambassador receives the benefits in Schedule 1. This is not a paid employment role.'),

    CL('1', 'Nature of the role'),
    S('1.1', 'This is a voluntary promotional role. It is not employment, not an apprenticeship, not a work placement, and not a contract for services carrying a wage.'),
    S('1.2', 'The Ambassador receives the non-cash benefits in Schedule 1 in return for the activities in Schedule 2. No salary, wage, fee, or commission is payable, and the Ambassador is not entitled to the national minimum wage, holiday pay, or any employment benefit.'),
    S('1.3', 'The Ambassador decides how much time to give and when. There are no required hours and no minimum activity. The Ambassador may stop at any time under clause 9.'),
    S('1.4', 'The Ambassador is not an officer, employee, or agent of UniBlueprint and has no authority to enter into any contract, make any commitment, incur any expense, or make any representation on UniBlueprint\'s behalf.'),
    S('1.5', 'The Ambassador is responsible for any tax arising from the benefits received. UniBlueprint makes no deduction and gives no tax advice.'),

    CL('2', 'Eligibility'),
    S('2.1', 'The Ambassador warrants that they are aged 18 or over and are enrolled at, or recently graduated from, the institution named in Schedule 2.'),
    S('2.2', 'The Ambassador will tell UniBlueprint if they cease to be connected with that institution.'),
    S('2.3', 'The Ambassador will comply with the UniBlueprint Safeguarding and Code of Conduct Policy, which forms part of this Agreement.'),
    S('2.4', 'Where an activity brings the Ambassador into contact with people under the age of 18 in a role of responsibility, Garda vetting under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016 is required before that activity takes place.'),

    CL('3', 'Institutional rules'),
    S('3.1', 'The Ambassador is responsible for complying with the rules of their institution and its students\' union, including any rule about commercial promotion, use of institutional facilities, use of institutional branding, and society activity.'),
    S('3.2', 'The Ambassador will obtain any permission required from their institution before running an event, distributing materials on campus, or using an institutional space or channel. UniBlueprint will support any application but the Ambassador must not proceed without permission.'),
    S('3.3', 'The Ambassador will not represent that UniBlueprint is endorsed by, affiliated with, or partnered with their institution unless UniBlueprint confirms in writing that a formal partnership exists.'),
    S('3.4', 'The Ambassador will not use their institution\'s name, crest, or logo in any promotional material without that institution\'s written permission.'),

    CL('4', 'What the Ambassador will do'),
    S('4.1', 'The Ambassador will carry out the activities in Schedule 2 in a manner that is honest, respectful, and consistent with UniBlueprint\'s values.'),
    S('4.2', 'The Ambassador will use only promotional materials and messaging supplied or approved by UniBlueprint, and will not create material that uses UniBlueprint branding without approval.'),
    S('4.3', 'The Ambassador will not:'),
    L('a', 'make any claim about UniBlueprint\'s services, pricing, results, or user numbers that UniBlueprint has not supplied in writing;'),
    L('b', 'guarantee any outcome to any person;'),
    L('c', 'promote UniBlueprint by spam, bulk unsolicited messaging, or any means that breaches the ePrivacy Regulations (S.I. No. 336 of 2011);'),
    L('d', 'buy followers, engagement, or reviews, or post a fake review or testimonial;'),
    L('e', 'disparage any competitor, institution, or individual; or'),
    L('f', 'promote UniBlueprint alongside alcohol, gambling, vaping, or any age-restricted product.'),
    S('4.4', 'The Ambassador will collect personal data (for example sign-up lists at an event) only using a method UniBlueprint has approved, will provide the privacy notice UniBlueprint supplies, and will pass the data to UniBlueprint promptly and then delete their own copy.'),

    CL('5', 'Advertising disclosure'),
    S('5.1', 'The Ambassador receives benefits from UniBlueprint. Every post, story, video, or other public communication that promotes UniBlueprint must make that commercial relationship clear to the audience.'),
    S('5.2', 'Disclosure must be prominent, in the same language as the post, and visible without the audience having to click "more". Acceptable forms include "#ad", "Paid partnership with UniBlueprint", or "UniBlueprint Ambassador". A tag or mention alone is not sufficient.'),
    S('5.3', 'This obligation arises under the Consumer Protection Act 2007 and the Advertising Standards Authority for Ireland Code. It applies whether or not UniBlueprint asks for a specific post.'),
    S('5.4', 'If UniBlueprint notifies the Ambassador that a post is non-compliant, the Ambassador will correct or remove it within twenty-four (24) hours.'),

    CL('6', 'Benefits'),
    S('6.1', 'UniBlueprint will provide the benefits in Schedule 1 for as long as this Agreement continues.'),
    S('6.2', 'Benefits are personal to the Ambassador, are not transferable, and have no cash value.'),
    S('6.3', 'Benefits stop on termination. A complimentary subscription ends at the end of the then-current period.'),
    S('6.4', 'Merchandise supplied remains the Ambassador\'s property on termination.'),
    S('6.5', 'UniBlueprint will reimburse pre-approved out-of-pocket expenses on production of a receipt. Expenses incurred without prior written approval are not reimbursed.'),

    CL('7', 'Intellectual property and content'),
    S('7.1', 'UniBlueprint grants the Ambassador a limited, revocable, non-exclusive licence to use the UniBlueprint name and logo solely for approved promotional activity under this Agreement.'),
    S('7.2', 'The Ambassador grants UniBlueprint a non-exclusive, royalty-free, worldwide licence to reproduce, share, and adapt content the Ambassador creates about UniBlueprint, and to use the Ambassador\'s name, image, and likeness in UniBlueprint marketing, during the term and for twelve (12) months afterwards.'),
    S('7.3', 'The Ambassador may withdraw consent to the continued use of their image for future campaigns by written notice. UniBlueprint will stop using it in new material within thirty (30) days but is not required to recall material already published or printed.'),
    S('7.4', 'The Ambassador warrants that content they create is their own and does not infringe any third party right, and that any other person appearing in it has consented.'),

    CL('8', 'Confidentiality'),
    S('8.1', 'The Ambassador will not disclose UniBlueprint\'s confidential information, including unreleased features, launch plans, pricing decisions, user numbers, and commercial terms.'),
    S('8.2', 'Where UniBlueprint shares something under embargo, the Ambassador will not publish it before the stated date.'),
    S('8.3', 'This obligation continues for two (2) years after termination.'),

    CL('9', 'Term and termination'),
    S('9.1', 'This Agreement runs for the period in Schedule 2 and may be renewed by written agreement.'),
    S('9.2', 'Either party may end it at any time on written notice, with no penalty and no notice period.'),
    S('9.3', 'UniBlueprint may end it immediately if the Ambassador breaches clause 3, 4, 5, or 8, or acts in a way that harms UniBlueprint\'s reputation.'),
    S('9.4', 'On termination the Ambassador will stop describing themselves as an Ambassador, stop using UniBlueprint branding, update or remove profile descriptions that state the role, and return or delete unused promotional materials and any personal data collected.'),
    S('9.5', 'The Ambassador is not required to delete historic posts, but must not present themselves as a current Ambassador after termination.'),
    S('9.6', 'Clauses 7.2, 8, 9.4, and 11 survive termination.'),

    CL('10', 'Liability'),
    S('10.1', 'Nothing in this Agreement limits liability for death or personal injury caused by negligence, or for fraud.'),
    S('10.2', 'The Ambassador acts on their own responsibility. UniBlueprint is not liable for any loss the Ambassador suffers in carrying out the role, including any consequence of a breach of institutional rules under clause 3.'),
    S('10.3', 'The Ambassador will indemnify UniBlueprint against any claim arising from a breach of clause 3, 4.3, 5, or 7.4.'),
    S('10.4', 'UniBlueprint maintains no insurance for the Ambassador. The Ambassador is not covered by UniBlueprint\'s policies and should not assume otherwise when organising any activity.'),

    CL('11', 'General'),
    S('11.1', 'This Agreement, with its Schedules and the Safeguarding and Code of Conduct Policy, is the entire agreement between the parties on its subject matter.'),
    S('11.2', 'Any variation must be in writing.'),
    S('11.3', 'The Ambassador may not assign this Agreement.'),
    S('11.4', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('11.5', 'This Agreement is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),

    H('Schedule 1: Benefits'),
    TABLE(
      ['Benefit', 'Detail'],
      [
        ['Complimentary Pro subscription', 'Full Pro access, free, for the term'],
        ['Ambassador merchandise', '[ITEMS, e.g. hoodie, tote, stickers]'],
        ['Early access', 'First access to new features before public release'],
        ['Reference', 'Written reference on request after 3 months of active participation'],
        ['Expenses', 'Pre-approved out-of-pocket expenses only (clause 6.5)'],
        ['Cash payment', 'None'],
      ],
      [1, 1.6]
    ),

    H('Schedule 2: Campus, activities, and term'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Institution', '[UNIVERSITY / COLLEGE]'],
        ['Course and year', '[COURSE], [YEAR]'],
        ['Term of this Agreement', '[START DATE] to [END DATE]'],
        ['Activities', 'Represent UniBlueprint on campus; share with own network; host or attend events; give feedback on the product'],
        ['Expected commitment', 'Flexible: no minimum hours'],
        ['Social handles used', '[@HANDLES]'],
        ['UniBlueprint contact', '[NAME], ' + EMAIL],
      ],
      [1, 1.6]
    ),

    EXECUTION('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature, each of which is an original.'),
    SIG(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    SIG('Signed by the Ambassador', 'Print name'),
  ],
})

module.exports = { handler, ambassador }
