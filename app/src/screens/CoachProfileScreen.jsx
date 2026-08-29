import { useEffect, useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking,
  Image, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, MapPin, AtSign, Mail, Phone, Link2, User, X, Send, Star,
} from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { coachSlug } from './ElevationScreen'

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

function EnquiryModal({ visible, onClose, coach, userId }) {
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

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
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={{ paddingVertical: 20 }}>
              <Text style={m.sentText}>
                Your enquiry has gone straight to {coach.name} and the UniBlueprint team. They'll follow up with you directly.
              </Text>
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
              <TouchableOpacity
                style={[m.sendBtn, sending && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={submit}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color={colors.cream} />
                  : <>
                      <Send size={14} color={colors.cream} strokeWidth={2} />
                      <Text style={m.sendBtnText}>Send Enquiry</Text>
                    </>
                }
              </TouchableOpacity>
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
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
                  <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
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
              <TouchableOpacity
                style={[m.sendBtn, (sending || !stars) && { opacity: 0.5 }]}
                activeOpacity={0.85}
                onPress={submit}
                disabled={sending || !stars}
              >
                {sending
                  ? <ActivityIndicator size="small" color={colors.cream} />
                  : <Text style={m.sendBtnText}>Submit Rating</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 14 },
  starRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 18 },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 100,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
    marginBottom: 12,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginBottom: 10 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14,
  },
  sendBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
  sentText: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, lineHeight: 21, marginBottom: 20 },
  doneBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})

export default function CoachProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { coach: baseCoach } = route.params

  // Live self-edited bio/photo, if this coach has a linked coach_profiles
  // row with a coach_slug matching this listing. Falls back to the static
  // listing data when no override exists yet.
  const [override, setOverride] = useState(null)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [myRating, setMyRating] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('coach_profiles')
      .select('bio, photo_url')
      .eq('coach_slug', coachSlug(baseCoach.id))
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setOverride(data) })
    return () => { cancelled = true }
  }, [baseCoach.id])

  // Has this user already rated this coach? One rating per user per coach
  // (coach_ratings has a unique constraint on coach_slug + user_id).
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase
      .from('coach_ratings')
      .select('rating')
      .eq('coach_slug', coachSlug(baseCoach.id))
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setMyRating(data.rating) })
    return () => { cancelled = true }
  }, [baseCoach.id, user?.id])

  const coach = override
    ? { ...baseCoach, bio: override.bio || baseCoach.bio, photoUrl: override.photo_url }
    : baseCoach

  function handleEnquire() {
    if (!coach.contact) return
    if (coach.contact.email)     return openLink('email',     coach.contact.email)
    if (coach.contact.phone)     return openLink('phone',     coach.contact.phone)
    if (coach.contact.instagram) return openLink('instagram', coach.contact.instagram)
    if (coach.contact.linktree)  return openLink('linktree',  coach.contact.linktree)
  }

  return (
    <View style={styles.screen}>

      {/* ── Navy header with frosted glass avatar ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={styles.backBtnText}>Coaches</Text>
        </TouchableOpacity>

        {/* Frosted glass avatar — double-ring treatment, real photo when available */}
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            {coach.photoUrl ? (
              <Image source={{ uri: coach.photoUrl }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <User
                size={44}
                color={coach.shell ? 'rgba(245,240,232,0.3)' : 'rgba(245,240,232,0.6)'}
                strokeWidth={1.2}
              />
            )}
          </View>
        </View>

        <Text style={styles.headerName}>{coach.name}</Text>
        {coach.title && <Text style={styles.headerTitle} numberOfLines={2}>{coach.title}</Text>}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Identity ── */}
        <View style={styles.identityBlock}>
          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>
              {coach.shell ? 'Coming Soon' : (coach.from || 'Enquire for pricing')}
            </Text>
          </View>
          {!coach.shell && coach.from?.includes('*') && (
            <Text style={styles.priceFootnote}>*A target, not a guarantee. See Risk Disclosure below.</Text>
          )}
          <Text style={styles.coachCategory}>{coach.category}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.muted} strokeWidth={1.8} />
            <Text style={styles.locationText}>{coach.location}</Text>
          </View>
          {coach.badge && (
            <View style={styles.mentorBadge}>
              <Text style={styles.mentorBadgeText}>{coach.badge}</Text>
            </View>
          )}
          {coach.rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{coach.rating}</Text>
              <Text style={styles.ratingCount}>({coach.reviews} reviews)</Text>
            </View>
          )}
        </View>

        {/* ── Tagline ── */}
        {coach.tagline && (
          <View style={styles.taglineBlock}>
            <Text style={styles.taglineText}>{coach.tagline}</Text>
          </View>
        )}

        {/* ── Shell placeholder ── */}
        {coach.shell && coach.shellMessage && (
          <View style={styles.section}>
            <View style={styles.shellBlock}>
              <Text style={styles.shellText}>{coach.shellMessage}</Text>
            </View>
          </View>
        )}

        {/* ── Bio ── */}
        {coach.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.bioText}>{coach.bio}</Text>
          </View>
        )}

        {/* ── Structured sections (e.g. Student Mentor Listing breakdown) ── */}
        {coach.sections && coach.sections.map(sec => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{sec.title}</Text>
            <Text style={styles.bioText}>{sec.body}</Text>
          </View>
        ))}

        {/* ── Quote ── */}
        {coach.quote && (
          <View style={styles.section}>
            <View style={styles.quoteBlock}>
              <Text style={styles.quoteText}>"{coach.quote}"</Text>
            </View>
          </View>
        )}

        {/* ── Services ── */}
        {coach.services && coach.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Services</Text>
            <View style={styles.servicePills}>
              {coach.services.map(s => (
                <View key={s} style={styles.servicePill}>
                  <Text style={styles.servicePillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Pricelist ── */}
        {coach.pricelist && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pricing</Text>
            <View style={styles.pricelistCard}>
              {coach.pricelist.map((p, i) => (
                <View
                  key={p.label}
                  style={[
                    styles.pricelistRow,
                    i < coach.pricelist.length - 1 && styles.pricelistDivider,
                  ]}
                >
                  <Text style={styles.pricelistLabel}>{p.label}</Text>
                  <Text style={styles.pricelistPrice}>{p.price}</Text>
                </View>
              ))}
            </View>
            {coach.pricingNote && (
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>{coach.pricingNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Pricing note (no pricelist) ── */}
        {!coach.pricelist && coach.pricingNote && (
          <View style={styles.section}>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{coach.pricingNote}</Text>
            </View>
          </View>
        )}

        {/* ── Package inclusions ── */}
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

        {/* ── Booking note ── */}
        {coach.bookingNote && (
          <View style={styles.section}>
            <View style={styles.bookingCard}>
              <Text style={styles.bookingText}>{coach.bookingNote}</Text>
            </View>
          </View>
        )}

        {/* ── Contact ── */}
        {coach.contact && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Get in touch</Text>
            <View style={styles.contactList}>
              {coach.contact.instagram && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('instagram', coach.contact.instagram)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><AtSign size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Instagram</Text>
                    <Text style={styles.contactHandle}>@{coach.contact.instagram}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.tiktok && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('tiktok', coach.contact.tiktok)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><AtSign size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>TikTok</Text>
                    <Text style={styles.contactHandle}>@{coach.contact.tiktok}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('email', coach.contact.email)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><Mail size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Email</Text>
                    <Text style={styles.contactHandle} numberOfLines={1}>{coach.contact.email}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('phone', coach.contact.phone)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><Phone size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Phone / WhatsApp</Text>
                    <Text style={styles.contactHandle}>{coach.contact.phone}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
              {coach.contact.linktree && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openLink('linktree', coach.contact.linktree)}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIcon}><Link2 size={16} color={colors.navy} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPlatform}>Linktree</Text>
                    <Text style={styles.contactHandle}>View all links</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Cross-link (e.g. coach who also runs a Lifestyle Blueprint partner business) ── */}
        {coach.crossLink && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.crossLinkCard}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(coach.crossLink.screen, coach.crossLink.params)}
            >
              <Text style={styles.crossLinkText}>{coach.crossLink.label}</Text>
              <ChevronRight size={14} color="#6D28D9" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── CTA ── */}
        {!coach.shell && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.8}
              onPress={() => setEnquiryOpen(true)}
            >
              <Text style={styles.ctaBtnText}>Book / Enquire</Text>
            </TouchableOpacity>
            {coach.contact && (
              <TouchableOpacity style={styles.ctaSecondaryBtn} activeOpacity={0.75} onPress={handleEnquire}>
                <Text style={styles.ctaSecondaryBtnText}>Or contact directly</Text>
              </TouchableOpacity>
            )}
            {user?.id && (
              myRating ? (
                <View style={styles.ratedBanner}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratedBannerText}>You rated this coach {myRating} / 5</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.ctaSecondaryBtn} activeOpacity={0.75} onPress={() => setRateOpen(true)}>
                  <Text style={styles.ctaSecondaryBtnText}>Rate this coach</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

      </ScrollView>

      <EnquiryModal
        visible={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        coach={coach}
        userId={user?.id}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: {},

  // Header
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 36,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },

  // Double-ring frosted glass avatar
  avatarOuter: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderWidth: 2, borderColor: 'rgba(245,240,232,0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.cream,
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  avatarInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(245,240,232,0.07)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.13)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerName:  { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, textAlign: 'center', lineHeight: 32, marginTop: 16 },
  headerTitle: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.72)', textAlign: 'center', lineHeight: 19, marginTop: 4 },

  priceChip: {
    alignSelf: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 7,
    marginBottom: 6,
  },
  priceChipText:  { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  priceFootnote:  { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },

  // Identity
  identityBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl, paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  coachName:     { fontFamily: fonts.serif, fontSize: 30, color: colors.navy, textAlign: 'center', lineHeight: 36, marginBottom: 6 },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  coachCategory: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy, opacity: 0.6, marginBottom: 8 },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  ratingStar:    { fontSize: 15, color: '#F59E0B' },
  ratingValue:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  ratingCount:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  // Mentor badge
  mentorBadge:     { backgroundColor: '#F0FDF4', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  mentorBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: '#15803D', letterSpacing: 0.4, textTransform: 'uppercase' },

  // Tagline
  taglineBlock: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: 'rgba(30,58,95,0.05)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    padding: 18, alignItems: 'center',
  },
  taglineText: {
    fontFamily: fonts.serif, fontSize: 17, color: colors.navy,
    textAlign: 'center', lineHeight: 26, fontStyle: 'italic',
  },

  // Shell
  shellBlock: {
    backgroundColor: colors.white, borderRadius: radius.card,
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
  bioText: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, lineHeight: 23 },

  // Quote
  quoteBlock: {
    backgroundColor: colors.white,
    borderLeftWidth: 3, borderLeftColor: colors.navy,
    borderRadius: 6, padding: 18, ...shadows.card,
  },
  quoteText: { fontFamily: fonts.serif, fontSize: 15, color: colors.navy, lineHeight: 24, fontStyle: 'italic' },

  // Services
  servicePills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servicePill:     { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(30,58,95,0.10)', ...shadows.card },
  servicePillText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },

  // Pricing
  pricelistCard:    { backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  pricelistRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  pricelistDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  pricelistLabel:   { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, flex: 1, marginRight: 12 },
  pricelistPrice:   { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },

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
  contactList: { backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  contactIcon:     { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactPlatform: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 2 },
  contactHandle:   { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  // CTA
  ctaBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 54, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.md },
  ctaBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  ctaSecondaryBtn: {
    height: 48, borderRadius: radius.button, marginHorizontal: spacing.md,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaSecondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  ratedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: radius.button, marginHorizontal: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  ratedBannerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
})
