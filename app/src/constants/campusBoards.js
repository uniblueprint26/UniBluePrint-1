/**
 * Campus Connect — board registry.
 *
 * One entry per board. `fields` drives the generic post form
 * (PostFormModal) and `filters` drives the generic filter bar on
 * BoardDetailScreen — field/filter `key`s are the literal Postgres column
 * name on `table`, so a generic insert is just `{ ...values, user_id }`.
 *
 * `special` marks boards whose browse view needs bespoke UI beyond the
 * generic card list (set on BoardDetailScreen): 'accommodation' (Roomy.ie
 * panel), 'clubs' (join button + request-a-society), 'projects' (example
 * confirmation sheet), 'problems' (solutions thread + upvote), 'reviews'
 * (aggregate ratings header), 'suggestions' (upvote), 'ads' (mark sold).
 * Every board, special or not, still uses the shared PostFormModal for its
 * post form and the shared campus gate before posting.
 */

export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  DECIMAL: 'decimal',
  SELECT: 'select',
  TOGGLE: 'toggle',
  TAGS: 'tags',
  DATE: 'date',
  PHOTO: 'photo',
  STARS: 'stars',
  // Added for Course Connect (Shared Notes / Past Papers) — PDF or image
  // upload via FileUploader, distinct from PHOTO (image-only, compressed).
  FILE: 'file',
}

const T = FIELD_TYPES

export const CAMPUS_BOARDS = [
  {
    key: 'accommodation',
    title: 'Accommodation',
    icon: '🏠',
    color: '#EFF6FF',
    table: 'accommodation_posts',
    special: 'accommodation',
    tagline: 'Rooms, houseshares, and flats to share near your campus.',
    postCta: 'Post to Accommodation',
    fields: [
      { key: 'post_type', label: 'Post type', type: T.SELECT, required: true, options: ['Looking for room', 'Room available', 'Flat to share'] },
      { key: 'title', label: 'Title', type: T.TEXT, required: true, placeholder: 'e.g. Room near UCD, bills included' },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true, placeholder: 'Bedroom size, house rules, who you’re looking for...' },
      { key: 'rent_per_month', label: 'Rent per month (€)', type: T.DECIMAL, placeholder: 'e.g. 600' },
      { key: 'location', label: 'Location', type: T.TEXT, required: true, placeholder: 'e.g. Smithfield, Dublin 7' },
      { key: 'available_from', label: 'Available from', type: T.DATE, placeholder: 'YYYY-MM-DD' },
      { key: 'contact_preference', label: 'Contact preference', type: T.TEXT, required: true, placeholder: 'Email, phone, or in-app chat' },
      { key: 'photo_url', label: 'Photo (optional)', type: T.PHOTO },
    ],
    filters: [
      { key: 'post_type', label: 'Type', type: T.SELECT, options: ['Looking for room', 'Room available', 'Flat to share'] },
      { key: 'location', label: 'Location', type: 'search' },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.post_type, p.rent_per_month != null ? `€${p.rent_per_month}/mo` : null, p.location].filter(Boolean),
  },
  {
    key: 'events',
    title: 'Campus Events',
    icon: '🎉',
    color: '#FDF4FF',
    table: 'campus_events',
    tagline: 'Society nights, careers fairs, open days, and student-run events.',
    postCta: 'Post an Event',
    fields: [
      { key: 'event_name', label: 'Event name', type: T.TEXT, required: true },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'event_date', label: 'Date', type: T.DATE, required: true, placeholder: 'YYYY-MM-DD' },
      { key: 'event_time', label: 'Time', type: T.TEXT, required: true, placeholder: 'e.g. 7:00pm' },
      { key: 'location', label: 'Location on campus', type: T.TEXT, required: true },
      { key: 'organiser', label: 'Organiser', type: T.TEXT, required: true, placeholder: 'e.g. Law Society' },
      { key: 'is_ticketed', label: 'Ticketed event', type: T.TOGGLE, offLabel: 'Free entry', onLabel: 'Ticketed' },
      { key: 'ticket_link', label: 'Ticket link', type: T.TEXT, placeholder: 'https://...', showIf: v => !!v.is_ticketed },
    ],
    filters: [
      { key: 'is_ticketed', label: 'Free / Ticketed', type: T.SELECT, options: ['Free', 'Ticketed'] },
      { key: 'organiser', label: 'Organiser / society', type: 'search' },
    ],
    cardTitle: p => p.event_name,
    cardMeta: p => [`${p.event_date ?? ''} · ${p.event_time ?? ''}`, p.location, p.is_ticketed ? 'Ticketed' : 'Free'].filter(Boolean),
  },
  {
    key: 'study-groups',
    title: 'Study Groups',
    icon: '📚',
    color: '#F0F9FF',
    table: 'study_groups',
    tagline: 'Find or form a study group by module, level, or subject.',
    postCta: 'Post a Study Group',
    fields: [
      { key: 'subject', label: 'Subject / module', type: T.TEXT, required: true, placeholder: 'e.g. FIN301' },
      { key: 'year_of_study', label: 'Year of study', type: T.SELECT, required: true, options: ['1st year', '2nd year', '3rd year', '4th year', 'Postgrad'] },
      { key: 'format', label: 'Format', type: T.SELECT, required: true, options: ['In person', 'Online', 'Hybrid'] },
      { key: 'frequency', label: 'Frequency', type: T.TEXT, required: true, placeholder: 'e.g. Weekly, Thursdays' },
      { key: 'max_group_size', label: 'Max group size', type: T.NUMBER, required: true, min: 2, max: 50, default: 6 },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
    ],
    filters: [
      { key: 'subject', label: 'Subject', type: 'search' },
      { key: 'year_of_study', label: 'Year', type: T.SELECT, options: ['1st year', '2nd year', '3rd year', '4th year', 'Postgrad'] },
      { key: 'format', label: 'Format', type: T.SELECT, options: ['In person', 'Online', 'Hybrid'] },
    ],
    cardTitle: p => p.subject,
    cardMeta: p => [p.year_of_study, p.format, p.frequency].filter(Boolean),
  },
  {
    key: 'lost-found',
    title: 'Lost and Found',
    icon: '🔍',
    color: '#FFF7ED',
    table: 'lost_found_posts',
    tagline: 'Report a lost item, or hand something found back to its owner.',
    postCta: 'Post to Lost & Found',
    fields: [
      { key: 'status', label: 'Found or lost?', type: T.SELECT, required: true, options: ['Found', 'Lost'] },
      { key: 'item_description', label: 'Item description', type: T.TEXTAREA, required: true, placeholder: 'Colour, brand, any distinguishing details...' },
      { key: 'location', label: 'Location found / last seen', type: T.TEXT, required: true },
      { key: 'date_occurred', label: 'Date', type: T.DATE, placeholder: 'YYYY-MM-DD' },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
      { key: 'photo_url', label: 'Photo (optional)', type: T.PHOTO },
    ],
    filters: [
      { key: 'status', label: 'Found / Lost', type: T.SELECT, options: ['Found', 'Lost'] },
    ],
    cardTitle: p => p.item_description,
    cardMeta: p => [p.status, p.location, p.date_occurred].filter(Boolean),
  },
  {
    key: 'conversations',
    title: 'Campus Conversation Boards',
    icon: '💬',
    color: '#FDF4FF',
    table: 'campus_conversations',
    tagline: 'Open discussion, whatever your campus wants to talk about.',
    postCta: 'Start a Conversation',
    fields: [
      { key: 'title', label: 'Title (optional)', type: T.TEXT },
      { key: 'body', label: 'What’s on your mind?', type: T.TEXTAREA, required: true },
      { key: 'anonymous', label: 'Post anonymously', type: T.TOGGLE },
    ],
    filters: [],
    cardTitle: p => p.title || null,
    cardMeta: () => [],
    cardBody: p => p.body,
  },
  {
    key: 'clubs',
    title: 'Join Clubs and Societies',
    icon: '🤝',
    color: '#F0FDF4',
    table: 'clubs_societies',
    special: 'clubs',
    tagline: 'Find and join clubs and societies at your campus.',
    postCta: 'Request a New Society',
    // Fields used only for the "request a new society" flow — a request
    // inserts into the same table with status = 'requested'.
    fields: [
      { key: 'name', label: 'Society name', type: T.TEXT, required: true },
      { key: 'category', label: 'Category', type: T.TEXT, required: true, placeholder: 'e.g. Sports, Arts & Culture' },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'contact', label: 'Contact (optional)', type: T.TEXT },
    ],
    filters: [
      { key: 'category', label: 'Category', type: 'search' },
    ],
  },
  {
    key: 'projects',
    title: 'Project Collaboration',
    icon: '💡',
    color: '#FDF4FF',
    table: 'project_collaborations',
    special: 'projects',
    tagline: 'Find teammates for college projects and side projects.',
    postCta: 'Post a Project',
    fields: [
      { key: 'title', label: 'Project title', type: T.TEXT, required: true },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'skills_needed', label: 'Skills needed', type: T.TAGS, placeholder: 'Type a skill and press add' },
      { key: 'timeline', label: 'Timeline', type: T.TEXT, required: true, placeholder: 'e.g. One semester' },
      { key: 'collaborators_needed', label: 'Collaborators needed', type: T.NUMBER, required: true, min: 1, max: 50, default: 1 },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
    ],
    filters: [
      { key: 'skills_needed', label: 'Skill', type: 'search' },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.timeline, `${p.collaborators_needed} spot${p.collaborators_needed !== 1 ? 's' : ''} needed`].filter(Boolean),
  },
  {
    key: 'problems',
    title: 'Problems and Solutions',
    icon: '🧩',
    color: '#FEF9C3',
    table: 'problems_posts',
    special: 'problems',
    tagline: 'Ask for help, and share solutions with your campus community.',
    postCta: 'Post a Problem',
    fields: [
      { key: 'description', label: 'Describe the problem', type: T.TEXTAREA, required: true },
      { key: 'category', label: 'Category', type: T.SELECT, required: true, options: ['Campus facilities', 'Academic', 'Housing', 'Transport', 'Other'] },
      { key: 'anonymous', label: 'Post anonymously', type: T.TOGGLE },
    ],
    filters: [
      { key: 'category', label: 'Category', type: T.SELECT, options: ['Campus facilities', 'Academic', 'Housing', 'Transport', 'Other'] },
    ],
    cardMeta: p => [p.category].filter(Boolean),
    cardBody: p => p.description,
  },
  {
    key: 'subscriptions',
    title: 'Shared Subscriptions',
    icon: '🔗',
    color: '#F0F9FF',
    table: 'shared_subscriptions',
    tagline: 'Split the cost of streaming, software, and other subscriptions.',
    postCta: 'Post a Subscription',
    fields: [
      { key: 'service_name', label: 'Service name', type: T.TEXT, required: true, placeholder: 'e.g. Spotify Family' },
      { key: 'spots_available', label: 'Spots available', type: T.NUMBER, required: true, min: 1, max: 20, default: 1 },
      { key: 'cost_per_person', label: 'Cost per person / month (€)', type: T.DECIMAL, required: true },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
    ],
    filters: [
      { key: 'service_name', label: 'Service', type: 'search' },
    ],
    cardTitle: p => p.service_name,
    cardMeta: p => [`${p.spots_available} spot${p.spots_available !== 1 ? 's' : ''} left`, `€${p.cost_per_person}/mo each`].filter(Boolean),
  },
  {
    key: 'reviews',
    title: 'College Reviews',
    icon: '⭐',
    color: '#F0FDF4',
    table: 'college_reviews',
    special: 'reviews',
    tagline: 'Honest reviews of courses, modules, and college life.',
    postCta: 'Write a Review',
    fields: [
      { key: 'overall_rating', label: 'Overall rating', type: T.STARS, required: true },
      { key: 'teaching_quality', label: 'Teaching Quality', type: T.STARS, required: true },
      { key: 'campus_facilities', label: 'Campus Facilities', type: T.STARS, required: true },
      { key: 'student_support', label: 'Student Support', type: T.STARS, required: true },
      { key: 'social_life', label: 'Social Life', type: T.STARS, required: true },
      { key: 'value_for_money', label: 'Value for Money', type: T.STARS, required: true },
      { key: 'review_text', label: 'Written review', type: T.TEXTAREA, required: true },
      { key: 'anonymous', label: 'Post anonymously', type: T.TOGGLE },
    ],
    filters: [],
  },
  {
    key: 'suggestions',
    title: 'Campus Suggestions',
    icon: '💭',
    color: '#FDF4FF',
    table: 'campus_suggestions',
    special: 'suggestions',
    tagline: 'Suggest improvements and ideas for your campus.',
    postCta: 'Post a Suggestion',
    fields: [
      { key: 'title', label: 'Title', type: T.TEXT, required: true },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'category', label: 'Category', type: T.SELECT, required: true, options: ['Facilities', 'Events', 'Services', 'Academic', 'Other'] },
      { key: 'anonymous', label: 'Post anonymously', type: T.TOGGLE },
    ],
    filters: [
      { key: 'category', label: 'Category', type: T.SELECT, options: ['Facilities', 'Events', 'Services', 'Academic', 'Other'] },
    ],
    cardTitle: p => p.title,
    cardBody: p => p.description,
  },
  {
    key: 'ads',
    title: 'Student Ads',
    icon: '📢',
    color: '#F5F0E8',
    table: 'student_ads',
    special: 'ads',
    tagline: 'Buy, sell, offer a service, or advertise to your campus.',
    postCta: 'Post a Student Ad',
    fields: [
      { key: 'ad_type', label: 'Ad type', type: T.SELECT, required: true, options: ['Service offered', 'Item for sale', 'Item wanted', 'Tutoring', 'Other'] },
      { key: 'title', label: 'Title', type: T.TEXT, required: true },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'price', label: 'Price (€, if applicable)', type: T.DECIMAL },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true },
      { key: 'photo_url', label: 'Photo (optional)', type: T.PHOTO },
    ],
    filters: [
      { key: 'ad_type', label: 'Type', type: T.SELECT, options: ['Service offered', 'Item for sale', 'Item wanted', 'Tutoring', 'Other'] },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.ad_type, p.price != null ? `€${p.price}` : null].filter(Boolean),
  },
  {
    key: 'opportunities',
    title: 'Opportunities',
    icon: '💼',
    color: '#FEF9C3',
    table: 'opportunities',
    tagline: 'Internships, part-time jobs, volunteering, and more.',
    postCta: 'Post an Opportunity',
    fields: [
      { key: 'opportunity_type', label: 'Opportunity type', type: T.SELECT, required: true, options: ['Internship', 'Part-time job', 'Volunteer', 'Competition', 'Grant', 'Other'] },
      { key: 'title', label: 'Title', type: T.TEXT, required: true },
      { key: 'organisation', label: 'Organisation', type: T.TEXT, required: true },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true },
      { key: 'link', label: 'Link', type: T.TEXT, placeholder: 'https://...' },
      { key: 'deadline', label: 'Deadline (if applicable)', type: T.DATE, placeholder: 'YYYY-MM-DD' },
    ],
    filters: [
      { key: 'opportunity_type', label: 'Type', type: T.SELECT, options: ['Internship', 'Part-time job', 'Volunteer', 'Competition', 'Grant', 'Other'] },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.opportunity_type, p.organisation, p.deadline ? `Deadline ${p.deadline}` : null].filter(Boolean),
  },
]

export function getBoard(key) {
  return CAMPUS_BOARDS.find(b => b.key === key) || null
}
