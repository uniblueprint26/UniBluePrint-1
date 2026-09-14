/**
 * Interest and industry tags — the shared, expandable interest-tag system.
 *
 * This is shared infrastructure, not a Course Connect or Directory-specific
 * list: both screens (and sign-up) read from it and both write to the same
 * `profiles.interests` column (see the
 * 20260915100000_profiles_interests migration) through the shared
 * useInterests() hook (hooks/useInterests.js) — Task #12's Directory tag
 * filters are meant to consume this exact list and column rather than
 * duplicate it.
 *
 * INTERESTS below is the predefined, pickable set — broader than the
 * original 53-tag sign-up list it replaces, so there's a real chance
 * someone's actual interest is already on it. It's deliberately not
 * exhaustive, though: useInterests() also lets a person type in their own
 * label (see MAX_CUSTOM_INTEREST_LENGTH), stored the exact same way — a
 * plain string in the same array — so predefined and custom interests are
 * indistinguishable once saved and both work everywhere the array is read.
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
  { id: 'mobile_dev',     label: 'Mobile Development', category: 'Technology' },
  { id: 'game_dev',       label: 'Game Development', category: 'Technology' },
  { id: 'cloud',          label: 'Cloud & Infra',    category: 'Technology' },
  { id: 'ux_design',      label: 'UX & Design',      category: 'Technology' },
  { id: 'networking_it',  label: 'Networking (IT)',  category: 'Technology' },
  { id: 'robotics',       label: 'Robotics',         category: 'Technology' },

  // Business
  { id: 'finance',        label: 'Finance',          category: 'Business' },
  { id: 'accounting',     label: 'Accounting',       category: 'Business' },
  { id: 'marketing',      label: 'Marketing',        category: 'Business' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', category: 'Business' },
  { id: 'human_resources', label: 'Human Resources', category: 'Business' },
  { id: 'economics',      label: 'Economics',        category: 'Business' },
  { id: 'sales',          label: 'Sales',            category: 'Business' },
  { id: 'management',     label: 'Management',       category: 'Business' },
  { id: 'supply_chain',   label: 'Supply Chain & Logistics', category: 'Business' },
  { id: 'consulting',     label: 'Consulting',       category: 'Business' },

  // Healthcare
  { id: 'nursing',        label: 'Nursing',          category: 'Healthcare' },
  { id: 'medicine',       label: 'Medicine',         category: 'Healthcare' },
  { id: 'pharmacy',       label: 'Pharmacy',         category: 'Healthcare' },
  { id: 'mental_health',  label: 'Mental Health',    category: 'Healthcare' },
  { id: 'physiology',     label: 'Physiology',       category: 'Healthcare' },
  { id: 'nutrition',      label: 'Nutrition',        category: 'Healthcare' },
  { id: 'dentistry',      label: 'Dentistry',        category: 'Healthcare' },
  { id: 'paramedicine',   label: 'Paramedicine',     category: 'Healthcare' },

  // Engineering
  { id: 'civil_eng',      label: 'Civil Engineering',       category: 'Engineering' },
  { id: 'mech_eng',       label: 'Mechanical Engineering',  category: 'Engineering' },
  { id: 'elec_eng',       label: 'Electrical Engineering',  category: 'Engineering' },
  { id: 'chem_eng',       label: 'Chemical Engineering',    category: 'Engineering' },
  { id: 'struct_eng',     label: 'Structural Engineering',  category: 'Engineering' },
  { id: 'aero_eng',       label: 'Aerospace Engineering',   category: 'Engineering' },
  { id: 'biomed_eng',     label: 'Biomedical Engineering',  category: 'Engineering' },

  // Law and Social Sciences
  { id: 'law',            label: 'Law',              category: 'Law & Social' },
  { id: 'politics',       label: 'Politics',         category: 'Law & Social' },
  { id: 'psychology',     label: 'Psychology',       category: 'Law & Social' },
  { id: 'social_work',    label: 'Social Work',      category: 'Law & Social' },
  { id: 'sociology',      label: 'Sociology',        category: 'Law & Social' },
  { id: 'criminology',    label: 'Criminology',      category: 'Law & Social' },
  { id: 'international_relations', label: 'International Relations', category: 'Law & Social' },

  // Creative
  { id: 'graphic_design', label: 'Graphic Design',   category: 'Creative' },
  { id: 'photography',    label: 'Photography',      category: 'Creative' },
  { id: 'film_video',     label: 'Film & Video',     category: 'Creative' },
  { id: 'writing',        label: 'Writing',          category: 'Creative' },
  { id: 'music',          label: 'Music',            category: 'Creative' },
  { id: 'fashion',        label: 'Fashion',          category: 'Creative' },
  { id: 'architecture',   label: 'Architecture',     category: 'Creative' },
  { id: 'animation',      label: 'Animation',        category: 'Creative' },
  { id: 'theatre',        label: 'Theatre & Drama',  category: 'Creative' },

  // Science
  { id: 'biology',        label: 'Biology',          category: 'Science' },
  { id: 'chemistry',      label: 'Chemistry',        category: 'Science' },
  { id: 'physics',        label: 'Physics',          category: 'Science' },
  { id: 'environmental',  label: 'Environmental Science', category: 'Science' },
  { id: 'marine_science', label: 'Marine Science',   category: 'Science' },
  { id: 'astronomy',      label: 'Astronomy',        category: 'Science' },
  { id: 'agriculture',    label: 'Agriculture',      category: 'Science' },

  // Sport and Fitness
  { id: 'fitness',        label: 'Fitness',          category: 'Sport & Fitness' },
  { id: 'sports_science', label: 'Sports Science',   category: 'Sport & Fitness' },
  { id: 'coaching',       label: 'Coaching',         category: 'Sport & Fitness' },
  { id: 'physiotherapy',  label: 'Physiotherapy',    category: 'Sport & Fitness' },
  { id: 'gaa',            label: 'GAA',              category: 'Sport & Fitness' },
  { id: 'team_sports',    label: 'Team Sports',      category: 'Sport & Fitness' },
  { id: 'outdoor_adventure', label: 'Outdoor & Adventure', category: 'Sport & Fitness' },

  // Education
  { id: 'teaching',       label: 'Teaching',         category: 'Education' },
  { id: 'early_years',    label: 'Early Years',      category: 'Education' },
  { id: 'special_ed',     label: 'Special Education', category: 'Education' },
  { id: 'languages',      label: 'Languages',        category: 'Education' },

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
  { id: 'motor_mechanics',  label: 'Motor Mechanics', category: 'Trades' },
  { id: 'welding',          label: 'Welding & Fabrication', category: 'Trades' },
  { id: 'hvac',             label: 'HVAC & Refrigeration', category: 'Trades' },

  // Media and Public Life
  { id: 'journalism',      label: 'Journalism',       category: 'Media & Public' },
  { id: 'public_service',  label: 'Public Service',   category: 'Media & Public' },
  { id: 'volunteering',    label: 'Volunteering',     category: 'Media & Public' },
  { id: 'social_media',    label: 'Social Media',     category: 'Media & Public' },
  { id: 'gaming_esports',  label: 'Gaming & Esports', category: 'Media & Public' },
]

/** Max total interests a person can have set at once (predefined + custom combined). */
export const MAX_INTERESTS = 10

/** Max characters allowed in a self-typed custom interest label. */
export const MAX_CUSTOM_INTEREST_LENGTH = 30

/** Category group labels for grouped display. */
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
  'Media & Public':   'Media and Public Life',
}
