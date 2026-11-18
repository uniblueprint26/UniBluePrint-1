/**
 * adBoardContent.js — the fixed, hand-written bits of the Ad Board.
 * None of this is stored in the database.
 *
 *   BASKETS         the tiles in the Marketplace grid
 *   TRIAL           the standard prices shown struck through in the Deals hero
 *   UBP_PLACEMENTS  the UniBlueprint internships, pinned at the top of Jobs
 *   EXAMPLE_TUTORS  clearly labelled examples, always shown after real tutors
 *   UBP_CARDS       "Posted by UBP" cards: what to post where, and the app
 *                   features UBP wants people to use
 *
 * Ride shares, Lost and found and Notes are Campus Connect features. They do
 * not appear on the Ad Board at all.
 */
import { SITE_URL } from './site'

// `visual` keys come from components/ads/adTheme.js.
export const BASKETS = [
  { key: 'deals',       label: 'Deals',        line: 'Lifestyle partner offers',        visual: 'deal',   noun: ['deal', 'deals'] },
  { key: 'jobs',        label: 'Jobs',         line: 'Part-time work and internships',  visual: 'job',    noun: ['job', 'jobs'] },
  { key: 'tutors',      label: 'Tutors',       line: 'Help with a subject',             visual: 'tutor',  noun: ['tutor', 'tutors'] },
  { key: 'marketplace', label: 'Buy and sell', line: 'Items and skills from students',  visual: 'sale',   noun: ['listing', 'listings'] },
  { key: 'ubp',         label: 'From UBP',     line: 'What to post, and where',         visual: 'ubp',    noun: ['card', 'cards'] },
]

export const BASKET_BY_KEY = Object.fromEntries(BASKETS.map(b => [b.key, b]))

// Real prices, confirmed against src/lib/stripe-products.js and
// src/pages/PricingPage.jsx (both in euro).
export const TRIAL = {
  headline: 'Everything is free during your trial',
  sub: 'All services half price during the free trial',
  monthly: '€6.99 a month',
  annual: '€49.99 a year',
}

// The UniBlueprint internships. These are placements at UBP itself, so they
// are hand-written here and pinned above any real jobs. Apply opens the team
// contact page.
export const PLACEMENT_URL = `${SITE_URL}/contact?tab=team`

export const PLACEMENTS_INTRO = 'UniBlueprint is a student-founded Irish company launching in December. Placements are unpaid, with a possible bonus at the end based on your contribution.'

const PLACEMENT_TERMS = 'You get a named mentor from week one, a scoped project with milestones, regular feedback and real ownership.'

export const UBP_PLACEMENTS = [
  {
    id: 'ubp-placement-outreach', team: 'Outreach', title: 'Outreach placement, UniBlueprint',
    summary: `Build our community, grow UniBlueprint on campuses and form partnerships with colleges, student groups and partners. ${PLACEMENT_TERMS}`,
  },
  {
    id: 'ubp-placement-marketing', team: 'Marketing', title: 'Marketing placement, UniBlueprint',
    summary: `Work on our brand, creative, content, social and digital campaigns. ${PLACEMENT_TERMS}`,
  },
  {
    id: 'ubp-placement-finance', team: 'Finance', title: 'Finance placement, UniBlueprint',
    summary: `Help with budgeting, financial planning, reporting and partner payments. ${PLACEMENT_TERMS}`,
  },
  {
    id: 'ubp-placement-tech', team: 'Tech', title: 'Tech placement, UniBlueprint',
    summary: `Work across strategy, app development and platform work, including testing, security, databases and infrastructure. ${PLACEMENT_TERMS}`,
  },
  {
    id: 'ubp-placement-legal', team: 'Legal', title: 'Legal placement, UniBlueprint',
    summary: `Work on data protection, contracts, terms and policies. ${PLACEMENT_TERMS}`,
  },
]

export const EXAMPLE_TUTOR_NOTE = 'Post your own to appear here.'

// Always shown after any real tutors. Every one is an obvious example: the
// price is "€?" and the card says it is not a real tutor. Never stored.
export const EXAMPLE_TUTORS = [
  { id: 'example-tutor-1', industry: 'Accounting',           subject: 'Financial accounting, first and second year', blurb: 'Balance sheets, ledgers and exam practice.' },
  { id: 'example-tutor-2', industry: 'Software engineering', subject: 'Intro to programming in Python',             blurb: 'Build small projects and debug together.' },
  { id: 'example-tutor-3', industry: 'Nursing',              subject: 'Anatomy and physiology revision',            blurb: 'Clear notes and quick quizzes before exams.' },
  { id: 'example-tutor-4', industry: 'Law',                  subject: 'Contract law and case notes',                blurb: 'How to read a case and structure an answer.' },
  { id: 'example-tutor-5', industry: 'Electrical trade',     subject: 'Electrical theory for apprentices',          blurb: 'Circuits, regulations and Phase exam prep.' },
  { id: 'example-tutor-6', industry: 'Engineering',          subject: 'Engineering mathematics and mechanics',      blurb: 'Worked examples for problem sheets.' },
  { id: 'example-tutor-7', industry: 'Marketing',            subject: 'Digital marketing and analytics basics',     blurb: 'Campaign plans, content and reading the numbers.' },
  { id: 'example-tutor-8', industry: 'Languages',            subject: 'Conversational Spanish for beginners',       blurb: 'Relaxed speaking practice, one to one.' },
]

// What kind of tap each UBP card does (see useListingActions.openUbpCard):
//   weekly  opens the Weekly Blueprint
//   home    opens a screen in the Home stack with openInHomeStack
//   web     opens a web page
//   post    opens the Post a listing sheet
export const UBP_CARDS = [
  {
    id: 'ubp-advertise-job', visual: 'ad', typeLabel: 'Advertise',
    title: 'Advertise your job here',
    blurb: 'Feel free to advertise jobs you may be offering too.',
    opens: 'Opens Post a listing',
    action: { type: 'post' },
  },
  {
    id: 'ubp-cv-review', visual: 'cv', typeLabel: 'Foundation',
    title: 'Foundation Blueprint CV review',
    blurb: 'Get your CV checked before you apply.',
    opens: 'Opens Foundation',
    action: { type: 'home', route: 'Foundation' },
  },
  {
    id: 'ubp-weekly', visual: 'weekly', typeLabel: 'Weekly Blueprint',
    title: 'Join the Weekly Blueprint',
    blurb: 'Deals, coaches and campus news in one issue, every week.',
    opens: 'Opens the Weekly Blueprint',
    action: { type: 'weekly' },
  },
  {
    id: 'ubp-coaching', visual: 'skill', typeLabel: 'Elevation',
    title: 'Book a coach on Elevation',
    blurb: 'One to one coaching from people who have done it.',
    opens: 'Opens Elevation',
    action: { type: 'home', route: 'Elevation' },
  },
  {
    id: 'ubp-tutor-post', visual: 'tutor', typeLabel: 'Tutoring',
    title: 'Offer tutoring',
    blurb: 'Good at a subject? Post a tutor listing and appear in Tutors.',
    opens: 'Opens Post a listing',
    action: { type: 'post' },
    starterFor: 'marketplace',
  },
]
