import {
  GraduationCap, Calculator, CalendarX, Users, StickyNote, Handshake,
  Tag, ShieldCheck, Leaf, MapPin, Lock, Bus, Search,
  Wallet, Briefcase, Sparkles, Send,
  CheckCheck, Trophy, Award,
  Radio, Zap, LayoutGrid,
} from 'lucide-react-native'
import { COURSE_COMPASS } from './partnerBrands'
import { priorityChrome } from './priorityTheme'

// The Explore catalog: one place that says what exists in the app (or is on
// the way). Each row has a `status` of 'live' or 'soon'. Live rows either
// open a route (`route`) or a generic list from the explore_content table
// (`kind`, opened on the ExploreList screen). `unit` is the word shown next
// to the item count when it is known ("24 listings"). `fromUbp` marks lists
// UBP seeded itself.
//
// Budgeting uses gold because it is money; nothing else here does.

export const EXPLORE_GROUPS = [
  {
    key: 'study',
    title: 'Study',
    rows: [
      { key: 'scholarships', name: 'Scholarships', Icon: GraduationCap, status: 'live', kind: 'scholarships', fromUbp: true, unit: ['listing', 'listings'] },
      { key: 'grade-calculator', name: 'Grade calculator', Icon: Calculator, status: 'soon' },
      { key: 'exam-clash', name: 'Exam clash checker', Icon: CalendarX, status: 'soon' },
      { key: 'peer-tutoring', name: 'Peer tutoring', Icon: Users, status: 'soon' },
      { key: 'lecture-notes', name: 'Lecture notes', Icon: StickyNote, status: 'soon' },
      { key: 'course-swap', name: 'Course swap', Icon: Handshake, status: 'soon' },
    ],
  },
  {
    key: 'campus-life',
    title: 'Campus life',
    rows: [
      { key: 'discounts', name: 'Student discounts', Icon: Tag, status: 'live', kind: 'discounts', fromUbp: true, unit: ['offer', 'offers'] },
      { key: 'support', name: 'Support services', Icon: ShieldCheck, status: 'live', kind: 'support', fromUbp: true, unit: ['service', 'services'] },
      { key: 'societies', name: 'Societies directory', Icon: Users, status: 'live', kind: 'societies', fromUbp: true, unit: ['society', 'societies'] },
      { key: 'volunteering', name: 'Volunteering', Icon: Leaf, status: 'live', kind: 'volunteering', fromUbp: true, unit: ['role', 'roles'] },
      { key: 'busy-spots', name: 'Busy spots', Icon: MapPin, status: 'soon' },
      { key: 'printers-lockers', name: 'Printers and lockers', Icon: Lock, status: 'soon' },
      { key: 'night-bus', name: 'Night bus', Icon: Bus, status: 'soon' },
      { key: 'lost-found', name: 'Lost and found', Icon: Search, status: 'soon' },
    ],
  },
  {
    key: 'money-career',
    title: 'Money and career',
    rows: [
      { key: 'budgeting', name: 'Budgeting', Icon: Wallet, status: 'live', route: 'Budgeting', money: true },
      { key: 'jobs-board', name: 'Jobs board', Icon: Briefcase, status: 'soon' },
      { key: 'internships', name: 'Internships', Icon: Sparkles, status: 'soon' },
      { key: 'split-bill', name: 'Split the bill', Icon: Send, status: 'soon' },
    ],
  },
  {
    key: 'milestones',
    title: 'Milestones',
    rows: [
      { key: 'freshers', name: 'Freshers guide', Icon: CheckCheck, status: 'live', kind: 'freshers', fromUbp: true, statusText: 'Checklist' },
      { key: 'graduation', name: 'Graduation countdown', Icon: Trophy, status: 'soon' },
      { key: 'alumni', name: 'Alumni', Icon: Award, status: 'soon' },
    ],
  },
  {
    key: 'fun',
    title: 'Just for fun',
    rows: [
      { key: 'radio', name: 'Campus Radio', Icon: Radio, status: 'soon' },
      { key: 'trivia', name: 'Trivia night', Icon: Zap, status: 'soon' },
      { key: 'bingo', name: 'Campus Bingo', Icon: LayoutGrid, status: 'soon' },
    ],
  },
]

// The list screens (ExploreList) and their page titles.
export const EXPLORE_KINDS = {
  scholarships: { title: 'Scholarships', subtitle: 'Funding you can apply for', emptyTitle: 'No scholarships yet', empty: 'We are adding these. Know one? Suggest it below.' },
  discounts:    { title: 'Student discounts', subtitle: 'Offers for students', emptyTitle: 'No offers yet', empty: 'We are adding these. Know one? Suggest it below.' },
  support:      { title: 'Support services', subtitle: 'People who can help', emptyTitle: 'No services yet', empty: 'We are adding these. Know one? Suggest it below.' },
  societies:    { title: 'Societies directory', subtitle: 'Find your people', emptyTitle: 'No societies yet', empty: 'We are adding these. Know one? Suggest it below.' },
  volunteering: { title: 'Volunteering', subtitle: 'Give some time', emptyTitle: 'No roles yet', empty: 'We are adding these. Know one? Suggest it below.' },
  freshers:     { title: 'Freshers guide', subtitle: 'Tick things off as you go', emptyTitle: 'No checklist yet', empty: 'We are writing this one. Check back soon.' },
}

// Partners shown in Explore ("Our partners") and as the strip on My Blueprint.
// Each partner wears its OWN brand, not UBP's: Course Compass uses the real
// coursecompass.ie navy, sky and orange with Crimson Pro and Outfit
// (constants/partnerBrands.js), Priority is black with a silver chrome serif
// "P" (constants/priorityTheme.js), Kobo is dark teal with a mint "K".
// `mark` says how the tile is drawn, see components/explore/ExploreParts.jsx.
export const PARTNERS = [
  {
    key: 'course-compass', name: 'Course Compass', blurb: 'Find the course that fits you',
    mark: 'compass', featured: true, action: { route: 'Compass' }, cta: 'Open',
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
  {
    key: 'kobo', name: 'Kobo', blurb: 'Send money home',
    mark: 'K', action: { sheet: 'kobo' }, cta: 'Soon', soon: true,
    bg: '#1B403C', fg: '#ABDFC7', accent: '#ABDFC7',
    ctaBg: 'rgba(171,223,199,0.16)', ctaFg: '#ABDFC7',
    soonText: 'Sending money home with Kobo is on its way. We will let you know when it is ready.',
  },
]

// Words for an item count: 1 listing, 24 listings.
export function countLabel(count, unit) {
  if (!count || !unit) return null
  return `${count} ${count === 1 ? unit[0] : unit[1]}`
}
