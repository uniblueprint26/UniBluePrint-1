/**
 * Course Connect — board registry.
 *
 * Same engine as Campus Connect (see constants/campusBoards.js for the full
 * contract docs) — this is a second, parallel registry rather than more
 * entries in CAMPUS_BOARDS because every board here is course-scoped and
 * cross-Ireland rather than campus-scoped, and BoardDetailScreen reads
 * `registry: 'course'` off the route to know which list to look the key up
 * in, which back label/destination to show, and to skip the Campus Connect
 * "select your campus to post" gate (Course Connect never requires one).
 *
 * `special` values used here: 'notes' and 'papers' (download button + count,
 * shared with Resource Finder's cross-table search) and 'reviews' (reused
 * from Campus Connect's renderer against the *same* `college_reviews` table
 * — see the note on the `course-reviews` entry below for why).
 */
import { FIELD_TYPES } from './campusBoards'

const T = FIELD_TYPES

export const INDUSTRY_CATEGORIES = [
  'Technology', 'Healthcare', 'Finance', 'Law', 'Engineering', 'Education',
  'Business', 'Creative', 'Science', 'Construction', 'Hospitality',
  'Public Sector', 'Social Work', 'Sports', 'Marketing',
]

export const COURSE_BOARDS = [
  {
    key: 'course-boards',
    title: 'Course Boards',
    icon: '🎓',
    color: '#EFF6FF',
    table: 'course_boards_posts',
    tagline: 'Discussion boards for your course, programme, or workplace — open to everyone on it, anywhere in Ireland.',
    postCta: 'Post to Your Board',
    fields: [
      { key: 'course', label: 'Course / Programme / Workplace', type: T.TEXT, required: true, placeholder: 'e.g. Computer Science, UCD — or Electrical Apprenticeship, ETB' },
      { key: 'title', label: 'Title (optional)', type: T.TEXT },
      { key: 'body', label: 'Post', type: T.TEXTAREA, required: true, placeholder: "What's on your mind?" },
    ],
    filters: [
      { key: 'course', label: 'Course / Programme / Workplace', type: 'search' },
    ],
    cardTitle: p => p.title || p.course,
    cardMeta: p => [p.course].filter(Boolean),
    cardBody: p => p.body,
  },
  {
    key: 'notes',
    title: 'Shared Notes',
    icon: '📝',
    color: '#F0FDF4',
    table: 'shared_notes',
    special: 'notes',
    captureInstitution: true,
    tagline: 'Module summaries and revision notes, shared by students across every Irish college.',
    postCta: 'Upload Notes',
    fields: [
      { key: 'title', label: 'Title', type: T.TEXT, required: true, placeholder: 'e.g. Week 7 Consumer Behaviour Summary' },
      { key: 'subject', label: 'Subject', type: T.TEXT, required: true, placeholder: 'e.g. Consumer Behaviour' },
      { key: 'course', label: 'Course / Programme', type: T.TEXT, required: true, placeholder: 'e.g. Business & Marketing' },
      { key: 'year', label: 'Year of study', type: T.SELECT, required: true, options: ['1st year', '2nd year', '3rd year', '4th year', 'Postgrad'] },
      { key: 'file_url', label: 'File (PDF or image)', type: T.FILE, required: true, mimeKey: 'file_mime', nameKey: 'file_name' },
    ],
    filters: [
      { key: 'subject', label: 'Subject', type: 'search' },
      { key: 'course', label: 'Course', type: 'search' },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.subject, p.course, p.year].filter(Boolean),
  },
  {
    key: 'papers',
    title: 'Past Papers',
    icon: '📄',
    color: '#FFF7ED',
    table: 'past_papers',
    special: 'papers',
    captureInstitution: true,
    tagline: 'Past exam papers shared across every Irish college — browse, download, revise.',
    postCta: 'Upload a Past Paper',
    fields: [
      { key: 'subject', label: 'Subject', type: T.TEXT, required: true, placeholder: 'e.g. Contract Law' },
      { key: 'course', label: 'Course / Programme', type: T.TEXT, required: true, placeholder: 'e.g. Law' },
      { key: 'year', label: 'Exam year', type: T.TEXT, required: true, placeholder: 'e.g. 2023' },
      { key: 'exam_session', label: 'Exam session', type: T.SELECT, required: true, options: ['Semester 1', 'Semester 2', 'Summer', 'Autumn/Repeat'] },
      { key: 'file_url', label: 'File (PDF or image)', type: T.FILE, required: true, mimeKey: 'file_mime', nameKey: 'file_name' },
    ],
    filters: [
      { key: 'subject', label: 'Subject', type: 'search' },
      { key: 'course', label: 'Course', type: 'search' },
    ],
    cardTitle: p => `${p.subject} · ${p.exam_session} ${p.year}`,
    cardMeta: p => [p.course, p.year, p.exam_session].filter(Boolean),
  },
  {
    key: 'study-groups',
    title: 'Study Groups',
    icon: '📚',
    color: '#F0F9FF',
    table: 'course_connect_study_groups',
    tagline: 'Find or form a study group by module — open across every Irish college.',
    postCta: 'Post a Study Group',
    fields: [
      { key: 'subject', label: 'Subject / module', type: T.TEXT, required: true, placeholder: 'e.g. FIN301' },
      { key: 'university', label: 'Institution / employer', type: T.TEXT, required: true, placeholder: 'e.g. UCD, or your training centre / employer' },
      { key: 'year_of_study', label: 'Year of study', type: T.SELECT, required: true, options: ['1st year', '2nd year', '3rd year', '4th year', 'Postgrad'] },
      { key: 'format', label: 'Format', type: T.SELECT, required: true, options: ['In person', 'Online', 'Hybrid'] },
      { key: 'frequency', label: 'Frequency', type: T.TEXT, required: true, placeholder: 'e.g. Weekly, Thursdays' },
      { key: 'max_group_size', label: 'Max group size', type: T.NUMBER, required: true, min: 2, max: 50, default: 6 },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
    ],
    filters: [
      { key: 'subject', label: 'Subject', type: 'search' },
      { key: 'university', label: 'Institution', type: 'search' },
      { key: 'year_of_study', label: 'Year', type: T.SELECT, options: ['1st year', '2nd year', '3rd year', '4th year', 'Postgrad'] },
      { key: 'format', label: 'Format', type: T.SELECT, options: ['In person', 'Online', 'Hybrid'] },
    ],
    cardTitle: p => p.subject,
    cardMeta: p => [p.university, p.year_of_study, p.format, p.frequency].filter(Boolean),
  },
  {
    key: 'projects',
    title: 'Cross-Ireland Project Collaboration',
    icon: '💡',
    color: '#FDF4FF',
    table: 'cross_ireland_projects',
    special: 'projects',
    tagline: 'Find teammates for college projects and side projects, from any Irish college.',
    postCta: 'Post a Project',
    fields: [
      { key: 'title', label: 'Project title', type: T.TEXT, required: true },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'university', label: 'Your institution / employer', type: T.TEXT, required: true, placeholder: 'e.g. TCD' },
      { key: 'skills_needed', label: 'Skills needed', type: T.TAGS, placeholder: 'Type a skill and press add' },
      { key: 'timeline', label: 'Timeline', type: T.TEXT, required: true, placeholder: 'e.g. One semester' },
      { key: 'collaborators_needed', label: 'Collaborators needed', type: T.NUMBER, required: true, min: 1, max: 50, default: 1 },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
    ],
    filters: [
      { key: 'skills_needed', label: 'Skill', type: 'search' },
      { key: 'university', label: 'University', type: 'search' },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.university, p.timeline, `${p.collaborators_needed} spot${p.collaborators_needed !== 1 ? 's' : ''} needed`].filter(Boolean),
  },
  {
    key: 'industry',
    title: 'Industry Discussions',
    icon: '💼',
    color: '#FEF9C3',
    table: 'industry_discussions',
    tagline: 'Careers, internships, and industry news, by sector — for students, apprentices, and workers alike, talk to people already in the field.',
    postCta: 'Start a Discussion',
    fields: [
      { key: 'industry', label: 'Industry', type: T.SELECT, required: true, options: INDUSTRY_CATEGORIES },
      { key: 'title', label: 'Title', type: T.TEXT, required: true },
      { key: 'body', label: 'Post', type: T.TEXTAREA, required: true, placeholder: 'Ask a question, share news, or start a discussion...' },
    ],
    filters: [
      { key: 'industry', label: 'Industry', type: T.SELECT, options: INDUSTRY_CATEGORIES },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.industry].filter(Boolean),
    cardBody: p => p.body,
  },
  {
    // Reuses Campus Connect's `college_reviews` table rather than a
    // duplicate one — see the Phase 5 report for the reasoning (a single
    // shared pool of reviews makes more sense than fragmenting the same
    // data across two tables that would need to stay in sync). This entry
    // adds an `institution` field so a review can be attributed to a
    // specific college and filtered on — Campus Connect's own entry is
    // left unchanged (posted from inside a campus, so it doesn't ask).
    key: 'course-reviews',
    title: 'Public College Reviews',
    icon: '⭐',
    color: '#F0FDF4',
    table: 'college_reviews',
    special: 'reviews',
    tagline: 'Honest reviews of Irish colleges — overall rating, category breakdown, and written reviews.',
    postCta: 'Write a Review',
    fields: [
      { key: 'institution', label: 'College', type: T.TEXT, required: true, placeholder: 'e.g. University College Dublin' },
      { key: 'overall_rating', label: 'Overall rating', type: T.STARS, required: true },
      { key: 'teaching_quality', label: 'Teaching Quality', type: T.STARS, required: true },
      { key: 'campus_facilities', label: 'Campus Facilities', type: T.STARS, required: true },
      { key: 'student_support', label: 'Student Support', type: T.STARS, required: true },
      { key: 'social_life', label: 'Social Life', type: T.STARS, required: true },
      { key: 'value_for_money', label: 'Value for Money', type: T.STARS, required: true },
      { key: 'review_text', label: 'Written review', type: T.TEXTAREA, required: true },
      { key: 'anonymous', label: 'Post anonymously', type: T.TOGGLE },
    ],
    filters: [
      { key: 'institution', label: 'College', type: 'search' },
    ],
  },
]

export function getCourseBoard(key) {
  return COURSE_BOARDS.find(b => b.key === key) || null
}
