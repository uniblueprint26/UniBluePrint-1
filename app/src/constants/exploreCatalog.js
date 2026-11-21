import {
  GraduationCap, Users, StickyNote, Calculator, CalendarClock, ArrowRightLeft,
  Tag, ShieldCheck, Leaf, Search, Bus, Wallet, Briefcase, CheckCheck, Hourglass,
  Building2, Flag, Sparkles, BookOpen, Radio, CircleHelp, LayoutGrid, Handshake,
} from 'lucide-react-native'
import { COURSE_COMPASS, KOBO, SCOUT, ROOMY } from './partnerBrands'
import { priorityChrome } from './priorityTheme'

// The Explore catalog: one place that says what exists in the app.
//
// Explore groups things into BUNDLES. A bundle is one tile on Explore that
// opens its own page (ExploreBundle) listing its rows, so no row list gets long.
// Every row is live and opens something that works today, one of these ways:
//   `kind`          a generic list from the explore_content table, opened on
//                   the ExploreList screen
//   `route`         a screen in the Home stack, with optional `params`
//   `adBoardBasket` a basket of the Ad Board Marketplace ('tutors', 'jobs')
//   `comingSoon`    a coming soon row. Only shown while the remote switch
//                   coming_soon_tiles is on (constants/comingSoon.js)
// `hint` is the one short line under the name. `unit` is the word shown next to
// the item count when it is known ("24 listings").
//
// Budgeting uses gold because it is money; nothing else here does.

export const EXPLORE_BUNDLES = [
  {
    key: 'study',
    title: 'Study',
    blurb: 'Grades, exams and funding',
    Icon: GraduationCap,
    rows: [
      { key: 'grade-calculator', name: 'Grade calculator', hint: 'Your overall result and what the next exam needs', Icon: Calculator, route: 'GradeCalculator' },
      { key: 'exam-clash', name: 'Exam clash checker', hint: 'Spot clashes and tight gaps, and add exams to Calendar', Icon: CalendarClock, route: 'ExamClash' },
      { key: 'scholarships', name: 'Scholarships', hint: 'Real funding, with short guides', Icon: GraduationCap, route: 'Scholarships', statusText: 'Guides' },
      { key: 'course-swap', name: 'Course swap', hint: 'Thinking of changing course? Opens Course Compass', Icon: ArrowRightLeft, route: 'Compass', params: { from: 'course-swap' } },
      { key: 'peer-tutoring', name: 'Peer tutoring', hint: 'Find a tutor or offer your help', Icon: Users, adBoardBasket: 'tutors' },
      { key: 'lecture-notes', name: 'Lecture notes', hint: 'Share and find notes', Icon: StickyNote, route: 'BoardDetail', params: { boardKey: 'notes', registry: 'course' } },
    ],
  },
  {
    key: 'campus-life',
    title: 'Campus life',
    blurb: 'Societies, travel and support',
    Icon: Building2,
    rows: [
      { key: 'societies', name: 'Societies', hint: 'Find your people and see how to join', Icon: Users, kind: 'societies', unit: ['society', 'societies'] },
      { key: 'transport', name: 'Transport', hint: 'Journey planner and official operators', Icon: Bus, route: 'Transport' },
      { key: 'discounts', name: 'Student discounts', hint: 'Offers for students', Icon: Tag, kind: 'discounts', unit: ['offer', 'offers'] },
      { key: 'support', name: 'Support services', hint: 'People who can help', Icon: ShieldCheck, kind: 'support', unit: ['service', 'services'] },
      { key: 'volunteering', name: 'Volunteering', hint: 'Give some time', Icon: Leaf, kind: 'volunteering', unit: ['role', 'roles'] },
      { key: 'lost-found', name: 'Lost and found', hint: 'Lost something? Found something?', Icon: Search, route: 'BoardDetail', params: { boardKey: 'lost-found' } },
    ],
  },
  {
    key: 'money-career',
    title: 'Money and career',
    blurb: 'Budgeting, internships and jobs',
    Icon: Wallet,
    rows: [
      { key: 'budgeting', name: 'Budgeting', hint: 'Track what comes in and goes out', Icon: Wallet, route: 'Budgeting', money: true },
      { key: 'internships', name: 'Internships', hint: 'Real openings from official sources', Icon: Handshake, route: 'Internships' },
      { key: 'jobs-board', name: 'Jobs board', hint: 'Jobs on the Ad Board', Icon: Briefcase, adBoardBasket: 'jobs' },
    ],
  },
  {
    key: 'milestones',
    title: 'Milestones',
    blurb: 'Countdowns and your first weeks',
    Icon: Flag,
    rows: [
      { key: 'goal-countdown', name: 'Goal countdown', hint: 'Count down to anything you choose', Icon: Hourglass, route: 'GoalCountdown' },
      { key: 'freshers', name: 'Freshers guide', hint: 'Tick things off as you go', Icon: CheckCheck, kind: 'freshers', statusText: 'Checklist' },
    ],
  },
]

// Only shown while the coming_soon_tiles switch is on. Short copy from
// constants/comingSoon.js opens in a sheet.
export const COMING_SOON_BUNDLE = {
  key: 'coming-soon',
  title: 'Coming soon',
  blurb: 'Stay tuned',
  Icon: Sparkles,
  rows: [
    { key: 'alumni', name: 'Alumni', hint: 'Empty for now', Icon: GraduationCap, comingSoon: true },
    { key: 'campus-radio', name: 'Campus Radio', hint: 'Across the app', Icon: Radio, comingSoon: true },
    { key: 'trivia-night', name: 'Trivia night', hint: 'Across the app', Icon: CircleHelp, comingSoon: true },
    { key: 'campus-bingo', name: 'Campus Bingo', hint: 'Across the country', Icon: LayoutGrid, comingSoon: true },
  ],
}

// The list screens (ExploreList) and their page titles.
export const EXPLORE_KINDS = {
  discounts:    { title: 'Student discounts', subtitle: 'Offers for students', emptyTitle: 'No offers yet', empty: 'We are adding these. Know one? Suggest it below.' },
  support:      { title: 'Support services', subtitle: 'People who can help', emptyTitle: 'No services yet', empty: 'We are adding these. Know one? Suggest it below.' },
  societies:    { title: 'Societies', subtitle: 'Find your people', emptyTitle: 'No societies yet', empty: 'We are adding these. Know one? Suggest it below.' },
  volunteering: { title: 'Volunteering', subtitle: 'Give some time', emptyTitle: 'No roles yet', empty: 'We are adding these. Know one? Suggest it below.' },
  freshers:     { title: 'Freshers guide', subtitle: 'Tick things off as you go', emptyTitle: 'No checklist yet', empty: 'We are writing this one. Check back soon.' },
}

// Partners shown on My Blueprint ("Our partners") keep this short list.
// Each partner wears its OWN brand, not UBP's: Course Compass uses the real
// coursecompass.ie navy, sky and orange with Crimson Pro and Outfit
// (constants/partnerBrands.js), Priority is black with a silver chrome serif
// "P" (constants/priorityTheme.js).
// `mark` says how the tile is drawn, see components/explore/ExploreParts.jsx.
export const PARTNERS = [
  {
    key: 'course-compass', name: 'Course Compass', blurb: 'Find the course that fits you',
    mark: 'compass', action: { route: 'Compass' }, cta: 'Open',
    bg: COURSE_COMPASS.navy, fg: COURSE_COMPASS.cream, accent: COURSE_COMPASS.sky,
    ctaBg: COURSE_COMPASS.orange, ctaFg: COURSE_COMPASS.navy,
    markBg: 'rgba(61,169,224,0.16)',
    gradient: [COURSE_COMPASS.navy, '#17304F'],
    darkGradient: ['#17304F', '#0E2038'], darkRing: 'rgba(61,169,224,0.45)',
    nameFont: COURSE_COMPASS.fonts.headingBold, bodyFont: COURSE_COMPASS.fonts.body, ctaFont: COURSE_COMPASS.fonts.bodySemiBold,
  },
  {
    key: 'priority', name: 'Priority', blurb: 'Student events and nights out',
    mark: 'priority', action: { route: 'Priorities' }, cta: 'Open',
    bg: priorityChrome.black, fg: priorityChrome.fg, accent: priorityChrome.silver1,
    ctaBg: priorityChrome.silver1, ctaFg: priorityChrome.black, ring: priorityChrome.border,
    nameFont: 'DMSerifDisplay_400Regular', bodyFont: 'DMSans_400Regular', ctaFont: 'DMSans_600SemiBold',
  },
]

// The Explore partner strip (it swipes by itself): the two above, then Kobo,
// ScoutByRohi and Roomy.ie, then the real Lifestyle partners
// (see LIFESTYLE_STRIP_IDS and the strip in screens/ExploreScreen.jsx).
export const STRIP_PARTNERS = [
  ...PARTNERS,
  {
    key: 'kobo', name: 'Kobo', blurb: 'Join the waitlist. Not a bank. Test money only.',
    mark: 'image', logo: require('../../assets/partners/kobo/icon-light.png'), action: { route: 'KoboPartner' }, cta: 'Waitlist', tag: 'In beta',
    bg: KOBO.teal, fg: KOBO.cream, accent: KOBO.mint, markBg: 'rgba(168,230,207,0.14)',
    gradient: [KOBO.teal, KOBO.tealMid], darkGradient: [KOBO.tealDeep, KOBO.teal], darkRing: 'rgba(168,230,207,0.35)',
    ctaBg: KOBO.amber, ctaFg: KOBO.tealDeep,
    nameFont: KOBO.fonts.heading, bodyFont: KOBO.fonts.body, ctaFont: KOBO.fonts.heading,
  },
  {
    key: 'scout', name: 'ScoutByRohi', blurb: 'Irish internships and graduate schemes',
    mark: 'image', logo: require('../../assets/partners/scout/logo.png'), action: { route: 'ScoutPartner' }, cta: 'Open', logoTile: SCOUT.mint,
    bg: SCOUT.forest, fg: '#F6F8F5', accent: SCOUT.signal, markBg: 'rgba(18,183,111,0.14)',
    gradient: [SCOUT.forest, '#0F4A37'], darkGradient: ['#082A20', SCOUT.forest], darkRing: 'rgba(18,183,111,0.4)',
    ctaBg: SCOUT.signal, ctaFg: SCOUT.forest,
    nameFont: 'DMSerifDisplay_400Regular', bodyFont: 'DMSans_400Regular', ctaFont: 'DMSans_600SemiBold',
  },
  {
    key: 'roomy', name: 'Roomy.ie', blurb: 'Rooms and homes across Ireland',
    mark: 'image', logo: require('../../assets/partners/roomy/logo.png'), action: { route: 'RoomyPartner' }, cta: 'Open',
    bg: ROOMY.deep, fg: '#F4FBFD', accent: ROOMY.mint, markBg: 'rgba(74,222,128,0.14)',
    gradient: [ROOMY.deep, '#254225'], darkGradient: ['#0F1C0F', ROOMY.deep], darkRing: 'rgba(74,222,128,0.35)',
    ctaBg: ROOMY.teal, ctaFg: '#FFFFFF',
    nameFont: 'DMSans_700Bold', bodyFont: 'DMSans_400Regular', ctaFont: 'DMSans_600SemiBold',
  },
]

// Lifestyle partners that have their own logo file. They follow the brand
// partners in the strip and open the Lifestyle partners screen on that partner.
export const LIFESTYLE_STRIP_IDS = ['saiemsent', 'elect', 'jordanskitchen', 'pouvoirs']

// Words for an item count: 1 listing, 24 listings.
export function countLabel(count, unit) {
  if (!count || !unit) return null
  return `${count} ${count === 1 ? unit[0] : unit[1]}`
}
