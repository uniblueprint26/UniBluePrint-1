import { useState, useEffect, useRef, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform, Linking, Alert,
  Animated, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Plus, X, Globe, Building2, BookOpen,
  Wrench, Sparkles, Dumbbell, Camera, Activity,
  ChevronRight, ChevronLeft, Megaphone, Mail,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import ImageUploader from '../components/ui/ImageUploader'
import { supabase } from '../lib/supabase'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

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
      'September trial, every Foundation Blueprint service at half price. CV, LinkedIn, cover letter and more.',
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
      'Match with people on your route and split the cost every day.',
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
      'Share and discover notes across every Irish university and college. Search by module and course.',
    link: null,
  },
]

// ── Post Ad Modal ─────────────────────────────────────────────────────────────
// Image upload notes:
//   - Image is uploaded to the ad-images bucket at {userId}/{timestamp}.jpg
//     before form submission. The returned public URL is stored in ads.image_url.
//   - storagePath is computed once per modal open (timestamp locked in) so
//     the same path is used whether the user picks/re-picks before submitting.
//   - If the user cancels without submitting, the uploaded image becomes an
//     orphan in storage. This is acceptable for V1; admin cleanup or a
//     scheduled function can prune unlinked images later.
//
// Insert fixes applied here:
//   - 'link' → 'target_url'  (was sending a column that doesn't exist in ads)
//   - 'boards' column added to ads via migration 20260805100000_image_storage.sql
//   - 'status' column added to ads via same migration
//   - 'active: false', newly submitted ads are pending review, not live
//   - 'user_id', required by the new RLS INSERT policy

function PostAdModal({ visible, onClose }) {
  const { user }                        = useAuth()
  const [title,       setTitle]         = useState('')
  const [description, setDescription]   = useState('')
  const [link,        setLink]          = useState('')
  const [boards,      setBoards]        = useState([])
  const [submitting,  setSubmitting]    = useState(false)
  const [imageUrl,    setImageUrl]      = useState(null)
  const [adImagePath, setAdImagePath]   = useState(null)

  // Generate a fresh storage path each time the modal opens so every
  // submission gets a unique filename (avoids cross-submission collisions)
  useEffect(() => {
    if (visible && user?.id) {
      setAdImagePath(`${user.id}/${Date.now()}.jpg`)
      setImageUrl(null)
    }
  }, [visible, user?.id])

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
        user_id:     user?.id,
        title:       title.trim(),
        description: description.trim(),
        target_url:  link.trim() || null,
        boards,
        status:      'pending_review',
        active:      false,
        image_url:   imageUrl || null,
      })
    } catch {}
    finally {
      setTitle(''); setDescription(''); setLink(''); setBoards([])
      setImageUrl(null)
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
              <Text style={m.headerSub}>Reach young people across Ireland</Text>
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
              placeholder="e.g. Photography Sessions, €90 per shoot"
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

            {/* Ad image (optional) */}
            <Text style={[m.label, { marginTop: 20 }]}>Image (optional)</Text>
            <Text style={m.boardHint}>
              Add a photo to make your ad stand out. JPG, PNG, or WebP, under 5 MB.
            </Text>
            {adImagePath && (
              <ImageUploader
                bucket="ad-images"
                storagePath={adImagePath}
                currentUrl={null}
                onUpload={url => setImageUrl(url)}
                label=""
                size={80}
              />
            )}

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
                          ? 'Visible to all users across Ireland'
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

// ── Magazine data ─────────────────────────────────────────────────────────────
// Built from the real board/ad data above — cover, contents, one section per
// board (a divider page plus a two-page spread per listing), a post-your-ad
// spread, an advertise-with-us page, credits, and a back cover. Page count
// moves with how many ads exist; it isn't a padded fixed number.

const CROSS_ADS   = ADS.filter(ad => ad.boards.includes('cross-ireland') && ad.type !== 'featured')
const CAMPUS_ADS  = ADS.filter(ad => ad.boards.includes('campus')        && ad.type !== 'featured')
const COURSE_ADS  = ADS.filter(ad => ad.boards.includes('course')        && ad.type !== 'featured')
const FEATURED_AD = ADS.find(ad => ad.type === 'featured')

function buildMagazine() {
  const pages = [{ type: 'cover' }, { type: 'toc', entries: [] }]
  const toc = pages[1]
  const addSpread = ad => { pages.push({ type: 'ad-left', ad }); pages.push({ type: 'ad-right', ad }) }

  toc.entries.push({ label: 'Cross-Ireland', Icon: Globe, page: pages.length })
  pages.push({ type: 'divider', board: BOARDS[0], count: CROSS_ADS.length + (FEATURED_AD ? 1 : 0) })
  if (FEATURED_AD) addSpread(FEATURED_AD)
  CROSS_ADS.forEach(addSpread)

  toc.entries.push({ label: 'Campus Connect', Icon: Building2, page: pages.length })
  pages.push({ type: 'divider', board: BOARDS[1], count: CAMPUS_ADS.length })
  CAMPUS_ADS.forEach(addSpread)

  toc.entries.push({ label: 'Course Connect', Icon: BookOpen, page: pages.length })
  pages.push({ type: 'divider', board: BOARDS[2], count: COURSE_ADS.length })
  COURSE_ADS.forEach(addSpread)

  toc.entries.push({ label: 'Post Your Ad', Icon: Megaphone, page: pages.length })
  pages.push({ type: 'post-left' })
  pages.push({ type: 'post-right' })

  toc.entries.push({ label: 'Advertise With Us', Icon: Mail, page: pages.length })
  pages.push({ type: 'advertise' })

  pages.push({ type: 'credits' })
  pages.push({ type: 'back-cover' })
  return pages
}

const MAGAZINE = buildMagazine()
const { width: SCREEN_W } = Dimensions.get('window')

function getAdPressHandler(ad, navigation) {
  if (ad.id === 'ubp_promo') {
    return () => navigation.getParent()?.navigate('Home', {
      screen: 'Foundation',
    })
  }
  if (ad.id === 'campus_carpool') {
    return () => navigation.navigate('ChatRoom', {
      contextType: 'ad',
      contextId:   'campus_carpool',
      roomName:    'Campus Carpool',
      subtitle:    'Find your carpool match and coordinate your route',
    })
  }
  if (ad.id === 'course_notes') {
    return () => navigation.navigate('ChatRoom', {
      contextType: 'ad',
      contextId:   'course_notes',
      roomName:    'Course Notes',
      subtitle:    'Share and find notes across Ireland',
    })
  }
  if (ad.link) {
    return () => Linking.openURL(ad.link)
  }
  // Partner ads with no direct link (e.g. in-person-only sign-up): surface
  // the offer plus a real next step, instead of a dead-end repeat of the description.
  return () => Alert.alert(
    ad.brand,
    `${ad.description}\n\nNo direct booking link for this one yet — message the UniBlueprint team and we'll connect you.`,
    [
      { text: 'Message the team', onPress: () => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Interested in: ' + ad.brand)) },
      { text: 'Close', style: 'cancel' },
    ],
  )
}

// ── Page content ──────────────────────────────────────────────────────────────

function PageContent({ page, navigation, onJump, onOpenPost }) {
  switch (page.type) {
    case 'cover':
      return (
        <View style={[styles.pageInner, styles.coverPage]}>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>THIS TERM · ISSUE 1</Text>
          </View>
          <View style={{ flex: 1 }} />
          <UBPLogo height={30} color={colors.cream} />
          <Text style={styles.coverTitle}>The{'\n'}Advertisement{'\n'}Board</Text>
          <Text style={styles.coverSub}>
            Partner offers, services, and student listings from across Ireland.
          </Text>
          <View style={{ flex: 1 }} />
          <View style={styles.coverSwipeHint}>
            <Text style={styles.coverSwipeText}>Swipe to open</Text>
            <ChevronRight size={13} color="rgba(245,240,232,0.6)" />
          </View>
        </View>
      )

    case 'toc':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>CONTENTS</Text>
          <Text style={styles.pageHeading}>What's inside this issue</Text>
          <View style={{ gap: 2, marginTop: 26 }}>
            {page.entries.map(e => (
              <TouchableOpacity
                key={e.label}
                style={styles.tocRow}
                activeOpacity={0.7}
                onPress={() => onJump(e.page)}
              >
                <View style={styles.tocIconBox}><e.Icon size={15} color={colors.navy} /></View>
                <Text style={styles.tocLabel} numberOfLines={1}>{e.label}</Text>
                <Text style={styles.tocPageNum}>{e.page + 1}</Text>
                <ChevronRight size={13} color={colors.light} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.tocHint}>Tap a section to jump straight there — no need to flip through.</Text>
        </View>
      )

    case 'divider': {
      const b = page.board
      return (
        <View style={[styles.pageInner, styles.dividerPage, { backgroundColor: b.color }]}>
          <View style={{ flex: 1 }} />
          <b.Icon size={38} color="rgba(245,240,232,0.9)" strokeWidth={1.5} />
          <Text style={styles.dividerTitle}>{b.label}</Text>
          <Text style={styles.dividerSub}>{page.count} listing{page.count !== 1 ? 's' : ''} in this section</Text>
          <View style={{ flex: 1 }} />
        </View>
      )
    }

    case 'ad-left': {
      const ad = page.ad
      const cat = ad.category ? CATEGORY[ad.category] : null
      const isFeatured = ad.type === 'featured'
      return (
        <View style={[styles.pageInner, styles.adLeftPage, isFeatured && styles.adLeftPageFeatured]}>
          <View style={{ flex: 1 }} />
          {isFeatured ? (
            <View style={styles.adVisualBadgeFeatured}>
              <UBPLogo height={24} color={colors.cream} />
            </View>
          ) : cat ? (
            <View style={[styles.adVisualBadge, { backgroundColor: cat.bg }]}>
              <cat.Icon size={32} color={cat.color} strokeWidth={1.5} />
            </View>
          ) : null}
          <Text style={[styles.adVisualBrand, isFeatured && { color: 'rgba(245,240,232,0.6)' }]}>
            {ad.brand}
          </Text>
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[styles.adPageFold, isFeatured && { color: 'rgba(245,240,232,0.25)' }]}>
            {ad.boards.map(b => BOARDS.find(x => x.key === b)?.label).filter(Boolean).join(' · ')}
          </Text>
        </View>
      )
    }

    case 'ad-right': {
      const ad = page.ad
      const isFeatured = ad.type === 'featured'
      return (
        <View style={[styles.pageInner, isFeatured && styles.adRightPageFeatured]}>
          <Text style={[styles.pageKicker, isFeatured && { color: 'rgba(245,240,232,0.5)' }]}>
            {isFeatured ? 'UNIBLUEPRINT' : (ad.category || 'LISTING')}
          </Text>
          <Text style={[styles.adRightTitle, isFeatured && { color: colors.cream }]}>{ad.title}</Text>
          <Text style={[styles.adRightDesc, isFeatured && { color: 'rgba(245,240,232,0.75)' }]}>
            {ad.description}
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.adRightCta, isFeatured && styles.adRightCtaFeatured]}
            activeOpacity={0.85}
            onPress={getAdPressHandler(ad, navigation)}
          >
            <Text style={[styles.adRightCtaText, isFeatured && { color: colors.navy }]}>
              {isFeatured ? 'See the offer' : 'Get in touch'}
            </Text>
            <ChevronRight size={14} color={isFeatured ? colors.navy : colors.cream} />
          </TouchableOpacity>
        </View>
      )
    }

    case 'post-left':
      return (
        <View style={[styles.pageInner, styles.postPage]}>
          <View style={{ flex: 1 }} />
          <Megaphone size={36} color={colors.cream} strokeWidth={1.5} />
          <Text style={styles.postPageTitle}>Got something{'\n'}to advertise?</Text>
          <View style={{ flex: 1 }} />
        </View>
      )

    case 'post-right':
      return (
        <View style={[styles.pageInner, styles.postPage]}>
          <View style={{ flex: 1 }} />
          <Text style={styles.postPageBody}>
            Reach students across Ireland, your service, your event, your business. Every submission is reviewed by the UniBlueprint team before it goes live.
          </Text>
          <TouchableOpacity style={styles.postPageCta} activeOpacity={0.85} onPress={onOpenPost}>
            <Plus size={15} color={colors.navy} strokeWidth={2.5} />
            <Text style={styles.postPageCtaText}>Post an Ad</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
      )

    case 'advertise':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>ADVERTISE WITH US</Text>
          <Text style={styles.pageHeading}>Why partners advertise here</Text>
          <View style={{ gap: 16, marginTop: 22 }}>
            {[
              'Direct reach to students across every Irish college and campus.',
              'Every ad is reviewed by the UniBlueprint team, so listings stay trustworthy.',
              'Choose exactly where you appear: Cross-Ireland, Campus Connect, or Course Connect.',
            ].map((line, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>
      )

    case 'credits':
      return (
        <View style={[styles.pageInner, { alignItems: 'center', justifyContent: 'center' }]}>
          <UBPLogo height={24} color={colors.navy} />
          <Text style={styles.creditsText}>Published in-app by UniBlueprint.{'\n'}Updated every term.</Text>
        </View>
      )

    case 'back-cover':
      return (
        <View style={[styles.pageInner, styles.coverPage]}>
          <View style={{ flex: 1 }} />
          <UBPLogo height={28} color={colors.cream} />
          <Text style={styles.backCoverText}>See you next issue.</Text>
          <View style={{ flex: 1 }} />
        </View>
      )

    default:
      return null
  }
}

// ── Page wrapper — the turn animation ─────────────────────────────────────────
// No page-curl library is installed, and adding one now risks breaking the
// native module set Expo Go already has loaded. This uses only core
// Animated transforms (rotateY / scale / opacity, all native-driver safe) to
// give neighbouring pages a subtle turning-away feel as you swipe, rather
// than true paper-curl physics.

function MagazinePage({ page, index, scrollX, navigation, onJump, onOpenPost }) {
  const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W]
  const rotateY = scrollX.interpolate({ inputRange, outputRange: ['6deg', '0deg', '-6deg'], extrapolate: 'clamp' })
  const scale   = scrollX.interpolate({ inputRange, outputRange: [0.95, 1, 0.95], extrapolate: 'clamp' })
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.75, 1, 0.75], extrapolate: 'clamp' })

  return (
    <Animated.View style={[styles.page, { transform: [{ perspective: 900 }, { rotateY }, { scale }], opacity }]}>
      <PageContent page={page} navigation={navigation} onJump={onJump} onOpenPost={onOpenPost} />
    </Animated.View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AdBoardScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [modalVisible, setModalVisible] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const scrollRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const postPageIndex = useMemo(() => MAGAZINE.findIndex(p => p.type === 'post-right'), [])

  function jumpTo(index) {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <UBPLogo height={24} color={colors.cream} />
        <Text style={styles.topBarPageNum}>{pageIndex + 1} / {MAGAZINE.length}</Text>
        <TouchableOpacity style={styles.postBtn} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Plus size={14} color={colors.navy} strokeWidth={2.5} />
          <Text style={styles.postBtnText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Pages */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: e => setPageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)) },
        )}
      >
        {MAGAZINE.map((page, i) => (
          <MagazinePage
            key={i}
            page={page}
            index={i}
            scrollX={scrollX}
            navigation={navigation}
            onJump={jumpTo}
            onOpenPost={() => jumpTo(postPageIndex)}
          />
        ))}
      </Animated.ScrollView>

      {/* Prev / next + progress */}
      <View style={[styles.pagerControls, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.pagerBtn}
          activeOpacity={0.7}
          onPress={() => jumpTo(Math.max(0, pageIndex - 1))}
          disabled={pageIndex === 0}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={18} color={pageIndex === 0 ? colors.light : colors.navy} />
        </TouchableOpacity>
        <View style={styles.pagerTrack}>
          <View style={[styles.pagerFill, { width: `${((pageIndex + 1) / MAGAZINE.length) * 100}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.pagerBtn}
          activeOpacity={0.7}
          onPress={() => jumpTo(Math.min(MAGAZINE.length - 1, pageIndex + 1))}
          disabled={pageIndex === MAGAZINE.length - 1}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={18} color={pageIndex === MAGAZINE.length - 1 ? colors.light : colors.navy} />
        </TouchableOpacity>
      </View>

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
    paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  topBarPageNum: {
    fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.5)',
    fontVariant: ['tabular-nums'],
  },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.navy },

  // Page frame
  page: { width: SCREEN_W, flex: 1 },
  pageInner: {
    flex: 1, backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl,
  },
  pageKicker: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  pageHeading: {
    fontFamily: fonts.serif, fontSize: 26, color: colors.navy, marginTop: 8, lineHeight: 33,
  },

  // Cover / back cover
  coverPage: { backgroundColor: colors.navy, alignItems: 'flex-start' },
  coverBadge: {
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.3)', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  coverBadgeText: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.7)', letterSpacing: 1,
  },
  coverTitle: {
    fontFamily: fonts.serif, fontSize: 40, color: colors.cream, marginTop: 18, lineHeight: 46,
  },
  coverSub: {
    fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.6)', marginTop: 14, lineHeight: 21, maxWidth: '86%',
  },
  coverSwipeHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coverSwipeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
  backCoverText: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.6)', marginTop: 12 },

  // Table of contents
  tocRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
  },
  tocIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tocLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, flex: 1 },
  tocPageNum: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, fontVariant: ['tabular-nums'] },
  tocHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 20, lineHeight: 17, fontStyle: 'italic' },

  // Section divider
  dividerPage: { alignItems: 'center' },
  dividerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginTop: 16, textAlign: 'center' },
  dividerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.6)', marginTop: 6 },

  // Ad spread — left (visual)
  adLeftPage: { alignItems: 'center' },
  adLeftPageFeatured: { backgroundColor: colors.navy },
  adVisualBadge: {
    width: 76, height: 76, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  adVisualBadgeFeatured: {
    width: 76, height: 76, borderRadius: 18, backgroundColor: 'rgba(245,240,232,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  adVisualBrand: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginTop: 16, textAlign: 'center',
  },
  adPageFold: { fontFamily: fonts.sans, fontSize: 10, color: colors.light, letterSpacing: 0.4 },

  // Ad spread — right (copy)
  adRightPageFeatured: { backgroundColor: colors.navy },
  adRightTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy, marginTop: 8, lineHeight: 30 },
  adRightDesc: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 12, lineHeight: 21 },
  adRightCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 13, alignSelf: 'stretch',
  },
  adRightCtaFeatured: { backgroundColor: colors.cream },
  adRightCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  featuredBadge: {
    marginTop: 10,
    backgroundColor: '#F59E0B', borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  featuredBadgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.white, letterSpacing: 0.5 },

  // Post-an-ad spread
  postPage: { backgroundColor: colors.navy, alignItems: 'center' },
  postPageTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, marginTop: 14, textAlign: 'center', lineHeight: 32 },
  postPageBody: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.7)', textAlign: 'center', lineHeight: 21 },
  postPageCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 20, paddingVertical: 13, marginTop: 20,
  },
  postPageCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  // Advertise-with-us
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.navy, marginTop: 7, flexShrink: 0 },
  bulletText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, flex: 1, lineHeight: 21 },

  // Credits
  creditsText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12, textAlign: 'center', lineHeight: 19 },

  // Pager controls
  pagerControls: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingTop: 12,
    backgroundColor: colors.cream,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  pagerBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pagerTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(30,58,95,0.1)', overflow: 'hidden' },
  pagerFill: { height: 4, borderRadius: 2, backgroundColor: colors.navy },
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
