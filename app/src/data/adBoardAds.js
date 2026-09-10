/**
 * Shared between AdBoardScreen (the live Ad Board list) and
 * WeeklyBlueprintScreen (the magazine's own Ad Board page) — the category
 * icon/colour map, the curated real-partner listings, and the tap handler
 * that opens an ad's link or falls back to messaging the UBP team.
 */
import { Linking, Alert } from 'react-native'
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
// alongside live student-submitted ads.
//
// `contact` mirrors the same shape used in data/lifestylePartners.js (each id
// below is that same partner's Lifestyle Blueprint id) — instagram / phone /
// email / website, whichever this partner actually has on file. It's what
// lets getAdPressHandler open a real booking channel instead of falling back
// to "message the team": Whip Wizardz, JMC Fitness and Energie genuinely have
// no contact info on file yet (their Lifestyle Blueprint entries carry
// `contact: null` too — nothing invented here), so those three still fall
// back honestly rather than showing a fabricated number or handle.
export const CURATED_ADS = [
  { id: 'whip_wizardz', boards: ['cross-ireland'], category: 'Automotive', brand: 'Whip Wizardz', title: 'Car Sales and Services', description: 'Vehicle sales, sourcing, inspections, repairs and detailing. Jonesborough, near Dundalk. Book via WhatsApp.', contact: null },
  { id: 'nail_nurse',   boards: ['cross-ireland'], category: 'Beauty',     brand: 'The Nail Nurse', title: 'Nail and Beauty Services', description: 'Acrylic full sets from €25. Gel polish from €6. Galway. Student discount with valid ID. DM @theenailnurse__', contact: { instagram: 'theenailnurse__' } },
  { id: 'jmc_fitness',  boards: ['cross-ireland'], category: 'Fitness',    brand: 'JMC Fitness', title: 'Elite Sports Coaching', description: '12-week plan €300. In-person sessions €50 per hour. North Dublin 4G Astro. Analytics Breakdown €100.', contact: null },
  { id: 'nyz3ditz',     boards: ['cross-ireland'], category: 'Creative',   brand: 'Nyz3ditz', title: 'Photography and Video Mentorship', description: 'Monthly mentorship €55 per month. One-to-one shoot session €90. WhatsApp +353 85 7272 875. @Nyz3ditz', contact: { instagram: 'Nyz3ditz', phone: '+353857272875' } },
  { id: 'energie',      boards: ['cross-ireland'], category: 'Gym',       brand: 'Energie Fitness', title: 'Student Gym Membership', description: '€37.99 per month (standard €39.99 to €44.99). €15 joining fee. Mon to Fri 6am to 10pm. Sat to Sun 9am to 5pm.', contact: null },
]

export function getAdPressHandler(ad) {
  const url = ad.link || ad.target_url
  if (url) return () => Linking.openURL(url)

  const name = ad.brand || ad.title
  const contact = ad.contact

  // Real contact method on file — offer it directly instead of routing
  // through the team. Phone becomes a WhatsApp deep link (every partner
  // here that lists a phone number gives it out as a WhatsApp contact, per
  // their own descriptions/howToStart text), same as the Lifestyle
  // Blueprint's own contact chips.
  const actions = []
  if (contact?.phone) {
    actions.push({ text: 'WhatsApp', onPress: () => Linking.openURL(`https://wa.me/${contact.phone.replace(/[^\d]/g, '')}`) })
  }
  if (contact?.instagram) {
    actions.push({ text: `Instagram @${contact.instagram}`, onPress: () => Linking.openURL(`https://instagram.com/${contact.instagram}`) })
  }
  if (contact?.website) {
    actions.push({ text: 'Website', onPress: () => Linking.openURL(contact.website) })
  }
  if (contact?.email) {
    actions.push({ text: 'Email', onPress: () => Linking.openURL(`mailto:${contact.email}`) })
  }

  if (actions.length > 0) {
    return () => Alert.alert(name, ad.description, [...actions, { text: 'Close', style: 'cancel' }])
  }

  return () => Alert.alert(
    name,
    `${ad.description}\n\nNo direct booking link for this one yet. Message the UniBlueprint team and we'll connect you.`,
    [
      { text: 'Message the team', onPress: () => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Interested in: ' + name)) },
      { text: 'Close', style: 'cancel' },
    ],
  )
}
