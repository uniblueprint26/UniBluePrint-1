// ─── Elevation Blueprint coaches — shared data ─────────────────────────────
//
// Single source of truth for the website's public coach listing, used by
// both the full grid (ElevationBlueprintPage.jsx) and each coach's own
// shareable preview page (ElevationCoachProfilePage.jsx). Previously this
// array lived inline in ElevationBlueprintPage.jsx only; pulled out here so
// a direct link to one coach (e.g. for sharing) can read the same data
// without duplicating it.
//
// `from` mirrors each coach's real pricing from the app (app/src/screens/
// ElevationScreen.jsx), a genuine "From €X" teaser where one exists, or
// "Enquire in the app" where the app itself has no public number
// (enquiry-only, on-request, or a non-price metric like a copier target).
// Per Desmond: show enough to convert without giving the full picture away
// on web — this mix is what the real data already supports, not a separate
// gating layer, and the per-coach page below shows exactly these same
// fields, nothing more.
export const COACHES = [
  { id: 1,  name: 'Emmanuel',    via: 'via 500+ with Eman', photo: '/coaches/eman.jpg',       category: 'Academic Grinds',      location: 'Dublin',        filter: 'Academic Grinds',  from: 'Enquire in the app', services: ['LC Maths', 'LC Biology', 'LC Physics'], accent: '#1E3A5F' },
  { id: 2,  name: 'Jack',        via: 'via JMC Fitness',    photo: '/coaches/jmc.jpg',        category: 'Sports Coaching',      location: 'North Dublin',  filter: 'Sports',           from: 'Enquire in the app', services: ['In-Person Training', 'Football Coaching', 'Agent Connections'],    accent: '#166534' },
  { id: 3,  name: 'Nathan Yanzo', via: 'via Nyz3ditz',      photo: '/coaches/nathan.jpg',     category: 'Photography and Video', location: 'Ireland',      filter: 'Creative',         from: 'Enquire in the app', services: ['Monthly Mentorship', '1-1 Shoot Sessions', 'Creative Direction'], accent: '#C2410C' },
  { id: 4,  name: 'DG Trading',  photo: '/coaches/dgtrading.jpg', category: 'Trading and Finance',  location: 'Ireland',       filter: 'Trading and Finance',          from: 'Enquire in the app', services: ['NQ & MNQ Futures', 'ICT-Based Concepts', 'New York Pre-Market'], accent: '#1B4B5A' },
  { id: 6,  name: 'Emanuel T.',  photo: '/coaches/emanuelt.jpg',  category: 'Personal Training',    location: 'Ireland',       filter: 'Fitness',          from: 'Enquire in the app', services: ['Online Workout Plans', 'Nutrition Plans', 'Calisthenics Coaching'], accent: '#2D4B8E' },
  { id: 7,  name: 'Tadgh',       photo: '/coaches/tadgh.jpg',     category: 'Physique Development', location: 'Dublin',        filter: 'Fitness',          from: 'Enquire in the app', services: ['Custom Training Plans', 'Nutrition Coaching', 'Weekly Check-ins'], accent: '#145A3E' },
  { id: 8,  name: 'Milan',       via: 'via MPFitness',      photo: '/coaches/milan.jpg',      category: 'Personal Training',    location: 'Ireland',       filter: 'Fitness',          from: 'Enquire in the app', services: ['Physique Development', 'Fat Loss and Muscle Gain', 'Nutrition Coaching'], accent: '#15803D' },
  { id: 9,  name: 'Kevin',       via: 'via TrainwitKev',    photo: '/coaches/kevin.jpg',      category: 'Personal Training',    location: 'Dublin',        filter: 'Fitness',          from: 'Enquire in the app', services: ['1-to-1 PT Sessions', 'Beginner Gym Coaching', 'Accountability Coaching'], accent: '#145A3E' },
  { id: 10, name: 'Alex',        via: 'via Leva Impact',    photo: '/coaches/alex.jpg',       category: 'Digital Marketing',    location: 'Co. Mayo',      filter: 'Marketing',        from: 'Enquire in the app', services: ['Social Media Management', 'Content & Graphics', 'Creator Coordination', 'Client Reporting'], accent: '#4C1D95', badge: 'Student Mentor Listing', crossLinkHref: '/partners#leva', crossLinkLabel: 'See LEVA Impact on Partners' },
  { id: 12, name: 'Jayden',      photo: '/coaches/jayden.jpg',    category: 'Health and Fitness',   location: 'County Sligo',  filter: 'Fitness',          from: 'Enquire in the app', services: ['1-1 Online Coaching', 'Fitness Plans', 'Nutritional Guidance'],  accent: '#134E4A' },
  { id: 13, name: 'Stephen',     via: 'via Course Compass', photo: '/coaches/coursecompass.jpg', category: 'Course Compass',       location: 'Ireland',       filter: 'Career',           services: ['Career Planning', 'Graduate Pathways', 'Interview Prep', 'CAO Guidance'], accent: '#1B4B5A', href: '/course-compass' },
  { id: 14, name: 'Camila',      photo: '/coaches/camila.jpg',    category: 'Personal Training · Muay Thai · Yoga', location: 'Dublin 8', filter: 'Fitness', from: 'Enquire in the app', services: ['Physique Development', 'Muay Thai Fitness', 'Nutrition Coaching'], accent: '#145A3E', crossLinkHref: '/partners#camila', crossLinkLabel: "See Camila's Lifestyle listing" },
  { id: 15, name: 'Aoife',       via: 'via The Brave Flow Yoga', photo: '/coaches/aoife.jpg', category: 'Yoga',                 location: 'Dublin',        filter: 'Yoga',             from: 'Enquire in the app', services: ['Beginner Friendly Yoga', '1-to-1 Sessions', 'Meditation Classes'], accent: '#145A3E' },
  { id: 18, name: 'Zainab Adeyemi', via: 'via Soft Life Investing', photo: '/coaches/zainab.jpg', category: 'Investing & Finance Coach', location: 'Ireland', filter: 'Trading and Finance',       from: 'Enquire in the app', services: ['Personal Finance Coaching', 'Budgeting & Saving', 'Irish Investing Rules'], accent: '#1B4B5A' },
  { id: 19, name: 'Luana Ciweck', photo: '/coaches/luana.jpg', category: 'Online Fitness Coaching', location: 'Co. Mayo',  filter: 'Fitness',        from: 'Enquire in the app', services: ['Online Fitness Coaching', 'Personalised Programmes', 'Confidence & Strength Coaching'], accent: '#145A3E' },
]

export function getCoachById(id) {
  const numericId = Number(id)
  return COACHES.find(c => c.id === numericId)
}
