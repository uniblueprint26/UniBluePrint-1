/**
 * Cross-cutting instruments:
 *   11 Mutual Non-Disclosure Agreement
 *   12 Intellectual Property Assignment Deed
 *   13 Data Processing Terms
 *   14 Safeguarding and Code of Conduct Policy
 */

const { Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, build } = require('./lib')

const CO = 'UniBlueprint Limited'
const EMAIL = 'uniblueprintoperations@gmail.com'

// ═══════════════════════════════════════════════════════════════════════════
// 11 MUTUAL NDA
// ═══════════════════════════════════════════════════════════════════════════

const nda = () => build({
  file: '11-Mutual-NDA.docx',
  ref: 'UBP-NDA-v1.0',
  title: 'UniBlueprint Mutual Non-Disclosure Agreement',
  children: [
    Title('Mutual Non-Disclosure Agreement'),
    Subtitle('For discussions before a full agreement is signed'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE].`),
    S('(2)', '[OTHER PARTY NAME] of [ADDRESS].'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('When to use this',
      'Use before sharing anything commercially sensitive with a prospective partner, coach, investor, adviser, or hire, where no full agreement is signed yet. Once a full agreement is signed, its own confidentiality clause takes over and this one falls away for that subject matter.'),

    CL('1', 'Purpose'),
    S('1.1', 'The parties wish to explore [DESCRIBE, e.g. a possible partnership on Lifestyle Blueprint] (the "Purpose") and may each disclose confidential information to the other for that Purpose.'),

    CL('2', 'Confidential Information'),
    S('2.1', '"Confidential Information" means any information disclosed by one party (the "Discloser") to the other (the "Recipient") in connection with the Purpose, in any form, whether or not marked confidential, including business plans, financial information, pricing, user and member numbers, product plans, source code, designs, marketing strategy, partner and coach lists, and the existence and content of the parties\' discussions.'),
    S('2.2', 'Confidential Information does not include information that:'),
    L('a', 'is or becomes public other than through a breach of this Agreement;'),
    L('b', 'the Recipient already lawfully held without a duty of confidence;'),
    L('c', 'the Recipient receives from a third party free to disclose it; or'),
    L('d', 'the Recipient independently develops without using the Discloser\'s Confidential Information.'),

    CL('3', 'Obligations'),
    S('3.1', 'The Recipient will:'),
    L('a', 'keep the Confidential Information secret and use it only for the Purpose;'),
    L('b', 'protect it with at least the care it uses for its own confidential information, and in any event with reasonable care;'),
    L('c', 'disclose it only to those of its personnel and professional advisers who need it for the Purpose and who are bound by equivalent obligations, and remain responsible for their compliance; and'),
    L('d', 'not copy or record it beyond what the Purpose requires.'),
    S('3.2', 'The Recipient may disclose Confidential Information where required by law, court order, or a regulator, provided it gives the Discloser notice first where lawful and discloses only what is required.'),
    S('3.3', 'Nothing in this Agreement restricts a protected disclosure under the Protected Disclosures Act 2014 or the reporting of a criminal offence or a child protection concern.'),

    CL('4', 'No licence, no obligation'),
    S('4.1', 'Nothing in this Agreement transfers or licenses any intellectual property. All Confidential Information remains the property of the Discloser.'),
    S('4.2', 'Neither party is obliged to disclose anything, to proceed with the Purpose, or to enter into any further agreement.'),
    S('4.3', 'Neither party makes any warranty as to the accuracy or completeness of Confidential Information disclosed.'),

    CL('5', 'Return and destruction'),
    S('5.1', 'On written request, or when the Purpose ends, the Recipient will return or destroy the Confidential Information and any copies, and confirm in writing that it has done so.'),
    S('5.2', 'The Recipient may retain one copy where required by law or professional rules, or where held in routine electronic backup that is not readily accessible, and this Agreement continues to apply to it.'),

    CL('6', 'Data protection'),
    S('6.1', 'Where Confidential Information includes personal data, each party will comply with the General Data Protection Regulation (EU) 2016/679 and the Data Protection Act 2018 and will process it only for the Purpose.'),
    S('6.2', 'Neither party will disclose to the other any personal data of its members, users, or customers except where strictly necessary for the Purpose and on a lawful basis.'),

    CL('7', 'Term'),
    S('7.1', 'This Agreement begins on the date above and the obligations of confidentiality continue for three (3) years from the date of disclosure, and indefinitely in respect of trade secrets and personal data.'),
    S('7.2', 'Where the parties later sign a full agreement covering the same subject matter, that agreement\'s confidentiality provisions replace this one for information disclosed under it.'),

    CL('8', 'Remedies'),
    S('8.1', 'The parties acknowledge that damages may not be an adequate remedy for breach and that injunctive relief may be sought without proving actual damage.'),

    CL('9', 'General'),
    S('9.1', 'This Agreement is the entire agreement between the parties on its subject matter.'),
    S('9.2', 'Any variation must be in writing and signed.'),
    S('9.3', 'Neither party may assign this Agreement without the other\'s written consent.'),
    S('9.4', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('9.5', 'This Agreement is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),

    EXECUTION('Signed by the parties on the date first written above. This Agreement may be signed in counterparts and by electronic signature.'),
    SIG(`For and on behalf of ${CO}`, 'Print name', { position: true }),
    SIG('For and on behalf of the other party', 'Print name', { position: true }),
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// 12 IP ASSIGNMENT DEED
// ═══════════════════════════════════════════════════════════════════════════

const ipDeed = () => build({
  file: '12-IP-Assignment-Deed.docx',
  ref: 'UBP-IPDEED-v1.0',
  title: 'UniBlueprint Intellectual Property Assignment Deed',
  children: [
    Title('Intellectual Property Assignment Deed'),
    Subtitle('For work already created, before a full agreement was in place'),

    H('Parties'),
    S('(1)', `${CO}, a company incorporated in Ireland (registered number [COMPANY NUMBER]) whose registered office is at [REGISTERED OFFICE] (the "Company").`),
    S('(2)', '[ASSIGNOR FULL NAME] of [ADDRESS] (the "Assignor").'),
    P('Dated: [DATE]', { bold: true }),

    NOTE('Who needs to sign this',
      'Anyone who made something for UniBlueprint before signing a full agreement: whoever wrote code, designed the logo, took photographs, drew illustrations, wrote copy, or built a feature. Under the Copyright and Related Rights Act 2000 a contractor keeps copyright in what they make unless they assign it in writing. Without this deed, that person still owns it, whatever was paid. Investors and acquirers check for exactly this.'),

    H('Background'),
    P('A.  The Assignor has created or contributed to the works described in the Schedule (the "Works") for or in connection with the Company\'s business.'),
    P('B.  The Works were created before, or otherwise than under, a written agreement assigning intellectual property to the Company.'),
    P('C.  The Assignor has agreed to assign all intellectual property in the Works to the Company on the terms of this Deed.'),

    CL('1', 'Assignment'),
    S('1.1', 'In consideration of the sum of €[AMOUNT] (receipt of which the Assignor acknowledges) and the other benefits received by the Assignor from the Company, the Assignor assigns to the Company, with full title guarantee and free of all encumbrances, all right, title, and interest in the Works and all intellectual property rights in them, absolutely, throughout the world, for the full term of those rights and any renewal or extension.'),
    S('1.2', 'The rights assigned include copyright and related rights under the Copyright and Related Rights Act 2000, database rights, design rights whether registered or unregistered, rights in trade marks and goodwill, rights in know-how and confidential information, and all rights of action and remedies in respect of any past, present, or future infringement.'),
    S('1.3', 'The assignment takes effect on the date of this Deed and, in respect of any right not capable of present assignment, takes effect as an assignment of future rights that vests automatically when the right comes into existence.'),

    CL('2', 'Moral rights'),
    S('2.1', 'The Assignor irrevocably waives, so far as the law allows, all moral rights in the Works, including the right to be identified as author and the right to object to derogatory treatment, under Chapter 7 of Part II of the Copyright and Related Rights Act 2000.'),
    S('2.2', 'The waiver extends to the Company\'s licensees and successors in title.'),

    CL('3', 'Warranties'),
    S('3.1', 'The Assignor warrants that:'),
    L('a', 'they are the sole author and owner of the Works and are free to assign them;'),
    L('b', 'the Works are original and do not infringe any third party right;'),
    L('c', 'no other person has any claim to or interest in the Works;'),
    L('d', 'the Works have not been assigned, licensed, or encumbered to anyone else;'),
    L('e', 'where the Works incorporate any third party material, including any font, stock asset, library, template, or artificial-intelligence-generated element, that material is identified in the Schedule together with its licence, and the licence permits the Company\'s intended commercial use; and'),
    L('f', 'the Works were not created using any equipment, facility, or resource of an employer, university, or third party in circumstances where that party could claim rights in them.'),
    S('3.2', 'The Assignor will indemnify the Company against any loss arising from a breach of clause 3.1.'),

    CL('4', 'Further assurance'),
    S('4.1', 'The Assignor will, at the Company\'s cost and on request, sign any document and do anything else reasonably required to give full effect to this Deed or to register the Company as owner of any right assigned, including any assignment required by a domain registrar, app store, or intellectual property office.'),
    S('4.2', 'The Assignor irrevocably appoints the Company as its attorney to sign any such document in the Assignor\'s name if the Assignor fails to do so within fourteen (14) days of a written request.'),

    CL('5', 'Delivery of materials'),
    S('5.1', 'The Assignor will deliver to the Company all originals, source files, working files, editable formats, passwords, and access credentials relating to the Works, and will retain no copy other than as the Company agrees in writing.'),

    CL('6', 'General'),
    S('6.1', 'This Deed is the entire agreement between the parties on its subject matter.'),
    S('6.2', 'Any variation must be in writing and executed as a deed.'),
    S('6.3', 'If any provision is held unenforceable it is severed and the remainder continues.'),
    S('6.4', 'This Deed is governed by the laws of Ireland and the parties submit to the exclusive jurisdiction of the courts of Ireland.'),

    H('Schedule: The Works'),
    P('Describe precisely. A vague description weakens the assignment.'),
    TABLE(
      ['Work', 'Description', 'Date created', 'Third party material and licence'],
      [
        ['[e.g. UniBlueprint logo]', '[DETAIL]', '[DATE]', '[e.g. font "X" under licence Y / none]'],
        ['[e.g. app screen designs]', '[DETAIL]', '[DATE]', '[DETAIL / none]'],
        ['[e.g. website source code]', '[DETAIL]', '[DATE]', '[open source libraries: list / none]'],
        ['[e.g. photographs]', '[DETAIL]', '[DATE]', '[model releases held? / none]'],
      ],
      [1, 1.3, 0.7, 1.2]
    ),

    EXECUTION('Executed and delivered as a deed on the date first written above.'),
    SIG(`Executed as a deed for and on behalf of ${CO}`, 'Print name', { position: true }),
    SIG('Signed and delivered as a deed by the Assignor', 'Print name', { witness: true }),
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// 13 DATA PROCESSING TERMS
// ═══════════════════════════════════════════════════════════════════════════

const dpa = () => build({
  file: '13-Data-Processing-Terms.docx',
  ref: 'UBP-DPA-v1.0',
  title: 'UniBlueprint Data Processing Terms',
  children: [
    Title('Data Processing Terms'),
    Subtitle('Article 28 GDPR terms: incorporated into role agreements'),

    P('These Terms apply where a Handler, Coach, Contributor, Representative, Team Member, or other contractor (the "Processor") processes personal data on behalf of ' + CO + ' (the "Controller"). They form part of that person\'s agreement with the Controller and satisfy Article 28(3) of the General Data Protection Regulation (EU) 2016/679 ("GDPR").', { grey: true }),

    NOTE('These are not optional boilerplate',
      'Article 28(3) GDPR requires a written contract with every processor containing these specific terms. Without it, the Controller is in breach regardless of how carefully the data is actually handled. Attach these Terms to every role agreement where the person touches member data.'),

    CL('1', 'Roles'),
    S('1.1', 'The Controller determines the purposes and means of processing personal data relating to its members and users. The Processor processes that personal data only on the Controller\'s behalf.'),
    S('1.2', 'Where the Processor determines its own purposes for personal data, for example a Coach keeping their own client records, the Processor acts as an independent controller for that processing and these Terms do not apply to it. The Processor must comply with the GDPR in its own right for that processing.'),

    CL('2', 'Scope of processing'),
    S('2.1', 'The subject matter, duration, nature, purpose, types of personal data, and categories of data subject are set out in the Annex.'),

    CL('3', 'Processor obligations'),
    S('3.1', 'The Processor will process personal data only on the Controller\'s documented instructions, including as to transfers outside the European Economic Area, unless required otherwise by law, in which case the Processor will inform the Controller before processing unless the law prohibits it.'),
    S('3.2', 'The Processor will immediately inform the Controller if it considers an instruction infringes the GDPR or other data protection law.'),
    S('3.3', 'The Processor will ensure that any person authorised to process the personal data is bound by an obligation of confidentiality and has received appropriate guidance.'),
    S('3.4', 'The Processor will implement appropriate technical and organisational measures under Article 32 GDPR, including as a minimum:'),
    L('a', 'access to personal data only through Controller-provided systems and accounts;'),
    L('b', 'a strong unique password and multi-factor authentication on every account used;'),
    L('c', 'device encryption, an automatic screen lock, and up-to-date operating system and security software;'),
    L('d', 'no storage of personal data on a personal device, personal cloud account, personal email account, or removable media;'),
    L('e', 'no processing of personal data on a shared or public computer;'),
    L('f', 'no transmission of personal data over an unsecured channel; and'),
    L('g', 'secure deletion of any local copy immediately once the task is complete.'),
    S('3.5', 'The Processor will not engage another processor without the Controller\'s prior specific or general written authorisation. Where authorised, the Processor will impose the same obligations by written contract and remains fully liable to the Controller for that sub-processor\'s performance.'),
    S('3.6', 'The Processor will assist the Controller, by appropriate technical and organisational measures and so far as possible, in responding to requests to exercise data subject rights under Chapter III GDPR, including access, rectification, erasure, restriction, portability, and objection. The Processor will forward any request it receives directly to the Controller within two (2) business days and will not respond to it itself.'),
    S('3.7', 'The Processor will assist the Controller in complying with Articles 32 to 36 GDPR, covering security, breach notification, data protection impact assessments, and prior consultation, taking into account the nature of processing and the information available to it.'),
    S('3.8', 'At the Controller\'s choice, the Processor will delete or return all personal data at the end of the provision of services and delete existing copies, unless retention is required by law.'),
    S('3.9', 'The Processor will make available to the Controller all information necessary to demonstrate compliance with Article 28 and will allow for and contribute to audits and inspections conducted by the Controller or an auditor it mandates, on reasonable notice.'),

    CL('4', 'Personal data breach'),
    S('4.1', 'The Processor will notify the Controller without undue delay, and in any event within twenty-four (24) hours, after becoming aware of a personal data breach.'),
    S('4.2', 'The notification will describe, so far as known, the nature of the breach, the categories and approximate number of data subjects and records affected, the likely consequences, and the measures taken or proposed.'),
    S('4.3', 'A lost or stolen device on which personal data was held, an account compromise, and an email sent to the wrong recipient are each a personal data breach and must be reported.'),
    S('4.4', 'The Processor will not notify the Data Protection Commission, any other supervisory authority, or any data subject unless the Controller directs it to.'),
    S('4.5', 'The Processor will take all reasonable steps to contain and remediate the breach and will co-operate fully with the Controller\'s investigation.'),

    CL('5', 'Restrictions'),
    S('5.1', 'The Processor will not:'),
    L('a', 'use personal data for its own purposes, including marketing, research, training a model, or portfolio use;'),
    L('b', 'upload personal data to any artificial intelligence or third party tool that is not on the Controller\'s written approved list;'),
    L('c', 'contact a data subject other than through the Controller\'s systems and for the authorised purpose;'),
    L('d', 'combine the personal data with any other dataset; or'),
    L('e', 'retain personal data after the task is complete.'),
    S('5.2', 'The Processor will access only the minimum personal data needed for the specific task and will not browse records out of curiosity. Access is logged and monitored.'),

    CL('6', 'International transfers'),
    S('6.1', 'The Processor will not transfer personal data outside the European Economic Area without the Controller\'s prior written authorisation and an appropriate Chapter V GDPR transfer mechanism.'),
    S('6.2', 'Accessing personal data from outside the European Economic Area is a transfer for this purpose. The Processor will notify the Controller before working from outside the EEA.'),

    CL('7', 'Liability'),
    S('7.1', 'The Processor will indemnify the Controller against any fine, compensation, loss, or cost arising from the Processor\'s breach of these Terms or of its obligations under the GDPR.'),
    S('7.2', 'Nothing in these Terms limits either party\'s liability to a data subject or to a supervisory authority.'),

    H('Annex: Details of processing'),
    TABLE(
      ['Item', 'Detail'],
      [
        ['Subject matter', 'Processing of member personal data to deliver UniBlueprint services'],
        ['Duration', 'For the term of the role agreement, and only while a task is in progress'],
        ['Nature and purpose', 'Reviewing submissions, delivering services, communicating with members, and administering the platform'],
        ['Types of personal data', 'Name, email, phone, institution, course, year, employment and education history, career documents, submission content, session records, and correspondence'],
        ['Special category data', 'Not processed by default. Health, disability, or other special category data may incidentally appear in a member submission and must be handled with particular care and never copied out of the platform.'],
        ['Categories of data subject', 'UniBlueprint members and users, including persons aged under 18 where applicable'],
        ['Approved sub-processors', '[NONE / LIST]'],
        ['Approved tools', '[LIST, e.g. platform only. Any AI tool must be listed here or it is not approved.]'],
        ['Retention', 'Delete local copies immediately on task completion. Platform retention follows the UniBlueprint Privacy Policy.'],
        ['Controller contact', EMAIL],
      ],
      [1, 2]
    ),

    EXECUTION('Acknowledged as part of the signatory\'s role agreement with ' + CO + '.'),
    SIG('Acknowledged by the Processor', 'Print name'),
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// 14 SAFEGUARDING AND CODE OF CONDUCT POLICY
// ═══════════════════════════════════════════════════════════════════════════

const safeguarding = () => build({
  file: '14-Safeguarding-and-Code-of-Conduct.docx',
  ref: 'UBP-SAFEGUARD-v1.0',
  title: 'UniBlueprint Safeguarding and Code of Conduct Policy',
  children: [
    Title('Safeguarding and Code of Conduct Policy'),
    Subtitle('Applies to every person acting for UniBlueprint'),

    P('This Policy forms part of every UniBlueprint role agreement. It applies to the Founder, team members, Campus Handlers, Uni Coaches, Campus Ambassadors, outreach representatives, and any contractor or volunteer acting for UniBlueprint.', { grey: true }),

    NOTE('Vetting is a legal requirement, not a policy choice',
      'Under the National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016 it is a criminal offence for an organisation to permit a person to undertake relevant work with children or vulnerable persons without first obtaining vetting disclosure. UniBlueprint must be registered with the National Vetting Bureau before it can seek vetting for its own people. Start that registration now if it is not already in place.'),

    CL('1', 'Why this Policy exists'),
    S('1.1', 'UniBlueprint serves young people in Ireland. Some are adults. Some, including those using Course Compass, CAO, and college-application services, are under 18.'),
    S('1.2', 'Everyone acting for UniBlueprint has a responsibility to keep those people safe, to behave appropriately, and to escalate concerns rather than handle them alone.'),
    S('1.3', 'This Policy sets the minimum standard. Breach of it is a material breach of the person\'s agreement with UniBlueprint.'),

    CL('2', 'Garda vetting'),
    S('2.1', 'Any person whose role involves necessary and regular contact with a person under the age of 18, or with a vulnerable person, must hold a current vetting disclosure obtained through UniBlueprint before that contact begins.'),
    S('2.2', 'Roles requiring vetting include, at minimum:'),
    L('a', 'any Coach who accepts a booking from a person under 18;'),
    L('b', 'any Handler who reviews a submission from a person under 18;'),
    L('c', 'any Ambassador or team member running an activity involving under-18s; and'),
    L('d', 'anyone with moderation or direct-message access to community spaces used by under-18s.'),
    S('2.3', 'Vetting must be renewed in line with UniBlueprint\'s renewal cycle and re-vetting must be completed before expiry.'),
    S('2.4', 'A person must not begin relevant work while vetting is pending. There is no exception and no waiver.'),
    S('2.5', 'Where a role is restricted to over-18s only, that restriction must be enforced in the product, not assumed. If the restriction cannot be enforced technically, vetting is required.'),

    CL('3', 'Child protection reporting'),
    S('3.1', 'UniBlueprint operates in line with the Children First Act 2015 and the Children First: National Guidance for the Protection and Welfare of Children.'),
    S('3.2', 'Certain roles are "mandated persons" under Schedule 2 of the Children First Act 2015 and carry a legal duty to report a child protection concern above the threshold to Tusla. Where a person holds such a role, that duty applies to them personally and is not discharged by reporting internally.'),
    S('3.3', 'Everyone else must report any child protection concern immediately to the UniBlueprint Designated Liaison Person named in the Annex, who will make any report required to Tusla.'),
    S('3.4', 'A concern must be reported even if the person is unsure, and even if the information came second hand. It is not the reporter\'s job to investigate or to decide whether the concern is well founded.'),
    S('3.5', 'No person will suffer any detriment for making a report in good faith.'),

    CL('4', 'Risk of harm and crisis disclosure'),
    S('4.1', 'If a member discloses, or a submission indicates, that they may be at risk of harming themselves or another person, the following steps apply immediately:'),
    L('a', 'do not attempt to counsel, diagnose, or advise on the matter;'),
    L('b', 'if there is an immediate risk to life, contact the emergency services on 112 or 999;'),
    L('c', 'signpost the member to the free support services listed in the app, including Samaritans on 116 123 and Pieta House on 1800 247 247;'),
    L('d', 'notify the Designated Liaison Person immediately, and in any event the same day; and'),
    L('e', 'record only what is necessary, factually, and in the platform.'),
    S('4.2', 'Do not promise confidentiality to a member who discloses risk of harm. Explain that the concern must be passed on.'),
    S('4.3', 'Support the member calmly and without judgement. Do not minimise what they have said and do not tell them they are overreacting.'),

    CL('5', 'Professional boundaries'),
    S('5.1', 'Everyone acting for UniBlueprint will:'),
    L('a', 'communicate with members only through UniBlueprint systems, and not through personal phone numbers, personal social accounts, or private messaging;'),
    L('b', 'keep communication relevant to the service being provided;'),
    L('c', 'never arrange to meet a member privately or one-to-one in a non-public setting, and never at a private residence;'),
    L('d', 'never pursue or accept a romantic or sexual relationship with a member met through UniBlueprint;'),
    L('e', 'never give or accept a gift, loan, or money to or from a member;'),
    L('f', 'never take, request, or share a photograph or recording of a member without documented consent, and never of a person under 18 without the consent of a parent or guardian;'),
    L('g', 'never share personal contact details, home address, or social media with a member; and'),
    L('h', 'never be alone with a person under 18, whether in person or in a private online session.'),
    S('5.2', 'In-person sessions must take place in an appropriate professional or public setting. Where a Coach delivers in-person training, the venue must be a recognised commercial or sporting facility.'),
    S('5.3', 'If a member attempts to move the relationship outside these boundaries, decline politely and report it.'),

    CL('6', 'Respect and equality'),
    S('6.1', 'Everyone will treat members and colleagues with dignity and respect, and will not discriminate, harass, or victimise on any ground protected by the Employment Equality Acts 1998 to 2015 or the Equal Status Acts 2000 to 2018, being gender, civil status, family status, sexual orientation, religion, age, disability, race, and membership of the Traveller community.'),
    S('6.2', 'Bullying, harassment, sexual harassment, and abuse of any kind are prohibited and will result in immediate termination.'),
    S('6.3', 'Use inclusive language. Refer to the community as "young people". Do not assume anyone\'s pathway, background, gender, or circumstances.'),
    S('6.4', 'Anyone who experiences or witnesses harassment should report it to the Founder or the Designated Liaison Person. Reports are taken seriously and handled confidentially so far as possible.'),

    CL('7', 'Scope of competence'),
    S('7.1', 'No one will give advice outside their competence and qualifications.'),
    S('7.2', 'In particular, no one will provide medical, psychological, psychiatric, therapeutic, financial, investment, immigration, or legal advice unless they are qualified, registered, and insured to do so.'),
    S('7.3', 'Where a member needs support outside the scope of the service, refer them to an appropriate professional or to the resources in the app.'),
    S('7.4', 'Never present a personal opinion as professional advice.'),

    CL('8', 'Online conduct and community spaces'),
    S('8.1', 'Community boards, chats, and direct messages are moderated. Anyone with moderation access will act promptly on reported content.'),
    S('8.2', 'Prohibited content includes anything that is abusive, harassing, discriminatory, sexual, violent, promotes self-harm, promotes an age-restricted product, or discloses another person\'s personal information.'),
    S('8.3', 'Report rather than engage. Do not argue with a user in a public space.'),
    S('8.4', 'Preserve evidence before removing content where the matter may need to be reported.'),

    CL('9', 'Confidentiality and member information'),
    S('9.1', 'Member information is confidential. Access only what the task requires, do not discuss a member\'s circumstances with anyone outside the authorised channel, and do not copy information out of the platform.'),
    S('9.2', 'Confidentiality does not apply where there is a risk of harm or a child protection concern. Safety comes first.'),
    S('9.3', 'The Data Processing Terms set out the detailed obligations and apply in full.'),

    CL('10', 'Disclosure obligations'),
    S('10.1', 'Everyone must disclose immediately to UniBlueprint:'),
    L('a', 'any criminal charge or conviction;'),
    L('b', 'any Garda investigation involving them;'),
    L('c', 'any professional or academic disciplinary finding;'),
    L('d', 'any child protection concern raised about them in any setting; and'),
    L('e', 'any change affecting the validity of their vetting.'),
    S('10.2', 'Failure to disclose is itself a serious breach.'),

    CL('11', 'Reporting and response'),
    S('11.1', 'Concerns are reported to the Designated Liaison Person named in the Annex, or where the concern involves that person, directly to the Founder.'),
    S('11.2', 'UniBlueprint will acknowledge a report promptly, take immediate protective steps where needed including suspending access, and refer to Tusla or An Garda Síochána where required.'),
    S('11.3', 'A person who is the subject of a safeguarding concern may be suspended while it is assessed. Suspension is a neutral protective step and is not a finding.'),
    S('11.4', 'Records of concerns and responses are kept securely and separately, and retained in line with the retention schedule.'),

    CL('12', 'Breach'),
    S('12.1', 'Breach of this Policy is a material breach of the person\'s agreement with UniBlueprint and may result in immediate termination.'),
    S('12.2', 'Serious breaches will be reported to An Garda Síochána, Tusla, or a professional regulator as appropriate.'),

    H('Annex: Key contacts'),
    TABLE(
      ['Role', 'Name', 'Contact'],
      [
        ['Designated Liaison Person', '[NAME]', '[EMAIL / PHONE]'],
        ['Deputy Designated Liaison Person', '[NAME]', '[EMAIL / PHONE]'],
        ['Founder', '[NAME]', EMAIL],
        ['Emergency services', 'n/a', '112 or 999'],
        ['Tusla Child and Family Agency', 'n/a', 'tusla.ie: duty social work team'],
        ['Samaritans Ireland', 'n/a', '116 123 (24 hours, free)'],
        ['Pieta House', 'n/a', '1800 247 247'],
        ['Data Protection Commission', 'n/a', 'dataprotection.ie'],
      ],
      [1.2, 1, 1.4]
    ),

    H('Acknowledgement'),
    P('I have read and understood the UniBlueprint Safeguarding and Code of Conduct Policy and agree to comply with it. I understand that breach of this Policy may result in the immediate termination of my agreement with UniBlueprint.'),

    SIG('Signed', 'Print name'),
    SIG('Role', 'Role held'),
  ],
})

module.exports = { nda, ipDeed, dpa, safeguarding }
