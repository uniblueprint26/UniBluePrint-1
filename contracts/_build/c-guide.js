/**
 * 00: Contract Suite Guide (internal, not for signature)
 */

const { Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, build } = require('./lib')

const EMAIL = 'uniblueprintoperations@gmail.com'

const guide = () => build({
  file: '00-CONTRACT-SUITE-GUIDE.docx',
  ref: 'UBP-GUIDE-v1.0',
  title: 'UniBlueprint Contract Suite: Guide',
  children: [
    Title('Contract Suite Guide'),
    Subtitle('Internal. Do not send this document to a counterparty.'),

    NOTE('Read this first',
      'These are drafted templates, not legal advice, and no solicitor has reviewed them. They are built on Irish law and on how the UniBlueprint product actually works. Before you send any of them out for signature, have an Irish solicitor review at least documents 01, 03, and 04, and confirm the two flagged issues on page 2. Budget for one review session. It is far cheaper than fixing a signed contract later.')
,
    H('What is in the suite'),
    TABLE(
      ['#', 'Document', 'Who signs it', 'Priority'],
      [
        ['01', 'Founder Service Agreement', 'Founder', 'Sign first'],
        ['02', 'Partner Agreement', 'Lifestyle Blueprint businesses', 'Before September'],
        ['03', 'Uni Coach Agreement', 'Elevation Blueprint coaches', 'Before September'],
        ['04', 'Campus Handler Agreement', 'Foundation Blueprint reviewers', 'Before September'],
        ['05', 'Campus Ambassador Agreement', 'Campus ambassadors', 'Before September'],
        ['06', 'Marketing Contributor Agreement', 'Marketing contributors', 'On engagement'],
        ['07', 'Outreach and Partnerships Agreement', 'Outreach representatives', 'On engagement'],
        ['08', 'Legal Counsel Agreement', 'Legal lead', 'On engagement'],
        ['09', 'Finance Officer Agreement', 'Finance lead', 'On engagement'],
        ['10', 'Team Member Agreement', 'Any other internal role', 'On engagement'],
        ['11', 'Mutual NDA', 'Anyone, before a full agreement', 'As needed'],
        ['12', 'IP Assignment Deed', 'Anyone who built something already', 'Urgent'],
        ['13', 'Data Processing Terms', 'Attach to every role agreement', 'With each'],
        ['14', 'Safeguarding and Code of Conduct', 'Everyone, without exception', 'With each'],
      ],
      [0.3, 1.6, 1.6, 0.8]
    ),

    H('Two things to resolve before anything is sent'),

    CL('1', 'The coach revenue share is already public'),
    S('1.1', 'The website Join page states that Uni Coaches "Keep 85% of every booking". That is a public commitment made to every coach who has read it.'),
    S('1.2', 'Document 03 is drafted at 85% coach / 15% UniBlueprint to match. Clause 7 then gives you a mechanism to confirm or change the rate by 25 September 2026, with the coach free to walk away if the change is less favourable.'),
    S('1.3', 'If you want a different split, change the website first. Issuing a contract at a worse rate than your published promise is the kind of inconsistency that loses coaches and invites a consumer-protection complaint.'),

    CL('2', 'You are not incorporated yet'),
    S('2.1', 'Every template carries [COMPANY NUMBER] and [REGISTERED OFFICE] placeholders. Until UniBlueprint Limited exists, there is no company to contract with.'),
    S('2.2', 'Document 01 clause 2 handles this: you sign personally and for the company to be formed, and the company ratifies within thirty days of incorporation under section 45 of the Companies Act 2014.'),
    S('2.3', 'Practical order: incorporate, then fill the company number and registered office into every template, then issue. If you must issue before incorporation, use the same pre-incorporation wording from document 01 clause 2 in each contract, and ratify them all at the first board meeting.'),

    H('Employment status: the single biggest legal risk'),
    P('Every role in this suite is drafted as independent contracting. Irish law decides status on substance, not on the label in the contract. Since Revenue Commissioners v Karshan (Midlands) Ltd t/a Domino\'s Pizza [2023] IESC 24, the test asks five questions: is there a wage-work bargain, is there mutuality of obligation, does the employer control the work, do the facts as a whole point to self-employment, and does any legislation change the answer.'),
    P('If the WRC, Revenue, or a court decides a role is really employment, the consequences fall on UniBlueprint: unpaid employer PRSI with interest, holiday pay under the Organisation of Working Time Act 1997, minimum wage under the National Minimum Wage Act 2000, and potential unfair dismissal exposure.'),
    TABLE(
      ['Role', 'Risk', 'Why', 'What keeps it safe'],
      [
        ['Campus Handler', 'HIGH', 'You train them, set the process, quality-check output, supply the systems', 'Genuine right to refuse work, no rosters, no set hours, real substitution right'],
        ['Marketing Contributor', 'MEDIUM', 'Regular briefs can look like a job', 'Brief-by-brief acceptance, they use own tools, they work for others'],
        ['Outreach Representative', 'MEDIUM', 'Targets and territory can look like supervision', 'Targets stay indicative not binding, no set hours'],
        ['Legal / Finance', 'MEDIUM', 'Ongoing retained role', 'Genuine autonomy, own tools, other clients'],
        ['Uni Coach', 'LOW', 'They set prices, own clients, own insurance, own equipment', 'Do not set their prices or roster them'],
        ['Ambassador', 'LOW', 'Non-cash benefits, voluntary, no hours', 'Never pay cash, never set required hours'],
      ],
      [0.9, 0.5, 1.5, 1.5]
    ),
    P('Ask an employment solicitor to review document 04 specifically. It is the one most likely to be recharacterised.', { bold: true }),

    H('Garda vetting: start this now'),
    S('a', 'UniBlueprint serves people under 18 through Course Compass, CAO personal statements, college interview prep, and course selection guidance.'),
    S('b', 'Under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016 it is a criminal offence to permit a person to do relevant work with children without a vetting disclosure.'),
    S('c', 'UniBlueprint must first register as a relevant organisation with the National Vetting Bureau before it can seek vetting for anyone. That registration takes time. Begin it now.'),
    S('d', 'Until vetting is in place, either restrict those services to over-18s and enforce it in the product, or do not run them.'),
    S('e', 'Note the tension in your current documents: the Terms of Service say users must be 18 or over, but Course Compass and CAO services are aimed at 5th and 6th year students. Resolve that before launch. Either the age gate is real and enforced, or vetting is required.'),

    H('What to fill in on every document'),
    TABLE(
      ['Placeholder', 'Where it comes from'],
      [
        ['[COMPANY NUMBER]', 'CRO certificate of incorporation'],
        ['[REGISTERED OFFICE]', 'CRO registered address'],
        ['[DATE]', 'Date of signature'],
        ['[THRESHOLD]', 'Your dual-authorisation limit: suggest €500 to start'],
        ['Schedule fee and rate fields', 'Your commercial decision: never leave blank'],
        ['[AMOUNT] in insurance clauses', 'Typical: €1m public liability, €250k professional indemnity'],
      ],
      [1, 2]
    ),

    H('Sequence to work through'),
    S('1', 'Incorporate UniBlueprint Limited. Get the company number and registered office.'),
    S('2', 'Sign document 01 (Founder), including the clause 6 IP assignment. This puts the website, app, and brand into the company.'),
    S('3', 'Identify everyone who built anything before now and get document 12 (IP Assignment Deed) signed by each of them.'),
    S('4', 'Register with the National Vetting Bureau.'),
    S('5', 'Have a solicitor review 01, 03, and 04.'),
    S('6', 'Complete every schedule with real numbers.'),
    S('7', 'Issue 02 to partners and 03 to coaches, each with 13 and 14 attached.'),
    S('8', 'Issue 04 and 05 as handlers and ambassadors are appointed.'),
    S('9', 'Issue 06 to 10 to internal team as they join.'),
    S('10', 'Keep a signed-contract register. Document 08 clause 1.1(e) makes that Legal\'s job.'),

    H('The September deadlines you set'),
    TABLE(
      ['Date', 'What happens', 'Where it is written'],
      [
        ['20th of trial month', 'Partner must confirm or make contact with their UBP contact', 'Doc 02, clause 3'],
        ['5 days before that', 'UniBlueprint must send a reminder, or the date extends', 'Doc 02, clause 3.3'],
        ['End of trial month', 'If no contact, listing pauses. No charge, no debt.', 'Doc 02, clause 3.4'],
        ['25 September 2026', 'UniBlueprint confirms the coach revenue share from 1 October', 'Doc 03, clause 7.2'],
        ['Within 14 days after', 'Coach may exit without penalty if the rate is worse', 'Doc 03, clause 7.3'],
        ['30 September 2026', 'September trial pricing ends', 'Website and app'],
        ['1 October 2026', 'Standard pricing applies', 'Website and app'],
      ],
      [1, 1.8, 1]
    ),

    H('Signing'),
    S('a', 'Electronic signature is valid in Ireland under the Electronic Commerce Act 2000 and eIDAS Regulation (EU) 910/2014. A reputable e-signature platform is fine for everything except the deeds.'),
    S('b', 'Documents 01 and 12 are executed as deeds and need a witness who is present, is not a party, and is not a family member of a party. Use wet ink for these unless your e-signature platform properly supports witnessed deeds.'),
    S('c', 'Keep the signed original. Store a copy in the contract register with the counterparty name, date, document version, and any schedule values.'),
    S('d', 'Anyone under 18 cannot be bound by most of these agreements. Do not appoint an under-18 to a paid role without advice.'),

    H('Keeping it consistent with the product'),
    P('These contracts reference what the website and app actually say. If you change any of the following, the contracts must change too:'),
    B('The coach revenue share on the Join page (currently 85%)'),
    B('The refund and cancellation terms in the Refund Policy (24-hour cancellation, 48-hour quality window)'),
    B('Service prices on the Pricing page (Foundation €15 to €20, Elevation €20 to €40)'),
    B('The September trial dates (ends 30 September 2026, standard pricing 1 October 2026)'),
    B('The retention periods in the Privacy Policy (payment records 7 years)'),
    B('The 18-plus eligibility rule in the Terms of Service'),
    P('Document 08 clause 1.1(b) makes keeping these aligned a named responsibility.'),

    H('Questions'),
    P('Contact: ' + EMAIL),
  ],
})

module.exports = { guide }
