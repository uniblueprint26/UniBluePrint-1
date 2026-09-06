/**
 * Ad Board → Blog — the same real Irish education news articles as the
 * website (src/data/blogPosts.js on the website repo), hardcoded here and
 * updated manually when the website blog changes rather than a live sync
 * (a confirmed decision for this phase). Six articles, one per category,
 * with the exact same title/excerpt/section content as the website — no
 * invented copy.
 */

export function calcReadTime(sections) {
  const allText = sections
    .map(s => s.type === 'list' ? (s.items || []).join(' ') : (s.text || ''))
    .join(' ')
  const words = allText.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const POSTS = [
  {
    slug: 'how-to-write-a-cv',
    title: 'How to Write a CV That Gets Noticed in Ireland',
    excerpt: 'A step-by-step guide to building a CV that stands out to Irish recruiters and graduate programme selectors.',
    category: 'CV & Career',
    date: '2026-05-20',
    sections: [
      { type: 'paragraph', text: 'Your CV is often the first thing a recruiter sees, and in many cases it takes less than ten seconds to decide whether to read on. In the Irish job market, where graduate scheme applications can receive hundreds of submissions, getting the basics right is not optional. It is the baseline.' },
      { type: 'heading', text: 'Keep it to one page' },
      { type: 'paragraph', text: 'Unless you have more than five years of relevant work experience, your CV should fit on a single A4 page. Recruiters are not looking for your life story, they are looking for evidence you can do the job. Prioritise your most recent and most relevant experience. If a section does not support your application, cut it entirely.' },
      { type: 'heading', text: 'Tailor it every time' },
      { type: 'paragraph', text: 'Generic CVs rarely work. Before sending your CV anywhere, read the job description and mirror the language it uses. If they list "stakeholder management" as a requirement, use that phrase, not "working with people". Applicant Tracking Systems scan for keyword matches before a human ever reads your application, so alignment with the job spec matters more than creative wording.' },
      { type: 'heading', text: 'What to include' },
      { type: 'list', items: [
        'Personal details: name, email, phone, LinkedIn URL, no photo, date of birth, or references',
        'A two-sentence personal summary at the top tailored to the role',
        'Work experience in reverse chronological order with bullet points that quantify impact',
        'Education: your degree, institution, and expected or achieved grade',
        'Relevant technical and soft skills, backed by evidence, not just listed',
        'Activities: societies, sports, volunteering, or any position of responsibility',
      ]},
      { type: 'heading', text: 'Mistakes to avoid' },
      { type: 'paragraph', text: 'Avoid generic phrases like "team player" or "hard worker" without evidence to back them up. Do not use heavily designed templates that confuse ATS software. Stick to clean fonts in navy or black. Check spelling carefully, one typo in a CV can disqualify an otherwise strong application.' },
      { type: 'paragraph', text: 'If you want a trained eye to review your CV, the Foundation Blueprint CV optimisation service delivers detailed feedback and a redrafted version reviewed by a Campus Handler within 48 hours.' },
    ],
  },
  {
    slug: 'cao-guide-2027',
    title: 'CAO Guide: Understanding Points, Preferences, and the Application Process',
    excerpt: 'Everything you need to know about applying to Irish higher education through the CAO, from building your list to understanding how points work.',
    category: 'Education',
    date: '2026-04-10',
    sections: [
      { type: 'paragraph', text: 'The CAO, Central Applications Office, is how young people in Ireland apply for places on undergraduate courses at universities and institutes of technology. The process looks simple from the outside: list your course preferences, sit your Leaving Cert, wait for offers. But knowing the details makes a significant difference to your outcome.' },
      { type: 'heading', text: 'How points work' },
      { type: 'paragraph', text: 'Leaving Certificate points are calculated from your best six subjects in one sitting, with grades converted to points on a fixed scale. Higher Level subjects carry more points than Ordinary Level. Bonus points apply for Higher Level Mathematics. Points cut-offs for each course are set by supply and demand each year, they are not fixed thresholds, and the same course can vary by 30 to 50 points from one year to the next.' },
      { type: 'heading', text: 'Building your course list' },
      { type: 'paragraph', text: 'You can list up to ten Level 8 courses and ten Level 7/6 courses on the CAO. Order them by genuine preference, not predicted points. The CAO assigns places starting from your highest preference downward. There is no strategic benefit to listing a course lower than where you genuinely want it. Include a mix of aspirational, realistic, and safe options.' },
      { type: 'heading', text: 'Key dates' },
      { type: 'list', items: [
        'Early application deadline: typically 1 February, reduced fee before this date',
        'Normal application deadline: typically 1 May',
        'Change of mind facility: open from May until early July',
        'Round One offers: typically mid-August after Leaving Cert results',
        'Round Two and later rounds: late August and September for remaining places',
      ]},
      { type: 'paragraph', text: 'If you need help with your application, personal statements for courses that require them, understanding mature student or DARE/HEAR entry routes, or structuring your course list, the Foundation Blueprint CAO service connects you with a Campus Handler who has been through the process themselves.' },
    ],
  },
  {
    slug: 'foundation-blueprint-explained',
    title: 'Foundation Blueprint: What It Is and How It Works',
    excerpt: 'A clear explanation of what Foundation Blueprint services are, who delivers them, and what you can expect when you submit a request.',
    category: 'Platform',
    date: '2026-03-25',
    sections: [
      { type: 'paragraph', text: 'Foundation Blueprint is UniBlueprint\'s academic and career support service. It covers the practical documents and applications that most people need at some point but rarely get real help with: CVs, cover letters, LinkedIn profiles, CAO personal statements, interview preparation, and more. Every submission is reviewed by a trained Campus Handler before delivery.' },
      { type: 'heading', text: 'What Campus Handlers do' },
      { type: 'paragraph', text: 'Campus Handlers are enrolled at Irish universities and colleges, they have been trained and onboarded by the UniBlueprint team. They review every Foundation Blueprint submission against a quality checklist before it is delivered. They are not AI tools. They are people who understand the Irish context, the courses you are applying for, and the employers you are targeting.' },
      { type: 'heading', text: 'Standard and Premium' },
      { type: 'paragraph', text: 'Foundation Blueprint services come in two tiers. Standard includes delivery within 48 hours and one revision request. Premium includes same-day delivery (subject to Handler availability), two revision requests, and priority queue. Both tiers are available to Pro subscribers at the listed service prices. During September 2026, all services are 50% off as part of the launch trial.' },
      { type: 'heading', text: 'How to submit a request' },
      { type: 'list', items: [
        'Log in to your UniBlueprint account and navigate to Foundation Blueprint',
        'Select the service you need, CV, cover letter, LinkedIn, CAO, and more',
        'Complete the intake form with your background, target role, and any specific notes',
        'Choose Standard or Premium tier and confirm your order',
        'Your Campus Handler will review and deliver within the specified window',
        'Review the output and request a revision if needed',
      ]},
    ],
  },
  {
    slug: 'campus-connect-guide',
    title: 'Getting Started with Campus Connect',
    excerpt: 'Campus Connect is the community layer of UniBlueprint. Here is everything you need to know about boards, groups, and how to get involved.',
    category: 'Campus Life',
    date: '2026-03-12',
    sections: [
      { type: 'paragraph', text: 'Campus Connect is the community feature built into UniBlueprint for students on your campus. It is free for all users, no Pro subscription required. Think of it as a digital campus notice board that actually works: organised by topic, moderated against community standards, and available to students at your specific university.' },
      { type: 'heading', text: 'The boards' },
      { type: 'paragraph', text: 'Each campus has a set of boards covering common student needs. There is a General board for campus news and discussions, a Housing board for rentals and accommodation questions, a Carpool board for sharing lifts, a Lost and Found board, a Marketplace for buying and selling, and a Clubs and Societies board for campus groups to post updates and recruit members.' },
      { type: 'heading', text: 'Community standards' },
      { type: 'paragraph', text: 'Campus Connect is moderated to keep it useful and respectful. Content that violates community standards is removed without notice. Repeated violations result in account restrictions. The goal is a space where students feel comfortable asking questions and sharing information, not a free-for-all. If you see content that should not be there, use the report function.' },
      { type: 'heading', text: 'Tips for getting the most out of Campus Connect' },
      { type: 'list', items: [
        'Introduce yourself on the General board when you first join',
        'Check the Housing board before signing any accommodation agreement',
        'Use the Carpool board to share costs for weekend travel home',
        'Post on Lost and Found immediately if you lose or find something',
        'Follow your societies on the Clubs board for event updates',
        'Ask questions, there is no such thing as a stupid question in a community built for students',
      ]},
    ],
  },
  {
    slug: 'graduate-employment-ireland-2026',
    title: 'Graduate Employment in Ireland 2026, What the Data Says',
    excerpt: 'Irish graduate employment rates remain strong but the landscape is shifting. Tech, healthcare, and professional services are growing while other sectors are tightening. Here is what you need to know going into the job market this year.',
    category: 'Career Tips',
    date: '2026-04-01',
    sections: [
      { type: 'paragraph', text: 'The Higher Education Authority publishes annual graduate outcomes data covering employment rates, further study, and salary bands by field of study and by institution, genuinely the best source if you want a real answer to "will my degree actually get me a job", rather than guessing from anecdotes. It is worth reading directly rather than relying on secondhand summaries, since it breaks results down by specific course, not just broad categories.' },
      { type: 'heading', text: 'What tends to hold true year over year' },
      { type: 'list', items: [
        'Tech, healthcare, and professional services (finance, accounting, law) consistently show strong graduate absorption',
        'STEM and business graduates tend to report faster time-to-first-job than some humanities fields, though this varies significantly by specific course and by how proactively a graduate job searches',
        'Postgraduate study genuinely improves outcomes in some fields and makes very little difference in others, it depends heavily on the sector',
        'Graduates who did placements, internships, or relevant part-time work during their degree consistently report faster and stronger employment outcomes than those who did not',
      ]},
      { type: 'heading', text: 'The part most graduates underinvest in' },
      { type: 'paragraph', text: 'A strong degree gets you into consideration. What gets you hired over another candidate with a similar degree is usually the presentation, a CV that is actually structured for how recruiters and applicant tracking systems read it, a LinkedIn profile that shows up in the searches recruiters actually run, and being able to talk about your experience in specific, evidenced terms rather than generic language. This is the gap between "qualified" and "hired" for a lot of graduates, and it is entirely fixable.' },
      { type: 'heading', text: 'Where to actually check current numbers' },
      { type: 'paragraph', text: 'For exact current salary bands and sector-by-sector employment rates, go to the HEA\'s own graduate outcomes survey rather than a summarised version, the underlying data is public and broken down in more useful detail than most secondhand reporting on it.' },
      { type: 'heading', text: 'If you want the presentation side sorted' },
      { type: 'paragraph', text: 'Foundation Blueprint\'s CV, cover letter, and LinkedIn services are built specifically around what Irish recruiters and ATS systems are actually screening for, reviewed by a real Campus Handler, not generated and left unchecked.' },
    ],
  },
  {
    slug: 'apprenticeship-ireland-2026',
    title: 'Why More Young People in Ireland Are Choosing Apprenticeships in 2026',
    excerpt: 'Apprenticeship numbers in Ireland are at a record high. We look at why, which programmes are growing, and what you need to know if you are considering an alternative to the traditional university route.',
    category: 'Irish Student Guides',
    date: '2026-05-01',
    sections: [
      { type: 'paragraph', text: 'Apprenticeships in Ireland have moved well beyond the traditional trades. Alongside electrical, plumbing, and construction, still core and still in real demand, there are now recognised apprenticeship routes into accounting, insurance, ICT, finance, and more, run jointly between employers and further education providers. If your mental model of an apprenticeship is stuck a decade behind, it is worth a proper second look.' },
      { type: 'heading', text: 'Why more people are choosing this route' },
      { type: 'list', items: [
        'You earn a wage from day one instead of paying fees while studying',
        'Qualifications are nationally recognised and, for many trades, in genuine short supply',
        'The "professional" apprenticeship routes (accounting, ICT, insurance, and others) offer a real alternative into white-collar careers without a traditional four-year degree',
        'Structured progression, most apprenticeships have a clear path from entry level to qualified professional with defined milestones',
      ]},
      { type: 'heading', text: 'What to actually check before applying' },
      { type: 'paragraph', text: 'Not all apprenticeships are structured the same way, length, off-the-job training requirements, and entry requirements vary by trade and by provider. SOLAS maintains the official register of registered apprenticeships and current provider information, and it is worth going there directly rather than relying on secondhand descriptions, since new apprenticeship programmes are added regularly and older summaries go out of date fast.' },
      { type: 'heading', text: 'It is not "instead of" college, for some people, it is the better fit' },
      { type: 'paragraph', text: 'The apprenticeship-versus-university framing misses the point for a lot of people. The real question is what kind of learning and what kind of career path actually suits you, hands-on, earning while training, versus a more academic route. Neither is a fallback option for the other.' },
      { type: 'heading', text: 'Working out if it is right for you' },
      { type: 'paragraph', text: 'UniBlueprint\'s Apprenticeship Compass, part of the Course Compass suite inside Foundation Blueprint, walks through your interests and strengths against the realistic apprenticeship pathways available in Ireland, a genuine comparison, not just a course list.' },
    ],
  },
]

export function getPost(slug) {
  return POSTS.find(p => p.slug === slug) || null
}
