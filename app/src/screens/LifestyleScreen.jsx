import { useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking,
} from 'react-native'
import {
  Heart, PiggyBank, Tag, ShoppingBag, ChevronRight,
  ChevronDown, ChevronUp, Phone, Mail, AtSign,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Filter Pills ────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'fitness',  label: 'Health & Fitness' },
  { key: 'beauty',   label: 'Beauty' },
  { key: 'fashion',  label: 'Fashion' },
  { key: 'food',     label: 'Food & Drink' },
  { key: 'services', label: 'Services' },
]

// ─── Partner Data ─────────────────────────────────────────────────────────────
// status: 'live' | 'shell' | 'tbc'
// 'live'  → full card with expand/pricing
// 'shell' → name + category only, "details coming soon"
// 'tbc'   → confirmed partner, amber TBC badge, "details to follow"

const PARTNERS = [
  // ── Live: Health & Fitness ──────────────────────────────────────────────
  {
    id: 'mpfitness',
    brand: 'MPFitness',
    initials: 'MP',
    initBg: '#15803D',
    filterKey: 'fitness',
    category: 'Personal Training',
    tagline: 'MPFitness. More Than Fitness.',
    deal: 'Full Client Package from €150/month',
    status: 'live',
    credentials: 'Certified Personal Trainer · Advanced Nutrition Coach · International Men\'s Physique Athlete',
    description: 'MPFitness coaching packages built around your goals, lifestyle, and schedule. Milan Piroska brings a competition athlete\'s mindset to every client, combining personalised training with advanced nutrition coaching. Now taking on prep clients.',
    pricelist: [
      { label: 'Full Client Package',             price: '€150/month · €40/week' },
      { label: 'Nutrition Client Package',         price: '€100/month · €30/week' },
      { label: 'In-Person PT + Assessment',        price: '€50/session' },
      { label: 'Online Consultation Call',         price: '€30/call' },
      { label: 'Deposit (all bookings)',           price: '€20 required' },
    ],
    pricingNote: 'Pricing pending final sign-off.',
    howToStart: 'Fill out the free client consultation form in bio, then DM "READY" on Instagram or WhatsApp.',
    contact: { instagram: 'milanpir_fitness', phone: '0857633757', email: 'milanpirfitness@gmail.com' },
  },
  {
    id: 'energie',
    brand: 'Energie Fitness',
    initials: 'EF',
    initBg: '#0369A1',
    filterKey: 'fitness',
    category: 'Gym Membership',
    tagline: 'Full gym access at a student rate.',
    deal: 'From €37.99/month',
    status: 'live',
    description: 'Join Energie Fitness with an exclusive student membership at €37.99/month — compared to the standard rate of €39.99–€44.99/month. Joining fee is €15 (normally €30). Must be set up in person at the gym.',
    pricelist: [
      { label: 'Student Monthly',    price: '€37.99/month' },
      { label: 'Student Joining Fee', price: '€15' },
      { label: 'Standard Monthly',   price: '€39.99–€44.99' },
      { label: 'Standard Joining Fee', price: '€30' },
    ],
    howToStart: 'Set up in-person at your nearest Energie Fitness location. Open Mon–Fri 6am–10pm, Sat–Sun 9am–5pm.',
    contact: null,
  },
  {
    id: 'jmc',
    brand: 'JMC Fitness',
    initials: 'JMC',
    initBg: '#166534',
    filterKey: 'fitness',
    category: 'Sports Coaching',
    tagline: 'Elite sports coaching, fully personalised.',
    // NOTE: confirm lowest available offering with Des/Camila before publishing price update
    deal: 'From €50/hr',
    status: 'live',
    description: 'JMC Fitness delivers elite sports coaching with fully personalised programmes: online coaching, in-person training on North Dublin 4G Astro, dietary guidance, specialist football coaching, and connections to professional agents.',
    pricelist: [
      { label: 'In-Person Session (1hr)', price: '€50' },
      { label: '12-Week Online Plan',     price: '€300' },
      { label: 'Analytics Breakdown',     price: '€100' },
    ],
    pricingNote: 'Pricing subject to confirmation. Contact for current packages.',
    howToStart: 'Book via the Elevation Blueprint section of the app.',
    contact: null,
  },

  // ── Live: Photography & Services ────────────────────────────────────────
  {
    id: 'nyz3ditz',
    brand: 'Nyz3ditz',
    initials: 'N3',
    initBg: '#C2410C',
    filterKey: 'services',
    category: 'Photography & Video',
    tagline: 'Creative mentorship for students building their portfolio.',
    deal: 'From €55/month',
    status: 'live',
    description: 'Nathan Yanzo (@Nyz3ditz) is a professional photographer and videographer offering mentorship and 1-1 shoot sessions for students building their creative skills. Monthly subscription includes Zoom calls and editing guidance.',
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session',    price: '€90' },
    ],
    howToStart: 'WhatsApp +353 85 7272 875 or DM @Nyz3ditz on Instagram to book.',
    contact: { instagram: 'Nyz3ditz', phone: '+353857272875' },
  },
  {
    id: 'whipwizardz',
    brand: 'Whip Wizardz',
    initials: 'WW',
    initBg: '#1E3A5F',
    filterKey: 'services',
    category: 'Automotive',
    tagline: 'Everything automotive in one place, Jonesborough.',
    deal: 'Student-friendly pricing',
    status: 'live',
    description: 'Appointment-based automotive specialists based in Jonesborough, near Dundalk. Whip Wizardz covers vehicle sales, sourcing, inspections, repairs, bodywork, detailing, import services, and consignment.',
    services: ['Vehicle Sales & Sourcing', 'Inspections', 'Repairs & Bodywork', 'Detailing', 'Import & Consignment'],
    howToStart: 'Book via WhatsApp, phone, or social media for your appointment.',
    contact: null,
  },

  // ── Live: Beauty ────────────────────────────────────────────────────────
  {
    id: 'nailnurse',
    brand: 'The Nail Nurse',
    initials: 'NN',
    initBg: '#BE185D',
    filterKey: 'beauty',
    category: 'Nail Tech · Galway',
    tagline: 'Full nail treatments at student prices.',
    deal: 'Student Discount',
    status: 'live',
    description: 'Professional nail technician based in Galway (@theenailnurse__). Full range of nail treatments at student-friendly prices. Student discount available with valid student ID.',
    pricelist: [
      { label: 'Acrylic Full Set',         price: '€25–€35' },
      { label: 'Infill / Rebalance',       price: '€20–€30' },
      { label: 'Gel Polish (hands)',        price: '€20–€25' },
      { label: 'Gel Polish (toes)',         price: '€20–€21' },
      { label: 'Gel Polish removal',        price: '€6–€8' },
      { label: 'Basic Manicure',           price: '€15' },
      { label: 'Luxury Manicure',          price: '€20–€21' },
      { label: 'Nail Art (per nail)',       price: '€3.50+' },
      { label: 'Nail Art (full set add-on)', price: '€10+' },
    ],
    howToStart: 'Show your valid student ID when booking. DM @theenailnurse__ on Instagram.',
    contact: { instagram: 'theenailnurse__' },
  },

  // ── Shell: Services ─────────────────────────────────────────────────────
  { id: 'leva',       brand: 'Leva Impact',             initials: 'LI', initBg: '#0369A1', filterKey: 'services', category: 'Digital Marketing', status: 'shell' },
  { id: 'kelan',      brand: 'madebykelan',             initials: 'MK', initBg: '#1E3A5F', filterKey: 'services', category: 'Creative',          status: 'shell' },

  // ── Shell: Hair ─────────────────────────────────────────────────────────
  { id: 'lucy',    brand: 'Hair by Lucy Staunton Kelly', initials: 'LS', initBg: '#B45309', filterKey: 'beauty', category: 'Hair', status: 'shell' },
  { id: 'angelic', brand: 'Angelic Touch',               initials: 'AT', initBg: '#92400E', filterKey: 'beauty', category: 'Hair', status: 'shell' },

  // ── Shell: Clothing ──────────────────────────────────────────────────────
  { id: 'ocean1',      brand: 'Ocean1',           initials: 'O1', initBg: '#0369A1', filterKey: 'fashion', category: 'Clothing', status: 'shell' },
  { id: 'pouvoirs',    brand: 'Pouvoirs Gallery', initials: 'PG', initBg: '#4B5563', filterKey: 'fashion', category: 'Clothing', status: 'shell' },
  { id: 'saiemsent',   brand: 'Saiemsent',        initials: 'SM', initBg: '#374151', filterKey: 'fashion', category: 'Clothing', status: 'shell' },
  { id: 'fortesce',    brand: 'Fortesce',         initials: 'FT', initBg: '#1D4ED8', filterKey: 'fashion', category: 'Clothing', status: 'shell' },
  { id: 'streetclth',  brand: 'Street Clothing',  initials: 'SC', initBg: '#111827', filterKey: 'fashion', category: 'Clothing', status: 'shell' },
  { id: 'timing',      brand: 'Timing',           initials: 'TM', initBg: '#374151', filterKey: 'fashion', category: 'Clothing', status: 'shell' },

  // ── Shell: Food & Drink ──────────────────────────────────────────────────
  { id: 'lume',       brand: 'Lume',            initials: 'LM', initBg: '#D97706', filterKey: 'food', category: 'Food & Drink', status: 'shell' },
  { id: 'njoy',       brand: 'N-joy',           initials: 'NJ', initBg: '#B45309', filterKey: 'food', category: 'Food & Drink', status: 'shell' },
  { id: 'tuckin',     brand: 'Tuck Inn',        initials: 'TI', initBg: '#92400E', filterKey: 'food', category: 'Food & Drink', status: 'shell' },
  { id: 'coffeespot', brand: 'The Coffee Spot', initials: 'CS', initBg: '#78350F', filterKey: 'food', category: 'Food & Drink', status: 'shell' },
  { id: 'islandsips', brand: 'Island Sips',     initials: 'IS', initBg: '#0891B2', filterKey: 'food', category: 'Food & Drink', status: 'shell' },

  // ── Shell: Lash Tech ────────────────────────────────────────────────────
  { id: 'chloehouse', brand: 'Chloe May House',  initials: 'CM', initBg: '#7C3AED', filterKey: 'beauty', category: 'Lash Tech', status: 'shell' },
  { id: 'lashlux',    brand: 'Lash Lux Dublin',  initials: 'LL', initBg: '#9333EA', filterKey: 'beauty', category: 'Lash Tech', status: 'shell' },

  // ── Shell: Nail Tech ────────────────────────────────────────────────────
  { id: 'dolledm',  brand: 'Dolled by M',        initials: 'DM', initBg: '#BE185D', filterKey: 'beauty', category: 'Nail Tech', status: 'shell' },
  { id: 'eveburac', brand: 'Eve Burac',           initials: 'EB', initBg: '#DB2777', filterKey: 'beauty', category: 'Nail Tech', status: 'shell' },
  { id: 'claras',   brand: "Clara's Beauty Room", initials: 'CB', initBg: '#EC4899', filterKey: 'beauty', category: 'Nail Tech', status: 'shell' },

  // ── Shell: Makeup ───────────────────────────────────────────────────────
  { id: 'erinburke', brand: 'Erin Burke Makeup', initials: 'EB', initBg: '#C2410C', filterKey: 'beauty', category: 'Makeup', status: 'shell' },
  { id: 'nicole',    brand: 'Nicole',            initials: 'NI', initBg: '#9A3412', filterKey: 'beauty', category: 'Makeup', status: 'shell' },
  { id: 'wzorek',    brand: 'Wzorek',            initials: 'WZ', initBg: '#7C2D12', filterKey: 'beauty', category: 'Makeup', status: 'shell' },

  // ── TBC: confirmed coming soon ──────────────────────────────────────────
  { id: 'carolynes',   brand: 'Carolynes Beauty Studio', initials: 'CB', initBg: '#D97706', filterKey: 'beauty', category: 'Beauty Studio', status: 'tbc' },
  { id: 'kasia',       brand: 'Makeup By Kasia',         initials: 'MK', initBg: '#D97706', filterKey: 'beauty', category: 'Makeup',        status: 'tbc' },
  { id: 'pkglam',      brand: 'The PK Glam',             initials: 'PK', initBg: '#D97706', filterKey: 'beauty', category: 'Beauty',        status: 'tbc' },
  { id: 'hardluck',    brand: 'Hardluck Club',           initials: 'HC', initBg: '#D97706', filterKey: 'food',   category: 'Venue',         status: 'tbc' },
  { id: 'lashessteph', brand: 'Lashes By Steph',         initials: 'LS', initBg: '#D97706', filterKey: 'beauty', category: 'Lash Tech',     status: 'tbc' },
  { id: 'purplebrunch',brand: 'Purple Brunch',           initials: 'PB', initBg: '#D97706', filterKey: 'food',   category: 'Food & Drink',  status: 'tbc' },
]

// ─── Wellbeing & Support ─────────────────────────────────────────────────────
const SUPPORT_LINES = [
  { name: 'Samaritans Ireland',  number: '116 123',        hours: '24/7',        link: 'tel:116123' },
  { name: 'Pieta House',         number: '116 123',        hours: '24/7',        link: 'tel:116123' },
  { name: 'Niteline',            number: '1800 793 793',   hours: 'Term nights', link: 'tel:1800793793' },
  { name: 'SpunOut',             number: 'spunout.ie',     hours: 'Online',      link: 'https://spunout.ie' },
  { name: 'Jigsaw',              number: 'jigsaw.ie',      hours: 'Online',      link: 'https://jigsaw.ie' },
  { name: 'Turn2Me',             number: 'turn2me.ie',     hours: 'Online',      link: 'https://turn2me.ie' },
  { name: 'MyMind',              number: '01 820 5277',    hours: 'Mon–Fri',     link: 'tel:018205277' },
  { name: 'Student Counselling', number: 'Your college',   hours: 'On campus',   link: null },
]

const WELLBEING_RESOURCES = [
  { title: 'Managing Exam Stress',          type: 'Guide',    readTime: '4 min read', tag: 'Mental Health' },
  { title: 'Sleep & Academic Performance',  type: 'Article',  readTime: '6 min read', tag: 'Wellbeing' },
  { title: "Student Anxiety: What's Normal", type: 'Resource', readTime: '5 min read', tag: 'Support' },
  { title: 'Mindfulness for Students',      type: 'Guide',    readTime: '3 min read', tag: 'Wellbeing' },
]

// ─── Budget Tools ─────────────────────────────────────────────────────────────
const BUDGET_TOOLS = [
  { title: 'Student Budget Calculator', sub: 'Plan rent, food, transport and more', Icon: PiggyBank },
  { title: 'SUSI Grant Guide',          sub: 'Check eligibility and application steps', Icon: Tag },
  { title: 'Part-Time Work Finder',     sub: 'Flexible roles near your campus', Icon: ShoppingBag },
]

// ─── Initials Circle ─────────────────────────────────────────────────────────
function Circle({ partner, size = 44 }) {
  const isTbc = partner.status === 'tbc'
  const bg = isTbc ? '#F59E0B' : partner.initBg
  const text = isTbc ? 'TBC' : partner.initials
  const fontSize = text.length > 2 ? 10 : 13
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.circleText, { fontSize }]}>{text}</Text>
    </View>
  )
}

// ─── Contact Chip ─────────────────────────────────────────────────────────────
function ContactChip({ type, value }) {
  const handlers = {
    instagram: () => Linking.openURL(`https://instagram.com/${value}`),
    phone:     () => Linking.openURL(`tel:${value.replace(/\s/g, '')}`),
    email:     () => Linking.openURL(`mailto:${value}`),
  }
  const labels  = { instagram: `@${value}`, phone: value, email: value }
  const icons   = {
    instagram: <AtSign size={12} color={colors.cream} />,
    phone:     <Phone  size={12} color={colors.cream} />,
    email:     <Mail   size={12} color={colors.cream} />,
  }
  if (!handlers[type]) return null
  return (
    <TouchableOpacity style={styles.contactChip} onPress={handlers[type]} activeOpacity={0.8}>
      {icons[type]}
      <Text style={styles.contactChipText}>{labels[type]}</Text>
    </TouchableOpacity>
  )
}

// ─── Partner Card ─────────────────────────────────────────────────────────────
function PartnerCard({ partner }) {
  const [open, setOpen] = useState(false)
  const isLive  = partner.status === 'live'
  const isShell = partner.status === 'shell'
  const isTbc   = partner.status === 'tbc'

  return (
    <View style={styles.partnerCard}>
      {/* Card row — always visible */}
      <TouchableOpacity
        style={styles.cardRow}
        activeOpacity={isLive ? 0.75 : 1}
        onPress={() => isLive && setOpen(v => !v)}
        disabled={!isLive}
      >
        <Circle partner={partner} size={44} />

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text
              style={[styles.brandName, (isShell || isTbc) && styles.brandMuted]}
              numberOfLines={1}
            >
              {partner.brand}
            </Text>
            {isTbc && (
              <View style={styles.tbcBadge}>
                <Text style={styles.tbcBadgeText}>TBC</Text>
              </View>
            )}
            {isShell && (
              <View style={styles.shellBadge}>
                <Text style={styles.shellBadgeText}>Coming Soon</Text>
              </View>
            )}
            {isLive && (
              open
                ? <ChevronUp   size={15} color={colors.navy} />
                : <ChevronDown size={15} color={colors.muted} />
            )}
          </View>

          <Text style={styles.categoryLabel}>{partner.category}</Text>

          {isLive && partner.deal && (
            <Text style={styles.dealLabel}>{partner.deal}</Text>
          )}
          {isTbc && (
            <Text style={styles.secondaryLabel}>Confirmed partner, details to follow</Text>
          )}
          {isShell && (
            <Text style={styles.secondaryLabel}>Profile and details coming soon</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded detail — live cards only */}
      {isLive && open && (
        <View style={styles.expandedSection}>
          {partner.credentials && (
            <Text style={styles.credentialsText}>{partner.credentials}</Text>
          )}

          <View style={styles.expandDivider} />

          {partner.description && (
            <>
              <Text style={styles.expandLabel}>ABOUT</Text>
              <Text style={styles.expandBody}>{partner.description}</Text>
            </>
          )}

          {partner.services && (
            <View style={styles.servicePills}>
              {partner.services.map(s => (
                <View key={s} style={styles.servicePill}>
                  <Text style={styles.servicePillText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {partner.pricelist && (
            <>
              <Text style={[styles.expandLabel, { marginTop: 16 }]}>PRICING</Text>
              <View style={styles.priceTable}>
                {partner.pricelist.map((row, i) => (
                  <View
                    key={i}
                    style={[
                      styles.priceRow,
                      i < partner.pricelist.length - 1 && styles.priceRowBorder,
                    ]}
                  >
                    <Text style={styles.priceRowLabel}>{row.label}</Text>
                    <Text style={styles.priceRowValue}>{row.price}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {partner.pricingNote && (
            <Text style={styles.pricingNote}>{partner.pricingNote}</Text>
          )}

          {partner.howToStart && (
            <>
              <Text style={[styles.expandLabel, { marginTop: 16 }]}>HOW TO START</Text>
              <Text style={styles.expandBody}>{partner.howToStart}</Text>
            </>
          )}

          {partner.hours && (
            <Text style={styles.hoursText}>{partner.hours}</Text>
          )}

          {partner.contact && (
            <View style={styles.contactRow}>
              {partner.contact.instagram && (
                <ContactChip type="instagram" value={partner.contact.instagram} />
              )}
              {partner.contact.phone && (
                <ContactChip type="phone" value={partner.contact.phone} />
              )}
              {partner.contact.email && (
                <ContactChip type="email" value={partner.contact.email} />
              )}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LifestyleScreen() {
  const [activeFilter, setActiveFilter] = useState('all')

  const visible = activeFilter === 'all'
    ? PARTNERS
    : PARTNERS.filter(p => p.filterKey === activeFilter)

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>LIFESTYLE</Text>
          <Text style={styles.heroTitle}>Lifestyle Blueprint</Text>
          <Text style={styles.heroSub}>
            Partner deals, wellbeing support, and money tools — built around what student life actually costs.
          </Text>
        </View>

        {/* ── Partner Listings ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Confirmed Partners" title="Partner Listings" />

          {/* Filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, activeFilter === f.key && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Partner cards */}
          <View style={styles.partnerList}>
            {visible.map(p => <PartnerCard key={p.id} partner={p} />)}
          </View>

          {visible.length === 0 && (
            <Text style={styles.emptyText}>No partners in this category yet.</Text>
          )}
        </View>

        {/* ── Mental Health & Wellbeing ─────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Student Wellbeing" title="Mental Health & Support" />

          <View style={styles.supportBanner}>
            <Heart size={16} color={colors.cream} fill={colors.cream} />
            <Text style={styles.supportBannerText}>
              Need to talk? Free, confidential support is available 24/7.
            </Text>
          </View>

          <View style={styles.supportList}>
            {SUPPORT_LINES.map(line => (
              <TouchableOpacity
                key={line.name}
                activeOpacity={line.link ? 0.8 : 1}
                onPress={() => line.link && Linking.openURL(line.link)}
              >
                <Card style={styles.supportCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportName}>{line.name}</Text>
                    <Text style={styles.supportHours}>{line.hours}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.supportNumber}>{line.number}</Text>
                    {line.link && <Phone size={12} color={colors.muted} style={{ marginTop: 3 }} />}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <SectionHeader eyebrow="Resources" title="Wellbeing Reads" style={{ marginTop: spacing.xl }} />
          <View style={styles.supportList}>
            {WELLBEING_RESOURCES.map((r, i) => (
              <TouchableOpacity key={i} activeOpacity={0.8}>
                <Card style={styles.articleCard}>
                  <View style={styles.articleTag}>
                    <Text style={styles.articleTagText}>{r.tag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleTitle}>{r.title}</Text>
                    <Text style={styles.articleMeta}>{r.type} · {r.readTime}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Budgeting Tools ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Money & Finance" title="Budgeting Tools" />
          <View style={styles.supportList}>
            {BUDGET_TOOLS.map(({ title, sub, Icon }) => (
              <TouchableOpacity key={title} activeOpacity={0.8}>
                <Card style={styles.budgetCard}>
                  <View style={styles.budgetIconWrap}>
                    <Icon size={20} color={colors.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.budgetTitle}>{title}</Text>
                    <Text style={styles.budgetSub}>{sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <Card style={styles.tipCard}>
            <Text style={styles.tipEyebrow}>MONEY TIP OF THE WEEK</Text>
            <Text style={styles.tipText}>
              Cook in bulk on Sundays. Students who meal prep spend on average 40% less on food per week than those who don't.
            </Text>
          </Card>
        </View>

      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.cream },
  scroll:  { paddingBottom: 56 },

  // Hero
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle:   { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },

  // Filter pills
  filterScroll:  { marginHorizontal: -spacing.md, marginBottom: spacing.md },
  filterContent: { paddingHorizontal: spacing.md, gap: 8, flexDirection: 'row' },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterPillText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  filterPillTextActive: { color: colors.cream },

  // Partner list
  partnerList: { gap: 10 },
  emptyText:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 24 },

  // Partner card
  partnerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleText: { fontFamily: fonts.sansBold, color: '#FFFFFF', letterSpacing: 0.3 },

  cardBody:   { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  brandName: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, flex: 1 },
  brandMuted: { color: colors.muted },

  categoryLabel:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  dealLabel:      { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 3 },
  secondaryLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 3, fontStyle: 'italic' },

  // Status badges
  tbcBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tbcBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 0.4 },

  shellBadge: {
    backgroundColor: 'rgba(30,58,95,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  shellBadgeText: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.muted },

  // Expanded section
  expandedSection: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expandDivider: { height: 1, backgroundColor: colors.border, marginBottom: 14, marginTop: 2 },
  expandLabel:   { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 6 },
  expandBody:    { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },

  credentialsText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted,
    lineHeight: 18, marginTop: 12, marginBottom: 4,
  },

  servicePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  servicePill: {
    backgroundColor: colors.cream, borderRadius: radius.badge,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  servicePillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  // Pricing table
  priceTable: {
    backgroundColor: colors.cream,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,58,95,0.07)',
  },
  priceRowLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, flex: 1, marginRight: 8 },
  priceRowValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  pricingNote: {
    fontFamily: fonts.sans, fontSize: 11, color: colors.muted,
    fontStyle: 'italic', marginTop: 8, lineHeight: 16,
  },

  hoursText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted,
    marginTop: 8,
  },

  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  contactChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.navy, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  contactChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.cream },

  // Wellbeing
  supportBanner: {
    backgroundColor: '#DC2626', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  supportBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.white, flex: 1, lineHeight: 19 },
  supportList: { gap: 10, marginTop: spacing.md },
  supportCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  supportName:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  supportHours:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  supportNumber: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  // Articles
  articleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  articleTag: {
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0,
  },
  articleTagText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream },
  articleTitle:   { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  articleMeta:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  // Budget
  budgetCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  budgetIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  budgetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  budgetSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  tipCard:     { marginTop: spacing.md, backgroundColor: colors.navy, padding: 18 },
  tipEyebrow:  { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1 },
  tipText:     { fontFamily: fonts.sans, fontSize: 14, color: colors.cream, lineHeight: 21, marginTop: 8 },
})
