import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, Linking, Alert,
  Animated, Dimensions, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Plus, X, Globe, Building2, GraduationCap,
  Wrench, Sparkles, Dumbbell, Camera, Activity, ShoppingBag,
  ChevronRight, ChevronLeft, Megaphone, Star, Crown,
  MapPin, Users, Wallet, Newspaper, CalendarClock, Award, Heart,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import ImageUploader from '../components/ui/ImageUploader'
import { supabase } from '../lib/supabase'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { WEBSITE_LINKS } from '../constants/site'
import { COACHES, coachSlug } from './ElevationScreen'
import { PARTNERS } from '../data/lifestylePartners'

// ─── The Weekly Blueprint ───────────────────────────────────────────────────
// A fixed 27-page structure (see the spec Desmond sent — same page order
// every week, content rotates). Most pages pull from data that's real
// elsewhere in the app already (coaches, Lifestyle partners, Foundation
// services, live deals, posted ads); the handful of genuinely one-off
// editorial pages (campus events, student spotlight, campus guide, team,
// coach board, UBP board, week ahead, blueprint feature, founders' note,
// money moves) come from weekly_issue_content, written by Operations/Founder
// through WeeklyIssueEditorScreen.jsx — never fabricated here.

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

// ── Board config (Post an Ad destinations + Ad Board / Marketplace pages) ──

const BOARDS = [
  { key: 'cross-ireland', label: 'Cross-Ireland',  Icon: Globe,      color: colors.navy },
  { key: 'campus',        label: 'Campus Connect', Icon: Building2,  color: '#B45309'   },
  { key: 'course',        label: 'Course Connect', Icon: Globe,      color: '#0369A1'   },
  { key: 'marketplace',   label: 'Marketplace',    Icon: ShoppingBag, color: '#6D28D9'  },
]

const CATEGORY = {
  'Automotive': { Icon: Wrench,    color: '#1d4ed8', bg: '#EFF6FF' },
  'Beauty':     { Icon: Sparkles,  color: '#86198F', bg: '#FDF4FF' },
  'Fitness':    { Icon: Dumbbell,  color: '#15803D', bg: '#F0FDF4' },
  'Creative':   { Icon: Camera,    color: '#C2410C', bg: '#FFF7ED' },
  'Gym':        { Icon: Activity,  color: '#0369A1', bg: '#F0F9FF' },
  'Campus':     { Icon: Building2, color: '#B45309', bg: '#FEF3C7' },
  'Course':     { Icon: Globe,     color: '#1E3A5F', bg: '#F5F0E8' },
  'Marketplace': { Icon: ShoppingBag, color: '#6D28D9', bg: '#F5F3FF' },
}

// Curated, real partner listings (contact-and-book relationships UniBlueprint
// has directly, not yet modelled in the ads table) shown on the Ad Board page
// alongside live student-submitted ads.
const CURATED_ADS = [
  { id: 'whip_wizardz', boards: ['cross-ireland'], category: 'Automotive', brand: 'Whip Wizardz', title: 'Car Sales and Services', description: 'Vehicle sales, sourcing, inspections, repairs and detailing. Jonesborough, near Dundalk. Book via WhatsApp.' },
  { id: 'nail_nurse',   boards: ['cross-ireland'], category: 'Beauty',     brand: 'The Nail Nurse', title: 'Nail and Beauty Services', description: 'Acrylic full sets from €25. Gel polish from €6. Galway. Student discount with valid ID. DM @theenailnurse__' },
  { id: 'jmc_fitness',  boards: ['cross-ireland'], category: 'Fitness',    brand: 'JMC Fitness', title: 'Elite Sports Coaching', description: '12-week plan €300. In-person sessions €50 per hour. North Dublin 4G Astro. Analytics Breakdown €100.' },
  { id: 'nyz3ditz',     boards: ['cross-ireland'], category: 'Creative',   brand: 'Nyz3ditz', title: 'Photography and Video Mentorship', description: 'Monthly mentorship €55 per month. One-to-one shoot session €90. WhatsApp +353 85 7272 875. @Nyz3ditz' },
  { id: 'energie',      boards: ['cross-ireland'], category: 'Gym',       brand: 'Energie Fitness', title: 'Student Gym Membership', description: '€37.99 per month (standard €39.99 to €44.99). €15 joining fee. Mon to Fri 6am to 10pm. Sat to Sun 9am to 5pm.' },
]

function getAdPressHandler(ad, navigation) {
  const url = ad.link || ad.target_url
  if (url) return () => Linking.openURL(url)
  const name = ad.brand || ad.title
  return () => Alert.alert(
    name,
    `${ad.description}\n\nNo direct booking link for this one yet. Message the UniBlueprint team and we'll connect you.`,
    [
      { text: 'Message the team', onPress: () => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Interested in: ' + name)) },
      { text: 'Close', style: 'cancel' },
    ],
  )
}

// ── Foundation Focus rotation — real Foundation services, real advice
// adapted from the corresponding website blog post. Two per issue, rotated
// by issue number so the page changes without anyone maintaining it weekly.
const FOUNDATION_TOPICS = [
  {
    service: 'CV Optimisation',
    tip: 'Unless you have five or more years of relevant experience, keep your CV to a single page. Recruiters are not looking for your life story, they are looking for evidence you can do the job. Tailor it every time: mirror the language in the job description, since Applicant Tracking Systems scan for keyword matches before a human ever reads it.',
  },
  {
    service: 'LinkedIn Optimisation',
    tip: 'Your headline is not just your job title, it is the one line that shows up in search results and under your name everywhere on the platform. Use it to say what you offer, not just what you\'re studying: "Business | Marketing & data analytics | Available from June 2026" tells a recruiter immediately whether to click through.',
  },
  {
    service: 'Interview Preparation',
    tip: 'The strongest interview answers use the STAR structure: Situation, Task, Action, Result. Prepare three or four real examples from your work, societies, or coursework in advance, so you\'re adapting a ready answer under pressure rather than building one from scratch.',
  },
]

const NAVY = colors.navy
const { width: SCREEN_W } = Dimensions.get('window')

// ── Post Ad Modal (unchanged mechanics — image upload, board selection) ────

function PostAdModal({ visible, onClose }) {
  const { user }                        = useAuth()
  const [title,       setTitle]         = useState('')
  const [description, setDescription]   = useState('')
  const [link,        setLink]          = useState('')
  const [boards,      setBoards]        = useState([])
  const [submitting,  setSubmitting]    = useState(false)
  const [imageUrl,    setImageUrl]      = useState(null)
  const [adImagePath, setAdImagePath]   = useState(null)

  useEffect(() => {
    if (visible && user?.id) {
      setAdImagePath(`${user.id}/${Date.now()}.jpg`)
      setImageUrl(null)
    }
  }, [visible, user?.id])

  function toggleBoard(key) {
    setBoards(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('ads').insert({
        user_id:     user?.id,
        title:       title.trim(),
        description: description.trim(),
        target_url:  link.trim() || null,
        boards,
        status:      'pending_review',
        active:      false,
        image_url:   imageUrl || null,
      })
      if (error) throw error
      setTitle(''); setDescription(''); setLink(''); setBoards([])
      setImageUrl(null)
      onClose()
      Alert.alert('Ad submitted', 'Your ad is in for review. It goes live once approved.')
    } catch {
      Alert.alert('Something went wrong', 'Your ad was not submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && boards.length > 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={m.container}>
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.headerTitle}>Post an Ad</Text>
              <Text style={m.headerSub}>Reach young people across Ireland</Text>
            </View>
            <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={15} color={colors.navy} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={m.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={m.label}>Ad Title</Text>
            <TextInput style={m.input} placeholder="e.g. Photography Sessions, €90 per shoot" placeholderTextColor={colors.light} value={title} onChangeText={setTitle} maxLength={80} />

            <Text style={[m.label, { marginTop: 20 }]}>Description</Text>
            <TextInput style={[m.input, m.textArea]} placeholder="Describe your service, pricing, location, and how to get in touch..." placeholderTextColor={colors.light} value={description} onChangeText={setDescription} multiline maxLength={300} textAlignVertical="top" />
            <Text style={m.charCount}>{description.length}/300</Text>

            <Text style={[m.label, { marginTop: 20 }]}>Link (optional)</Text>
            <TextInput style={m.input} placeholder="https://" placeholderTextColor={colors.light} value={link} onChangeText={setLink} keyboardType="url" autoCapitalize="none" autoCorrect={false} />

            <Text style={[m.label, { marginTop: 20 }]}>Image (optional)</Text>
            <Text style={m.boardHint}>Add a photo to make your ad stand out. JPG, PNG, or WebP, under 5 MB.</Text>
            {adImagePath && (
              <ImageUploader bucket="ad-images" storagePath={adImagePath} currentUrl={null} onUpload={url => setImageUrl(url)} label="" size={80} />
            )}

            <Text style={[m.label, { marginTop: 24 }]}>Post to</Text>
            <Text style={m.boardHint}>Select one or more boards. Your ad will appear wherever you choose. Marketplace is for goods and services you're offering or looking for.</Text>
            <View style={m.boardOptions}>
              {BOARDS.map(b => {
                const active = boards.includes(b.key)
                return (
                  <TouchableOpacity key={b.key} style={[m.boardOption, active && { borderColor: b.color }]} onPress={() => toggleBoard(b.key)} activeOpacity={0.8}>
                    <View style={[m.boardIconBox, { backgroundColor: active ? b.color : 'rgba(30,58,95,0.06)' }]}>
                      <b.Icon size={15} color={active ? colors.cream : colors.muted} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.boardLabel, active && { color: colors.navy }]}>{b.label}</Text>
                      <Text style={m.boardSub}>
                        {b.key === 'cross-ireland' ? 'Visible to all users across Ireland'
                          : b.key === 'campus' ? 'Visible on the Campus Connect board'
                          : b.key === 'course' ? 'Visible on the Course Connect board'
                          : 'Visible on the Marketplace page of the Weekly Blueprint'}
                      </Text>
                    </View>
                    <View style={[m.checkCircle, active && { backgroundColor: b.color, borderColor: b.color }]}>
                      {active && <View style={m.checkInner} />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity style={[m.submitBtn, (!canSubmit || submitting) && m.submitBtnDisabled]} onPress={handleSubmit} disabled={!canSubmit || submitting} activeOpacity={0.8}>
              <Text style={m.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Ad for Review'}</Text>
            </TouchableOpacity>
            <Text style={m.submitNote}>Ads are reviewed by the UniBlueprint team before going live. We'll be in touch within 24 hours.</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Small shared bits ───────────────────────────────────────────────────────

function EmptyNote({ children }) {
  return <Text style={styles.emptyNote}>{children}</Text>
}

function parsePipe(line) {
  return (line || '').split('|').map(s => s.trim())
}

// ── Page content ──────────────────────────────────────────────────────────

function PageContent({ page, navigation, onJump, onOpenPost, data, isPro }) {
  const { issue, content, deals, coaches, foundationTopics, lifestylePartners, marketplaceAds, curatedAds, liveBoardAds } = data
  const issueLabel = issue ? `ISSUE ${issue.issue_number}` : 'THIS WEEK'
  const theme = issue?.theme

  switch (page.type) {

    case 'cover':
      return (
        <LinearGradient colors={[shade(NAVY, -12), NAVY, shade(NAVY, 10)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.coverPage]}>
          <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>{issueLabel}</Text></View>
          <View style={{ flex: 1 }} />
          <UBPLogo height={30} color={colors.cream} />
          <View style={styles.coverRule} />
          <Text style={styles.coverTitle}>The{'\n'}Weekly{'\n'}Blueprint</Text>
          <Text style={styles.coverSub}>{theme || 'The structure behind your success.'}</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.coverSwipeHint}>
            <Text style={styles.coverSwipeText}>Swipe to open</Text>
            <ChevronRight size={13} color="rgba(245,240,232,0.6)" />
          </View>
        </LinearGradient>
      )

    case 'contents':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>YOUR BLUEPRINT THIS WEEK</Text>
          <Text style={styles.pageHeading}>What's inside</Text>
          <View style={{ gap: 2, marginTop: 22 }}>
            {page.entries.map(e => (
              <TouchableOpacity key={e.label} style={styles.tocRow} activeOpacity={0.7} onPress={() => onJump(e.page)}>
                <View style={styles.tocIconBox}><e.Icon size={14} color={colors.navy} /></View>
                <Text style={styles.tocLabel} numberOfLines={1}>{e.label}</Text>
                <Text style={styles.tocPageNum}>{e.page + 1}</Text>
                <ChevronRight size={13} color={colors.light} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.tocHint}>Tap a section to jump straight there.</Text>
        </View>
      )

    // ── Deals & Discounts ──────────────────────────────────────────────────
    case 'deals-1':
    case 'deals-2': {
      const half = Math.ceil(deals.length / 2)
      const slice = page.type === 'deals-1' ? deals.slice(0, half) : deals.slice(half)
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>{page.type === 'deals-1' ? "THIS WEEK'S DEALS" : 'MORE FOR LESS'}</Text>
          <Text style={styles.pageHeading}>{page.type === 'deals-1' ? 'Deals & Discounts' : 'More partners, more savings'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 18 }}>
            {slice.length === 0 ? (
              <EmptyNote>No live deals to show right now — check back soon.</EmptyNote>
            ) : slice.map(d => (
              <View key={d.id} style={styles.dealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealBrand}>{d.partners?.name || 'UniBlueprint Partner'}</Text>
                  <Text style={styles.dealTitle}>{d.title}</Text>
                  {!!d.description && <Text style={styles.dealDesc} numberOfLines={2}>{d.description}</Text>}
                </View>
                {d.discount_percent != null && (
                  <View style={styles.dealPercentBadge}><Text style={styles.dealPercentText}>{d.discount_percent}%</Text></View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )
    }

    case 'deal-room':
      return (
        <LinearGradient colors={[shade(NAVY, -10), NAVY, shade(NAVY, 12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.postPage]}>
          <View style={{ flex: 1 }} />
          <Crown size={34} color="#F5BA0B" strokeWidth={1.5} />
          <Text style={styles.postPageTitle}>The Deal Room</Text>
          <Text style={[styles.postPageBody, { marginTop: 10 }]}>
            {isPro
              ? 'You have full access. Every Lifestyle Partner deal is unlocked, not just Mental Health.'
              : 'Pro unlocks every Lifestyle Partner deal on the platform, not just Mental Health, which is always free for everyone.'}
          </Text>
          {!isPro && (
            <TouchableOpacity style={styles.postPageCta} activeOpacity={0.85} onPress={() => Linking.openURL(WEBSITE_LINKS.pricing)}>
              <Text style={styles.postPageCtaText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
        </LinearGradient>
      )

    // ── Coach Spotlight ─────────────────────────────────────────────────────
    case 'coach-1':
    case 'coach-2': {
      const coach = page.type === 'coach-1' ? coaches[0] : coaches[1]
      if (!coach) return <View style={styles.pageInner}><EmptyNote>No coach available this week.</EmptyNote></View>
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>COACH SPOTLIGHT</Text>
          <View style={styles.coachAvatarRing}><GraduationCap size={28} color={colors.navy} strokeWidth={1.5} /></View>
          <Text style={styles.coachName}>{coach.name}</Text>
          <Text style={styles.coachTitle}>{coach.title || coach.category}</Text>
          <Text style={styles.coachExpertise}>{coach.services?.[0] || coach.category}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
            <Text style={styles.coachBio}>{coach.bio}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.adRightCta}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate('Home', { screen: 'CoachProfile', params: { coach } })}
          >
            <Text style={styles.adRightCtaText}>View Coach Profile</Text>
            <ChevronRight size={14} color={colors.cream} />
          </TouchableOpacity>
        </View>
      )
    }

    // ── Foundation Blueprint ────────────────────────────────────────────────
    case 'foundation-1':
    case 'foundation-2': {
      const topic = page.type === 'foundation-1' ? foundationTopics[0] : foundationTopics[1]
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>{page.type === 'foundation-1' ? 'FOUNDATION FOCUS' : 'BUILD YOUR FOUNDATION'}</Text>
          <Text style={styles.pageHeading}>{topic.service}</Text>
          <Text style={styles.bodyText}>{topic.tip}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.needHelpLabel}>Need help with yours?</Text>
          <TouchableOpacity
            style={styles.adRightCta}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Foundation' })}
          >
            <Text style={styles.adRightCtaText}>Explore This Foundation Blueprint</Text>
            <ChevronRight size={14} color={colors.cream} />
          </TouchableOpacity>
        </View>
      )
    }

    // ── Campus Connect & Events ─────────────────────────────────────────────
    case 'campus-events-1':
    case 'campus-events-2': {
      const lines = (content.campus_events?.lines || []).filter(Boolean)
      const half = Math.ceil(lines.length / 2)
      const slice = page.type === 'campus-events-1' ? lines.slice(0, half) : lines.slice(half)
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>CAMPUS CONNECT</Text>
          <Text style={styles.pageHeading}>{page.type === 'campus-events-1' ? "What's happening on your campus?" : 'More across Ireland'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
            {slice.length === 0 ? (
              <EmptyNote>No campus events published for this issue yet.</EmptyNote>
            ) : slice.map((line, i) => {
              const [institution, event, date, location] = parsePipe(line)
              return (
                <View key={i} style={styles.eventRow}>
                  <Text style={styles.eventInstitution}>{institution}</Text>
                  <Text style={styles.eventTitle}>{event}</Text>
                  <View style={styles.eventMetaRow}>
                    {!!date && <Text style={styles.eventMeta}>{date}</Text>}
                    {!!location && <Text style={styles.eventMeta}>· {location}</Text>}
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </View>
      )
    }

    case 'campus-events-highlight': {
      const lines = (content.campus_events?.lines || []).filter(Boolean)
      const [institution, event, date, location] = parsePipe(lines[0])
      return (
        <LinearGradient colors={[shade('#B45309', -14), '#B45309', shade('#B45309', 14)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.dividerPage]}>
          <View style={{ flex: 1 }} />
          <CalendarClock size={34} color="rgba(245,240,232,0.95)" strokeWidth={1.5} />
          <Text style={styles.pageKickerLight}>CAMPUS CONNECT: THIS WEEK</Text>
          {lines.length === 0 ? (
            <Text style={styles.dividerSub}>No highlighted event for this issue yet.</Text>
          ) : (
            <>
              <Text style={styles.dividerTitle}>{event}</Text>
              <Text style={styles.dividerSub}>{institution}{date ? ` · ${date}` : ''}{location ? ` · ${location}` : ''}</Text>
            </>
          )}
          <View style={{ flex: 1 }} />
        </LinearGradient>
      )
    }

    case 'off-campus': {
      const lines = (content.campus_events?.lines || []).filter(Boolean)
      const byCity = {}
      lines.forEach(line => {
        const [, event, date, location] = parsePipe(line)
        const city = location || 'Ireland'
        if (!byCity[city]) byCity[city] = []
        byCity[city].push({ event, date })
      })
      const cities = Object.keys(byCity)
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>TAKING A TRIP OFF CAMPUS?</Text>
          <Text style={styles.pageHeading}>What's on around Ireland</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
            {cities.length === 0 ? (
              <EmptyNote>Nothing published for this issue yet.</EmptyNote>
            ) : cities.map(city => (
              <View key={city} style={{ marginBottom: 14 }}>
                <Text style={styles.cityLabel}>{city}</Text>
                {byCity[city].map((e, i) => (
                  <Text key={i} style={styles.cityEvent}>{e.event}{e.date ? ` · ${e.date}` : ''}</Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )
    }

    // ── Student Spotlight ────────────────────────────────────────────────────
    case 'student-spotlight-grid': {
      const lines = (content.student_spotlight?.lines || []).filter(Boolean)
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THIS WEEK'S STUDENT STORIES</Text>
          <Text style={styles.pageHeading}>Student Spotlight</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
            {lines.length === 0 ? (
              <EmptyNote>No student stories published for this issue yet.</EmptyNote>
            ) : lines.map((line, i) => {
              const [name, headline, teaser] = parsePipe(line)
              return (
                <View key={i} style={styles.storyCard}>
                  <Text style={styles.storyName}>{name}</Text>
                  <Text style={styles.storyHeadline}>{headline}</Text>
                  {!!teaser && <Text style={styles.storyTeaser} numberOfLines={2}>{teaser}</Text>}
                </View>
              )
            })}
          </ScrollView>
        </View>
      )
    }

    case 'student-spotlight-featured': {
      const s = content.student_spotlight || {}
      const hasFeatured = !!s.featuredName
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>STUDENT STORY</Text>
          {!hasFeatured ? (
            <EmptyNote>No featured story published for this issue yet.</EmptyNote>
          ) : (
            <>
              <Text style={styles.storyQuote}>"{s.featuredTeaser}"</Text>
              <Text style={styles.storyByline}>— {s.featuredName}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.needHelpLabel}>Want to read the rest?</Text>
              <TouchableOpacity
                style={styles.adRightCta}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(s.featuredSlug ? `${WEBSITE_LINKS.blog}/${s.featuredSlug}` : WEBSITE_LINKS.blog)}
              >
                <Text style={styles.adRightCtaText}>Read the Full Story</Text>
                <ChevronRight size={14} color={colors.cream} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )
    }

    // ── Campus Guide ─────────────────────────────────────────────────────────
    case 'campus-guide': {
      const g = content.campus_guide || {}
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THIS WEEK'S CAMPUS GUIDE</Text>
          {!g.title ? (
            <EmptyNote>No campus guide published for this issue yet.</EmptyNote>
          ) : (
            <>
              <Text style={styles.pageHeading}>{g.title}</Text>
              <ScrollView showsVerticalScrollIndicator={false}><Text style={styles.bodyText}>{g.body}</Text></ScrollView>
              <Text style={styles.needHelpLabel}>There's more to this guide...</Text>
              <TouchableOpacity
                style={styles.adRightCta}
                activeOpacity={0.85}
                onPress={() => navigation.getParent()?.navigate('Home', { screen: 'CampusConnect' })}
              >
                <Text style={styles.adRightCtaText}>Find Out More in Campus Connect</Text>
                <ChevronRight size={14} color={colors.cream} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )
    }

    // ── Lifestyle Edit ───────────────────────────────────────────────────────
    case 'lifestyle-edit':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THE LIFESTYLE EDIT</Text>
          <Text style={styles.pageHeading}>{lifestylePartners.length ? 'This week in fashion' : 'Coming soon'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
            {lifestylePartners.length === 0 ? (
              <EmptyNote>No Lifestyle fashion partners live yet — check back soon.</EmptyNote>
            ) : lifestylePartners.map(p => (
              <TouchableOpacity key={p.id} style={styles.dealRow} activeOpacity={0.8} onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Lifestyle' })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealBrand}>{p.brand}</Text>
                  <Text style={styles.dealTitle}>{p.tagline || p.category}</Text>
                  {!!p.deal && <Text style={styles.dealDesc}>{p.deal}</Text>}
                </View>
                <ChevronRight size={14} color={colors.light} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )

    // ── Marketplace ──────────────────────────────────────────────────────────
    case 'marketplace':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THE UBP MARKETPLACE</Text>
          <Text style={styles.pageHeading}>Offer a skill. Find a service.</Text>
          <Text style={[styles.bodyText, { marginTop: 4 }]}>
            Photography, tutoring, graphic design, hair and beauty, freelancing: put your skills in
            front of the UBP community, or find someone who has what you need.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
            {marketplaceAds.length === 0 ? (
              <EmptyNote>No marketplace listings yet. Be the first to post one.</EmptyNote>
            ) : marketplaceAds.map(ad => (
              <View key={ad.id} style={styles.dealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealTitle}>{ad.title}</Text>
                  <Text style={styles.dealDesc} numberOfLines={2}>{ad.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={onOpenPost}>
            <Plus size={14} color={colors.navy} strokeWidth={2.5} />
            <Text style={styles.secondaryCtaText}>Visit the Marketplace</Text>
          </TouchableOpacity>
        </View>
      )

    // ── UBP Team ─────────────────────────────────────────────────────────────
    case 'team': {
      const t = content.team || {}
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>BUILD WITH UBP</Text>
          <Text style={styles.pageHeading}>Meet the Team</Text>
          {!t.name ? (
            <EmptyNote>No team spotlight published for this issue yet.</EmptyNote>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.storyName}>{t.name}</Text>
              <Text style={styles.coachExpertise}>{t.role}</Text>
              <Text style={[styles.bodyText, { marginTop: 10 }]}>{t.intro}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={styles.needHelpLabel}>Think you could contribute to UBP?</Text>
          <TouchableOpacity style={styles.adRightCta} activeOpacity={0.85} onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Join the UniBlueprint Team'))}>
            <Text style={styles.adRightCtaText}>Join the Team</Text>
            <ChevronRight size={14} color={colors.cream} />
          </TouchableOpacity>
        </View>
      )
    }

    // ── Money Moves ──────────────────────────────────────────────────────────
    case 'money-moves': {
      const mm = content.money_moves || {}
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THIS WEEK'S FINANCIAL TIP</Text>
          <Text style={styles.pageHeading}>Money Moves</Text>
          {!mm.tip ? (
            <EmptyNote>No financial tip published for this issue yet.</EmptyNote>
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false}><Text style={styles.bodyText}>{mm.tip}</Text></ScrollView>
              <Text style={styles.coachExpertise}>— {mm.coachName || 'UniBlueprint Investment Coach'}</Text>
            </>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Budgeting' })}>
            <Wallet size={14} color={colors.navy} strokeWidth={2} />
            <Text style={styles.secondaryCtaText}>Open the Budgeting Tool</Text>
          </TouchableOpacity>
        </View>
      )
    }

    // ── The Coach Board ──────────────────────────────────────────────────────
    case 'coach-board': {
      const lines = (content.coach_board?.lines || []).filter(Boolean)
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>ONE TIP. MULTIPLE COACHES.</Text>
          <Text style={styles.pageHeading}>The Coach Board</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
            {lines.length === 0 ? (
              <EmptyNote>No coach tips published for this issue yet.</EmptyNote>
            ) : lines.map((line, i) => {
              const [name, role, quote] = parsePipe(line)
              return (
                <View key={i} style={styles.quoteCard}>
                  <Text style={styles.quoteRole}>{(role || '').toUpperCase()}</Text>
                  <Text style={styles.quoteText}>{quote}</Text>
                  <Text style={styles.quoteName}>— {name}</Text>
                </View>
              )
            })}
          </ScrollView>
        </View>
      )
    }

    // ── UBP Board / Week Ahead ───────────────────────────────────────────────
    case 'ubp-board':
    case 'week-ahead': {
      const key = page.type === 'ubp-board' ? 'ubp_board' : 'week_ahead'
      const lines = (content[key]?.lines || []).filter(Boolean)
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>{page.type === 'ubp-board' ? "WHAT'S HAPPENING AT UBP?" : 'PLAN AHEAD'}</Text>
          <Text style={styles.pageHeading}>{page.type === 'ubp-board' ? 'The UBP Board' : 'The Week Ahead'}</Text>
          <View style={{ gap: 14, marginTop: 20 }}>
            {lines.length === 0 ? (
              <EmptyNote>Nothing published for this issue yet.</EmptyNote>
            ) : lines.map((line, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>
      )
    }

    // ── The Ad Board ──────────────────────────────────────────────────────────
    case 'ad-board':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THIS WEEK'S AD BOARD</Text>
          <Text style={styles.pageHeading}>The Ad Board</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 14 }}>
            {[...curatedAds, ...liveBoardAds].length === 0 ? (
              <EmptyNote>No ads live right now — be the first to post one.</EmptyNote>
            ) : [...curatedAds, ...liveBoardAds].map(ad => {
              const cat = ad.category ? CATEGORY[ad.category] : null
              return (
                <TouchableOpacity key={ad.id} style={styles.adBoardRow} activeOpacity={0.8} onPress={getAdPressHandler(ad, navigation)}>
                  <View style={[styles.adBoardIcon, { backgroundColor: cat?.bg || '#F5F0E8' }]}>
                    {cat ? <cat.Icon size={16} color={cat.color} strokeWidth={1.8} /> : <Megaphone size={16} color={colors.navy} strokeWidth={1.8} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dealBrand}>{ad.brand || ad.title}</Text>
                    <Text style={styles.dealTitle} numberOfLines={1}>{ad.title}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={onOpenPost}>
            <Plus size={14} color={colors.navy} strokeWidth={2.5} />
            <Text style={styles.secondaryCtaText}>Advertise With Us</Text>
          </TouchableOpacity>
        </View>
      )

    // ── Blueprint Feature ─────────────────────────────────────────────────────
    case 'blueprint-feature': {
      const bf = content.blueprint_feature || {}
      return (
        <LinearGradient colors={[shade(NAVY, -10), NAVY, shade(NAVY, 12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.postPage]}>
          <View style={{ flex: 1 }} />
          <Award size={32} color={colors.cream} strokeWidth={1.5} />
          {!bf.title ? (
            <Text style={[styles.postPageBody, { marginTop: 12 }]}>No feature published for this issue yet.</Text>
          ) : (
            <>
              {!!bf.kicker && <Text style={styles.pageKickerLight}>{bf.kicker.toUpperCase()}</Text>}
              <Text style={styles.postPageTitle}>{bf.title}</Text>
              <Text style={[styles.postPageBody, { marginTop: 10 }]}>{bf.body}</Text>
            </>
          )}
          <View style={{ flex: 1 }} />
        </LinearGradient>
      )
    }

    // ── Founders' Note ────────────────────────────────────────────────────────
    case 'founders-note': {
      const fn = content.founders_note || {}
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THE FOUNDERS' NOTE</Text>
          <Text style={styles.pageHeading}>A word from the founders</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 14 }}>
            {!fn.body ? <EmptyNote>No founders' note published for this issue yet.</EmptyNote> : <Text style={styles.bodyText}>{fn.body}</Text>}
          </ScrollView>
        </View>
      )
    }

    case 'closing':
      return (
        <LinearGradient colors={[shade(NAVY, 10), NAVY, shade(NAVY, -12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.coverPage]}>
          <View style={{ flex: 1 }} />
          <UBPLogo height={26} color={colors.cream} />
          <Text style={styles.closingBig}>That's a wrap.</Text>
          <Text style={styles.backCoverText}>
            Thanks for spending part of your week with us.{'\n'}Keep building. Keep learning. Keep moving forward.{'\n\n'}We'll see you next week.
          </Text>
          <View style={{ flex: 1 }} />
        </LinearGradient>
      )

    default:
      return null
  }
}

// ── Page wrapper — swipe/turn animation (unchanged) ──────────────────────────

function MagazinePage({ page, index, scrollX, navigation, onJump, onOpenPost, data, isPro }) {
  const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W]
  const rotateY = scrollX.interpolate({ inputRange, outputRange: ['6deg', '0deg', '-6deg'], extrapolate: 'clamp' })
  const scale   = scrollX.interpolate({ inputRange, outputRange: [0.95, 1, 0.95], extrapolate: 'clamp' })
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.75, 1, 0.75], extrapolate: 'clamp' })

  return (
    <Animated.View style={[styles.page, { transform: [{ perspective: 900 }, { rotateY }, { scale }], opacity }]}>
      <PageContent page={page} navigation={navigation} onJump={onJump} onOpenPost={onOpenPost} data={data} isPro={isPro} />
    </Animated.View>
  )
}

// ── Fixed 27-page structure ──────────────────────────────────────────────────

function buildPages() {
  const pages = [
    { type: 'cover' },
    { type: 'contents', entries: [] },
    { type: 'deals-1' }, { type: 'deals-2' }, { type: 'deal-room' },
    { type: 'coach-1' }, { type: 'coach-2' },
    { type: 'foundation-1' }, { type: 'foundation-2' },
    { type: 'campus-events-1' }, { type: 'campus-events-2' }, { type: 'campus-events-highlight' }, { type: 'off-campus' },
    { type: 'student-spotlight-grid' }, { type: 'student-spotlight-featured' },
    { type: 'campus-guide' },
    { type: 'lifestyle-edit' },
    { type: 'marketplace' },
    { type: 'team' },
    { type: 'money-moves' },
    { type: 'coach-board' },
    { type: 'ubp-board' },
    { type: 'week-ahead' },
    { type: 'ad-board' },
    { type: 'blueprint-feature' },
    { type: 'founders-note' },
    { type: 'closing' },
  ]
  const toc = pages[1]
  const idx = t => pages.findIndex(p => p.type === t)
  toc.entries.push(
    { label: 'Deals & Discounts', Icon: Star,          page: idx('deals-1') },
    { label: 'Coach Spotlights',  Icon: GraduationCap,  page: idx('coach-1') },
    { label: 'Foundation Focus',  Icon: Award,          page: idx('foundation-1') },
    { label: 'Campus Connect',    Icon: Building2,      page: idx('campus-events-1') },
    { label: 'Student Spotlight', Icon: Newspaper,      page: idx('student-spotlight-grid') },
    { label: 'Campus Guide',      Icon: MapPin,         page: idx('campus-guide') },
    { label: 'Lifestyle Edit',    Icon: Sparkles,       page: idx('lifestyle-edit') },
    { label: 'Marketplace',       Icon: ShoppingBag,    page: idx('marketplace') },
    { label: 'UBP Team',          Icon: Users,          page: idx('team') },
    { label: 'Money Moves',       Icon: Wallet,         page: idx('money-moves') },
    { label: 'Coach Board',       Icon: Heart,          page: idx('coach-board') },
    { label: 'Ad Board',          Icon: Megaphone,      page: idx('ad-board') },
  )
  return pages
}

const PAGES = buildPages()

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AdBoardScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { isPro } = useAuth()
  const [modalVisible, setModalVisible] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [screenData, setScreenData] = useState({
    issue: null, content: {}, deals: [], coaches: [], foundationTopics: FOUNDATION_TOPICS.slice(0, 2),
    lifestylePartners: [], marketplaceAds: [], curatedAds: CURATED_ADS, liveBoardAds: [],
  })
  const scrollRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [issueRes, dealsRes, marketplaceRes, liveAdsRes] = await Promise.all([
        supabase.rpc('get_current_weekly_issue'),
        supabase.from('deals').select('*, partners(name, type)').eq('active', true),
        supabase.from('ads').select('*').eq('active', true).contains('boards', ['marketplace']),
        supabase.from('ads').select('*').eq('active', true).overlaps('boards', ['cross-ireland', 'campus', 'course']),
      ])
      if (cancelled) return

      const issue = issueRes.data?.[0] || null
      const content = issue?.content || {}
      const issueNumber = issue?.issue_number ?? 1

      const eligibleCoaches = COACHES.filter(c => !c.shell && c.bio)
      const c1 = eligibleCoaches[issueNumber % eligibleCoaches.length]
      const c2 = eligibleCoaches[(issueNumber + 1) % eligibleCoaches.length]

      const fTopics = [
        FOUNDATION_TOPICS[issueNumber % FOUNDATION_TOPICS.length],
        FOUNDATION_TOPICS[(issueNumber + 1) % FOUNDATION_TOPICS.length],
      ]

      setScreenData({
        issue,
        content,
        deals: dealsRes.data || [],
        coaches: [c1, c2].filter(Boolean),
        foundationTopics: fTopics,
        lifestylePartners: PARTNERS.filter(p => p.filterKey === 'fashion' && p.status === 'live'),
        marketplaceAds: marketplaceRes.data || [],
        curatedAds: CURATED_ADS,
        liveBoardAds: liveAdsRes.data || [],
      })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  function jumpTo(index) {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <UBPLogo height={24} color={colors.cream} />
        <Text style={styles.topBarPageNum}>{pageIndex + 1} / {PAGES.length}</Text>
        <TouchableOpacity style={styles.postBtn} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Plus size={14} color={colors.navy} strokeWidth={2.5} />
          <Text style={styles.postBtnText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <UBPLogo height={26} color={colors.navy} />
        </View>
      ) : (
        <>
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
            {PAGES.map((page, i) => (
              <MagazinePage
                key={i}
                page={page}
                index={i}
                scrollX={scrollX}
                navigation={navigation}
                onJump={jumpTo}
                onOpenPost={() => { setModalVisible(true) }}
                data={screenData}
                isPro={isPro}
              />
            ))}
          </Animated.ScrollView>

          <View style={[styles.pagerControls, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={styles.pagerBtn} activeOpacity={0.7} onPress={() => jumpTo(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeft size={18} color={pageIndex === 0 ? colors.light : colors.navy} />
            </TouchableOpacity>
            <View style={styles.pagerTrack}>
              <View style={[styles.pagerFill, { width: `${((pageIndex + 1) / PAGES.length) * 100}%` }]} />
            </View>
            <TouchableOpacity style={styles.pagerBtn} activeOpacity={0.7} onPress={() => jumpTo(Math.min(PAGES.length - 1, pageIndex + 1))} disabled={pageIndex === PAGES.length - 1} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronRight size={18} color={pageIndex === PAGES.length - 1 ? colors.light : colors.navy} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <PostAdModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: NAVY, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  topBarPageNum: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.5)', fontVariant: ['tabular-nums'] },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: NAVY },

  page: { width: SCREEN_W, flex: 1 },
  pageInner: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  pageKicker: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  pageKickerLight: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14 },
  pageHeading: { fontFamily: fonts.serif, fontSize: 25, color: NAVY, marginTop: 8, lineHeight: 32 },
  bodyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 12, lineHeight: 22 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.light, fontStyle: 'italic', marginTop: 14 },
  needHelpLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: NAVY, marginBottom: 10 },

  // Cover / closing
  coverPage: { alignItems: 'flex-start' },
  coverBadge: { backgroundColor: 'rgba(245,240,232,0.12)', borderWidth: 1, borderColor: 'rgba(245,240,232,0.25)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  coverBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.75)', letterSpacing: 1 },
  coverRule: { width: 40, height: 2, borderRadius: 1, backgroundColor: 'rgba(245,240,232,0.35)', marginTop: 18 },
  coverTitle: { fontFamily: fonts.serif, fontSize: 42, color: colors.cream, marginTop: 16, lineHeight: 48 },
  coverSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.6)', marginTop: 14, lineHeight: 21, maxWidth: '86%' },
  coverSwipeHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coverSwipeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
  backCoverText: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.65)', marginTop: 14, lineHeight: 22, textAlign: 'center' },
  closingBig: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginTop: 14 },

  // TOC
  tocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)' },
  tocIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tocLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: NAVY, flex: 1 },
  tocPageNum: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, fontVariant: ['tabular-nums'] },
  tocHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 18, lineHeight: 17, fontStyle: 'italic' },

  // Divider-style pages (highlight, etc.)
  dividerPage: { alignItems: 'center' },
  dividerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, marginTop: 16, textAlign: 'center' },
  dividerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 6, textAlign: 'center' },

  // Deals
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  dealBrand: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dealTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: NAVY, marginTop: 2 },
  dealDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 17 },
  dealPercentBadge: { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  dealPercentText: { fontFamily: fonts.sansBold, fontSize: 13, color: NAVY },

  // Coach spotlight
  coachAvatarRing: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  coachName: { fontFamily: fonts.serif, fontSize: 22, color: NAVY, marginTop: 12 },
  coachTitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  coachExpertise: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: NAVY, marginTop: 8 },
  coachBio: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.muted, lineHeight: 21 },

  // CTA pill (reused across many pages)
  adRightCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: NAVY, borderRadius: radius.button, paddingVertical: 13, marginTop: 4,
  },
  adRightCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.cream },
  secondaryCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)', borderRadius: radius.button, paddingVertical: 12, marginTop: 12,
  },
  secondaryCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: NAVY },

  // Events
  eventRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  eventInstitution: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: NAVY, marginTop: 3 },
  eventMetaRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  eventMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  cityLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: NAVY, marginBottom: 4 },
  cityEvent: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginBottom: 3, lineHeight: 18 },

  // Student spotlight
  storyCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  storyName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: NAVY },
  storyHeadline: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  storyTeaser: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 4, lineHeight: 17 },
  storyQuote: { fontFamily: fonts.serif, fontSize: 20, color: NAVY, marginTop: 20, lineHeight: 28, fontStyle: 'italic' },
  storyByline: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted, marginTop: 10 },

  // Quotes (coach board)
  quoteCard: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  quoteRole: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.muted, letterSpacing: 0.6 },
  quoteText: { fontFamily: fonts.serif, fontSize: 16, color: NAVY, marginTop: 4, lineHeight: 22 },
  quoteName: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 4 },

  // Ad Board list
  adBoardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  adBoardIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Bullets (UBP board / week ahead)
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NAVY, marginTop: 7, flexShrink: 0 },
  bulletText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, flex: 1, lineHeight: 21 },

  // Post/upsell gradient pages
  postPage: { backgroundColor: NAVY, alignItems: 'center' },
  postPageTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.cream, marginTop: 10, textAlign: 'center', lineHeight: 30 },
  postPageBody: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.75)', textAlign: 'center', lineHeight: 20, maxWidth: '90%' },
  postPageCta: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 13, marginTop: 18 },
  postPageCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: NAVY },

  // Pager controls
  pagerControls: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingTop: 12, backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  pagerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pagerTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(30,58,95,0.1)', overflow: 'hidden' },
  pagerFill: { height: 4, borderRadius: 2, backgroundColor: NAVY },
})

// ── Modal styles ──────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  headerSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.55)', marginTop: 4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  scroll: { padding: 20, paddingBottom: 60 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  input: { backgroundColor: colors.white, borderRadius: radius.button, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)', paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.sans, fontSize: 14, color: NAVY },
  textArea: { height: 110, paddingTop: 12 },
  charCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'right', marginTop: 5 },
  boardHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 12 },
  boardOptions: { gap: 10 },
  boardOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.1)', padding: 14 },
  boardIconBox: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  boardLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted, marginBottom: 2 },
  boardSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, lineHeight: 17 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cream },
  submitBtn: { marginTop: 28, backgroundColor: NAVY, borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  submitNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, textAlign: 'center', marginTop: 14, lineHeight: 18 },
})
