import { useEffect, useState, useCallback } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Share,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  ChevronRight, X, Send, Star, CalendarClock, Lock, ExternalLink, MessageCircle, Share2, Heart,
} from 'lucide-react-native'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { SITE_URL } from '../constants/site'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { coachSlug } from './ElevationScreen'
import AppHeader from '../components/ui/AppHeader'
import { PILLARS } from '../constants/pillars'
import BrandProfile, { ProfileButton, Chip, ProfileSection } from '../components/profile/BrandProfile'
import { coachDisplayName } from '../lib/coachDisplay'
import { cleanCopy } from '../lib/plainCopy'
import { pillarTint } from '../constants/pillarTints'
import { useBrandFollow } from '../hooks/useBrandFollow'
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
  const follow = useBrandFollow('coach', coachSlug(baseCoach?.id ?? 0))

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
    ? { ...baseCoach, bio: override.bio || baseCoach.bio, photoUrl: resolvedPhoto, verified: baseCoach.verified || !!override.verified }
    : { ...baseCoach, photoUrl: resolvedPhoto, verified: !!baseCoach.verified }

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

  const accent = pillarTint('elevation', isDark)
  const pricelistRows = displayPricelist && displayPricelist.length > 0 && showPricing ? displayPricelist : null
  const services = coach.services || []
  const isMoney = v => /€/.test(String(v))
  const name = coachDisplayName(coach)
  const heroOrFirst = coach.heroImage || (coach.gallery && coach.gallery[0]) || null
  const bannerImage = heroOrFirst
  const avatarSrc = override?.photo_url ? { uri: override.photo_url } : (coach.avatar || coach.heroImage || null)
  const subtitle = [cleanCopy(coach.cardTag || coach.category), coach.location].filter(Boolean).join(', ')
  const sections = (coach.sections || [])

  function onBook() {
    if (NATIVE_BOOKING_LINK) { Linking.openURL(coachBookingUrl(coach)); return }
    navigation.navigate('CoachBooking', { coach })
  }

  function onShare() {
    Share.share({
      message: `Take a look at ${name} on UniBlueprint. ${SITE_URL}`,
    }).catch(() => {})
  }

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        testID="profile-scroll"
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <BrandProfile
          banner={{ image: bannerImage, color: coach.bannerBg || accent, fit: coach.bannerFit }}
          avatar={avatarSrc ? { image: avatarSrc } : { initials: name.slice(0, 1), bg: accent, fg: '#FFFFFF' }}
          name={name}
          verified={coach.verified !== false}
          subtitle={subtitle}
          chips={[
            <Chip key="c" label="Coach" accent={accent} strong />,
            coach.location ? <Chip key="l" label={coach.location} accent={accent} /> : null,
            coach.badge ? <Chip key="b" label={cleanCopy(coach.badge)} accent={accent} /> : null,
          ].filter(Boolean)}
          actions={!coach.shell ? (
            <>
              {showBooking && (
                <ProfileButton
                  label="Book a session"
                  Icon={NATIVE_BOOKING_LINK ? ExternalLink : CalendarClock}
                  onPress={onBook}
                  style={{ flexBasis: '100%' }}
                />
              )}
              {follow.enabled && (
                <ProfileButton
                  label={follow.following ? 'Following' : 'Follow'}
                  Icon={Heart}
                  variant="secondary"
                  onPress={follow.toggle}
                  accessibilityLabel={follow.following ? `Unfollow ${name}` : `Follow ${name}`}
                />
              )}
              <ProfileButton
                label="Get in touch"
                Icon={MessageCircle}
                variant={showBooking ? 'secondary' : 'primary'}
                onPress={() => setEnquiryOpen(true)}
                accessibilityLabel={`Get in touch with ${name}`}
              />
              <ProfileButton label="Share" Icon={Share2} variant="secondary" onPress={onShare} accessibilityLabel={`Share ${name}`} />
            </>
          ) : null}
          tagline={coach.tagline ? cleanCopy(coach.tagline) : null}
          bio={cleanCopy(coach.bio)}
          gallery={coach.gallery}
        >
          {coach.shell && coach.shellMessage && (
            <ProfileSection>
              <Text style={styles.shellText}>{coach.shellMessage}</Text>
            </ProfileSection>
          )}

          {services.length > 0 && (
            <ProfileSection title="Services">
              <View style={styles.chipWrap}>{services.map(sv => <Chip key={sv} label={cleanCopy(sv)} accent={accent} />)}</View>
            </ProfileSection>
          )}

          {!!coach.quote && (
            <ProfileSection>
              <View style={[styles.quote, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.quoteText, { color: colors.textPrimary }]}>{'“'}{cleanCopy(coach.quote)}{'”'}</Text>
              </View>
            </ProfileSection>
          )}

          {sections.map(sec => (
            <ProfileSection key={sec.title} title={cleanCopy(sec.title)}>
              <Text style={[styles.body, { color: colors.textPrimary }]}>{cleanCopy(sec.body)}</Text>
            </ProfileSection>
          ))}

          {coach.package && coach.package.length > 0 && (
            <ProfileSection title="What's included">
              <View style={[pb.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {coach.package.map((item, i) => (
                  <View key={i} style={[pb.row, i < coach.package.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <View style={[pb.dot, { backgroundColor: accent }]} />
                    <Text style={[pb.rowText, { color: colors.textPrimary }]}>{cleanCopy(item)}</Text>
                  </View>
                ))}
              </View>
            </ProfileSection>
          )}

          {/* Prices show on the website build only. */}
          {pricelistRows && (
            <ProfileSection title="Prices">
              <View style={[pb.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {pricelistRows.map((pl, i) => (
                  <View key={pl.label} style={[pb.row, i < pricelistRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <Text style={[pb.rowText, { color: colors.textPrimary }]}>{pl.label}</Text>
                    <Text style={[pb.price, { color: isMoney(pl.price) ? colors.goldText : colors.textPrimary }]}>{pl.price}</Text>
                  </View>
                ))}
              </View>
              {showPricing && !!coach.pricingNote && <Text style={[styles.body, { color: colors.textSecondary, marginTop: 10 }]}>{coach.pricingNote}</Text>}
            </ProfileSection>
          )}

          {!!coach.bookingNote && (comingSoonOn || !/coming soon/i.test(coach.bookingNote)) && (
            <ProfileSection>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{cleanCopy(coach.bookingNote)}</Text>
            </ProfileSection>
          )}

          {coach.crossLink && (
            <ProfileSection>
              <TouchableOpacity
                style={[styles.crossLink, { borderColor: colors.border, backgroundColor: colors.surface }]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(coach.crossLink.screen, coach.crossLink.params)}
                accessibilityRole="button"
                accessibilityLabel={cleanCopy(coach.crossLink.label)}
              >
                <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary }}>{cleanCopy(coach.crossLink.label)}</Text>
                <ChevronRight size={16} color={accent} strokeWidth={2} />
              </TouchableOpacity>
            </ProfileSection>
          )}

          {!coach.shell && (
            <ProfileSection>
              {user?.id && myRating ? (
                <View style={[pb.rateRow, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 0 }]}>
                  <View style={[pb.rateIcon, { backgroundColor: accent + '22' }]}><Star size={18} color={accent} fill={accent} /></View>
                  <View style={{ flex: 1 }}><Text style={[pb.rateTitle, { color: colors.textPrimary }]}>You rated this coach {myRating} out of 5</Text></View>
                </View>
              ) : user?.id && hasEngaged === true ? (
                <TouchableOpacity style={[pb.rateRow, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 0 }]} activeOpacity={0.8} onPress={() => setRateOpen(true)} accessibilityRole="button" accessibilityLabel="Rate this coach">
                  <View style={[pb.rateIcon, { backgroundColor: accent + '22' }]}><Star size={18} color={accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pb.rateTitle, { color: colors.textPrimary }]}>Rate this coach</Text>
                    <Text style={[pb.rateSub, { color: colors.textSecondary }]}>Tell others how it went.</Text>
                  </View>
                  <ChevronRight size={18} color={colors.light} />
                </TouchableOpacity>
              ) : user?.id && hasEngaged === false ? (
                <View style={styles.rateLockedRow}>
                  <Lock size={12} color={colors.light} strokeWidth={2} />
                  <Text style={styles.rateLockedText}>You can rate {name} once you have booked or enquired with them.</Text>
                </View>
              ) : null}
            </ProfileSection>
          )}
        </BrandProfile>
      </ScrollView>

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

const pb = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  rowText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  price: { fontFamily: fonts.sansBold, fontSize: 15 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  rateIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rateTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  rateSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
})

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23 },
  quote: { borderWidth: 1, borderRadius: radius.card, padding: 16 },
  quoteText: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 25 },
  crossLink: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderWidth: 1, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 10 },
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
