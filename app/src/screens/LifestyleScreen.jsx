import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, Modal, Linking } from 'react-native'
import { Heart, ShoppingBag, PiggyBank, Tag, ChevronRight, X, ExternalLink, Phone } from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

const PARTNERS = [
  {
    brand: 'Whip Wizardz',
    logo: require('../../assets/whip-wizardz-logo.png.png'),
    initials: 'WW', initBg: '#1E3A5F',
    discount: 'Student Deal',
    category: 'Automotive',
    color: '#EFF6FF',
    description: 'Appointment-based automotive specialists based in Jonesborough, near Dundalk. Whip Wizardz offers vehicle sales, sourcing, inspections, repairs, bodywork, detailing, import services, and consignment — everything automotive in one place.',
    dealText: 'Book via WhatsApp, phone, or social media for your appointment. Student-friendly pricing across all services.',
    contact: 'WhatsApp / Phone / Social Media',
    services: ['Vehicle Sales & Sourcing', 'Inspections', 'Repairs & Bodywork', 'Detailing', 'Import & Consignment'],
  },
  {
    brand: 'The Nail Nurse',
    logo: null,
    initials: 'TNN', initBg: '#B8860B',
    discount: 'Student Discount',
    category: 'Nail & Beauty',
    color: '#FDF4FF',
    description: 'Professional nail technician based in Galway. The Nail Nurse (@theenailnurse__) offers a full range of nail treatments at student-friendly prices. Student discount available with valid student ID.',
    dealText: 'Show your valid student ID when booking for your student discount across all treatments. DM on Instagram to book your appointment.',
    contact: '@theenailnurse__ · Instagram · Galway',
    pricelist: [
      { label: 'Acrylic Full Set', price: '€25–€35' },
      { label: 'Infill / Rebalance', price: '€20–€30' },
      { label: 'Gel Polish (hands)', price: '€20–€25' },
      { label: 'Gel Polish (toes)', price: '€20–€21' },
      { label: 'Gel Polish removal', price: '€6–€8' },
      { label: 'Basic Manicure', price: '€15' },
      { label: 'Luxury Manicure', price: '€20–€21' },
      { label: 'Nail Art (per nail)', price: '€3.50+' },
      { label: 'Nail Art (full set add-on)', price: '€10+' },
    ],
    services: ['Acrylic Nails', 'Gel Polish', 'Manicures', 'Nail Art', 'Student Discount'],
  },
  {
    brand: 'Nyz3ditz',
    logo: require('../../assets/nyz3ditz-logo.png.jpeg'),
    initials: 'N3', initBg: '#C2410C',
    discount: 'From €55/month',
    category: 'Photography & Video',
    color: '#FFF7ED',
    description: 'Nathan Yanzo (@Nyz3ditz) is a professional photographer and videographer offering mentorship and 1-1 shoot sessions for students building their creative skills. Monthly subscription includes Zoom calls and editing guidance.',
    dealText: 'Monthly subscription €55/month — includes Zoom calls and editing guidance. 1-1 shoot session €90 covering lighting and composition. WhatsApp +353 85 7272 875 or DM @Nyz3ditz to book.',
    contact: '@Nyz3ditz · WhatsApp +353 85 7272 875',
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session', price: '€90' },
    ],
    services: ['Monthly Mentorship', '1-1 Shoot Sessions', 'Editing Guidance', 'Lighting & Composition'],
  },
  {
    brand: 'Energie Fitness',
    logo: require('../../assets/energie-fitness-logo.png.jpeg'),
    initials: 'EF', initBg: '#0369A1',
    discount: '€37.99/month',
    category: 'Gym & Fitness',
    color: '#F0F9FF',
    description: 'Join Energie Fitness with an exclusive student membership at €37.99/month — compared to the standard rate of €39.99–€44.99/month. Joining fee is €15 (normally €30). Setup must be done in person at the gym.',
    dealText: 'Student membership: €37.99/month (normal €39.99–€44.99). Student joining fee: €15 (normal €30). Must be set up in person. Open Mon–Fri 6am–10pm, Sat–Sun 9am–5pm.',
    contact: 'Set up in-person at your nearest Energie Fitness location',
    pricelist: [
      { label: 'Student Monthly', price: '€37.99/month' },
      { label: 'Student Joining Fee', price: '€15' },
      { label: 'Standard Monthly', price: '€39.99–€44.99' },
      { label: 'Standard Joining Fee', price: '€30' },
    ],
    services: ['Full Gym Access', 'Group Classes', 'Wellness Programmes', 'Student Rate'],
    hours: 'Mon–Fri 6am–10pm · Sat–Sun 9am–5pm',
  },
  {
    brand: 'JMC Fitness',
    logo: require('../../assets/jmc-fitness-logo.png.jpeg'),
    initials: 'JMC', initBg: '#15803D',
    discount: 'From €50/hr',
    category: 'Sports Coaching',
    color: '#F0FDF4',
    description: 'Elite sports coaching offering fully personalised programmes. JMC Fitness provides online coaching, in-person training sessions on North Dublin 4G Astro, dietary guidance, specialist football coaching, and connections to professional agents.',
    dealText: 'Book directly through the Elevation Blueprint section. 12-week online plan at €300. In-person sessions €50/hr. Analytics breakdown €100.',
    contact: 'Book via Elevation Blueprint',
    pricelist: [
      { label: '12-Week Online Plan', price: '€300' },
      { label: 'In-Person Session (1hr)', price: '€50' },
      { label: 'Analytics Breakdown', price: '€100' },
    ],
    services: ['12-Week Online Plan', 'In-Person Training', 'Football Coaching', 'Analytics', 'Dietary Guidance', 'Agent Connections'],
  },
  {
    brand: 'Emmanuel Fasanmi',
    logo: null,
    initials: 'EF', initBg: '#7C3AED',
    discount: 'Pricing TBC',
    category: 'Academic Grinds',
    color: '#FEF9C3',
    description: 'One-to-one and small group grinds in Maths, Physics, and Biology for Leaving Certificate and university students across Dublin. Sessions are structured, focused, and built around where you actually need to improve.',
    dealText: 'Contact Emmanuel through the Elevation Blueprint section to discuss your needs and book sessions. Pricing to be confirmed.',
    contact: 'Book via Elevation Blueprint',
    services: ['Maths Grinds', 'Physics Grinds', 'Biology Grinds'],
  },
]

const WELLBEING_RESOURCES = [
  { title: 'Managing Exam Stress', type: 'Guide', readTime: '4 min read', tag: 'Mental Health' },
  { title: 'Sleep & Academic Performance', type: 'Article', readTime: '6 min read', tag: 'Wellbeing' },
  { title: "Student Anxiety: What's Normal", type: 'Resource', readTime: '5 min read', tag: 'Support' },
  { title: 'Mindfulness for Students', type: 'Guide', readTime: '3 min read', tag: 'Wellbeing' },
]

const SUPPORT_LINES = [
  { name: 'Samaritans Ireland', number: '116 123',        hours: '24/7',        color: '#EFF6FF', link: 'tel:116123' },
  { name: 'Pieta House',        number: '116 123',        hours: '24/7',        color: '#FDF4FF', link: 'tel:116123' },
  { name: 'Niteline',           number: '1800 793 793',   hours: 'Term nights', color: '#F0FDF4', link: 'tel:1800793793' },
  { name: 'SpunOut',            number: 'spunout.ie',     hours: 'Online',      color: '#FFF7ED', link: 'https://spunout.ie' },
  { name: 'Jigsaw',             number: 'jigsaw.ie',      hours: 'Online',      color: '#F0F9FF', link: 'https://jigsaw.ie' },
  { name: 'Turn2Me',            number: 'turn2me.ie',     hours: 'Online',      color: '#FEF9C3', link: 'https://turn2me.ie' },
  { name: 'MyMind',             number: '01 820 5277',    hours: 'Mon–Fri',     color: '#F5F0E8', link: 'tel:018205277' },
  { name: 'Student Counselling',number: 'Your college',   hours: 'On campus',   color: '#FFF7ED', link: null },
]

const BUDGET_TOOLS = [
  { title: 'Student Budget Calculator', sub: 'Plan rent, food, transport and more', icon: PiggyBank, color: '#EFF6FF' },
  { title: 'SUSI Grant Guide', sub: 'Check eligibility and application steps', icon: Tag, color: '#F0FDF4' },
  { title: 'Part-Time Work Finder', sub: 'Flexible roles near your campus', icon: ShoppingBag, color: '#FFF7ED' },
]

const DISCOUNT_CATEGORIES = [
  { label: 'Food & Drink', count: 3, color: '#FFF7ED', icon: '🍕' },
  { label: 'Fitness & Sport', count: 2, color: '#FEF9C3', icon: '🏋️' },
  { label: 'Creative', count: 1, color: '#FDF4FF', icon: '🎬' },
  { label: 'Car Services', count: 1, color: '#EFF6FF', icon: '🚗' },
  { label: 'Marketing', count: 1, color: '#F0FDF4', icon: '📱' },
  { label: 'Education', count: 1, color: '#F0F9FF', icon: '📚' },
  { label: 'Beauty', count: 1, color: '#FDF4FF', icon: '✨' },
  { label: 'More coming', count: null, color: '#F5F0E8', icon: '🔒' },
]

function PartnerLogo({ partner, size = 56 }) {
  if (partner.logo) {
    return (
      <Image
        source={partner.logo}
        style={{ width: size, height: size, borderRadius: size / 2, marginBottom: 10 }}
        resizeMode="cover"
      />
    )
  }
  return (
    <View style={[
      styles.partnerInitialsCircle,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: partner.initBg, marginBottom: 10 },
    ]}>
      <Text style={[styles.partnerInitialsText, { fontSize: size > 48 ? 14 : 11 }]}>{partner.initials}</Text>
    </View>
  )
}

export default function LifestyleScreen() {
  const [selectedPartner, setSelectedPartner] = useState(null)

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>LIFESTYLE</Text>
          <Text style={styles.heroTitle}>Lifestyle Blueprint</Text>
          <Text style={styles.heroSub}>
            Deals, wellbeing, and money tools — built around what student life actually costs.
          </Text>
        </View>

        {/* ── Partner Deals ── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Confirmed Partners" title="Partner Deals" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {PARTNERS.map(partner => (
              <TouchableOpacity key={partner.brand} activeOpacity={0.8} onPress={() => setSelectedPartner(partner)}>
                <View style={[styles.dealCard, { backgroundColor: partner.color }]}>
                  <PartnerLogo partner={partner} size={56} />
                  <Text style={styles.dealBrand} numberOfLines={2}>{partner.brand}</Text>
                  <Text style={styles.dealDiscount}>{partner.discount}</Text>
                  <View style={styles.dealCategoryBadge}>
                    <Text style={styles.dealCategoryText}>{partner.category}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewDealBtn}
                    onPress={() => setSelectedPartner(partner)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDealBtnText}>View Deal</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Mental Health & Wellbeing ── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Student Wellbeing" title="Mental Health & Support" />

          <View style={styles.supportBanner}>
            <Heart size={16} color={colors.cream} fill={colors.cream} />
            <Text style={styles.supportBannerText}>
              Need to talk? Free, confidential support is available 24/7.
            </Text>
          </View>

          <View style={{ gap: 10, marginTop: spacing.md }}>
            {SUPPORT_LINES.map(line => (
              <TouchableOpacity
                key={line.name}
                activeOpacity={line.link ? 0.8 : 1}
                onPress={() => line.link && Linking.openURL(line.link)}
              >
                <Card style={[styles.supportCard, { backgroundColor: line.color }]}>
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
          <View style={{ gap: 10 }}>
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
                  <ChevronRight size={14} color={colors.light} style={{ alignSelf: 'center' }} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Budgeting Tools ── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Money & Finance" title="Budgeting Tools" />
          <View style={{ gap: 12 }}>
            {BUDGET_TOOLS.map(({ title, sub, icon: Icon, color }) => (
              <TouchableOpacity key={title} activeOpacity={0.8}>
                <Card style={styles.budgetCard}>
                  <View style={[styles.budgetIcon, { backgroundColor: color }]}>
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
              Cook in bulk on Sundays — students who meal prep spend on average 40% less on food per week than those who don't.
            </Text>
          </Card>
        </View>

        {/* ── Student Discounts ── */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <SectionHeader eyebrow="Browse By Category" title="Student Discounts" />
          <View style={styles.discountGrid}>
            {DISCOUNT_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.label} activeOpacity={0.8} style={styles.discountCell}>
                <Card style={[styles.discountCard, { backgroundColor: cat.color }]}>
                  <Text style={styles.discountEmoji}>{cat.icon}</Text>
                  <Text style={styles.discountLabel}>{cat.label}</Text>
                  <Text style={styles.discountCount}>{cat.count !== null ? `${cat.count} deals` : 'Soon'}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Browse All Deals</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Partner Deal Modal ── */}
      <Modal
        visible={!!selectedPartner}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPartner(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPartner(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            {selectedPartner && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <PartnerLogo partner={selectedPartner} size={52} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.modalBrand}>{selectedPartner.brand}</Text>
                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>{selectedPartner.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.modalClose} activeOpacity={0.7}>
                    <X size={18} color={colors.navy} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSectionLabel}>ABOUT</Text>
                <Text style={styles.modalDescription}>{selectedPartner.description}</Text>

                {/* Service tags */}
                {selectedPartner.services && (
                  <View style={styles.modalServices}>
                    {selectedPartner.services.map(s => (
                      <View key={s} style={styles.modalServicePill}>
                        <Text style={styles.modalServicePillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Pricelist if available */}
                {selectedPartner.pricelist && (
                  <>
                    <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>PRICING</Text>
                    <View style={styles.modalPricelist}>
                      {selectedPartner.pricelist.map(p => (
                        <View key={p.label} style={styles.modalPriceRow}>
                          <Text style={styles.modalPriceLabel}>{p.label}</Text>
                          <Text style={styles.modalPriceValue}>{p.price}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Hours if available */}
                {selectedPartner.hours && (
                  <View style={styles.modalHoursRow}>
                    <Text style={styles.modalSectionLabel}>OPENING HOURS</Text>
                    <Text style={styles.modalHoursText}>{selectedPartner.hours}</Text>
                  </View>
                )}

                <View style={[styles.modalDealBox, { backgroundColor: selectedPartner.color }]}>
                  <Text style={styles.modalDealLabel}>STUDENT DEAL</Text>
                  <Text style={styles.modalDealText}>{selectedPartner.dealText}</Text>
                </View>

                <View style={styles.modalContactRow}>
                  <Text style={styles.modalContactLabel}>Contact</Text>
                  <Text style={styles.modalContactValue}>{selectedPartner.contact}</Text>
                </View>

                <TouchableOpacity style={styles.modalCta} activeOpacity={0.8} onPress={() => setSelectedPartner(null)}>
                  <Text style={styles.modalCtaText}>Got It</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 48 },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  rowScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },

  dealCard: {
    width: 152, borderRadius: radius.card,
    padding: 14, marginRight: 12, alignItems: 'center',
  },
  partnerInitialsCircle: { alignItems: 'center', justifyContent: 'center' },
  partnerInitialsText: { fontFamily: fonts.sansBold, color: '#FFFFFF' },
  dealBrand: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textAlign: 'center', lineHeight: 18 },
  dealDiscount: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.navy, marginTop: 4, textAlign: 'center' },
  dealCategoryBadge: {
    backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 8,
  },
  dealCategoryText: { fontFamily: fonts.sans, fontSize: 10, color: colors.navy },
  viewDealBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 14, paddingVertical: 7, marginTop: 10,
  },
  viewDealBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },

  supportBanner: {
    backgroundColor: '#DC2626', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  supportBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.white, flex: 1, lineHeight: 19 },
  supportCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  supportName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  supportHours: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  supportNumber: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  articleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  articleTag: {
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0,
  },
  articleTagText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream },
  articleTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  articleMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  budgetCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  budgetIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  budgetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  budgetSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  tipCard: { marginTop: spacing.md, backgroundColor: colors.navy, padding: 18 },
  tipEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1 },
  tipText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream, lineHeight: 21, marginTop: 8 },

  discountGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  discountCell: { width: '50%', padding: 6 },
  discountCard: { padding: 16, borderRadius: radius.card, alignItems: 'flex-start' },
  discountEmoji: { fontSize: 26, marginBottom: 8 },
  discountLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  discountCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  primaryBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.md, paddingBottom: 36, maxHeight: '90%',
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: 'rgba(30,58,95,0.15)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center' },
  modalBrand: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  modalCategoryBadge: {
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 4,
  },
  modalCategoryText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  modalDivider: { height: 1, backgroundColor: 'rgba(30,58,95,0.08)', marginVertical: 16 },
  modalSectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 8 },
  modalDescription: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, lineHeight: 22 },

  modalServices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  modalServicePill: {
    backgroundColor: colors.cream, borderRadius: radius.badge,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  modalServicePillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  modalPricelist: {
    backgroundColor: colors.cream, borderRadius: radius.button, overflow: 'hidden',
  },
  modalPriceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  modalPriceLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy },
  modalPriceValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  modalHoursRow: { marginTop: 16 },
  modalHoursText: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy },

  modalDealBox: { borderRadius: radius.card, padding: 14, marginTop: 16 },
  modalDealLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy, letterSpacing: 0.8, opacity: 0.6, marginBottom: 6 },
  modalDealText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy, lineHeight: 20 },
  modalContactRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  modalContactLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  modalContactValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, flex: 1, textAlign: 'right', marginLeft: 8 },
  modalCta: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  modalCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
