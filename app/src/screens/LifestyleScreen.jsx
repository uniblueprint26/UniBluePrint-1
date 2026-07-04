import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Heart, ShoppingBag, Brain, PiggyBank, Tag, ChevronRight, ExternalLink } from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

const DEALS = [
  { brand: 'Whip Wizards',    discount: 'Student Deal',    category: 'Car Sales',          color: '#EFF6FF' },
  { brand: 'The Oat Goat',    discount: 'Student Offer',   category: 'Food & Drink',       color: '#F0FDF4' },
  { brand: "Jordan's Kitchen",discount: 'Student Offer',   category: 'Food & Drink',       color: '#FFF7ED' },
  { brand: 'NYZ Editz',       discount: 'Student Rate',    category: 'Video & Photo',      color: '#FDF4FF' },
  { brand: 'Energie Fitness', discount: 'Reduced Membership', category: 'Gym & Fitness',  color: '#F0F9FF' },
  { brand: 'ROM Sligo',       discount: 'Student Rate',    category: 'Sports Centre',      color: '#FEF9C3' },
  { brand: 'Leva Media',      discount: 'Student Package', category: 'Digital Marketing',  color: '#EFF6FF' },
  { brand: 'HB Detailing',    discount: 'Student Price',   category: 'Car Detailing',      color: '#F0FDF4' },
  { brand: 'Course Compass',  discount: 'Free Guidance',   category: 'CAO & Education',    color: '#FFF7ED' },
  { brand: 'Jenny Glow',      discount: 'Student Discount',category: 'Fragrance & Beauty', color: '#FDF4FF' },
]

const WELLBEING_RESOURCES = [
  { title: 'Managing Exam Stress', type: 'Guide', readTime: '4 min read', tag: 'Mental Health' },
  { title: 'Sleep & Academic Performance', type: 'Article', readTime: '6 min read', tag: 'Wellbeing' },
  { title: 'Student Anxiety: What\'s Normal', type: 'Resource', readTime: '5 min read', tag: 'Support' },
  { title: 'Mindfulness for Students', type: 'Guide', readTime: '3 min read', tag: 'Wellbeing' },
]

const SUPPORT_LINES = [
  { name: 'Samaritans Ireland', number: '116 123', hours: '24/7', color: '#EFF6FF' },
  { name: 'Niteline', number: '1800 793 793', hours: 'Term nights', color: '#F0FDF4' },
  { name: 'SpunOut', number: 'spunout.ie', hours: 'Online', color: '#FFF7ED' },
]

const BUDGET_TOOLS = [
  { title: 'Student Budget Calculator',  sub: 'Plan rent, food, transport and more', icon: PiggyBank, color: '#EFF6FF' },
  { title: 'SUSI Grant Guide',           sub: 'Check eligibility and application steps', icon: Tag, color: '#F0FDF4' },
  { title: 'Part-Time Work Finder',      sub: 'Flexible roles near your campus', icon: ShoppingBag, color: '#FFF7ED' },
]

const DISCOUNT_CATEGORIES = [
  { label: 'Food & Drink',    count: 3,  color: '#FFF7ED', icon: '🍕' },
  { label: 'Fitness & Sport', count: 2,  color: '#FEF9C3', icon: '🏋️' },
  { label: 'Creative',        count: 1,  color: '#FDF4FF', icon: '🎬' },
  { label: 'Car Services',    count: 2,  color: '#EFF6FF', icon: '🚗' },
  { label: 'Marketing',       count: 1,  color: '#F0FDF4', icon: '📱' },
  { label: 'Education',       count: 1,  color: '#F0F9FF', icon: '📚' },
  { label: 'Beauty',          count: 1,  color: '#FDF4FF', icon: '✨' },
  { label: 'More coming',     count: null, color: '#F5F0E8', icon: '🔒' },
]

export default function LifestyleScreen() {
  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>LIFESTYLE</Text>
          <Text style={styles.heroTitle}>Lifestyle Blueprint</Text>
          <Text style={styles.heroSub}>
            Deals, wellbeing, and money tools — built around what student life actually costs.
          </Text>
        </View>

        {/* ── Featured Deals ── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Exclusive Savings" title="Featured Deals" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
            {DEALS.map(deal => (
              <TouchableOpacity key={deal.brand} activeOpacity={0.8}>
                <View style={[styles.dealCard, { backgroundColor: deal.color }]}>
                  <View style={styles.dealIconBox}>
                    <Text style={styles.dealIconText}>{deal.brand.charAt(0)}</Text>
                  </View>
                  <Text style={styles.dealBrand}>{deal.brand}</Text>
                  <Text style={styles.dealDiscount}>{deal.discount}</Text>
                  <View style={styles.dealCategoryBadge}>
                    <Text style={styles.dealCategoryText}>{deal.category}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Mental Health & Wellbeing ── */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Student Wellbeing" title="Mental Health & Support" />

          {/* Emergency support bar */}
          <View style={styles.supportBanner}>
            <Heart size={16} color={colors.cream} fill={colors.cream} />
            <Text style={styles.supportBannerText}>
              Need to talk? Free, confidential support is available 24/7.
            </Text>
          </View>

          {/* Support lines */}
          <View style={{ gap: 10, marginTop: spacing.md }}>
            {SUPPORT_LINES.map(line => (
              <Card key={line.name} style={[styles.supportCard, { backgroundColor: line.color }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportName}>{line.name}</Text>
                  <Text style={styles.supportHours}>{line.hours}</Text>
                </View>
                <Text style={styles.supportNumber}>{line.number}</Text>
              </Card>
            ))}
          </View>

          {/* Wellbeing articles */}
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

          {/* Budget tip card */}
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
                  <Text style={styles.discountCount}>{cat.count} deals</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Browse All Deals</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    width: 130, borderRadius: radius.card,
    padding: 14, marginRight: 12, alignItems: 'center',
  },
  dealIconBox: {
    width: 48, height: 48, borderRadius: radius.circle,
    backgroundColor: 'rgba(30,58,95,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  dealIconText: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy },
  dealBrand: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textAlign: 'center' },
  dealDiscount: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.navy, marginTop: 4, textAlign: 'center' },
  dealCategoryBadge: {
    backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 8,
  },
  dealCategoryText: { fontFamily: fonts.sans, fontSize: 10, color: colors.navy },

  supportBanner: {
    backgroundColor: '#DC2626', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14,
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
})
