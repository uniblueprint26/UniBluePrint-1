import {
  BookOpen, Link2, MessageSquareQuote, Compass, FileStack, Library,
  GraduationCap, Layers, Users, Lightbulb, Home, Calendar,
  Megaphone, Tag, Briefcase, Landmark, Hammer, Building2, Plane,
} from 'lucide-react'

// ─── Shared option lists ───────────────────────────────────────────────────────

export const LC_SUBJECTS = [
  'Maths', 'English', 'Irish', 'Biology', 'Chemistry', 'Physics',
  'Business', 'Accounting', 'Economics', 'Geography', 'History',
  'Languages', 'Computer Science', 'Other',
]

export const UNIVERSITIES = [
  'University College Dublin', 'Trinity College Dublin', 'University College Cork',
  'Dublin City University', 'University of Galway', 'University of Limerick',
  'Maynooth University', 'Technological University Dublin', 'RCSI University',
  'Atlantic Technological University', 'South East Technological University',
  'Dundalk Institute of Technology', 'Other',
]

export const LC_YEAR_GROUPS = ['Junior Cycle', '3rd Year', '4th Year (TY)', '5th Year', '6th Year']
const RATING_5 = ['1 — Very low', '2 — Low', '3 — Moderate', '4 — High', '5 — Very high']

// ─── Category groups (for landing page display) ────────────────────────────────

export const CATEGORY_GROUPS = [
  { id: 'leaving-cert', label: 'Leaving Cert Hub' },
  { id: 'notes-course', label: 'Notes, Courses & Further Education' },
  { id: 'campus', label: 'Campus Life' },
  { id: 'careers', label: 'Careers & Community' },
]

// ─── Categories ─────────────────────────────────────────────────────────────────
// Every form collects: title, description, category-specific fields below, then an
// optional link and an optional file attachment.

export const CONTRIBUTOR_CATEGORIES = [
  {
    id: 'leaving_cert_notes',
    group: 'leaving-cert',
    icon: BookOpen,
    label: 'Leaving Cert Notes',
    description: 'Subject notes, chapter summaries, revision guides, essay plans, sample answers, flashcards and more.',
    fields: [
      { key: 'subject', label: 'Subject', type: 'select', options: LC_SUBJECTS, required: true },
      { key: 'note_type', label: 'Type of notes', type: 'select', required: true, options: [
        'Subject notes', 'Chapter summary', 'Revision guide', 'Essay plan', 'Sample answer',
        'Exam technique', 'Study schedule', 'Flashcards', 'Key quotes', 'Formula sheet',
      ] },
      { key: 'year_group', label: 'Recommended year group', type: 'select', options: LC_YEAR_GROUPS },
    ],
  },
  {
    id: 'leaving_cert_resource',
    group: 'leaving-cert',
    icon: Link2,
    label: 'Leaving Cert Resources',
    description: 'Websites, YouTube channels, study apps, AI tools, revision platforms and past paper resources.',
    fields: [
      { key: 'subject', label: 'Subject', type: 'select', options: LC_SUBJECTS, required: true },
      { key: 'resource_type', label: 'Resource type', type: 'select', required: true, options: [
        'Website', 'YouTube channel', 'Study app', 'AI tool / prompt', 'Revision platform',
        'Past paper resource', 'Study method',
      ] },
      { key: 'what_used_for', label: 'What did you use it for?', type: 'textarea', required: true },
      { key: 'why_helped', label: 'Why did it help?', type: 'textarea', required: true },
      { key: 'year_group', label: 'Recommended year group', type: 'select', options: LC_YEAR_GROUPS },
    ],
  },
  {
    id: 'leaving_cert_subject_review',
    group: 'leaving-cert',
    icon: MessageSquareQuote,
    label: 'Leaving Cert Subject Reviews',
    description: 'Difficulty, workload, best revision methods and exam preparation advice for a subject.',
    fields: [
      { key: 'subject', label: 'Subject', type: 'select', options: LC_SUBJECTS, required: true },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: RATING_5, required: true },
      { key: 'workload', label: 'Workload', type: 'select', options: RATING_5, required: true },
      { key: 'best_revision_methods', label: 'Best revision methods', type: 'textarea', required: true },
      { key: 'common_challenges', label: 'Common challenges', type: 'textarea' },
      { key: 'exam_prep_advice', label: 'Exam preparation advice', type: 'textarea', required: true },
    ],
  },
  {
    id: 'leaving_cert_experience',
    group: 'leaving-cert',
    icon: Compass,
    label: 'Leaving Cert Experiences',
    description: 'How you prepared, study routines, mistakes to avoid, and CAO or transition advice.',
    fields: [
      { key: 'how_prepared', label: 'How did you prepare?', type: 'textarea', required: true },
      { key: 'study_routine', label: 'Your study routine', type: 'textarea' },
      { key: 'mistakes_to_avoid', label: 'Mistakes to avoid', type: 'textarea' },
      { key: 'wish_knew_earlier', label: 'What do you wish you knew earlier?', type: 'textarea' },
      { key: 'cao_transition_advice', label: 'CAO / transition advice', type: 'textarea' },
    ],
  },
  {
    id: 'shared_notes',
    group: 'notes-course',
    icon: FileStack,
    label: 'Shared Notes Library',
    description: 'Lecture notes, revision sheets, flashcards, mind maps and study summaries.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'course', label: 'Course', type: 'text', required: true },
      { key: 'module_name', label: 'Module', type: 'text' },
      { key: 'note_type', label: 'Type of notes', type: 'select', required: true, options: [
        'Lecture notes', 'Revision sheet', 'Flashcards', 'Mind map', 'Study summary', 'Exam preparation material',
      ] },
    ],
  },
  {
    id: 'course_resource',
    group: 'notes-course',
    icon: Library,
    label: 'Course Connect Resources',
    description: 'Websites, YouTube, books, journals, AI tools, templates or apps that helped in your course.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'course', label: 'Course', type: 'text', required: true },
      { key: 'module_name', label: 'Module', type: 'text' },
      { key: 'module_code', label: 'Module code', type: 'text' },
      { key: 'resource_type', label: 'Resource type', type: 'select', required: true, options: [
        'Website', 'YouTube video', 'Book', 'Journal', 'AI tool / prompt', 'Template', 'App / software',
      ] },
      { key: 'what_used_for', label: 'What did you use it for?', type: 'textarea', required: true },
      { key: 'why_helped', label: 'Why did it help?', type: 'textarea', required: true },
    ],
  },
  {
    id: 'course_review',
    group: 'notes-course',
    icon: GraduationCap,
    label: 'Course Reviews',
    description: 'Overall rating, workload, career and placement opportunities, and advice for future students.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'course', label: 'Course', type: 'text', required: true },
      { key: 'year_group', label: 'Your year of study', type: 'select', options: ['1st', '2nd', '3rd', '4th', '5th', 'Postgrad'], required: true },
      { key: 'overall_rating', label: 'Overall rating', type: 'select', options: RATING_5, required: true },
      { key: 'workload', label: 'Workload', type: 'select', options: RATING_5, required: true },
      { key: 'career_opportunities', label: 'Career opportunities', type: 'textarea' },
      { key: 'placement_opportunities', label: 'Placement opportunities', type: 'textarea' },
      { key: 'advice', label: 'Advice for future students', type: 'textarea', required: true },
    ],
  },
  {
    id: 'module_review',
    group: 'notes-course',
    icon: Layers,
    label: 'Module Reviews',
    description: 'Lecturer, difficulty, assignment advice, exam advice and helpful resources for a specific module.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'module_name', label: 'Module', type: 'text', required: true },
      { key: 'module_code', label: 'Module code', type: 'text' },
      { key: 'lecturer', label: 'Lecturer', type: 'text' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: RATING_5, required: true },
      { key: 'assignment_advice', label: 'Assignment advice', type: 'textarea' },
      { key: 'exam_advice', label: 'Exam advice', type: 'textarea' },
    ],
  },
  {
    id: 'plc_further_education',
    group: 'notes-course',
    icon: Landmark,
    label: 'PLC & Further Education',
    description: 'Not everyone goes to college straight away — share notes, reviews and advice for PLC, QQI and further education courses.',
    fields: [
      { key: 'university', label: 'College / Institution', type: 'text', required: true },
      { key: 'course', label: 'Course / Programme', type: 'text', required: true },
      { key: 'qqi_level', label: 'QQI level', type: 'select', options: ['Level 5', 'Level 6', 'Other'], required: true },
      { key: 'workload', label: 'Workload', type: 'select', options: RATING_5 },
      { key: 'advice', label: 'Advice for future students', type: 'textarea', required: true },
    ],
  },
  {
    id: 'campus_connect',
    group: 'campus',
    icon: Users,
    label: 'Campus Connect',
    description: 'Study groups, gym partners, carpool requests, flatmate searches and student communities.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'connect_type', label: 'Type', type: 'select', required: true, options: [
        'Study group', 'Gym / sports partner', 'Carpool / ride share', 'Flatmate / roommate search',
        'Business connection', 'Student community',
      ] },
    ],
  },
  {
    id: 'campus_suggestion',
    group: 'campus',
    icon: Lightbulb,
    label: 'Campus Suggestions',
    description: 'Best study spots, cafés, food locations, libraries, facilities and hidden campus gems.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'suggestion_type', label: 'Category', type: 'select', required: true, options: [
        'Study spot', 'Café', 'Food location', 'Library', 'Student facility', 'Hidden gem',
      ] },
    ],
  },
  {
    id: 'accommodation_review',
    group: 'campus',
    icon: Home,
    label: 'Accommodation Reviews',
    description: 'Cost insights, location, pros, cons and advice on student accommodation.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'accommodation_name', label: 'Accommodation name', type: 'text', required: true },
      { key: 'cost_insight', label: 'Cost insight', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'pros', label: 'Pros', type: 'textarea', required: true },
      { key: 'cons', label: 'Cons', type: 'textarea', required: true },
    ],
  },
  {
    id: 'event',
    group: 'campus',
    icon: Calendar,
    label: 'Events',
    description: 'Freshers events, society events, career events, workshops and networking opportunities.',
    fields: [
      { key: 'university', label: 'University', type: 'select', options: UNIVERSITIES, required: true },
      { key: 'event_type', label: 'Event type', type: 'select', required: true, options: [
        'Freshers event', 'Society event', 'Career event', 'Workshop', 'Networking event', 'Student activity',
      ] },
      { key: 'event_date', label: 'Event date', type: 'date' },
    ],
  },
  {
    id: 'advertisement',
    group: 'careers',
    icon: Megaphone,
    label: 'Advertisement Board',
    description: 'Student businesses, part-time jobs, tutoring, services, and buy & sell listings.',
    fields: [
      { key: 'ad_type', label: 'Listing type', type: 'select', required: true, options: [
        'Student business', 'Part-time job', 'Tutoring', 'Service', 'Buy & sell', 'Accommodation advert',
      ] },
      { key: 'contact_info', label: 'Contact info', type: 'text', required: true },
    ],
  },
  {
    id: 'discount',
    group: 'careers',
    icon: Tag,
    label: 'Student Discounts',
    description: 'Local offers, business deals and student promotions.',
    fields: [
      { key: 'business_name', label: 'Business name', type: 'text', required: true },
      { key: 'discount_details', label: 'Discount details', type: 'textarea', required: true },
      { key: 'location', label: 'Location', type: 'text' },
    ],
  },
  {
    id: 'career_opportunity',
    group: 'careers',
    icon: Briefcase,
    label: 'Careers & Opportunities',
    description: 'Internships, placements, graduate roles, apprenticeships, work experience and volunteering.',
    fields: [
      { key: 'organisation', label: 'Organisation', type: 'text', required: true },
      { key: 'opportunity_type', label: 'Opportunity type', type: 'select', required: true, options: [
        'Internship', 'Placement', 'Graduate role', 'Apprenticeship', 'Work experience', 'Volunteering',
      ] },
      { key: 'application_deadline', label: 'Application deadline', type: 'date' },
    ],
  },
  {
    id: 'apprenticeship_insights',
    group: 'careers',
    icon: Hammer,
    label: 'Apprenticeships',
    description: 'Real insights from apprentices — trade, employer, workload and advice for anyone considering an apprenticeship.',
    fields: [
      { key: 'trade', label: 'Trade / sector', type: 'text', required: true },
      { key: 'employer_provider', label: 'Employer / training provider', type: 'text' },
      { key: 'year_of_apprenticeship', label: 'Year of apprenticeship', type: 'select', options: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Completed'] },
      { key: 'workload', label: 'Workload', type: 'select', options: RATING_5 },
      { key: 'advice', label: 'Advice for future apprentices', type: 'textarea', required: true },
    ],
  },
  {
    id: 'straight_into_work',
    group: 'careers',
    icon: Building2,
    label: 'Straight Into Work',
    description: 'Went straight into a job after school instead of college? Share your experience and advice for others considering the same path.',
    fields: [
      { key: 'role_title', label: 'Job title / role', type: 'text', required: true },
      { key: 'industry', label: 'Industry / sector', type: 'text' },
      { key: 'how_found_job', label: 'How did you find this job?', type: 'textarea' },
      { key: 'advice', label: 'Advice for others considering this path', type: 'textarea', required: true },
    ],
  },
  {
    id: 'gap_year',
    group: 'careers',
    icon: Plane,
    label: 'Gap Year',
    description: 'Took a year out before college, a PLC, or work? Share what you did and advice for others considering a gap year.',
    fields: [
      { key: 'gap_year_type', label: 'What did you do?', type: 'select', options: ['Travel', 'Work', 'Volunteering', 'Combination', 'Other'], required: true },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'highlights', label: 'Highlights or key takeaways', type: 'textarea' },
      { key: 'advice', label: 'Advice for students considering a gap year', type: 'textarea', required: true },
    ],
  },
]

export function getCategory(id) {
  return CONTRIBUTOR_CATEGORIES.find(c => c.id === id)
}
