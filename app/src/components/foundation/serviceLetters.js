// The letter inside each Foundation envelope. One entry per service, keyed by
// the service title used in CAREER_SERVICES.
//
// Everything here describes what the service really does, taken from its
// builder screen (app/src/screens/foundation/*) and its generator
// (supabase/functions/generate-*). Do not add a claim, number or guarantee
// here that those do not back up.
//
// Fields:
//   promise   one line: what the person ends up with
//   note      optional short honest line shown under the promise
//   get       "What you get": 3 to 4 plain bullets
//   steps     the first two steps of "How it works" (you answer, a draft is
//             built and a real person checks it)
//   webStep   step 1 for Android and web, where the questions are answered on
//             uniblueprint.ie. iOS never uses it: iOS copy must not point to the
//             website as a place to buy, so it keeps `steps[0]`
//   receive   the third step, without the timing (the sheet adds the
//             Standard and Premium times, and the weekend rule)
//   different "Why it is different": personal, industry specific, never a
//             template
//   ats       CV only: a plain-words explainer of ATS screening

const REVIEW_STEP = 'A first draft is built from your answers. A trained Campus Handler then reviews and checks it. It is never AI only.'

export const SERVICE_LETTERS = {
  'CV Optimisation': {
    promise: 'A CV written for your industry and the role you want, built from your own experience. It reads cleanly to automatic screening and well to a person.',
    get: [
      'A full CV built from your answers, or your current CV rewritten and improved',
      'Each bullet says what you did, the result and why it mattered',
      'A structure that fits you. No work experience yet? Your CV leads with education, projects and skills',
      'Your choice of tone (formal, balanced or modern) and length (one page or two)',
    ],
    ats: {
      title: 'ATS screening, in plain words',
      intro: [
        'ATS means applicant tracking system. Many larger employers use one to sort applications before a person reads them.',
        'It reads your CV as plain text. It pulls out your name, jobs, education and skills, and compares them with the job.',
        'A CV can be held back at this stage. Tables, columns, text boxes and graphics can scramble what the system reads. A CV that does not use the words the job asks for can rank low.',
      ],
      howTitle: 'How your CV is written for it',
      how: [
        'One simple structure with standard headings, such as Education, Experience and Skills',
        'No tables, text boxes or graphics. Plain text that any system can read',
        'The wording of your job ad is worked in naturally if you paste it in. No keyword stuffing',
        'Written for your industry and role, from your own experience and evidence',
      ],
      outro: 'We cannot promise an interview. We make sure your CV is not held back by how it is built.',
    },
    steps: [
      'You answer questions about your education, experience, skills, and the industry and role you want. You can add the job ad and your current CV.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie about your education, experience, skills, and the industry and role you want. You can add the job ad and your current CV.',
    receive: 'Your CV arrives in Outputs, ready to copy or share.',
    different: [
      'Personal to you. Every line comes from what you told us. We never invent an employer, a date, a number or a skill.',
      'Industry specific. Your target industry is required. The CV follows how that field reads CVs. It names real qualifications for your field only if you hold them.',
      'Never a template. The wording is built fresh from your evidence, so two people with similar jobs do not get the same CV. Societies, projects, volunteering and part-time work count as full evidence.',
    ],
  },

  'Portfolio Building': {
    promise: 'A clear plan for the portfolio that suits your field, built around the work you already have.',
    note: 'This is a plan for you to follow. We do not build the portfolio for you.',
    get: [
      'The best place to show your work in your field, with the reason, and one alternative',
      'An ordered checklist of what to include, based on what you actually have',
      'Tips for presenting your work well',
      'Honest advice if you have little to show yet, including small pieces to make first',
    ],
    steps: [
      'You tell us your field, the work you want to show, what you already have online and what the portfolio is for.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie about your field, the work you want to show, what you already have online and what the portfolio is for.',
    receive: 'Your plan arrives in Outputs, ready to copy or share.',
    different: [
      'Personal to you. It builds on what you already have online instead of starting you from zero.',
      'Industry specific. A developer, a designer and a teacher need very different portfolios. Your plan follows how your field shows work.',
      'Never a template. College projects and society work count as real pieces. We never suggest presenting thin work as more than it is.',
    ],
  },

  'LinkedIn Optimisation': {
    promise: 'Profile text written for your target industry, using the words recruiters in your field search for.',
    get: [
      'A headline, plus two alternatives to choose from',
      'An About section in the first person, with an opening line that works before "see more"',
      'Your experience rewritten with impact, if you have any',
      'Skills to add for your field, and ideas for what to feature on your profile',
    ],
    steps: [
      'You answer questions about how you want to be introduced, your target industry and role, your skills and experience, and who you want to reach.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie about how you want to be introduced, your target industry and role, your skills and experience, and who you want to reach.',
    receive: 'Your profile text arrives in Outputs. You copy it into LinkedIn yourself.',
    different: [
      'Personal to you. It is written from your own facts. No invented results and no job titles you do not have.',
      'Industry specific. Your target industry is required. It decides which keywords and skills go first.',
      'Never a template. No work experience yet? A student profile leads with who you are and where you are heading. That is a normal shape for a student, not a weaker one.',
    ],
  },

  'Cover Letter Assistance': {
    promise: 'A cover letter written for one role at one company. It adds to your CV instead of repeating it.',
    get: [
      'A full letter ready to send, in three or four short paragraphs',
      'An opening built on your strongest point, not "I am writing to apply"',
      'Proof from your own background that matches what the role needs',
      'A specific reason for this company and a confident close',
    ],
    steps: [
      'You tell us the role and company, your strongest point and why this company. You can paste in the job ad.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie about the role and company, your strongest point and why this company. You can paste in the job ad.',
    receive: 'Your letter arrives in Outputs, ready to copy or share.',
    different: [
      'Personal to you. It goes deep on one or two things from your background, not a summary of your whole CV.',
      'Industry specific. The tone suits the sector: more traditional for finance, law and government, more voice for tech, start-ups and creative roles.',
      'Never a template. If you give us nothing specific about the company, we write around it honestly. We never add flattery that would fit any employer.',
    ],
  },

  'Personal Statement': {
    promise: 'A personal statement written for your pathway, your course and your institution, in your own voice.',
    get: [
      'UCAS (UK universities): the three short answers UCAS now uses instead of one essay',
      'CAO mature applicant: one full statement on why this course now, your life and work experience, and how you will manage returning to study',
      'Postgraduate: a statement of about 400 to 600 words on your background, skills, goals and fit with the course',
      'An opening that avoids lines like "I have always been passionate about"',
    ],
    steps: [
      'You choose your pathway, then tell us the course, the institution, why you want it and what you have done.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie. You choose your pathway, then tell us the course, the institution, why you want it and what you have done.',
    receive: 'Your statement arrives in Outputs, ready to copy or share.',
    different: [
      'Personal to you. It is built from your real story. A lower grade or a gap is only mentioned if you tell us about it.',
      'Course specific. It is written for this course and institution, and could not be sent unchanged for another.',
      'Never a template. Each pathway has its own structure. For mature applicants, life and work experience count as real evidence.',
    ],
  },

  'Application Form Assistance': {
    promise: 'Drafted answers to your application form questions, built from your own real stories.',
    note: 'You need at least one story saved in your Evidence Bank first.',
    get: [
      'A drafted answer for every question you paste in',
      'Each answer built from one of your saved stories and shaped for what that question tests',
      'A note when none of your stories fits a question, so you know what to add',
      'Answers written in the first person, with the structure kept out of sight',
    ],
    steps: [
      'You paste in the questions exactly as they appear on the form. You can add the company and role.',
      'A draft answer is built for each question from your Evidence Bank stories. A trained Campus Handler then reviews and checks it. It is never AI only.',
    ],
    webStep: 'You answer questions on uniblueprint.ie. You paste in the form questions exactly as they appear. You can add the company and role.',
    receive: 'Your answers arrive in Outputs, ready to copy or share.',
    different: [
      'Personal to you. Every answer traces back to a story you wrote. Nothing is invented.',
      'Industry specific. Civil Service answers are matched to the capability being scored. Healthcare, finance, law, teaching, social work and engineering each have their own approach.',
      'Never a template. The same story is angled differently for each question. A society or part-time job story counts as much as an internship.',
    ],
  },

  'Interview Preparation': {
    promise: 'A prep pack for the exact interview you are facing, with likely questions and answers built from your own stories.',
    get: [
      'Likely questions for your role and interview type, each marked as behavioural, technical or strengths-based',
      'Model answers to behavioural questions, built from your Evidence Bank stories',
      'Things to look up about the company, written as prompts for you to research',
      'Tips for staying confident on the day',
    ],
    steps: [
      'You tell us the role, the company if you know it, the interview type, your background and anything you are unsure about.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie about the role, the company if you know it, the interview type, your background and anything you are unsure about.',
    receive: 'Your pack arrives in Outputs, ready to read before the interview.',
    different: [
      'Personal to you. Answers come only from your real stories. If you have no story for a question, you get coaching on where to find one, not an invented answer.',
      'Industry specific. The pack follows how interviews run in your field, for example a coding round, a portfolio walkthrough, a values-based panel or a trial shift.',
      'Never a template. A technical question gets a way to prepare, not a made-up answer.',
    ],
  },

  'Job Search Support': {
    promise: 'A job search plan for your field and your situation, with a 7 day action plan to start on.',
    get: [
      'A summary of where you stand now',
      'A plan across five channels: job boards, agencies, direct applications, networking and speculative applications, ranked for you',
      'Real Irish platforms that fit your field, with time-sensitive ones marked to check before you use them',
      'A 7 day action plan, and a tip for tracking your applications',
    ],
    steps: [
      'You answer questions about your field, who you are (student, apprentice, young worker or 5th or 6th year), the opportunity you want, and how your search has gone so far.',
      REVIEW_STEP,
    ],
    webStep: 'You answer questions on uniblueprint.ie about your field, who you are (student, apprentice, young worker or 5th or 6th year), the opportunity you want, and how your search has gone so far.',
    receive: 'Your plan arrives in Outputs, ready to copy or share.',
    different: [
      'Personal to you. It starts from where you are: just starting, applying with no interviews, or getting interviews with no offers.',
      'Industry specific. It uses the real route in your field, such as publicjobs.ie for the Civil Service, apprenticeship.ie for apprenticeships or EducationPosts.ie for teaching.',
      'Never a template. With no work experience yet, the plan changes. We cover where to look and how, never what is open today.',
    ],
  },
}
