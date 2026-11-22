// Elevation Blueprint: what coaching covers, for the website.
//
// The website names no individual coach and shows no coach photos. Names,
// photos, profiles, counties and pricing live in the app, so this site never
// needs updating when a coach joins or leaves. These are categories only.
// Keep them in step with the app's coach list (app ElevationScreen).
export const COACH_FILTERS = ['All', 'Fitness', 'Academic', 'Finance', 'Marketing', 'Creative', 'Career']

export const COACH_CATEGORIES = [
  {
    id: 'fitness',
    filter: 'Fitness',
    title: 'Fitness and wellbeing',
    blurb: 'Personal training, physique coaching, online fitness plans, yoga and martial arts.',
    accent: '#145A3E',
  },
  {
    id: 'academic',
    filter: 'Academic',
    title: 'Academic grinds',
    blurb: 'One to one help with your subjects, from exam prep to the topics you find hardest.',
    accent: '#1E3A5F',
  },
  {
    id: 'finance',
    filter: 'Finance',
    title: 'Money and investing',
    blurb: 'Learn the basics of personal finance and investing from someone who explains it plainly.',
    accent: '#7C5A12',
  },
  {
    id: 'marketing',
    filter: 'Marketing',
    title: 'Digital marketing',
    blurb: 'Social media, personal branding and getting your work seen.',
    accent: '#4C1D95',
  },
  {
    id: 'creative',
    filter: 'Creative',
    title: 'Photography and video',
    blurb: 'Mentorship in photography, videography and editing.',
    accent: '#C2410C',
  },
  {
    id: 'career',
    filter: 'Career',
    title: 'Career guidance',
    blurb: 'Work out your next step, whether that is a course, an apprenticeship or a first job.',
    accent: '#0369A1',
  },
]

export const COACH_STEPS = [
  { n: 1, title: 'Browse in the app', desc: 'Every coach has a profile with their focus, county and what a session covers.' },
  { n: 2, title: 'Send a request', desc: 'Pick a coach and ask for a session. They reply to arrange a time.' },
  { n: 3, title: 'Meet and learn', desc: 'Sessions are agreed directly between you and your coach.' },
]
