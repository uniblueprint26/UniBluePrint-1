import { EXPLORE_BUNDLES } from './exploreCatalog'

// The map of the app, used by global search and the side menu search.
//
// Every entry says where a thing lives, as a path from the top: for example
// CV Optimisation is Foundation Blueprint, then CV Optimisation. Search shows
// that path under the result like a web search does, so people learn where
// everything is. Only real places are listed. Nothing is invented.
//
//   path     the way there, top first. The last item is the thing itself
//   words    extra words that should find it (a person types "CV", "rent", "bus")
//   nav      where it opens: { tab, screen, params }. tab is one of
//            Home, AdBoard, Messages, Profile. The Foundation screen opens the
//            named service when given params.open
//   pillar   the pillar colour key (see constants/pillars.jsx), optional
//   about    one short line

const H = (screen, params) => ({ tab: 'Home', screen, params })

const FOUNDATION_SERVICES = [
  ['CV Optimisation', 'cv resume curriculum vitae'],
  ['Portfolio Building', 'portfolio work samples'],
  ['LinkedIn Optimisation', 'linkedin profile headline'],
  ['Cover Letter Assistance', 'cover letter application'],
  ['Personal Statement', 'ucas cao statement postgraduate'],
  ['Application Form Assistance', 'application form questions'],
  ['Interview Preparation', 'interview prep questions'],
  ['Job Search Support', 'job search plan'],
]

const BASE = [
  // Foundation
  { path: ['Foundation Blueprint'], words: 'foundation documents career envelope', nav: H('Foundation'), pillar: 'foundation', about: 'Documents and career help' },
  ...FOUNDATION_SERVICES.map(([name, words]) => ({
    path: ['Foundation Blueprint', name], words, nav: H('Foundation', { open: name }), pillar: 'foundation', about: 'Open the envelope and start your answers',
  })),
  { path: ['Foundation Blueprint', 'Evidence Bank'], words: 'stories examples evidence', nav: H('EvidenceBank'), pillar: 'foundation', about: 'Your saved stories for applications' },
  { path: ['Foundation Blueprint', 'My outputs'], words: 'deliverables delivered documents downloads', nav: H('MyOutputs'), pillar: 'foundation', about: 'Everything delivered to you' },
  { path: ['Foundation Blueprint', 'Career readiness'], words: 'checklist readiness', nav: H('CareerReadiness'), pillar: 'foundation', about: 'See how ready you are' },
  { path: ['Foundation Blueprint', 'Application tracker'], words: 'applications track jobs deadlines', nav: H('ApplicationTracker'), pillar: 'foundation', about: 'Keep track of where you applied' },

  // Elevation and Lifestyle
  { path: ['Elevation Blueprint'], words: 'coach coaching mentor sessions book', nav: H('Elevation'), pillar: 'elevation', about: 'Coaches and sessions' },
  { path: ['Lifestyle Blueprint'], words: 'partners wellbeing deals gym food', nav: H('Lifestyle'), pillar: 'lifestyle', about: 'Our partners and local offers' },
  { path: ['Lifestyle Blueprint', 'Partners'], words: 'partner places local', nav: H('LifestylePartners'), pillar: 'lifestyle', about: 'Places and people we work with' },
  { path: ['Lifestyle Blueprint', 'Featured deals'], words: 'deals discounts offers', nav: H('LifestyleFeaturedDeals'), pillar: 'lifestyle', about: 'Offers from our partners' },
  { path: ['Lifestyle Blueprint', 'Wellbeing'], words: 'wellbeing mental health support helpline', nav: H('LifestyleWellbeing'), pillar: 'lifestyle', about: 'Support and healthy habits' },

  // Campus Connect
  { path: ['Campus Connect'], words: 'campus community toolkit', nav: H('CampusConnect'), pillar: 'campus', about: 'Your own community' },
  { path: ['Campus Connect', 'Boards'], words: 'boards accommodation events ride share carpool lost and found', nav: H('CampusBoards'), pillar: 'campus', about: 'Accommodation, events, rides and more' },
  { path: ['Campus Connect', 'Busy spots'], words: 'busy heatmap queue crowded library canteen', nav: H('BusySpots'), pillar: 'campus', about: 'See how busy places are' },
  { path: ['Campus Connect', 'Study rooms'], words: 'study room library book space', nav: H('StudyRooms'), pillar: 'campus', about: 'Share and find study rooms' },
  { path: ['Campus Connect', 'Commute buddy'], words: 'commute travel buddy bus train', nav: H('CommuteBuddy'), pillar: 'campus', about: 'Travel with someone' },
  { path: ['Campus Connect', 'Toolkit'], words: 'toolkit weather what to wear night bus transport', nav: H('CampusToolkit'), pillar: 'campus', about: 'Weather, transport and more' },
  { path: ['Campus Connect', 'Campus pulse'], words: 'pulse weekly question', nav: H('CampusPulseArchive'), pillar: 'campus', about: 'Past weeks of the pulse' },
  { path: ['Campus Connect', 'Ranked'], words: 'ranked leaderboard', nav: H('CampusRanked'), pillar: 'campus', about: 'How campuses rank' },
  { path: ['Campus Connect', 'Roomy.ie'], words: 'roomy accommodation rent room digs', nav: H('RoomyPartner'), pillar: 'campus', about: 'Our accommodation partner' },

  // Course Connect
  { path: ['Course Connect'], words: 'course connect across ireland talk', nav: H('CourseConnect'), pillar: 'course', about: 'Everyone in Ireland, one place to talk' },
  { path: ['Course Connect', 'Questions and answers'], words: 'q and a questions ask answer help', nav: H('ModuleQA'), pillar: 'course', about: 'Ask and answer' },
  { path: ['Course Connect', 'Resource finder'], words: 'resources notes links', nav: H('ResourceFinder'), pillar: 'course', about: 'Find useful resources' },

  // Money, Compass, Ad Board
  { path: ['Budgeting'], words: 'money budget spend save income', nav: H('Budgeting'), about: 'Track what comes in and goes out' },
  { path: ['Course Compass'], words: 'cao course choose compass degree', nav: H('Compass'), pillar: 'compass', about: 'Find the course that fits you' },
  { path: ['Ad Board'], words: 'ads adverts marketplace', nav: { tab: 'AdBoard', screen: 'AdBoardMain' }, about: 'Magazine, blogs and listings' },
  { path: ['Ad Board', 'Weekly Blueprint'], words: 'magazine weekly issue', nav: { tab: 'AdBoard', screen: 'WeeklyBlueprint' }, about: 'The weekly magazine' },
  { path: ['Ad Board', 'Blog'], words: 'blog articles read', nav: { tab: 'AdBoard', screen: 'Blog' }, about: 'This week’s blogs' },
  { path: ['Ad Board', 'Marketplace'], words: 'buy sell marketplace listing', nav: { tab: 'AdBoard', screen: 'Marketplace' }, about: 'Baskets of listings' },
  { path: ['Ad Board', 'Marketplace', 'Jobs'], words: 'jobs work part time', nav: { tab: 'AdBoard', screen: 'AdBoardBasket', params: { basket: 'jobs' } }, about: 'Jobs on the Ad Board' },
  { path: ['Ad Board', 'Marketplace', 'Tutors'], words: 'tutors grinds lessons', nav: { tab: 'AdBoard', screen: 'AdBoardBasket', params: { basket: 'tutors' } }, about: 'Find a tutor' },
  { path: ['Ad Board', 'Marketplace', 'Deals'], words: 'deals offers discounts', nav: { tab: 'AdBoard', screen: 'AdBoardBasket', params: { basket: 'deals' } }, about: 'Deals for members' },

  // Everyday places
  { path: ['Home', 'Calendar'], words: 'calendar events exams timetable import', nav: H('Calendar'), about: 'Your week and your exams' },
  { path: ['Home', 'Notifications'], words: 'alerts bell notifications', nav: H('Notifications'), about: 'What is new' },
  { path: ['Home', 'Explore'], words: 'explore bundles tools', nav: H('Explore'), about: 'Tools, scholarships and more' },
  { path: ['Home', 'Saved posts'], words: 'saved bookmarks', nav: H('SavedPosts'), about: 'Posts you bookmarked' },
  { path: ['Home', 'Live archive'], words: 'live archive moments', nav: H('LiveArchive'), about: 'Your Live moments' },
  { path: ['Messages'], words: 'chat messages dm inbox', nav: { tab: 'Messages', screen: 'MessagesMain' }, about: 'Chats and requests' },
  { path: ['Messages', 'Discover'], words: 'discover people meet swipe', nav: { tab: 'Messages', screen: 'MessagesMain', params: { tab: 'discover' } }, about: 'Meet people' },

  // Profile and settings
  { path: ['Profile'], words: 'profile me account', nav: { tab: 'Profile', screen: 'ProfileMain' }, about: 'Your details and plan' },
  { path: ['Profile', 'Settings'], words: 'settings preferences', nav: { tab: 'Profile', screen: 'Settings' }, about: 'Account, privacy, appearance' },
  { path: ['Profile', 'Settings', 'Notifications'], words: 'notification choices quiet hours alerts', nav: { tab: 'Profile', screen: 'Settings' }, about: 'Choose what you hear about' },
  { path: ['Profile', 'Settings', 'Appearance'], words: 'dark mode light theme', nav: { tab: 'Profile', screen: 'Settings' }, about: 'System, light or dark' },
  { path: ['Profile', 'Settings', 'Blocked members'], words: 'block unblock blocked', nav: { tab: 'Profile', screen: 'BlockedMembers' }, about: 'People you blocked' },
  { path: ['Profile', 'Settings', 'Privacy and data'], words: 'privacy data gdpr', nav: { tab: 'Profile', screen: 'PrivacyData' }, about: 'Your rights and what we keep' },
  { path: ['Profile', 'Settings', 'Download my data'], words: 'export download data copy', nav: { tab: 'Profile', screen: 'PrivacyData' }, about: 'Get a copy of your data' },
  { path: ['Profile', 'Settings', 'Delete account'], words: 'delete close remove account', nav: { tab: 'Profile', screen: 'PrivacyData' }, about: 'Permanent' },
  { path: ['Profile', 'Plans'], words: 'pricing plans pro price', nav: { tab: 'Profile', screen: 'Pricing' }, about: 'What each plan includes' },
  { path: ['Profile', 'Settings', 'Help and support'], words: 'help support contact', nav: { tab: 'Profile', screen: 'Help' }, about: 'Get help from the team' },
  { path: ['Profile', 'Settings', 'FAQs'], words: 'faq questions', nav: { tab: 'Profile', screen: 'FAQs' }, about: 'Quick answers' },
  { path: ['Profile', 'Settings', 'About UniBlueprint'], words: 'about team mission', nav: { tab: 'Profile', screen: 'About' }, about: 'Who we are' },
  { path: ['Profile', 'Settings', 'How UniBlueprint works'], words: 'tour walkthrough how it works', nav: { tab: 'Profile', screen: 'BlueprintTour' }, about: 'Replay the walkthrough' },
]

// Explore bundle rows come straight from the Explore catalog so the two never
// disagree. Coming soon rows are left out.
const EXPLORE = EXPLORE_BUNDLES.flatMap(b => b.rows
  .filter(r => !r.comingSoon)
  .map(r => ({
    path: ['Home', 'Explore', b.title, r.name],
    words: `${r.name} ${r.hint || ''}`,
    row: r,
    about: r.hint,
  })))

export const SEARCH_INDEX = [...BASE, ...EXPLORE].map((e, i) => ({
  ...e,
  id: String(i),
  title: e.path[e.path.length - 1],
  trail: e.path.slice(0, -1),
}))

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() }

// Returns the best matches, best first. Matches the start of a word, so "cv"
// finds CV Optimisation and "opt" finds it too. A hit in the title counts more
// than a hit in the path or the extra words.
export function searchApp(query, limit = 12) {
  const q = norm(query)
  if (!q) return []
  const terms = q.split(' ')
  const scored = []
  for (const e of SEARCH_INDEX) {
    const title = norm(e.title)
    const trail = norm(e.trail.join(' '))
    const words = norm(e.words)
    const about = norm(e.about)
    let score = 0
    let ok = true
    for (const t of terms) {
      const re = new RegExp(`(^| )${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      let s = 0
      if (title === t) s = 12
      else if (re.test(title)) s = 8
      else if (re.test(trail)) s = 4
      else if (re.test(words)) s = 5
      else if (re.test(about)) s = 2
      else if (t.length > 2 && (title.includes(t) || words.includes(t))) s = 1
      if (!s) { ok = false; break }
      score += s
    }
    if (ok) scored.push({ e, score: score - e.path.length * 0.1 })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(x => x.e)
}

// Opens a search result. `navigation` can be any navigator in the app. The
// side menu passes its own navigation, which is why this goes through MainTabs
// when it has to.
export function openSearchResult(navigation, entry, { fromDrawer = false } = {}) {
  if (entry.row) {
    // Explore catalog rows know how to open themselves.
    const { openExploreRow } = require('../lib/explore/exploreRows')
    if (fromDrawer) {
      navigation.navigate('MainTabs', { screen: 'Home', params: { screen: entry.row.route || 'Explore', params: entry.row.params } })
    } else {
      openExploreRow(navigation, entry.row)
    }
    return
  }
  const { tab, screen, params } = entry.nav
  if (fromDrawer) {
    navigation.navigate('MainTabs', { screen: tab, params: { screen, params } })
  } else if (tab === 'Home') {
    navigation.navigate(screen, params)
  } else {
    navigation.navigate(tab, { screen, params })
  }
}
