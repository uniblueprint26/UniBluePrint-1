/**
 * LifestyleWellbeingScreen — one of the 4 standalone Lifestyle destinations
 * (see LifestyleScreen, the hub they're all reached from).
 *
 * Content source: data/mentalHealthSupport.js — 10 categories of genuinely
 * real, individually-verified Irish support services (see that file's own
 * header comment for sourcing). Previously rendered as a long vertical
 * stack of "3 featured + Explore N more" accordions, buried below the
 * partner grid/map and the Budgeting section on one shared scroll. That
 * content hasn't changed here, only the structure: Crisis Support stays
 * always-visible (safety-critical, never worth a tap to reveal), every
 * other category is a tappable tile in a real 2-up grid — icon, accent
 * colour, name, how many services — opening a sheet with that category's
 * full list, rather than one more chunk of an already-long page.
 */
import { useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Modal, Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, X, Heart, Phone, ExternalLink,
  Siren, GraduationCap, LifeBuoy, Utensils, CloudRain, ShieldAlert, UserRound, Sun, MessagesSquare,
  BookOpen, Sparkles, FileText, Clock,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { MENTAL_HEALTH_CATEGORIES } from '../data/mentalHealthSupport'

// Icon + accent per category — crisis kept separate (always-open, its own
// red treatment) from the rest (grid tiles opening a sheet).
const CAT_META = {
  crisis:              { Icon: Siren,          accent: '#DC2626' },
  counselling:         { Icon: MessagesSquare,  accent: '#0369A1' },
  student:             { Icon: GraduationCap,   accent: '#7C3AED' },
  addiction:           { Icon: LifeBuoy,        accent: '#B45309' },
  eating:              { Icon: Utensils,        accent: '#BE185D' },
  bereavement:         { Icon: CloudRain,       accent: '#4B5563' },
  'domestic-violence': { Icon: ShieldAlert,     accent: '#991B1B' },
  mens:                { Icon: UserRound,       accent: '#1D4ED8' },
  womens:              { Icon: UserRound,       accent: '#DB2777' },
  wellbeing:           { Icon: Sun,             accent: '#15803D' },
}

const CRISIS = MENTAL_HEALTH_CATEGORIES.find(c => c.key === 'crisis')
const OTHER_CATEGORIES = MENTAL_HEALTH_CATEGORIES.filter(c => c.key !== 'crisis')

const WELLBEING_RESOURCES = [
  { title: 'Managing Exam Stress',           type: 'Guide',    readTime: '4 min read', Icon: Clock,   accent: '#B45309' },
  { title: 'Sleep & Academic Performance',   type: 'Article',  readTime: '6 min read', Icon: FileText, accent: '#0369A1' },
  { title: "Student Anxiety: What's Normal", type: 'Resource', readTime: '5 min read', Icon: Sparkles, accent: '#7C3AED' },
  { title: 'Mindfulness for Students',       type: 'Guide',    readTime: '3 min read', Icon: BookOpen, accent: '#15803D' },
]

function SupportLineRow({ line, accent, last }) {
  return (
    <TouchableOpacity
      activeOpacity={line.link ? 0.75 : 1}
      onPress={() => line.link && Linking.openURL(line.link)}
      style={[styles.lineRow, !last && styles.lineRowBorder]}
    >
      <View style={[styles.lineAccent, { backgroundColor: accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.lineName}>{line.name}</Text>
        <Text style={styles.lineHours}>{line.hours}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.lineNumber}>{line.number}</Text>
        {line.link?.startsWith('tel:') || line.link?.startsWith('sms:') ? (
          <Phone size={11} color={colors.muted} style={{ marginTop: 3 }} />
        ) : line.link ? (
          <ExternalLink size={11} color={colors.muted} style={{ marginTop: 3 }} />
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

// Category tile — a real grid cell (icon, accent wash, name, count), not a
// list row: tapping opens CategorySheet below with the full list.
function CategoryTile({ category, onPress }) {
  const meta = CAT_META[category.key] || { Icon: Heart, accent: colors.navy }
  return (
    <TouchableOpacity style={styles.catTile} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.catTileIcon, { backgroundColor: `${meta.accent}16` }]}>
        <meta.Icon size={20} color={meta.accent} strokeWidth={2} />
      </View>
      <Text style={styles.catTileLabel} numberOfLines={2}>{category.label}</Text>
      <Text style={styles.catTileCount}>{category.items.length} services</Text>
    </TouchableOpacity>
  )
}

// Category detail sheet — same Modal/Pressable bottom-sheet recipe as
// PartnerDetailSheet (components/lifestyle/PartnerCards.jsx), including its
// bottom safe-area padding fix, so a long category list never sits flush
// against — or under — a device's home indicator / gesture bar.
function CategorySheet({ category, visible, onClose }) {
  const insets = useSafeAreaInsets()
  if (!category) return null
  const meta = CAT_META[category.key] || { Icon: Heart, accent: colors.navy }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <TouchableOpacity style={styles.sheetCloseBtn} onPress={onClose} activeOpacity={0.75} accessibilityLabel="Close">
            <X size={16} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.sheetHeaderRow}>
            <View style={[styles.sheetHeaderIcon, { backgroundColor: `${meta.accent}16` }]}>
              <meta.Icon size={18} color={meta.accent} strokeWidth={2} />
            </View>
            <Text style={styles.sheetTitle}>{category.label}</Text>
          </View>

          <ScrollView
            style={{ flex: 1, marginTop: 10 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.sheetListCard}>
              {category.items.map((line, i) => (
                <SupportLineRow key={line.name} line={line} accent={meta.accent} last={i === category.items.length - 1} />
              ))}
            </Card>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default function LifestyleWellbeingScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [openCategoryKey, setOpenCategoryKey] = useState(null)
  const openCategory = OTHER_CATEGORIES.find(c => c.key === openCategoryKey) || null

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Integrated header + hero ── */}
        <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>Home</Text>
            </TouchableOpacity>
            <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
            <View style={{ width: 70 }} />
          </View>

          <Text style={styles.heroEyebrow}>LIFESTYLE · WELLBEING</Text>
          <Text style={styles.heroTitle}>Wellbeing</Text>
          <Text style={styles.heroSub}>
            Real, verified Irish support services, organised so you can actually find what you need,
            not one long list to scroll past.
          </Text>
        </View>

        <View style={styles.content}>

          {/* Crisis Support — always open, never behind a tap. */}
          <View style={styles.crisisBanner}>
            <Siren size={16} color={colors.white} />
            <Text style={styles.crisisBannerText}>
              If you're in crisis or in danger right now, use one of the numbers below or call 999/112.
            </Text>
          </View>
          <Card style={[styles.sheetListCard, { marginTop: 12 }]}>
            {CRISIS.items.map((line, i) => (
              <SupportLineRow key={line.name} line={line} accent="#DC2626" last={i === CRISIS.items.length - 1} />
            ))}
          </Card>

          {/* Category grid */}
          <SectionHeader eyebrow="Browse by category" title="Find the right support" style={{ marginTop: spacing.xl }} />
          <View style={styles.catGrid}>
            {OTHER_CATEGORIES.map(category => (
              <CategoryTile key={category.key} category={category} onPress={() => setOpenCategoryKey(category.key)} />
            ))}
          </View>

          {/* Wellbeing Reads */}
          <SectionHeader eyebrow="Resources" title="Wellbeing Reads" style={{ marginTop: spacing.xl }} />
          <View style={styles.readsGrid}>
            {WELLBEING_RESOURCES.map((r, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => Linking.openURL('https://spunout.ie')} style={styles.readTile}>
                <View style={[styles.readIconWrap, { backgroundColor: `${r.accent}16` }]}>
                  <r.Icon size={16} color={r.accent} strokeWidth={2} />
                </View>
                <Text style={styles.readTitle} numberOfLines={2}>{r.title}</Text>
                <View style={styles.readMetaRow}>
                  <Text style={styles.readMeta}>{r.type} · {r.readTime}</Text>
                  <ChevronRight size={12} color={colors.light} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <CategorySheet category={openCategory} visible={!!openCategory} onClose={() => setOpenCategoryKey(null)} />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },

  scrollView: { flex: 1 },
  scroll: {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  crisisBanner: {
    backgroundColor: '#DC2626', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  crisisBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.white, flex: 1, lineHeight: 19 },

  // Shared list-card recipe: used both for the always-open Crisis card and
  // inside CategorySheet for whichever category is open.
  sheetListCard: { padding: 0, overflow: 'hidden' },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingRight: 4 },
  lineRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)' },
  lineAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 4 },
  lineName:   { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy },
  lineHours:  { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  lineNumber: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  // Category grid — real 2-up tiles, not a list.
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: {
    width: '48%', backgroundColor: colors.white, borderRadius: radius.card,
    padding: 14, ...shadows.card,
  },
  catTileIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  catTileLabel: { fontFamily: fonts.serif, fontSize: 14.5, color: colors.navy, lineHeight: 18 },
  catTileCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 4 },

  // Category detail sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card + 4, borderTopRightRadius: radius.card + 4,
    paddingHorizontal: 18, paddingTop: 12, maxHeight: '85%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(30,58,95,0.15)', alignSelf: 'center', marginBottom: 14 },
  sheetCloseBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 1,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 34 },
  sheetHeaderIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, flex: 1 },

  // Wellbeing Reads — a real 2-up grid, not a list of rows.
  readsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  readTile: {
    width: '48%', backgroundColor: colors.white, borderRadius: radius.card,
    padding: 14, ...shadows.card,
  },
  readIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  readTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.navy, lineHeight: 17 },
  readMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  readMeta: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, flexShrink: 1 },
})
