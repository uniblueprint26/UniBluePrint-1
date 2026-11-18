/**
 * adBoardContent.js — the fixed, hand-written bits of the Ad Board.
 * None of this is stored in the database.
 *
 *   BASKETS         the tiles in the Marketplace grid
 *   TRIAL           the standard prices shown struck through in the Deals hero
 *   EXAMPLE_TUTORS  clearly labelled examples shown while real tutors are few
 *   UBP_CARDS       "Posted by UBP" cards: what to post where, and the app
 *                   features UBP wants people to use
 *
 * Ride shares, Lost and found and Notes are Campus Connect features. They do
 * not appear on the Ad Board at all.
 */
import { SITE_URL } from './site'

// `visual` keys come from components/ads/adTheme.js.
export const BASKETS = [
  { key: 'deals',       label: 'Deals',        line: 'Partner offers for students',     visual: 'deal',   noun: ['deal', 'deals'] },
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

export const EXAMPLE_TUTOR_NOTE = 'This is how a tutor listing looks. Post yours to appear here.'

// Shown only while the real tutor table has fewer than 3 rows.
export const EXAMPLE_TUTORS = [
  { id: 'example-tutor-1', title: 'Leaving Cert Maths, one to one', subject: 'Maths', rate: 20, rateSub: 'per hour', blurb: 'Higher level. Past papers and exam technique.' },
  { id: 'example-tutor-2', title: 'First-year Chemistry help', subject: 'Chemistry', rate: 18, rateSub: 'per hour', blurb: 'Lab write-ups and problem sets, in small groups.' },
  { id: 'example-tutor-3', title: 'Essay writing and referencing', subject: 'Writing', rate: 15, rateSub: 'per hour', blurb: 'Structure, argument and clean referencing.' },
]

// What kind of tap each UBP card does (see useListingActions.openUbpCard):
//   weekly  opens the Weekly Blueprint
//   home    opens a screen in the Home stack with openInHomeStack
//   web     opens a web page
//   post    opens the Post a listing sheet
export const UBP_CARDS = [
  {
    id: 'ubp-placements', visual: 'job', typeLabel: 'Placement',
    title: 'Placement roles at UBP',
    blurb: 'Placement jobs UBP is offering. Tap to see how to apply.',
    opens: 'Opens the UBP team page',
    action: { type: 'web', url: `${SITE_URL}/contact?tab=team` },
    starterFor: 'jobs',
  },
  {
    id: 'ubp-advertise-job', visual: 'ad', typeLabel: 'Advertise',
    title: 'Advertise your job here',
    blurb: 'Feel free to advertise jobs you may be offering too.',
    opens: 'Opens Post a listing',
    action: { type: 'post' },
    starterFor: 'jobs',
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
