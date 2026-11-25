import { useEffect, useState, useCallback } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking,
  Image, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import {
  ChevronLeft, ChevronRight, MapPin, AtSign, Mail, Phone, Link2, User, X, Send, Star,
  CalendarClock, Lock, ExternalLink,
} from 'lucide-react-native'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { WEBSITE_LINKS } from '../constants/site'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { coachSlug } from './ElevationScreen'
import AppHeader from '../components/ui/AppHeader'
import { PILLARS } from '../constants/pillars'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import SharePrompt from '../components/feed/SharePrompt'
import Button from '../components/ui/Button'
import ProUpgradeGate from '../components/ui/ProUpgradeGate'
import { coachBookingUrl } from '../constants/site'
import { NATIVE_NEUTRAL_BILLING, isRealWorldCoach } from '../constants/platformPolicy'
import { useProAccess } from '../hooks/useProAccess'
import { useComingSoonEnabled } from '../constants/comingSoon'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { fetchActiveIntroCallOffer, introCallLabel } from '../lib/introCallOffers'
import { formatEuro } from '../lib/coachPricing'

// iOS and Android (neutral billing, see constants/platformPolicy.js): in
// person coaching is a real-world service (App Store 3.1.3(e), "goods and
// services outside the app"), not digital content, so "Book a Coach" sends the
// person to the website's booking page (Linking.openURL) instead of the in-app
// CoachBookingScreen flow. That is only done for coaches that are clearly
// delivered in person (isRealWorldCoach). For online, digital or unclear
// coaching there is no booking link and no price list on native, and the
// person can still send a message. Web keeps the in-app booking flow.
const NATIVE_BOOKING_LINK = NATIVE_NEUTRAL_BILLING

// ── Photo gallery ────────────────────────────────────────────────────────────
//
// Sliding, swipe-paged set of a coach's studio/gym photos (e.g. Milan
// Piroska, Tadgh Darcy — see COACHES.gallery in ElevationScreen.jsx). Only
// rendered when a coach actually has a gallery — every other coach's
// profile renders exactly as before. Each frame uses resizeMode 'contain'
// on a fixed aspect-ratio box (not 'cover') so these real portrait studio
// photos are never cropped to fill the slot.
function PhotoGallery({ photos }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [width, setWidth] = useState(0)
  const [index, setIndex] = useState(0)

  if (!photos || photos.length === 0) return null

  function onMomentumEnd(e) {
    if (width === 0) return
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Photos</Text>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumEnd}
              style={styles.galleryScroller}
            >
              {photos.map((photo, i) => (
                <View key={i} style={[styles.galleryFrame, { width }]}>
                  <Image source={photo} style={styles.galleryImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.galleryDots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.galleryDot, i === index && styles.galleryDotActive]} />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  )
}

// ── Pricing & booking lock, for free (non-Pro) users ────────────────────────
// Everything ABOVE pricing (photos, bio, services, gallery) stays fully
// visible to free users, same as before. This wraps just the pricing/booking
// block: the real content renders underneath, visible but blurred (so a free
// user can see there's real structure there, not just a placeholder), with a
// lock card + "Unlock with Elevation Pro" CTA on top. Pro users see the exact
// same children with no wrapper at all.
function ProBlurLock({ isPro, children, onUnlock, styles }) {
  if (isPro) return children
  return (
    <View style={styles.lockWrap}>
      <View pointerEvents="none" style={styles.lockContent}>
        {children}
      </View>
      <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.lockOverlay}>
        <View style={styles.lockIconCircle}>
          <Lock size={19} color="#C9A24B" strokeWidth={2} />
        </View>
        <Text style={styles.lockTitle}>See the real pricing</Text>
        <Text style={styles.lockBody}>
          Pro members see exact rates and book directly with every coach on Elevation.
        </Text>
        {!NATIVE_NEUTRAL_BILLING && (
          <TouchableOpacity style={styles.lockCta} activeOpacity={0.85} onPress={onUnlock}>
            <Text style={styles.lockCtaText}>Unlock with Elevation Pro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ── Link helper ───────────────────────────────────────────────────────────────

function openLink(type, value) {
  if (!value) return
  const urls = {
    instagram: `https://www.instagram.com/${value}`,
    tiktok:    `https://www.tiktok.com/@${value}`,
    linktree:  value,
    email:     `mailto:${value}`,
    phone:     `tel:${value}`,
  }
  Linking.openURL(urls[type])
}

// ── Screen ────────────────────────────────────────────────────────────────────

// ── Booking / Enquiry Modal ─────────────────────────────────────────────────
// Writes a real row to coach_enquiries — Operations/Founder and, if the
// coach is a registered platform user, the coach themself are notified.
// Sits alongside the direct-contact links, not instead of them, since most
// coaches in this listing are not yet registered platform users.

function EnquiryModal({ visible, onClose, coach, userId, onSent, navigation }) {
  const { colors } = useTheme()
  const m = __gs_m(colors)
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [sharePromptText, setSharePromptText] = useState('')
  const [sharePromptDismissed, setSharePromptDismissed] = useState(false)

  async function submit() {
    if (!userId) {
      setErrorMsg('Please sign in to send a booking enquiry.')
      return
    }
    setSending(true)
    setErrorMsg(null)
    try {
      const { error } = await supabase.from('coach_enquiries').insert({
        user_id: userId,
        coach_slug: coachSlug(coach.id),
        coach_name: coach.name,
        message: message.trim() || null,
      })
      if (error) throw error
      setSent(true)
      onSent?.()
      // Best-effort: pick up the coach's own share-prompt copy, if they set
      // one in their Studio profile settings. Silently falls back to the
      // platform default when the coach isn't a linked platform user yet,
      // or hasn't written one.
      supabase
        .from('coach_profiles')
        .select('share_prompt_text')
        .eq('coach_slug', coachSlug(coach.id))
        .maybeSingle()
        .then(({ data }) => setSharePromptText(data?.share_prompt_text || ''))
        .catch(() => {})
    } catch {
      setErrorMsg('Could not send your enquiry. Please try again, or contact the coach directly below.')
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setMessage('')
    setSent(false)
    setErrorMsg(null)
    setSharePromptText('')
    setSharePromptDismissed(false)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={m.backdrop}
      >
        <View style={m.sheet}>
          <View style={m.headerRow}>
            <Text style={m.title}>{sent ? 'Enquiry sent' : `Enquire with ${coach.name}`}</Text>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={{ paddingVertical: 20 }}>
              <Text style={m.sentText}>
                Your enquiry has gone straight to {coach.name} and the UniBlueprint team. They'll follow up with you directly.
              </Text>
              <SharePrompt
                visible={!sharePromptDismissed}
                text={sharePromptText}
                fallbackText={`Just enquired with ${coach.name}, tell your feed about it!`}
                prefill={{
                  initialTab: 'thread',
                  initialMood: 'buzzing',
                  initialText: `Just reached out to ${coach.name} on UniBlueprint 🙌`,
                }}
                onShare={(prefill) => { handleClose(); navigation.navigate('Composer', prefill) }}
                onDismiss={() => setSharePromptDismissed(true)}
              />
              <TouchableOpacity style={m.doneBtn} activeOpacity={0.85} onPress={handleClose}>
                <Text style={m.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={m.sub}>
                Tell {coach.name} a bit about what you're looking for. This goes directly to them and the UniBlueprint team.
              </Text>
              <TextInput
                style={m.input}
                placeholder="e.g. I'd like to enquire about the 8-week package, starting availability..."
                placeholderTextColor={colors.light}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {!!errorMsg && <Text style={m.error}>{errorMsg}</Text>}
              <Button
                label="Send Enquiry"
                icon={Send}
                onPress={submit}
                variant="primary"
                loading={sending}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Rate Coach Modal ─────────────────────────────────────────────────────────
// Writes a real row to coach_ratings — self-initiated (no booking system to
// gate it on, matches the enquire-not-book model), one rating per user per
// coach. onRated tells the parent screen so it can swap the button for a
// "you rated this coach" state without a re-fetch.
function RateCoachModal({ visible, onClose, coach, userId, onRated }) {
  const { colors } = useTheme()
  const m = __gs_m(colors)
  const [stars, setStars]       = useState(0)
  const [comment, setComment]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  async function submit() {
    if (!userId || !stars) return
    setSending(true)
    setErrorMsg(null)
    try {
      const { error } = await supabase.from('coach_ratings').insert({
        coach_slug: coachSlug(coach.id),
        user_id: userId,
        rating: stars,
        comment: comment.trim() || null,
      })
      if (error) throw error
      setSent(true)
      onRated(stars)
    } catch {
      setErrorMsg('Could not save your rating. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setStars(0)
    setComment('')
    setSent(false)
    setErrorMsg(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={m.backdrop}
      >
        <View style={m.sheet}>
          <View style={m.headerRow}>
            <Text style={m.title}>{sent ? 'Thanks for rating' : `Rate ${coach.name}`}</Text>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={{ paddingVertical: 20 }}>
              <Text style={m.sentText}>
                Your rating helps other students choose the right coach.
              </Text>
              <TouchableOpacity style={m.doneBtn} activeOpacity={0.85} onPress={handleClose}>
                <Text style={m.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={m.sub}>How was your experience with {coach.name}?</Text>
              <View style={m.starRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setStars(n)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${n} star${n === 1 ? '' : 's'}`}
                    accessibilityState={{ selected: n <= stars }}
                  >
                    <Star size={32} color="#F59E0B" fill={n <= stars ? '#F59E0B' : 'transparent'} strokeWidth={1.5} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={m.input}
                placeholder="Optional: say a bit more about your experience..."
                placeholderTextColor={colors.light}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {!!errorMsg && <Text style={m.error}>{errorMsg}</Text>}
              <Button
                label="Submit Rating"
                onPress={submit}
                variant="primary"
                loading={sending}
                disabled={!stars}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function __gs_m(colors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 14 },
  starRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 18 },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 100,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
    marginBottom: 12,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginBottom: 10 },
  sentText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, lineHeight: 21, marginBottom: 20 },
  doneBtn: { backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.accentFg },
  })
}

// ── Phase 14 investigation: "View Profile shows nothing" ──────────────────
// Re-verified end to end (Playwright against Expo web, every entry point
// that navigates here — ElevationScreen's card, Budgeting's Investment tab,
// Lifestyle's coach cross-link, the Weekly Blueprint coach spotlight, the
// Home Spotlight carousel — all pass the same full COACHES record from
// ElevationScreen.jsx, never a stripped-down one). Screenshotted six
// coaches spanning the full range of how much data they have, from the
// sparsest (Jayden Reynolds: bio + services + contact, no tagline/quote/
// pricelist) to the richest (Milan Piroska: 7-photo gallery, pricelist,
// package, quote). Every one rendered a complete profile — header, price,
// category, bio, services, contact, and both CTAs — nothing here reproduced
// as empty or broken. Kept as-is rather than rebuilt; see ElevationScreen's
// COACHES for the underlying data every field below reads from.
export default function CoachProfileScreen({ route, navigation }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation)
  // route.params can legitimately be missing entirely — e.g. navigation
  // restoring a persisted stack after a cold start, or any future caller
  // that navigates here without a coach (every current call site passes
  // one, but nothing enforces that) — so this falls back to undefined
  // rather than crashing on destructuring, matching the || {} guard every
  // other params-driven screen in this app already uses (OutputDetailScreen,
  // StudentProfileScreen, TicketDetailScreen, etc.). The `if (!baseCoach)`
  // guard below renders a plain "not found" state instead.
  const { coach: baseCoach } = route.params || {}
  // Elevation is a Pro-only surface (see ElevationScreen.jsx's own comment
  // and docs/business/subscription-pricing-model.md) — gated again here,
  // not just on the ElevationScreen directory, because this screen is also
  // reachable directly (Home Spotlight carousel, the Weekly Blueprint
  // coach spotlight page),
  // bypassing that directory entirely.
  const { canAccess: hasProAccess, loading: proLoading } = useProAccess()
  const comingSoonOn = useComingSoonEnabled()

  // Live self-edited bio/photo, if this coach has a linked coach_profiles
  // row with a coach_slug matching this listing. Falls back to the static
  // listing data when no override exists yet.
  const [override, setOverride] = useState(null)
  // The coach's own self-set intro call offer (Desmond-approved, migration
  // 20261015150000_coach_intro_call_offers.sql), if they've turned one on —
  // null until fetched, and stays null for coaches with none active (the
  // default for every coach). Shown alongside their existing pricelist, not
  // instead of it — see the Pricing section below.
  const [introOffer, setIntroOffer] = useState(null)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [myRating, setMyRating] = useState(null)
  // null while unknown, then true/false. Gates "Rate this coach" on the
  // user having an actual booking or enquiry with this coach — never seeded,
  // never assumed. Re-checked on focus so returning from the new booking
  // flow (or after sending a quick enquiry) unlocks it without a reload.
  const [hasEngaged, setHasEngaged] = useState(null)
  const [tab, setTab] = useState('about')

  useEffect(() => {
    if (!baseCoach) return
    let cancelled = false
    supabase
      .from('coach_profiles')
      .select('bio, photo_url, verified')
      .eq('coach_slug', coachSlug(baseCoach.id))
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setOverride(data) })
    return () => { cancelled = true }
  }, [baseCoach?.id])

  useEffect(() => {
    if (!baseCoach) return
    let cancelled = false
    fetchActiveIntroCallOffer(coachSlug(baseCoach.id)).then(offer => {
      if (!cancelled) setIntroOffer(offer)
    })
    return () => { cancelled = true }
  }, [baseCoach?.id])

  // Has this user already rated this coach? One rating per user per coach
  // (coach_ratings has a unique constraint on coach_slug + user_id).
  useEffect(() => {
    if (!user?.id || !baseCoach) return
    let cancelled = false
    supabase
      .from('coach_ratings')
      .select('rating')
      .eq('coach_slug', coachSlug(baseCoach.id))
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setMyRating(data.rating) })
    return () => { cancelled = true }
  }, [baseCoach?.id, user?.id])

  // Has this user ever booked or enquired with this coach? Checked against
  // both real mechanisms already in the schema — coach_bookings (the new
  // dedicated booking flow) and coach_enquiries (the existing quick-message
  // path) — either one counts as "an actual booking/connection".
  const checkEngagement = useCallback(() => {
    if (!user?.id || !baseCoach) { setHasEngaged(null); return }
    const slug = coachSlug(baseCoach.id)
    Promise.all([
      supabase.from('coach_bookings').select('id').eq('coach_slug', slug).eq('user_id', user.id).limit(1),
      supabase.from('coach_enquiries').select('id').eq('coach_slug', slug).eq('user_id', user.id).limit(1),
    ]).then(([bookings, enquiries]) => {
      const engaged = (bookings.data?.length > 0) || (enquiries.data?.length > 0)
      setHasEngaged(engaged)
    }).catch(() => setHasEngaged(false))
  }, [baseCoach?.id, user?.id])

  useFocusEffect(useCallback(() => { checkEngagement() }, [checkEngagement]))

  // Photo precedence: a founder/self-uploaded coach_profiles.photo_url wins
  // when present, otherwise fall back to the coach's bundled heroImage
  // (e.g. Milan Piroska, Tadgh Darcy's studio shots) — same precedence as
  // the Home Spotlight carousel (see lib/featuredContent.js coach()), so a
  // coach's photo is consistent everywhere it appears. null-safe throughout
  // — baseCoach can be missing (see the `if (!baseCoach)` render guard
  // below); `coach` just resolves to null in that case rather than crashing.
  const resolvedPhoto = override?.photo_url || baseCoach?.heroImage || null
  // Verified is never assumed — only a real coach_profiles.verified = true
  // row earns the badge (see VerifiedBadge's own default of false).
  const coach = !baseCoach ? null : override
    ? { ...baseCoach, bio: override.bio || baseCoach.bio, photoUrl: resolvedPhoto, verified: !!override.verified }
    : { ...baseCoach, photoUrl: resolvedPhoto, verified: false }

  // Pricing section data: the coach's existing static pricelist (untouched)
  // plus, when active, their own self-set intro call offer as one more row
  // — never replacing anything already there. A coach with no pricelist at
  // all but an active intro call still gets a (single-row) Pricing section.
  // Neutral billing on iOS and Android: prices and the booking link are only
  // shown for coaches that are clearly delivered in person.
  // Euro amounts show on the website only (founder decision). In person
  // coaches keep the booking link, which opens uniblueprint.ie.
  const showPricing = !NATIVE_NEUTRAL_BILLING
  const showBooking = !NATIVE_NEUTRAL_BILLING || isRealWorldCoach(coach)
  const introRow = introOffer
    ? { label: introCallLabel(introOffer), price: introOffer.price_cents > 0 ? formatEuro(introOffer.price_cents) : 'Free' }
    : null
  const displayPricelist = introRow
    ? [...(coach?.pricelist || []), introRow]
    : coach?.pricelist

  function handleEnquire() {
    if (!coach.contact) return
    if (coach.contact.email)     return openLink('email',     coach.contact.email)
    if (coach.contact.phone)     return openLink('phone',     coach.contact.phone)
    if (coach.contact.instagram) return openLink('instagram', coach.contact.instagram)
    if (coach.contact.linktree)  return openLink('linktree',  coach.contact.linktree)
  }

  // No coach in route.params at all — see the header comment on baseCoach
  // above for how this can happen. Checked before the Pro gate below since
  // that branch itself reads coach.name/coach.category.
  if (!coach) {
    return (
      <View style={styles.screen}>
        <AppHeader navigation={navigation} showBack />
        <Text style={[styles.headerName, { color: colors.textPrimary, textAlign: 'left', padding: 20 }]}>Coach not found</Text>
      </View>
    )
  }

  if (proLoading) return null

  if (!hasProAccess) {
    return (
      <View style={styles.screen}>
        <AppHeader navigation={navigation} showBack />
        <Text style={[styles.headerName, { color: colors.textPrimary, textAlign: 'left', paddingHorizontal: 20, paddingTop: 20 }]}>{coach.name}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, paddingHorizontal: 20, marginBottom: 8 }}>{coach.category}</Text>
        <ProUpgradeGate
          variant="screen"
          title="Elevation is a Pro feature"
          message={`Pro unlocks full access to Elevation coaching, including ${coach.name}'s profile, pricing, and booking requests.`}
        />
      </View>
    )
  }

  const purple = isDark ? '#B7A3F0' : PILLARS.elevation.color
  const pricelistRows = displayPricelist && displayPricelist.length > 0 && showPricing ? displayPricelist : null
  const hasServices = coach.services && coach.services.length > 0
  const hasPrices = !coach.shell && (!!pricelistRows || (coach.pricingNote && showPricing))
  const hasPricesTab = hasPrices || (NATIVE_NEUTRAL_BILLING && !coach.shell)
  const tabs = [
    { key: 'about', label: 'About' },
    ...(hasServices ? [{ key: 'services', label: 'Services' }] : []),
    // On iOS and Android there are no euro amounts, so this tab only holds
    // the coach rating and is called Rating.
    ...(hasPricesTab ? [{ key: 'prices', label: hasPrices ? 'Prices' : 'Rating' }] : []),
  ]
  const activeTab = tabs.some(t => t.key === tab) ? tab : 'about'
  const pics = [coach.photoUrl, ...(coach.gallery || [])].filter(Boolean)
  const isMoney = v => /€/.test(String(v))

  function onBook() {
    if (NATIVE_BOOKING_LINK) { Linking.openURL(coachBookingUrl(coach)); return }
    navigation.navigate('CoachBooking', { coach })
  }

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Swiping pictures sit above the coach name. */}
        {pics.length > 0 && <CoachPictures photos={pics} />}

        <View style={pb.head}>
          {pics.length === 0 && (
            <View style={[pb.ring, { borderColor: purple }]}>
              <User size={34} color={purple} strokeWidth={1.4} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[pb.name, { color: colors.textPrimary }]}>{coach.name}</Text>
            <Text style={[pb.sub, { color: colors.textSecondary }]}>{[coach.cardTag || coach.category, coach.location].filter(Boolean).join(', ')}</Text>
            <VerifiedBadge verified={coach.verified} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
          </View>
        </View>

        {coach.shell && coach.shellMessage && (
          <View style={styles.section}>
            <View style={styles.shellBlock}><Text style={styles.shellText}>{coach.shellMessage}</Text></View>
          </View>
        )}

        {tabs.length > 1 && (
          <View style={[pb.tabs, { backgroundColor: colors.tabFill }]}>
            {tabs.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[pb.tab, activeTab === t.key && { backgroundColor: colors.surface }]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: activeTab === t.key }}
              >
                <Text style={[pb.tabText, { color: activeTab === t.key ? colors.textPrimary : colors.textSecondary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'about' && (
          <>
            {!!coach.tagline && (
              <View style={[styles.section, { marginTop: 20 }]}>
                <Text style={[pb.tagline, { color: colors.textPrimary, borderLeftColor: purple }]}>{coach.tagline}</Text>
              </View>
            )}
            {coach.bio && (
              <View style={[styles.section, !coach.tagline && { marginTop: 22 }]}>
                <Text style={styles.sectionLabel}>About</Text>
                <Text style={styles.bioText}>{coach.bio}</Text>
              </View>
            )}
            {coach.sections && coach.sections.map(sec => (
              <View key={sec.title} style={styles.section}>
                <Text style={styles.sectionLabel}>{sec.title}</Text>
                <Text style={styles.bioText}>{sec.body}</Text>
              </View>
            ))}
            {coach.quote && (
              <View style={styles.section}>
                <View style={styles.quoteBlock}><Text style={styles.quoteText}>"{coach.quote}"</Text></View>
              </View>
            )}
            {coach.package && coach.package.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What's included</Text>
                <View style={styles.packageCard}>
                  {coach.package.map((item, i) => (
                    <View key={i} style={styles.packageRow}>
                      <View style={styles.packageDot} />
                      <Text style={styles.packageText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {coach.bookingNote && (comingSoonOn || !/coming soon/i.test(coach.bookingNote)) && (
              <View style={styles.section}>
                <View style={styles.bookingCard}><Text style={styles.bookingText}>{coach.bookingNote}</Text></View>
              </View>
            )}
            {coach.contact && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Get in touch</Text>
                <View style={styles.contactList}>
                  {coach.contact.instagram && (
                    <TouchableOpacity style={styles.contactRow} onPress={() => openLink('instagram', coach.contact.instagram)} activeOpacity={0.75}>
                      <View style={styles.contactIcon}><AtSign size={16} color={colors.textPrimary} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}><Text style={styles.contactPlatform}>Instagram</Text><Text style={styles.contactHandle}>@{coach.contact.instagram}</Text></View>
                      <ChevronRight size={14} color={colors.light} />
                    </TouchableOpacity>
                  )}
                  {coach.contact.tiktok && (
                    <TouchableOpacity style={styles.contactRow} onPress={() => openLink('tiktok', coach.contact.tiktok)} activeOpacity={0.75}>
                      <View style={styles.contactIcon}><AtSign size={16} color={colors.textPrimary} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}><Text style={styles.contactPlatform}>TikTok</Text><Text style={styles.contactHandle}>@{coach.contact.tiktok}</Text></View>
                      <ChevronRight size={14} color={colors.light} />
                    </TouchableOpacity>
                  )}
                  {coach.contact.email && (
                    <TouchableOpacity style={styles.contactRow} onPress={() => openLink('email', coach.contact.email)} activeOpacity={0.75}>
                      <View style={styles.contactIcon}><Mail size={16} color={colors.textPrimary} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}><Text style={styles.contactPlatform}>Email</Text><Text style={styles.contactHandle} numberOfLines={1}>{coach.contact.email}</Text></View>
                      <ChevronRight size={14} color={colors.light} />
                    </TouchableOpacity>
                  )}
                  {coach.contact.phone && (
                    <TouchableOpacity style={styles.contactRow} onPress={() => openLink('phone', coach.contact.phone)} activeOpacity={0.75}>
                      <View style={styles.contactIcon}><Phone size={16} color={colors.textPrimary} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}><Text style={styles.contactPlatform}>Phone or WhatsApp</Text><Text style={styles.contactHandle}>{coach.contact.phone}</Text></View>
                      <ChevronRight size={14} color={colors.light} />
                    </TouchableOpacity>
                  )}
                  {coach.contact.linktree && (
                    <TouchableOpacity style={styles.contactRow} onPress={() => openLink('linktree', coach.contact.linktree)} activeOpacity={0.75}>
                      <View style={styles.contactIcon}><Link2 size={16} color={colors.textPrimary} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}><Text style={styles.contactPlatform}>Linktree</Text><Text style={styles.contactHandle}>View all links</Text></View>
                      <ChevronRight size={14} color={colors.light} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            {coach.crossLink && (
              <View style={styles.section}>
                <TouchableOpacity style={styles.crossLinkCard} activeOpacity={0.75} onPress={() => navigation.navigate(coach.crossLink.screen, coach.crossLink.params)}>
                  <Text style={styles.crossLinkText}>{coach.crossLink.label}</Text>
                  <ChevronRight size={14} color="#6D28D9" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === 'services' && hasServices && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Services</Text>
            <View style={[pb.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {coach.services.map((sv, i) => (
                <View key={sv} style={[pb.row, i < coach.services.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={[pb.dot, { backgroundColor: purple }]} />
                  <Text style={[pb.rowText, { color: colors.textPrimary }]}>{sv}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'prices' && hasPricesTab && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{hasPrices ? 'Prices and booking' : 'Rating'}</Text>
            {pricelistRows ? (
              <ProBlurLock styles={styles} isPro={hasProAccess} onUnlock={() => Linking.openURL(WEBSITE_LINKS.pricing)}>
                <View style={[pb.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {pricelistRows.map((pl, i) => (
                    <View key={pl.label} style={[pb.row, i < pricelistRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                      <Text style={[pb.rowText, { color: colors.textPrimary }]}>{pl.label}</Text>
                      <Text style={[pb.price, { color: isMoney(pl.price) ? colors.goldText : colors.textPrimary }]}>{pl.price}</Text>
                    </View>
                  ))}
                </View>
              </ProBlurLock>
            ) : showPricing && coach.pricingNote ? (
              <View style={styles.noteCard}><Text style={styles.noteText}>{coach.pricingNote}</Text></View>
            ) : null}
            {user?.id && myRating ? (
              <View style={[pb.rateRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[pb.rateIcon, { backgroundColor: purple + '22' }]}><Star size={18} color={purple} fill={purple} /></View>
                <View style={{ flex: 1 }}><Text style={[pb.rateTitle, { color: colors.textPrimary }]}>You rated this coach {myRating} out of 5</Text></View>
              </View>
            ) : user?.id && hasEngaged === true ? (
              <TouchableOpacity style={[pb.rateRow, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => setRateOpen(true)} accessibilityRole="button" accessibilityLabel="Rate this coach">
                <View style={[pb.rateIcon, { backgroundColor: purple + '22' }]}><Star size={18} color={purple} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[pb.rateTitle, { color: colors.textPrimary }]}>Rate this coach</Text>
                  <Text style={[pb.rateSub, { color: colors.textSecondary }]}>Tell others how it went.</Text>
                </View>
                <ChevronRight size={18} color={colors.light} />
              </TouchableOpacity>
            ) : user?.id && hasEngaged === false ? (
              <View style={styles.rateLockedRow}>
                <Lock size={12} color={colors.light} strokeWidth={2} />
                <Text style={styles.rateLockedText}>You can rate {coach.name} once you have booked or enquired with them.</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {!coach.shell && (
        <View style={[pb.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          {showBooking && (
            <TouchableOpacity style={[pb.bookBtn, { backgroundColor: colors.accentBg }]} activeOpacity={0.85} onPress={onBook} accessibilityRole="button" accessibilityLabel="Book a session">
              {NATIVE_BOOKING_LINK ? <ExternalLink size={18} color={colors.accentFg} /> : <CalendarClock size={18} color={colors.accentFg} />}
              <Text style={[pb.bookText, { color: colors.accentFg }]}>{NATIVE_BOOKING_LINK ? 'Book on uniblueprint.ie' : 'Book a session'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={pb.msgBtn} activeOpacity={0.75} onPress={() => setEnquiryOpen(true)} accessibilityRole="button">
            <Text style={[pb.msgText, { color: colors.textPrimary }]}>Send a quick message</Text>
          </TouchableOpacity>
        </View>
      )}

      <EnquiryModal
        visible={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        coach={coach}
        userId={user?.id}
        onSent={() => setHasEngaged(true)}
        navigation={navigation}
      />
      <RateCoachModal
        visible={rateOpen}
        onClose={() => setRateOpen(false)}
        coach={coach}
        userId={user?.id}
        onRated={rating => setMyRating(rating)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Swiping pictures above the coach name. Contain, so logos and portraits are never cropped.
function CoachPictures({ photos }) {
  const { colors } = useTheme()
  const [w, setW] = useState(0)
  const [i, setI] = useState(0)
  return (
    <View style={{ marginHorizontal: 16, marginTop: 14 }} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <View style={{ height: 230, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        {w > 0 && (
          <ScrollView horizontal pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={e => setI(Math.round(e.nativeEvent.contentOffset.x / w))}>
            {photos.map((ph, n) => (
              <View key={n} style={{ width: w, height: 230, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={typeof ph === 'string' ? { uri: ph } : ph} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      {photos.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {photos.map((_, n) => (
            <View key={n} style={{ height: 6, width: n === i ? 16 : 6, borderRadius: 3, backgroundColor: n === i ? colors.textPrimary : colors.border }} />
          ))}
        </View>
      )}
    </View>
  )
}

const pb = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 16 },
  ring: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 18, padding: 4, borderRadius: 14 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 11 },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  tagline: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 24, borderLeftWidth: 3, paddingLeft: 12 },
  card: { borderRadius: radius.card, borderWidth: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  rowText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  price: { fontFamily: fonts.sansBold, fontSize: 15 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  rateIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rateTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  rateSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 4 },
  bookBtn: { height: 54, borderRadius: radius.button, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bookText: { fontFamily: fonts.sansBold, fontSize: 16 },
  msgBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  msgText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView
  // reliably fills the space below the fixed navy header on native — without
  // it RN can size the ScrollView to its own content instead of the
  // available viewport, which is what let content sit under the header /
  // CTA buttons end up unreachable on a real phone (invisible on web).
  scrollView: { flex: 1 },
  scroll: {},

  // Header
  header: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: 36,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.chromeFg },

  // Double-ring frosted glass avatar — outer ring picked up in brand gold
  // (rather than plain cream) for a warmer, more premium feel befitting a
  // paid coach's profile, matching the gold accents used elsewhere below.
  avatarOuter: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderWidth: 2, borderColor: 'rgba(201,162,75,0.45)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  avatarInner: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(245,240,232,0.07)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.13)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  headerName:  { fontFamily: fonts.serif, fontSize: 26, color: colors.chromeFg, textAlign: 'center', lineHeight: 32, marginTop: 16 },
  headerTitle: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.72)', textAlign: 'center', lineHeight: 19, marginTop: 4 },

  // maxWidth + centered wrapping text: a longer enquiry-style price string
  // (e.g. "Online coaching — pricing on enquiry") previously stretched this
  // pill into a near-full-width banner instead of the compact centered
  // capsule every other coach gets — the actual layout bug behind the "off"
  // placement reported on longer-text profiles. Capping the width and
  // letting it wrap keeps every coach's price pill the same proportioned
  // shape regardless of how long their pricing text happens to be.
  priceChip: {
    alignSelf: 'center',
    alignItems: 'center',
    maxWidth: '78%',
    backgroundColor: colors.accentBg,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(201,162,75,0.5)',
    paddingHorizontal: 18, paddingVertical: 9,
    marginBottom: 10,
  },
  priceChipLabel: { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.6)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 1 },
  priceChipText:  { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg, textAlign: 'center' },

  // Identity
  identityBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl, paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  coachName:     { fontFamily: fonts.serif, fontSize: 30, color: colors.textPrimary, textAlign: 'center', lineHeight: 36, marginBottom: 6 },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  // Category as a soft pill rather than plain text — small hierarchy lift
  // consistent with the badge/tagline treatment elsewhere on the page.
  categoryPill:     { backgroundColor: 'rgba(30,58,95,0.06)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8 },
  categoryPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary, opacity: 0.75 },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  // Mentor badge
  mentorBadge:     { backgroundColor: '#F0FDF4', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  mentorBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: '#15803D', letterSpacing: 0.4, textTransform: 'uppercase' },

  // Tagline — gold left accent (rather than a plain tinted box) for a
  // warmer, more premium editorial feel.
  taglineBlock: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: colors.gold,
    ...shadows.card,
    padding: 18, alignItems: 'center',
  },
  taglineText: {
    fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary,
    textAlign: 'center', lineHeight: 26, fontStyle: 'italic',
  },

  // Shell
  shellBlock: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 24, alignItems: 'center', ...shadows.card,
  },
  shellText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },

  // Generic section
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12,
  },
  bioText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, lineHeight: 23 },

  // Photo gallery — a fixed 4:5 aspect-ratio frame (close to the natural
  // ratio of the supplied studio portraits) with resizeMode 'contain', so
  // the full photo always shows regardless of its exact source ratio;
  // any letterboxing is filled by the cream frame background rather than
  // cropping the subject.
  galleryScroller: {
    borderRadius: radius.card, overflow: 'hidden',
    backgroundColor: colors.surfaceAlt, ...shadows.card,
  },
  galleryFrame: {
    aspectRatio: 4 / 5, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  galleryImage: { width: '100%', height: '100%' },
  galleryDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  galleryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(30,58,95,0.18)' },
  galleryDotActive: { backgroundColor: colors.gold, width: 16 },

  // Quote
  quoteBlock: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.gold,
    borderRadius: 6, padding: 18, ...shadows.card,
  },
  quoteText: { fontFamily: fonts.serif, fontSize: 15, color: colors.textPrimary, lineHeight: 24, fontStyle: 'italic' },

  // Services
  servicePills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servicePill:     { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(30,58,95,0.10)', ...shadows.card },
  servicePillText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },

  // Pricing
  pricelistCard:    { backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  pricelistRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  pricelistDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  pricelistLabel:   { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 12 },
  pricelistPrice:   { fontFamily: fonts.serif, fontSize: 18, color: colors.goldDeep },

  // Notes
  noteCard:    { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#FDE68A', marginTop: 12 },
  noteText:    { fontFamily: fonts.sans, fontSize: 13, color: '#92400E', lineHeight: 20 },
  bookingCard: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  bookingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },

  // Cross-link (coach ↔ partner listing)
  crossLinkCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: '#F5F3FF', borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  crossLinkText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#6D28D9', lineHeight: 19, flex: 1 },

  // Package
  packageCard: { backgroundColor: '#F0FDF4', borderRadius: radius.card, padding: 18, gap: 10 },
  packageRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  packageDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D', marginTop: 7, flexShrink: 0 },
  packageText: { fontFamily: fonts.sans, fontSize: 14, color: '#166534', lineHeight: 21, flex: 1 },

  // Contact
  contactList: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  contactIcon:     { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactPlatform: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 2 },
  contactHandle:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },

  // CTA
  ctaBtn: { marginHorizontal: spacing.md },
  ctaSecondaryBtn: {
    height: 48, borderRadius: radius.button, marginHorizontal: spacing.md,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaSecondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },
  ratedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: radius.button, marginHorizontal: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  ratedBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },
  rateLockedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: spacing.md, paddingVertical: 6,
  },
  rateLockedText: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'center', flexShrink: 1 },
  avatarImg: { width: 86, height: 86, borderRadius: 43 },

  // Pricing & booking blur-lock (free users)
  lockWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  lockContent: { opacity: 0.9 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,240,232,0.55)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 24,
  },
  lockIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: colors.navy, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  lockTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.navy, marginBottom: 4, textAlign: 'center' },
  lockBody: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.navy, opacity: 0.75,
    textAlign: 'center', lineHeight: 17, marginBottom: 16, maxWidth: 260,
  },
  lockCta: { backgroundColor: '#C9A24B', borderRadius: 22, paddingHorizontal: 26, paddingVertical: 12 },
  lockCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy },
  })
}
