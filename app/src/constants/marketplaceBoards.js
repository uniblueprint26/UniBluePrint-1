/**
 * Ad Board → Marketplace — reuses the same schema-driven board engine as
 * Campus Connect / Course Connect (see campusBoards.js for the field/filter
 * shape this drives: PostFormModal for posting, BoardDetailScreen for
 * browsing). Two boards, cross-Ireland like Course Connect — not scoped to
 * a campus:
 *   'skills'  — offer or find a skill (tutoring, design, photography, ...)
 *   'buysell' — post items for sale or wanted
 *
 * Both use `special: 'marketplace'` on BoardDetailScreen: a poster can mark
 * their own listing sold/filled or reopen it, with no auto-expiry — a
 * confirmed decision for this board (see BoardDetailScreen's renderMarketplaceCard).
 */

export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  DECIMAL: 'decimal',
  SELECT: 'select',
  PHOTO: 'photo',
}

const T = FIELD_TYPES

// Buckets used by the price-range filter on Buy & Sell — matched via
// `filter.matches`, since a filter this shaped (comparing a numeric column
// against a labelled range) doesn't fit the generic equality/search filter
// logic every other board filter uses.
const PRICE_BUCKETS = [
  { label: 'Under €20',   test: p => p != null && p < 20 },
  { label: '€20 – €50',   test: p => p != null && p >= 20 && p < 50 },
  { label: '€50 – €100',  test: p => p != null && p >= 50 && p < 100 },
  { label: '€100+',       test: p => p != null && p >= 100 },
]

export const MARKETPLACE_BOARDS = [
  {
    key: 'skills',
    title: 'Skills Marketplace',
    icon: '🎯',
    color: '#F5F3FF',
    table: 'marketplace_skills',
    special: 'marketplace',
    tagline: 'Offer a skill, or find someone across Ireland who has what you need.',
    postCta: 'Post to Skills Marketplace',
    soldLabel: 'Mark filled', activeLabel: 'Reopen listing', soldStatus: 'closed',
    fields: [
      { key: 'listing_type', label: 'I am', type: T.SELECT, required: true, options: ['Offering a skill', 'Looking for a skill'] },
      { key: 'title', label: 'Title', type: T.TEXT, required: true, placeholder: 'e.g. Graphic design for events' },
      { key: 'category', label: 'Category', type: T.SELECT, required: true, options: ['Tutoring & Academic', 'Creative & Design', 'Tech & Development', 'Photography & Video', 'Fitness & Wellness', 'Music & Performance', 'Writing & Editing', 'Other'] },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true, placeholder: 'What you offer or need, your experience, availability...' },
      { key: 'rate_type', label: 'Rate or budget', type: T.SELECT, required: true, options: ['Fixed price', 'Hourly rate', 'Budget (negotiable)'] },
      { key: 'rate_amount', label: 'Amount (€, optional)', type: T.DECIMAL, placeholder: 'e.g. 25' },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true, placeholder: 'Email, phone, or in-app chat' },
    ],
    filters: [
      { key: 'listing_type', label: 'Type', type: T.SELECT, options: ['Offering a skill', 'Looking for a skill'] },
      { key: 'category', label: 'Category', type: T.SELECT, options: ['Tutoring & Academic', 'Creative & Design', 'Tech & Development', 'Photography & Video', 'Fitness & Wellness', 'Music & Performance', 'Writing & Editing', 'Other'] },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.listing_type, p.category, p.rate_amount != null ? `€${p.rate_amount} · ${p.rate_type}` : p.rate_type].filter(Boolean),
  },
  {
    key: 'buysell',
    title: 'Buy & Sell',
    icon: '🛍️',
    color: '#FEF3C7',
    table: 'marketplace_listings',
    special: 'marketplace',
    tagline: 'Buy and sell items with other students across Ireland.',
    postCta: 'Post an Item',
    soldLabel: 'Mark sold', activeLabel: 'Mark active', soldStatus: 'sold',
    fields: [
      { key: 'listing_type', label: 'Listing type', type: T.SELECT, required: true, options: ['For sale', 'Wanted'] },
      { key: 'title', label: 'Item title', type: T.TEXT, required: true, placeholder: 'e.g. IKEA desk lamp' },
      { key: 'category', label: 'Category', type: T.SELECT, required: true, options: ['Electronics', 'Textbooks & Notes', 'Furniture', 'Clothing', 'Tickets', 'Sports & Fitness', 'Other'] },
      { key: 'description', label: 'Description', type: T.TEXTAREA, required: true, placeholder: 'Condition, age, why you\'re selling / what you\'re after...' },
      { key: 'condition', label: 'Condition', type: T.SELECT, options: ['New', 'Like new', 'Good', 'Fair', 'Well used'], showIf: v => v.listing_type !== 'Wanted' },
      { key: 'price', label: 'Price (€)', type: T.DECIMAL, placeholder: 'e.g. 15' },
      { key: 'photo_url', label: 'Photo (optional)', type: T.PHOTO },
      { key: 'contact_method', label: 'Contact method', type: T.TEXT, required: true, placeholder: 'Email, phone, or in-app chat' },
    ],
    filters: [
      { key: 'listing_type', label: 'Type', type: T.SELECT, options: ['For sale', 'Wanted'] },
      { key: 'category', label: 'Category', type: T.SELECT, options: ['Electronics', 'Textbooks & Notes', 'Furniture', 'Clothing', 'Tickets', 'Sports & Fitness', 'Other'] },
      {
        key: 'price_range', label: 'Price', type: T.SELECT,
        options: PRICE_BUCKETS.map(b => b.label),
        matches: (item, opt) => PRICE_BUCKETS.find(b => b.label === opt)?.test(item.price) ?? true,
      },
    ],
    cardTitle: p => p.title,
    cardMeta: p => [p.listing_type, p.category, p.condition, p.price != null ? `€${p.price}` : null].filter(Boolean),
  },
]

export function getMarketplaceBoard(key) {
  return MARKETPLACE_BOARDS.find(b => b.key === key) || null
}
