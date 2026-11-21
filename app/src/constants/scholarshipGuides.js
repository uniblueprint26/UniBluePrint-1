// Real Irish scholarships, grants and bursaries, each with a short guide.
// Every fact here was read from the official source linked on the entry on
// 21 November 2026. Nothing is invented. Amounts and dates change every year, so
// each guide says so and sends the member to the source before they apply.
// `status` is what the source said at the time, in plain words.

export const SCHOLARSHIPS_CHECKED = '21 November 2026'

export const SCHOLARSHIP_GUIDES = [
  {
    key: 'susi',
    name: 'SUSI student grant',
    by: 'SUSI, the national grants authority',
    blurb: 'Help with living costs and fees for approved courses.',
    status: 'The 2026/27 online applications are closed. Late applications are possible.',
    who: [
      'You are an Irish, EU, EEA, UK or Swiss national, or have specific immigration status or leave to remain.',
      'You have lived in the Irish State, EU, EEA, UK or Switzerland for three of the last five years.',
      'You are on an approved course at an approved college.',
      'The course leads to a higher qualification than any you already hold.',
      'Your household income is below the set limits. SUSI publishes them on its income page.',
    ],
    worth: 'There are three kinds of support: a maintenance grant for living costs, a fee grant for tuition fees when you do not qualify for the Free Fees Scheme, and postgraduate fees support.',
    howto: [
      'Use the SUSI eligibility indicator on susi.ie to check where you stand.',
      'Apply online when the new academic year opens.',
      'If you miss the date, read the late applications page.',
    ],
    good: ['Grants are for PLC, undergraduate and postgraduate courses.', 'Grant support is capped at each level of study.'],
    url: 'https://susi.ie',
    urlLabel: 'Open susi.ie',
  },
  {
    key: 'saf',
    name: 'Student Assistance Fund',
    by: 'The HEA, run by your own college',
    blurb: 'Help if you hit money trouble while you study.',
    status: 'Open to current students. Your college runs it, so ask them.',
    who: [
      'You are a full-time or part-time student in higher education.',
      'You are having financial difficulties.',
      'Part-time students who are lone parents, or from other access target groups, have extra money set aside for them.',
    ],
    worth: 'It can help with books and class materials, rent, heat and light, food, medical costs, essential travel and childcare.',
    howto: [
      'Contact the access, welfare or student services office at your college.',
      'Ask how they take Student Assistance Fund applications.',
      'The HEA publishes guidelines for colleges each year if you want to read how it works.',
    ],
    good: ['Each college decides locally, within the HEA guidelines.'],
    url: 'https://hea.ie/policy/access-policy/student-assistance-fund/',
    urlLabel: 'Read it on hea.ie',
  },
  {
    key: '1916',
    name: '1916 Bursary Fund',
    by: 'The HEA',
    blurb: 'A bursary for first-time undergraduates from under-represented groups.',
    status: 'The 2026/27 round ran from 3 September to 9 October 2026 and is now closed. Check 1916bursary.ie for the next round.',
    who: [
      'You must meet three sets of criteria: financial, priority group and college entry.',
      'You are a first-time entrant to higher education. Students entering straight into year 2 can also apply.',
      'You are socio-economically disadvantaged and from one or more priority groups.',
    ],
    worth: 'The value changes by year and by tier. The site has a section called How much is it worth.',
    howto: [
      'Take the two minute Criteria Quick Check on 1916bursary.ie.',
      'Read the Application Form Overview before you start.',
      'Apply through the online bursary portal when the round opens.',
    ],
    good: ['Applications opened in early September for 2026/27, so plan ahead for next year.'],
    url: 'https://1916bursary.ie',
    urlLabel: 'Open 1916bursary.ie',
  },
  {
    key: 'ad-astra',
    name: 'UCD Ad Astra Academic Scholarship',
    by: 'University College Dublin',
    blurb: 'A scholarship for top Leaving Cert and A-Level results at UCD.',
    status: 'The details below come from the 2024 and 2025 cycles. Check the UCD page for the current year.',
    who: [
      'School leavers: six H1 grades at Higher Level in one sitting of the Leaving Cert, or three A* at A-Level in one sitting.',
      'There is an online application and an interview.',
      'Some awards go to continuing students, based on first-year results, nominated by their programme area.',
    ],
    worth: 'A bursary, which was 3,000 euro a year in the 2024 terms, and a fee remission in some years. Check the current terms.',
    howto: ['Read the Ad Astra Academy application page on ucd.ie.', 'Apply online, then prepare for the interview.'],
    good: ['This is for UCD only. Other colleges run their own scholarships, so search your college name plus scholarships.'],
    url: 'https://www.ucd.ie/adastraacademy/academic/',
    urlLabel: 'Open the UCD page',
  },
  {
    key: 'goipg',
    name: 'Government of Ireland Postgraduate Scholarship',
    by: 'Research Ireland (took over from the Irish Research Council)',
    blurb: 'Funding for research master\'s and PhD study.',
    status: 'The current call is closed. Check Research Ireland for the next one.',
    who: [
      'You are applying for research master\'s or doctoral study.',
      'It is open to EU and non-EU applicants.',
      'Unsuccessful applicants can apply twice to each of the postgraduate programmes.',
    ],
    worth: 'Up to 31,000 euro a year, made up of a stipend plus fees and research expenses. The programme is competitive, with an average success rate of about 18 percent over five years.',
    howto: ['Read the guide for applicants and the FAQs on the Research Ireland site.', 'Ask your host college research office for its own guidance notes and deadline.'],
    good: ['Host colleges publish their own guidance notes and FAQs, so ask your college research office early.'],
    url: 'https://research.ie/funding/goipg',
    urlLabel: 'Open Research Ireland',
  },
  {
    key: 'fulbright',
    name: 'Fulbright Irish Student Awards',
    by: 'Fulbright Ireland',
    blurb: 'Study or research in the USA for 4 to 12 months.',
    status: 'The 2026/27 round is closed. The next round would normally open in late summer. Check fulbright.ie.',
    who: [
      'You are an Irish citizen, or an EU or UK citizen who has lived in Ireland for at least five years.',
      'You have a clear course of study or research plan.',
      'You are not a dual US-Irish citizen or green card holder, are not living in the USA, and have not got extensive experience of studying or living there.',
    ],
    worth: 'The award funds postgraduate research or a postgraduate degree in the USA. Each award has its own terms.',
    howto: ['Read the student awards page and pick the award that fits.', 'A letter of acceptance is not needed at application, but it is preferred.'],
    good: ['Deadlines in past rounds fell around late October.'],
    url: 'https://fulbright.ie/going-to-the-usa/fulbright-irish-student-awards/',
    urlLabel: 'Open fulbright.ie',
  },
]
