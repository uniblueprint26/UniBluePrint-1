/**
 * Interest and industry tags
 *
 * These are shown as a multi-select chip grid in sign-up step 3 and stored
 * on user_metadata.interests as an array of label strings.
 * Directory search matches against these labels.
 *
 * Keep labels short (1–3 words) so chips stay compact.
 * Add to CATEGORY_LABELS if a new category is introduced.
 */

export const INTERESTS = [
  // Technology
  { id: 'software_dev',   label: 'Software Dev',     category: 'Technology' },
  { id: 'data_science',   label: 'Data Science',     category: 'Technology' },
  { id: 'ai_ml',          label: 'AI & Machine Learning', category: 'Technology' },
  { id: 'cybersecurity',  label: 'Cybersecurity',    category: 'Technology' },
  { id: 'web_dev',        label: 'Web Development',  category: 'Technology' },
  { id: 'cloud',          label: 'Cloud & Infra',    category: 'Technology' },
  { id: 'ux_design',      label: 'UX & Design',      category: 'Technology' },
  { id: 'networking_it',  label: 'Networking (IT)',  category: 'Technology' },

  // Business
  { id: 'finance',        label: 'Finance',          category: 'Business' },
  { id: 'accounting',     label: 'Accounting',       category: 'Business' },
  { id: 'marketing',      label: 'Marketing',        category: 'Business' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', category: 'Business' },
  { id: 'human_resources', label: 'Human Resources', category: 'Business' },
  { id: 'economics',      label: 'Economics',        category: 'Business' },
  { id: 'sales',          label: 'Sales',            category: 'Business' },
  { id: 'management',     label: 'Management',       category: 'Business' },

  // Healthcare
  { id: 'nursing',        label: 'Nursing',          category: 'Healthcare' },
  { id: 'medicine',       label: 'Medicine',         category: 'Healthcare' },
  { id: 'pharmacy',       label: 'Pharmacy',         category: 'Healthcare' },
  { id: 'mental_health',  label: 'Mental Health',    category: 'Healthcare' },
  { id: 'physiology',     label: 'Physiology',       category: 'Healthcare' },
  { id: 'nutrition',      label: 'Nutrition',        category: 'Healthcare' },

  // Engineering
  { id: 'civil_eng',      label: 'Civil Engineering',       category: 'Engineering' },
  { id: 'mech_eng',       label: 'Mechanical Engineering',  category: 'Engineering' },
  { id: 'elec_eng',       label: 'Electrical Engineering',  category: 'Engineering' },
  { id: 'chem_eng',       label: 'Chemical Engineering',    category: 'Engineering' },
  { id: 'struct_eng',     label: 'Structural Engineering',  category: 'Engineering' },

  // Law and Social Sciences
  { id: 'law',            label: 'Law',              category: 'Law & Social' },
  { id: 'politics',       label: 'Politics',         category: 'Law & Social' },
  { id: 'psychology',     label: 'Psychology',       category: 'Law & Social' },
  { id: 'social_work',    label: 'Social Work',      category: 'Law & Social' },
  { id: 'sociology',      label: 'Sociology',        category: 'Law & Social' },

  // Creative
  { id: 'graphic_design', label: 'Graphic Design',   category: 'Creative' },
  { id: 'photography',    label: 'Photography',      category: 'Creative' },
  { id: 'film_video',     label: 'Film & Video',     category: 'Creative' },
  { id: 'writing',        label: 'Writing',          category: 'Creative' },
  { id: 'music',          label: 'Music',            category: 'Creative' },
  { id: 'fashion',        label: 'Fashion',          category: 'Creative' },
  { id: 'architecture',   label: 'Architecture',     category: 'Creative' },

  // Science
  { id: 'biology',        label: 'Biology',          category: 'Science' },
  { id: 'chemistry',      label: 'Chemistry',        category: 'Science' },
  { id: 'physics',        label: 'Physics',          category: 'Science' },
  { id: 'environmental',  label: 'Environmental Science', category: 'Science' },
  { id: 'marine_science', label: 'Marine Science',   category: 'Science' },

  // Sport and Fitness
  { id: 'fitness',        label: 'Fitness',          category: 'Sport & Fitness' },
  { id: 'sports_science', label: 'Sports Science',   category: 'Sport & Fitness' },
  { id: 'coaching',       label: 'Coaching',         category: 'Sport & Fitness' },
  { id: 'physiotherapy',  label: 'Physiotherapy',    category: 'Sport & Fitness' },

  // Education
  { id: 'teaching',       label: 'Teaching',         category: 'Education' },
  { id: 'early_years',    label: 'Early Years',      category: 'Education' },
  { id: 'special_ed',     label: 'Special Education', category: 'Education' },

  // Hospitality and Tourism
  { id: 'hospitality',    label: 'Hospitality',      category: 'Hospitality' },
  { id: 'culinary_arts',  label: 'Culinary Arts',    category: 'Hospitality' },
  { id: 'tourism',        label: 'Tourism',          category: 'Hospitality' },
  { id: 'event_mgmt',     label: 'Event Management', category: 'Hospitality' },

  // Trades and Construction
  { id: 'electrical_trade', label: 'Electrical',     category: 'Trades' },
  { id: 'plumbing',        label: 'Plumbing',        category: 'Trades' },
  { id: 'carpentry',       label: 'Carpentry',       category: 'Trades' },
  { id: 'construction',    label: 'Construction',    category: 'Trades' },
]

/** Max interests a user can select at sign-up */
export const MAX_INTERESTS = 5

/** Category group labels for future grouped display */
export const CATEGORY_LABELS = {
  'Technology':       'Technology',
  'Business':         'Business',
  'Healthcare':       'Healthcare',
  'Engineering':      'Engineering',
  'Law & Social':     'Law and Social Sciences',
  'Creative':         'Creative Arts',
  'Science':          'Science',
  'Sport & Fitness':  'Sport and Fitness',
  'Education':        'Education',
  'Hospitality':      'Hospitality and Tourism',
  'Trades':           'Trades and Construction',
}
