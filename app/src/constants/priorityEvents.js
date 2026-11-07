// ─── Priority Events — FAKE DEMO DATA ──────────────────────────────────────
// Every event, venue, lineup name, date and price below is invented for a
// product demo (for Ross). None of this is a real booking, a confirmed
// venue, or a real artist — do not treat it as a live listing. Cities are
// real Irish locations (matching Priority's actual genre pools — House in
// Sligo/Galway, Afrobeats in Dublin, Folk nationwide); venue names are
// plausible but made up, not the name of a real room, so this can never be
// mistaken for an actual booked night at a real venue.
//
// Pricing on the flagship event mirrors the real tier structure already
// agreed in planning (Super Early Bird → 1st Release → Final Release,
// roughly €12–€19) — everything else uses plausible, invented prices.

export const PRIORITY_EVENTS = [
  {
    id: 'nyr-launch',
    title: "New Year's Refreshers",
    genre: 'house',
    flagship: true,
    dateLabel: 'Sat 9 Jan 2027',
    doorsLabel: 'Doors 9:00pm · 18+',
    city: 'Sligo',
    venue: 'The Harbourmaster',
    address: 'Harbour Road, Sligo',
    blurb: "Priority's first big launch of the year — the house night that started it all, back for New Year's Refreshers. The proven baseline, done bigger.",
    lineup: ['Resident DJ crew', 'Guest selector TBA'],
    tiers: [
      { id: 'seb', label: 'Super Early Bird', price: 12, note: 'Limited release' },
      { id: 'r1',  label: '1st Release',      price: 16, note: '' },
      { id: 'r2',  label: 'Final Release',    price: 19, note: 'On the door price' },
    ],
  },
  {
    id: 'afterglow-galway',
    title: 'Afterglow Sessions',
    genre: 'house',
    dateLabel: 'Fri 23 Jan 2027',
    doorsLabel: 'Doors 10:00pm · 18+',
    city: 'Galway',
    venue: 'Latchford Social Club',
    address: 'Lower Dominick Street, Galway',
    blurb: 'A late, dark room session for the house crowd who stay till close. Priority\'s Galway regular.',
    lineup: ['Resident DJ crew'],
    tiers: [
      { id: 'early', label: 'Early Bird', price: 10, note: '' },
      { id: 'door',  label: 'Standard',   price: 14, note: '' },
    ],
  },
  {
    id: 'golden-hour-dublin',
    title: 'Golden Hour',
    genre: 'afrobeats',
    dateLabel: 'Sat 7 Feb 2027',
    doorsLabel: 'Doors 10:30pm · 18+',
    city: 'Dublin',
    venue: 'The Tropic Room',
    address: 'Anne Street area, Dublin 2',
    blurb: "Priority's push into Afrobeats and Amapiano — Dublin's newest Saturday social, built with the city's own student promoters.",
    lineup: ['Guest DJ selector', 'Live MC'],
    tiers: [
      { id: 'early', label: 'Early Bird', price: 13, note: '' },
      { id: 'door',  label: 'Standard',   price: 18, note: '' },
    ],
  },
  {
    id: 'folk-fire-athlone',
    title: 'Folk & Fire',
    genre: 'folk',
    dateLabel: 'Thu 19 Feb 2027',
    doorsLabel: 'Doors 8:00pm · All ages',
    city: 'Athlone',
    venue: "The Lockhouse",
    address: 'Grace Road, Athlone',
    blurb: "An acoustic evening built around Priority's folk roster — a low-cost pilot night, warm room, real musicianship.",
    lineup: ['Headline trio', 'Support act'],
    tiers: [
      { id: 'door', label: 'Standard', price: 9, note: '' },
    ],
  },
  {
    id: 'harbour-lights-cork',
    title: 'Harbour Lights',
    genre: 'house',
    dateLabel: 'Fri 6 Mar 2027',
    doorsLabel: 'Doors 10:00pm · 18+',
    city: 'Cork',
    venue: 'Rooftop 48',
    address: 'South Mall, Cork',
    blurb: "Priority's first Cork date — a rooftop warm-up into a late set, testing the market ahead of a bigger run.",
    lineup: ['Resident DJ crew'],
    tiers: [
      { id: 'early', label: 'Early Bird', price: 11, note: '' },
      { id: 'door',  label: 'Standard',   price: 15, note: '' },
    ],
  },
  {
    id: 'border-sessions-derry',
    title: 'Border Sessions',
    genre: 'afrobeats',
    dateLabel: 'Sat 20 Mar 2027',
    doorsLabel: 'Doors 9:30pm · 18+',
    city: 'Derry',
    venue: 'The North Wing',
    address: "Foyle Street, Derry",
    blurb: 'A cross-border date for the Donegal/Derry student catchment — Priority\'s newest region, same formula as Sligo.',
    lineup: ['Guest DJ selector'],
    tiers: [
      { id: 'early', label: 'Early Bird', price: 10, note: '' },
      { id: 'door',  label: 'Standard',   price: 14, note: '' },
    ],
  },
  {
    id: 'folk-fire-mayo',
    title: 'Fireside Sessions',
    genre: 'folk',
    dateLabel: 'Fri 2 Apr 2027',
    doorsLabel: 'Doors 7:30pm · All ages',
    city: 'Westport',
    venue: "Clew Bay House",
    address: 'The Octagon, Westport, Co. Mayo',
    blurb: "A small-room folk night close to home for Priority's own touring roster — quiet, acoustic, ticketed low to fill the room.",
    lineup: ['Headline trio', 'Local support'],
    tiers: [
      { id: 'door', label: 'Standard', price: 8, note: '' },
    ],
  },
]

export function findPriorityEvent(id) {
  return PRIORITY_EVENTS.find(e => e.id === id) || null
}
