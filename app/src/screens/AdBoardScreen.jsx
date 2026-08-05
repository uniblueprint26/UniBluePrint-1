import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform, Linking, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Plus, X, Globe, Building2, BookOpen,
  Wrench, Sparkles, Dumbbell, Camera, Activity,
  ChevronRight,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import { supabase } from '../lib/supabase'
import { colors, fonts, spacing, radius } from '../constants/theme'

// ── Board config ──────────────────────────────────────────────────────────────

const BOARDS = [
  { key: 'cross-ireland', label: 'Cross-Ireland',  Icon: Globe,      color: colors.navy  },
  { key: 'campus',        label: 'Campus Connect', Icon: Building2,  color: '#B45309'    },
  { key: 'course',        label: 'Course Connect', Icon: BookOpen,   color: '#0369A1'    },
]

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY = {
  'Automotive': { Icon: Wrench,    color: '#1d4ed8', bg: '#EFF6FF' },
  'Beauty':     { Icon: Sparkles,  color: '#86198F', bg: '#FDF4FF' },
  'Fitness':    { Icon: Dumbbell,  color: '#15803D', bg: '#F0FDF4' },
  'Creative':   { Icon: Camera,    color: '#C2410C', bg: '#FFF7ED' },
  'Gym':        { Icon: Activity,  color: '#0369A1', bg: '#F0F9FF' },
  'Campus':     { Icon: Building2, color: '#B45309', bg: '#FEF3C7' },
  'Course':     { Icon: BookOpen,  color: '#1E3A5F', bg: '#F5F0E8' },
}

// ── Ads data ──────────────────────────────────────────────────────────────────

const ADS = [
  {
    id: 'ubp_promo',
    type: 'featured',
    boards: ['cross-ireland', 'campus', 'course'],
    category: null,
    brand: 'UniBlueprint',
    title: '50% Off Your First Service',
    description:
      'September trial — every Foundation Blueprint service at half price. CV, LinkedIn, cover letter and more.',
    link: null,
  },
  {
    id: 'whip_wizardz',
    type: 'partner',
    boards: ['cross-ireland'],
    category: 'Automotive',
    brand: 'Whip Wizardz',
    title: 'Car Sales and Services',
    description:
      'Vehicle sales, sourcing, inspections, repairs and detailing. Jonesborough, near Dundalk. Book via WhatsApp.',
    link: null,
  },
  {
    id: 'nail_nurse',
    type: 'partner',
    boards: ['cross-ireland'],
    category: 'Beauty',
    brand: 'The Nail Nurse',
    title: 'Nail and Beauty Services',
    description:
      'Acrylic full sets from €25. Gel polish from €6. Galway. Student discount with valid ID. DM @theenailnurse__',
    link: null,
  },
  {
    id: 'jmc_fitness',
    type: 'partner',
    boards: ['cross-ireland'],
    category: 'Fitness',
    brand: 'JMC Fitness',
    title: 'Elite Sports Coaching',
    description:
      '12-week plan €300. In-person sessions €50 per hour. North Dublin 4G Astro. Analytics Breakdown €100.',
    link: null,
  },
  {
    id: 'nyz3ditz',
    type: 'partner',
    boards: ['cross-ireland'],
    category: 'Creative',
    brand: 'Nyz3ditz',
    title: 'Photography and Video Mentorship',
    description:
      'Monthly mentorship €55 per month. One-to-one shoot session €90. WhatsApp +353 85 7272 875. @Nyz3ditz',
    link: null,
  },
  {
    id: 'energie',
    type: 'partner',
    boards: ['cross-ireland'],
    category: 'Gym',
    brand: 'Energie Fitness',
    title: 'Student Gym Membership',
    description:
      '€37.99 per month (standard €39.99 to €44.99). €15 joining fee. Mon to Fri 6am to 10pm. Sat to Sun 9am to 5pm.',
    link: null,
  },
  {
    id: 'campus_carpool',
    type: 'internal',
    boards: ['campus'],
    category: 'Campus',
    brand: 'Campus Connect',
    title: 'Find Your Campus Carpool',
    description:
      'Match with students on your route and split the cost every day.',
    link: null,
  },
  {
    id: 'course_notes',
    type: 'internal',
    boards: ['course'],
    category: 'Course',
    brand: 'Course Connect',
    title: 'Share Notes Across Ireland',
    description:
      'Over 1,200 notes uploaded by students. Search by module and university.',
    link: null,
  },
]

// ── Filter config ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',           label: 'All' },
  { key: 'cross-ireland', label: 'Cross-Ireland' },
  { key: 'campus',        label: 'Campus Connect' },
  { key: 'course',        label: 'Course Connect' },
]

// ── Ad Card ───────────────────────────────────────────────────────────────────

function AdCard({ ad, onPress }) {
  const isFeatured = ad.type === 'featured'
  const cat        = ad.category ? CATEGORY[ad.category] : null

  const titleClr  = isFeatured ? colors.cream              : colors.navy
  const descClr   = isFeatured ? 'rgba(245,240,232,0.65)'  : colors.muted
  const brandClr  = isFeatured ? 'rgba(245,240,232,0.48)'  : colors.light

  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.cardWrap} onPress={onPress}>
      <Card style={[styles.adCard, isFeatured && styles.adCardFeatured]}>

        {/* Icon + brand row */}
        <View style={styles.adHeader}>
          {isFeatured ? (
            <View style={styles.logoWrap}>
              <UBPLogo height={18} color={colors.cream} />
            </View>
          ) : cat ? (
            <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
              <cat.Icon size={18} color={cat.color} strokeWidth={1.8} />
            </View>
          ) : null}

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.adBrand, { color: brandClr }]} numberOfLines={1}>
              {ad.brand}
            </Text>
            {isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.adTitle, { color: titleClr }]}>{ad.title}</Text>

        {/* Description */}
        <Text style={[styles.adDesc, { color: descClr }]} numberOfLines={3}>
          {ad.description}
        </Text>

        {/* Footer: board pills + arrow */}
        <View style={styles.adFooter}>
          <View style={styles.boardPills}>
            {ad.boards.map(b => {
              const board  = BOARDS.find(x => x.key === b)
              if (!board) return null
              const pillBg  = isFeatured ? 'rgba(245,240,232,0.1)'  : 'rgba(30,58,95,0.05)'
              const pillClr = isFeatured ? 'rgba(245,240,232,0.65)' : colors.muted
              return (
                <View key={b} style={[styles.boardPill, { backgroundColor: pillBg }]}>
                  <board.Icon size={9} color={pillClr} strokeWidth={2} />
                  <Text style={[styles.boardPillText, { color: pillClr }]}>{board.label}</Text>
                </View>
              )
            })}
          </View>
          <ChevronRight size={15} color={isFeatured ? 'rgba(245,240,232,0.35)' : colors.light} />
        </View>

      </Card>
    </TouchableOpacity>
  )
}

// ── Post Ad Modal ─────────────────────────────────────────────────────────────

function PostAdModal({ visible, onClose }) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [link,        setLink]        = useState('')
  const [boards,      setBoards]      = useState([])
  const [submitting,  setSubmitting]  = useState(false)

  function toggleBoard(key) {
    setBoards(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      await supabase.from('ads').insert({
        title:       title.trim(),
        description: description.trim(),
        link:        link.trim() || null,
        boards,
        status:      'pending_review',
      })
    } catch {}
    finally {
      setTitle(''); setDescription(''); setLink(''); setBoards([])
      setSubmitting(false)
      onClose()
    }
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && boards.length > 0

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={m.container}>

          {/* Modal header */}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.headerTitle}>Post an Ad</Text>
              <Text style={m.headerSub}>Reach students across Ireland</Text>
            </View>
            <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={15} color={colors.navy} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={m.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* Title */}
            <Text style={m.label}>Ad Title</Text>
            <TextInput
              style={m.input}
              placeholder="e.g. Photography Sessions — €90 per shoot"
              placeholderTextColor={colors.light}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Description */}
            <Text style={[m.label, { marginTop: 20 }]}>Description</Text>
            <TextInput
              style={[m.input, m.textArea]}
              placeholder="Describe your service, pricing, location, and how to get in touch..."
              placeholderTextColor={colors.light}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={m.charCount}>{description.length}/300</Text>

            {/* Link */}
            <Text style={[m.label, { marginTop: 20 }]}>Link (optional)</Text>
            <TextInput
              style={m.input}
              placeholder="https://"
              placeholderTextColor={colors.light}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Board destination */}
            <Text style={[m.label, { marginTop: 24 }]}>Post to</Text>
            <Text style={m.boardHint}>
              Select one or more boards. Your ad will appear wherever you choose.
            </Text>
            <View style={m.boardOptions}>
              {BOARDS.map(b => {
                const active = boards.includes(b.key)
                return (
                  <TouchableOpacity
                    key={b.key}
                    style={[m.boardOption, active && { borderColor: b.color }]}
                    onPress={() => toggleBoard(b.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      m.boardIconBox,
                      { backgroundColor: active ? b.color : 'rgba(30,58,95,0.06)' },
                    ]}>
                      <b.Icon size={15} color={active ? colors.cream : colors.muted} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.boardLabel, active && { color: colors.navy }]}>
                        {b.label}
                      </Text>
                      <Text style={m.boardSub}>
                        {b.key === 'cross-ireland'
                          ? 'Visible to all students across Ireland'
                          : b.key === 'campus'
                          ? 'Visible on the Campus Connect board'
                          : 'Visible on the Course Connect board'}
                      </Text>
                    </View>
                    <View style={[m.checkCircle, active && { backgroundColor: b.color, borderColor: b.color }]}>
                      {active && <View style={m.checkInner} />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[m.submitBtn, (!canSubmit || submitting) && m.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              activeOpacity={0.8}
            >
              <Text style={m.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Ad for Review'}</Text>
            </TouchableOpacity>

            <Text style={m.submitNote}>
              Ads are reviewed by the UniBlueprint team before going live. We'll be in touch within 24 hours.
            </Text>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

function getAdPressHandler(ad, navigation) {
  if (ad.id === 'ubp_promo') {
    return () => navigation.getParent()?.navigate('Home', {
      screen: 'Blueprint', params: { initialTab: 'Foundation' },
    })
  }
  if (ad.id === 'campus_carpool') {
    return () => navigation.getParent()?.navigate('Home', {
      screen: 'Connect', params: { initialTab: 'Campus' },
    })
  }
  if (ad.id === 'course_notes') {
    return () => navigation.getParent()?.navigate('Home', {
      screen: 'Connect', params: { initialTab: 'Course' },
    })
  }
  if (ad.link) {
    return () => Linking.openURL(ad.link)
  }
  // Partner ads with no link: surface description in an alert
  return () => Alert.alert(ad.brand, ad.description)
}

export default function AdBoardScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  const [filter,      setFilter]      = useState('all')
  const [modalVisible, setModalVisible] = useState(false)

  const filtered = ADS.filter(ad =>
    filter === 'all' || ad.boards.includes(filter)
  )

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <UBPLogo height={28} color={colors.cream} />
        <TouchableOpacity
          style={styles.postBtn}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={15} color={colors.navy} strokeWidth={2.5} />
          <Text style={styles.postBtnText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={styles.screenTitle}>Advertisement Board</Text>
        <Text style={styles.screenSub}>
          Partner offers, services, and student listings across Ireland
        </Text>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
        </Text>
        {filtered.map(ad => (
          <AdCard key={ad.id} ad={ad} onPress={getAdPressHandler(ad, navigation)} />
        ))}
      </ScrollView>

      <PostAdModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: 14, paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  headingWrap: {
    paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10,
  },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },

  // Filter pills — identical to Directory
  filterRow: { paddingHorizontal: spacing.md, paddingBottom: 14, gap: 8 },
  filterPill: {
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  filterPillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  filterTextActive: { color: colors.cream },

  scroll:       { paddingHorizontal: spacing.md, paddingTop: 2 },
  resultCount:  { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginBottom: 14 },

  // Ad card
  cardWrap: { marginBottom: 14 },

  adCard: {
    padding: 18,
  },
  adCardFeatured: {
    backgroundColor: colors.navy,
  },

  adHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  iconCircle: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoWrap: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: 'rgba(245,240,232,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  adBrand: {
    fontFamily: fonts.sans, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 4,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B', borderRadius: radius.badge,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  featuredBadgeText: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.white, letterSpacing: 0.5,
  },

  adTitle: {
    fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22, marginBottom: 8,
  },
  adDesc: {
    fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 16,
  },

  adFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  boardPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  boardPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4,
  },
  boardPillText: { fontFamily: fonts.sans, fontSize: 10 },
})

// ── Modal styles ──────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  headerSub:   { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.55)', marginTop: 4 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },

  scroll: { padding: 20, paddingBottom: 60 },

  label: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.button, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
  },
  textArea: { height: 110, paddingTop: 12 },
  charCount: {
    fontFamily: fonts.sans, fontSize: 11, color: colors.light,
    textAlign: 'right', marginTop: 5,
  },

  boardHint: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 12,
  },
  boardOptions: { gap: 10 },
  boardOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.card, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14,
  },
  boardIconBox: {
    width: 38, height: 38, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  boardLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted, marginBottom: 2,
  },
  boardSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, lineHeight: 17 },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cream },

  submitBtn: {
    marginTop: 28,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 15, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },

  submitNote: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.light,
    textAlign: 'center', marginTop: 14, lineHeight: 18,
  },
})
