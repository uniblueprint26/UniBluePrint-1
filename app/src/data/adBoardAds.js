/**
 * Shared between AdBoardScreen (the live Ad Board list) and
 * WeeklyBlueprintScreen (the magazine's own Ad Board page) — the category
 * icon/colour map, the curated real-partner listings, and the tap handler
 * that opens an ad's own booking link when it has one.
 *
 * GDPR fix (task #94): this file used to carry a `contact` object per
 * curated ad (email/phone/Instagram handle, copied from
 * data/lifestylePartners.js) straight into the JS bundle, plus the same
 * handles/phone numbers again in a couple of ads' own `description` text.
 * Real contact info for these now lives in the backend-only
 * lifestyle_partner_contact_details table, fetched through
 * get_lifestyle_partner_contact() — see hooks/usePartnerContact.js and
 * components/ads/PartnerContactModal.jsx, which is what both screens above
 * open for any curated ad without a direct `link`. `partnerSlug` below is
 * just the join key into that table (the same id these partners already
 * use in lifestylePartners.js); `hasContact` is a non-sensitive flag ("try
 * fetching real contact info for this one") with no real value in it.
 */
import { Wrench, Sparkles, Dumbbell, Camera, Activity, Building2, Globe, ShoppingBag } from 'lucide-react-native'

export const CATEGORY = {
  'Automotive':  { Icon: Wrench,      color: '#1d4ed8', bg: '#EFF6FF' },
  'Beauty':      { Icon: Sparkles,    color: '#86198F', bg: '#FDF4FF' },
  'Fitness':     { Icon: Dumbbell,    color: '#15803D', bg: '#F0FDF4' },
  'Creative':    { Icon: Camera,      color: '#C2410C', bg: '#FFF7ED' },
  'Gym':         { Icon: Activity,    color: '#0369A1', bg: '#F0F9FF' },
  'Campus':      { Icon: Building2,   color: '#B45309', bg: '#FEF3C7' },
  'Course':      { Icon: Globe,       color: '#1E3A5F', bg: '#F5F0E8' },
  'Marketplace': { Icon: ShoppingBag, color: '#6D28D9', bg: '#F5F3FF' },
}

// Curated, real partner listings (contact-and-book relationships UniBlueprint
// has directly, not yet modelled in the ads table) shown on the Ad Board page
// alongside live student-submitted ads. `partnerSlug` is each partner's real
// Lifestyle Blueprint id (data/lifestylePartners.js) and
// lifestyle_partner_contact_details key — Whip Wizardz, JMC Fitness and
// Energie genuinely have no contact info on file yet (hasContact: false,
// same as their Lifestyle Blueprint entries), so PartnerContactModal shows
// its honest "coming soon, message the team" state for those three rather
// than inventing one.
export const CURATED_ADS = [
  { id: 'whip_wizardz', partnerSlug: 'whipwizardz', hasContact: false, boards: ['cross-ireland'], category: 'Automotive', brand: 'Whip Wizardz', title: 'Car Sales and Services', description: 'Vehicle sales, sourcing, inspections, repairs and detailing. Jonesborough, near Dundalk. Book via WhatsApp.' },
  { id: 'nail_nurse',   partnerSlug: 'nailnurse',   hasContact: true,  boards: ['cross-ireland'], category: 'Beauty',     brand: 'The Nail Nurse', title: 'Nail and Beauty Services', description: 'Acrylic full sets from €25. Gel polish from €6. Galway. Student discount with valid ID.' },
  { id: 'jmc_fitness',  partnerSlug: 'jmc',         hasContact: false, boards: ['cross-ireland'], category: 'Fitness',    brand: 'JMC Fitness', title: 'Elite Sports Coaching', description: '12-week plan €300. In-person sessions €50 per hour. North Dublin 4G Astro. Analytics Breakdown €100.' },
  { id: 'nyz3ditz',     partnerSlug: 'nyz3ditz',    hasContact: true,  boards: ['cross-ireland'], category: 'Creative',   brand: 'Nyz3ditz', title: 'Photography and Video Mentorship', description: 'Monthly mentorship €55 per month. One-to-one shoot session €90.' },
  { id: 'energie',      partnerSlug: 'energie',     hasContact: false, boards: ['cross-ireland'], category: 'Gym',       brand: 'Energie Fitness', title: 'Student Gym Membership', description: '€37.99 per month (standard €39.99 to €44.99). €15 joining fee. Mon to Fri 6am to 10pm. Sat to Sun 9am to 5pm.' },
]
