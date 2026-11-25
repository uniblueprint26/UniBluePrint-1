import { useState, useEffect, useRef, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Linking, Image,
  Animated, Dimensions, StyleSheet, Platform, AccessibilityInfo,
} from 'react-native'
import Reanimated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Clipboard from 'expo-clipboard'
import {
  Plus, ChevronRight, ChevronLeft, Megaphone, Tag, Star, Crown, Menu,
  MapPin, Users, Wallet, Newspaper, Award, Heart, Clock, BookOpen,
  Building2, GraduationCap, Sparkles, ShoppingBag,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import PostAdModal from '../components/ads/PostAdModal'
import PartnerContactModal from '../components/ads/PartnerContactModal'
import { supabase } from '../lib/supabase'
import { fonts, spacing, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { openMenu } from '../navigation/helpers'
import { useLightBackgroundStatusBar } from '../hooks/useStatusBarStyle'
import { useAuth } from '../context/AuthContext'
import { WEBSITE_LINKS } from '../constants/site'
import { NATIVE_NEUTRAL_BILLING } from '../constants/platformPolicy'
import { useFoundationEnabled } from '../hooks/useAppFlags'
import { COACHES } from './ElevationScreen'
import { PARTNERS } from '../data/lifestylePartners'
import { getPosts, calcReadTime, formatDate } from '../data/blogPosts'
import { isRealDeal } from '../lib/adBoard'
import { getPartnerDeals, isListedPartner } from '../lib/partnerDeals'
import { CATEGORY, CURATED_ADS } from '../data/adBoardAds'
import { SUPPORT_EMAIL } from '../constants/site'
import { WrappedPage, WrappedCover } from '../components/wrapped/WrappedPages'
import { normaliseWrapped } from '../lib/wrapped'

// ─── The Weekly Blueprint ───────────────────────────────────────────────────
// Issue 1 is the one time Ireland Wrapped look back: when issue.content.wrapped
// has pages (see docs/release/weekly-issue-1/wrapped-schema.md) they sit after
// the cover and contents, drawn by components/wrapped/WrappedPages.jsx. Only
// pages near the open one are mounted, so about 100 pages stay light. Standard
// editorial pages are left out when the issue has no content for them.
//
// A fixed 26-page structure (see the spec Desmond sent — same page order
// every week, content rotates). Most pages pull from data that's real
// elsewhere in the app already (coaches, Lifestyle partners, Foundation
// services, live deals, posted ads); the handful of genuinely one-off
// editorial pages (campus events, student spotlight, campus guide, team,
// coach board, UBP board, week ahead, blueprint feature, founders' note,
// money moves) come from weekly_issue_content, written by Operations/Founder
// through WeeklyIssueEditorScreen.jsx — never fabricated here.
//
// Reached from AdBoardScreen's "Open This Week's Issue" button, not scrolled
// into the Ad Board page itself. Reading position (which page the reader was
// on) is synced to their account via weekly_issue_reading_progress so
// reopening the magazine resumes where they left off, on any device.

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
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

const { width: SCREEN_W } = Dimensions.get('window')
// The true page turn needs reanimated. If it is missing, the hinge and fade runs.
// Only pages this close to the open one are mounted (the issue can be about 100 pages).
const NEAR = 2
const TURN_OK = typeof Reanimated?.View !== 'undefined' && typeof useSharedValue === 'function'

// ── Small shared bits ───────────────────────────────────────────────────────

function EmptyNote({ children }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return <Text style={styles.emptyNote}>{children}</Text>
}

function parsePipe(line) {
  return (line || '').split('|').map(s => s.trim())
}

// ── Page content ──────────────────────────────────────────────────────────

function PageContent({ page, navigation, onJump, onOpenPost, data, isPro }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const { issue, content, deals, coaches, foundationTopics, lifestylePartners, marketplaceAds, curatedAds, liveBoardAds } = data
  const issueLabel = issue ? `ISSUE ${issue.issue_number}` : 'THIS WEEK'
  const theme = issue?.theme
  // Ad Board page only: same branded contact card as AdBoardScreen.jsx,
  // reading real contact info from the backend (see PartnerContactModal /
  // hooks/usePartnerContact.js) instead of the old Alert.alert() fallback
  // that used to read ad.contact straight off CURATED_ADS.
  const [contactAd, setContactAd] = useState(null)

  switch (page.type) {

    case 'cover':
      return (
        <TouchableOpacity activeOpacity={0.96} style={{ flex: 1 }} onPress={() => onJump(1)} accessibilityRole="button" accessibilityLabel="Open the issue">
          <LinearGradient colors={['#0F2240', '#1B3659', '#26486F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.coverPage]}>
            <View style={styles.coverSpineBand} pointerEvents="none">
              {[0, 1, 2].map(i => <View key={i} style={styles.coverStitch} />)}
            </View>
            <View style={styles.coverFrame} pointerEvents="none" />
            <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>{issueLabel}</Text></View>
            <View style={{ flex: 1 }} />
            <UBPLogo height={30} color="#F5F0E8" />
            <View style={styles.coverRule} />
            <Text style={styles.coverTitle}>The{'\n'}Weekly{'\n'}Blueprint</Text>
            <Text style={styles.coverSub}>{theme || 'The structure behind your success.'}</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.coverOpenBtn}>
              <Text style={styles.coverOpenText}>Open the issue</Text>
              <ChevronRight size={16} color="#1E3A5F" strokeWidth={2.4} />
            </View>
            <Text style={styles.coverSwipeText}>Or swipe to turn the page</Text>
          </LinearGradient>
        </TouchableOpacity>
      )

    // Ireland Wrapped cover (issue data: theme and issue number).
    case 'wrapped-cover':
      return <WrappedCover wrapped={data.wrapped} issue={issue} onOpen={() => onJump(1)} />

    // One Wrapped page. page.w is the cleaned page, page.section its section.
    case 'wrapped':
      return (
        <WrappedPage
          page={page.w}
          section={page.section}
          navigation={navigation}
          allPages={data.wrapped}
          pageKey={`${issue?.id || 'issue'}:${page.n}`}
          onJump={onJump}
        />
      )

    case 'contents':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>{data.wrapped ? 'EVERYTHING IN THIS ISSUE' : 'YOUR BLUEPRINT THIS WEEK'}</Text>
          <Text style={styles.pageHeading}>What's inside</Text>
          <View style={styles.tocSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {page.entries.map((e, n) => (
                <TouchableOpacity key={`${n}:${e.label}`} style={[styles.tocRow, n > 0 && styles.tocRowBorder]} activeOpacity={0.7} onPress={() => onJump(e.page)}>
                  <Text style={styles.tocNum}>{String(n + 1).padStart(2, '0')}</Text>
                  {!!e.accent && <View style={[styles.tocDot, { backgroundColor: e.accent }]} />}
                  <Text style={styles.tocLabel} numberOfLines={1}>{e.label}</Text>
                  <View style={styles.tocLeader} />
                  <Text style={styles.tocPageNum}>{e.page + 1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <Text style={styles.tocHint}>Tap a section to turn straight to it.</Text>
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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 18 }}>
            {slice.length === 0 ? (
              <EmptyNote>No live deals to show right now. Check back soon.</EmptyNote>
            ) : slice.map(d => (
              <View key={d.key} style={styles.dealRow}>
                {d.logo ? (
                  <View style={styles.dealLogo}><Image source={d.logo} style={styles.dealLogoImg} resizeMode="contain" /></View>
                ) : d.initials ? (
                  <View style={[styles.dealLogo, { backgroundColor: d.initBg }]}><Text style={styles.dealMono}>{d.initials}</Text></View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealBrand}>{d.brand}</Text>
                  <Text style={styles.dealTitle}>{d.text}</Text>
                  {!!d.description && <Text style={styles.dealDesc} numberOfLines={2}>{d.description}</Text>}
                  {!!d.code && (
                    <View style={styles.dealCodeRow}>
                      <Text style={styles.dealCode} selectable>{d.code}</Text>
                      <TouchableOpacity
                        onPress={() => { Clipboard.setStringAsync(d.code).catch(() => {}) }}
                        accessibilityRole="button" accessibilityLabel={`Copy code ${d.code}`}
                        style={styles.dealCopy}
                      >
                        <Text style={styles.dealCopyText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )
    }

    case 'deal-room':
      return (
        <LinearGradient colors={[shade(colors.chromeBg, -10), colors.chromeBg, shade(colors.chromeBg, 12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.postPage]}>
          <View style={{ flex: 1 }} />
          <Crown size={34} color="#F5BA0B" strokeWidth={1.5} />
          <Text style={styles.postPageTitle}>The Deal Room</Text>
          <Text style={[styles.postPageBody, { marginTop: 10 }]}>
            {isPro
              ? 'You have full access. Every Lifestyle Partner deal is unlocked, not just Mental Health.'
              : 'Pro unlocks every Lifestyle Partner deal on the platform, not just Mental Health, which is always free for everyone.'}
          </Text>
          {/* iOS and Android: no purchase CTA in the app, status only (neutral billing). */}
          {!isPro && !NATIVE_NEUTRAL_BILLING && (
            <TouchableOpacity style={styles.postPageCta} activeOpacity={0.85} onPress={() => Linking.openURL(WEBSITE_LINKS.pricing)}>
              <Text style={styles.postPageCtaText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
          {!isPro && NATIVE_NEUTRAL_BILLING && (
            <Text style={[styles.postPageBody, { fontSize: 12.5, opacity: 0.7 }]}>Manage your plan on uniblueprint.ie</Text>
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
          <View style={styles.coachAvatarRing}><GraduationCap size={28} color={colors.textPrimary} strokeWidth={1.5} /></View>
          <Text style={styles.coachName}>{coach.name}</Text>
          <Text style={styles.coachTitle}>{coach.title || coach.category}</Text>
          <Text style={styles.coachExpertise}>{coach.services?.[0] || coach.category}</Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 12 }}>
            <Text style={styles.coachBio}>{coach.bio}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.adRightCta}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate('Home', { screen: 'CoachProfile', params: { coach } })}
          >
            <Text style={styles.adRightCtaText}>View Coach Profile</Text>
            <ChevronRight size={14} color={colors.accentFg} />
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
            <ChevronRight size={14} color={colors.accentFg} />
          </TouchableOpacity>
        </View>
      )
    }

    // ── Campus Connect & Events ─────────────────────────────────────────────
    // The week's top event used to get its own standalone divider page
    // (campus-events-highlight) repeating the same first entry shown just
    // below in the list — pure duplication of a single line. Folded into a
    // highlight card at the top of campus-events-1 instead: same "here's
    // the one to know about" treatment, no information lost, one fewer page.
    case 'campus-events-1':
    case 'campus-events-2': {
      const lines = (content.campus_events?.lines || []).filter(Boolean)
      const half = Math.ceil(lines.length / 2)
      const slice = page.type === 'campus-events-1' ? lines.slice(0, half) : lines.slice(half)
      const [hInstitution, hEvent, hDate, hLocation] = page.type === 'campus-events-1' ? parsePipe(lines[0]) : []
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>CAMPUS CONNECT</Text>
          <Text style={styles.pageHeading}>{page.type === 'campus-events-1' ? "What's happening on your campus?" : 'More across Ireland'}</Text>
          {page.type === 'campus-events-1' && !!hEvent && (
            <View style={styles.eventHighlightCard}>
              <Text style={styles.eventHighlightKicker}>THIS WEEK'S TOP EVENT</Text>
              <Text style={styles.eventHighlightTitle}>{hEvent}</Text>
              <Text style={styles.eventHighlightSub}>{hInstitution}{hDate ? ` · ${hDate}` : ''}{hLocation ? ` · ${hLocation}` : ''}</Text>
            </View>
          )}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 16 }}>
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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 16 }}>
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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 16 }}>
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
                <ChevronRight size={14} color={colors.accentFg} />
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
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}><Text style={styles.bodyText}>{g.body}</Text></ScrollView>
              <Text style={styles.needHelpLabel}>There's more to this guide...</Text>
              <TouchableOpacity
                style={styles.adRightCta}
                activeOpacity={0.85}
                onPress={() => navigation.getParent()?.navigate('Home', { screen: 'CampusConnect' })}
              >
                <Text style={styles.adRightCtaText}>Find Out More in Campus Connect</Text>
                <ChevronRight size={14} color={colors.accentFg} />
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
          <Text style={styles.pageHeading}>This week in fashion</Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 16 }}>
            {lifestylePartners.length === 0 ? (
              <EmptyNote>No Lifestyle fashion partners are live this week.</EmptyNote>
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
          <Text style={styles.pageHeading}>Offer a skill. Buy. Sell.</Text>
          <Text style={[styles.bodyText, { marginTop: 4 }]}>
            Photography, tutoring, graphic design, and freelancing in the Skills Marketplace, or
            buy and sell items with students across Ireland. No auto-expiry: you mark your own
            listing sold whenever it's done.
          </Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 12 }}>
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
          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={() => navigation.navigate('Marketplace')}>
            <ShoppingBag size={14} color={colors.textPrimary} strokeWidth={2.5} />
            <Text style={styles.secondaryCtaText}>Open the Marketplace</Text>
          </TouchableOpacity>
        </View>
      )

    // ── Blog ─────────────────────────────────────────────────────────────────
    case 'blog':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>FROM THE BLOG</Text>
          <Text style={styles.pageHeading}>Real Irish education news</Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 14 }}>
            {getPosts().slice(0, 6).map(post => (
              <TouchableOpacity key={post.slug} activeOpacity={0.8} onPress={() => navigation.navigate('Article', { slug: post.slug })}>
                <View style={styles.blogCard}>
                  <View style={styles.categoryPill}><Text style={styles.categoryPillText}>{post.category}</Text></View>
                  <Text style={styles.blogTitle} numberOfLines={2}>{post.title}</Text>
                  <View style={styles.blogMetaRow}>
                    <Text style={styles.blogMetaText}>{formatDate(post.date)}</Text>
                    <View style={styles.metaDivider} />
                    <Clock size={11} color={colors.light} />
                    <Text style={styles.blogMetaText}>{calcReadTime(post.sections)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={() => navigation.navigate('Blog')}>
            <BookOpen size={14} color={colors.textPrimary} strokeWidth={2.5} />
            <Text style={styles.secondaryCtaText}>Read the Full Blog</Text>
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
          <TouchableOpacity style={styles.adRightCta} activeOpacity={0.85} onPress={() => Linking.openURL('mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent('Join the UniBlueprint Team'))}>
            <Text style={styles.adRightCtaText}>Join the Team</Text>
            <ChevronRight size={14} color={colors.accentFg} />
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
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}><Text style={styles.bodyText}>{mm.tip}</Text></ScrollView>
              <Text style={styles.coachExpertise}>— {mm.coachName || 'UniBlueprint Investment Coach'}</Text>
            </>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Budgeting' })}>
            <Wallet size={14} color={colors.textPrimary} strokeWidth={2} />
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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 16 }}>
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
    // Two short bullet-list pages, same rendering, rarely more than a
    // handful of lines each — combined onto one page as two sections rather
    // than two nearly-empty pages back to back. Both content sections (and
    // both editor fields in weekly_issue_content) are unchanged, still
    // editable independently; only the page they render on is shared now.
    case 'ubp-board-week-ahead': {
      const ubpLines = (content.ubp_board?.lines || []).filter(Boolean)
      const weekLines = (content.week_ahead?.lines || []).filter(Boolean)
      const bulletList = lines => lines.length === 0 ? (
        <EmptyNote>Nothing published for this issue yet.</EmptyNote>
      ) : (
        <View style={{ gap: 14, marginTop: 16 }}>
          {lines.map((line, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>
      )
      return (
        <View style={styles.pageInner}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageKicker}>WHAT'S HAPPENING AT UBP?</Text>
            <Text style={styles.pageHeading}>The UBP Board</Text>
            {bulletList(ubpLines)}

            <View style={styles.sectionDivider} />

            <Text style={styles.pageKicker}>PLAN AHEAD</Text>
            <Text style={styles.pageHeading}>The Week Ahead</Text>
            {bulletList(weekLines)}
          </ScrollView>
        </View>
      )
    }

    // ── The Ad Board ──────────────────────────────────────────────────────────
    case 'ad-board':
      return (
        <View style={styles.pageInner}>
          <Text style={styles.pageKicker}>THIS WEEK'S AD BOARD</Text>
          <Text style={styles.pageHeading}>The Ad Board</Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 14 }}>
            {[...curatedAds, ...liveBoardAds].length === 0 ? (
              <EmptyNote>No ads live right now — be the first to post one.</EmptyNote>
            ) : [...curatedAds, ...liveBoardAds].map(ad => {
              const cat = ad.category ? CATEGORY[ad.category] : null
              return (
                <TouchableOpacity
                  key={ad.id}
                  style={styles.adBoardRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    // A live ad's own booking link opens directly; every
                    // curated partner opens the branded contact card
                    // instead, same as AdBoardScreen.jsx.
                    const url = ad.link || ad.target_url
                    if (url) return Linking.openURL(url)
                    setContactAd(ad)
                  }}
                >
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
            <Plus size={14} color={colors.textPrimary} strokeWidth={2.5} />
            <Text style={styles.secondaryCtaText}>Advertise With Us</Text>
          </TouchableOpacity>
          <PartnerContactModal ad={contactAd} visible={!!contactAd} onClose={() => setContactAd(null)} />
        </View>
      )

    // ── Blueprint Feature ─────────────────────────────────────────────────────
    case 'blueprint-feature': {
      const bf = content.blueprint_feature || {}
      return (
        <LinearGradient colors={[shade(colors.chromeBg, -10), colors.chromeBg, shade(colors.chromeBg, 12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.postPage]}>
          <View style={{ flex: 1 }} />
          <Award size={32} color={colors.chromeFg} strokeWidth={1.5} />
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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 14 }}>
            {!fn.body ? <EmptyNote>No founders' note published for this issue yet.</EmptyNote> : <Text style={styles.bodyText}>{fn.body}</Text>}
          </ScrollView>
        </View>
      )
    }

    case 'closing':
      return (
        <LinearGradient colors={[shade(colors.chromeBg, 10), colors.chromeBg, shade(colors.chromeBg, -12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pageInner, styles.coverPage]}>
          <View style={{ flex: 1 }} />
          <UBPLogo height={26} color={colors.chromeFg} />
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

// ── Page wrapper: a page turn ───────────────────────────────────────────────
// As you swipe, the page you are leaving hinges on its left edge (the spine)
// and swings toward you while it slides away and darkens, and the page coming
// in is first in the shadow of the turning one, then lights up. The cover
// turns the same way, so opening the issue feels like opening a book.

function MagazinePage({ page, index, active, near, scrollX, navigation, onJump, onOpenPost, data, isPro, reduce }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors)
  const W = SCREEN_W
  const range = [(index - 1) * W, index * W, (index + 1) * W]
  const rotateY = scrollX.interpolate({ inputRange: range, outputRange: ['0deg', '0deg', '-62deg'], extrapolate: 'clamp' })
  const opacity = scrollX.interpolate({ inputRange: range, outputRange: [0.9, 1, 0.5], extrapolate: 'clamp' })
  const inShadow = scrollX.interpolate({ inputRange: range, outputRange: [0.32, 0, 0], extrapolate: 'clamp' })
  const outShade = scrollX.interpolate({ inputRange: range, outputRange: [0, 0, 0.4], extrapolate: 'clamp' })

  if (reduce) {
    // Reduced motion: plain paging, no turn, no fade, no shading.
    return (
      <View pointerEvents={active ? 'auto' : 'none'} style={[styles.page, { backgroundColor: colors.background }]}>
        {near ? <PageContent page={page} navigation={navigation} onJump={onJump} onOpenPost={onOpenPost} data={data} isPro={isPro} /> : null}
        <View pointerEvents="none" style={[styles.spine, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(30,58,95,0.10)' }]} />
      </View>
    )
  }

  return (
    <Animated.View
      pointerEvents={active ? 'auto' : 'none'}
      style={[
        styles.page,
        {
          backgroundColor: colors.background,
          transformOrigin: 'left center',
          transform: [{ perspective: 1000 }, { rotateY }],
          opacity,
        },
      ]}
    >
      {near ? <PageContent page={page} navigation={navigation} onJump={onJump} onOpenPost={onOpenPost} data={data} isPro={isPro} /> : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: inShadow }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: outShade }]} />
      {/* The fold at the spine. */}
      <View pointerEvents="none" style={[styles.spine, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(30,58,95,0.10)' }]} />
    </Animated.View>
  )
}

// ── True page turn (reanimated) ─────────────────────────────────────────────
// Every page is pinned to the same spot on screen, stacked with the earlier
// pages on top. As you swipe, the top page swings about its left edge (the
// spine) like a leaf of a book, to the far side, and reveals the next page
// that was lying underneath. The turning page darkens as it lifts and the
// page underneath starts in its shadow. Runs on the UI thread. Used when
// reduced motion is off; otherwise the hinge and fade version above is used.

function TurnPage({ page, index, total, active, near, turnX, navigation, onJump, onOpenPost, data, isPro }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors)
  const W = SCREEN_W

  const pageStyle = useAnimatedStyle(() => {
    const p = turnX.value / W - index // 0 when this page is the open one
    const angle = interpolate(p, [0, 1], [0, -180], Extrapolation.CLAMP)
    return {
      zIndex: total - index,
      opacity: p <= -1 || p >= 0.5 ? 0 : 1,
      transform: [
        { translateX: turnX.value - index * W },
        { perspective: 1200 },
        { rotateY: `${angle}deg` },
      ],
    }
  })
  // Darkens as the page lifts, and the page underneath starts in shadow.
  const shadeStyle = useAnimatedStyle(() => {
    const p = turnX.value / W - index
    return { opacity: p >= 0 ? interpolate(p, [0, 0.5], [0, 0.4], Extrapolation.CLAMP) : interpolate(p, [-1, 0], [0.35, 0], Extrapolation.CLAMP) }
  })

  return (
    <Reanimated.View
      pointerEvents={active ? 'auto' : 'none'}
      style={[
        styles.page,
        { backgroundColor: colors.background, transformOrigin: 'left center', backfaceVisibility: 'hidden' },
        pageStyle,
      ]}
    >
      {near ? <PageContent page={page} navigation={navigation} onJump={onJump} onOpenPost={onOpenPost} data={data} isPro={isPro} /> : null}
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, shadeStyle]} />
      <View pointerEvents="none" style={[styles.spine, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(30,58,95,0.10)' }]} />
    </Reanimated.View>
  )
}

// ── Fixed 26-page structure ──────────────────────────────────────────────────
// Was 28 pages; trimmed by two, both merges rather than content cuts:
//  - campus-events-highlight (a whole page repeating just the first line of
//    campus-events-1's own list) folded into a highlight card at the top of
//    campus-events-1 — same "week's top event" treatment, no page of its own.
//  - ubp-board + week-ahead (two short bullet-list pages, identical layout)
//    combined onto one page as two stacked sections.

// An editorial slot only gets a page when the issue has something for it.
// Before this, an empty slot showed an "nothing published yet" note.
const hasLines = v => Array.isArray(v?.lines) && v.lines.some(l => typeof l === 'string' && l.trim())
const lineCount = v => (Array.isArray(v?.lines) ? v.lines.filter(l => typeof l === 'string' && l.trim()).length : 0)
const hasText = v => typeof v === 'string' && v.trim().length > 0

function buildPages(foundationOpen, content = {}, wrapped = null) {
  const c = content || {}
  const ss = c.student_spotlight || {}
  const hasWrapped = !!(wrapped && wrapped.pages && wrapped.pages.length)

  const wrappedPages = hasWrapped
    ? wrapped.pages.map((w, n) => ({ type: 'wrapped', w, n, section: wrapped.sections.find(sec => sec.key === w.section) || null }))
    : []

  const all = [
    { type: hasWrapped ? 'wrapped-cover' : 'cover' },
    { type: 'contents', entries: [] },
    ...wrappedPages,
    { type: 'deals-1' }, { type: 'deals-2' }, { type: 'deal-room' },
    { type: 'coach-1' }, { type: 'coach-2' },
    { type: 'foundation-1' }, { type: 'foundation-2' },
    ...(hasLines(c.campus_events) ? [{ type: 'campus-events-1' }] : []),
    ...(lineCount(c.campus_events) >= 2 ? [{ type: 'campus-events-2' }] : []),
    ...(hasLines(c.campus_events) ? [{ type: 'off-campus' }] : []),
    ...(hasLines(ss) ? [{ type: 'student-spotlight-grid' }] : []),
    ...(hasText(ss.featuredName) ? [{ type: 'student-spotlight-featured' }] : []),
    ...(hasText(c.campus_guide?.title) ? [{ type: 'campus-guide' }] : []),
    { type: 'lifestyle-edit' },
    { type: 'blog' },
    { type: 'marketplace' },
    ...(hasText(c.team?.name) ? [{ type: 'team' }] : []),
    ...(hasText(c.money_moves?.tip) ? [{ type: 'money-moves' }] : []),
    ...(hasLines(c.coach_board) ? [{ type: 'coach-board' }] : []),
    ...(hasLines(c.ubp_board) || hasLines(c.week_ahead) ? [{ type: 'ubp-board-week-ahead' }] : []),
    { type: 'ad-board' },
    ...(hasText(c.blueprint_feature?.title) ? [{ type: 'blueprint-feature' }] : []),
    ...(hasText(c.founders_note?.body) ? [{ type: 'founders-note' }] : []),
    { type: 'closing' },
  ]
  // The two Foundation pages are left out while Foundation is closed on iOS and Android.
  const pages = foundationOpen ? all : all.filter(p => !p.type.startsWith('foundation-'))
  const toc = pages[1]
  const idx = t => pages.findIndex(p => p.type === t)
  const has = t => idx(t) !== -1

  // Wrapped sections first (each jumps to its first page), then the standard entries.
  if (hasWrapped) {
    wrapped.sections.forEach(sec => {
      const at = pages.findIndex(p => p.type === 'wrapped' && p.w.section === sec.key)
      if (at !== -1) toc.entries.push({ label: sec.title, page: at, accent: sec.accent })
    })
  }
  const std = [
    { label: 'Deals & Discounts', Icon: Star,          t: 'deals-1' },
    { label: 'Coach Spotlights',  Icon: GraduationCap,  t: 'coach-1' },
    { label: 'Foundation Focus',  Icon: Award,          t: 'foundation-1' },
    { label: 'Campus Connect',    Icon: Building2,      t: 'campus-events-1' },
    { label: 'Student Spotlight', Icon: Newspaper,      t: 'student-spotlight-grid' },
    { label: 'Campus Guide',      Icon: MapPin,         t: 'campus-guide' },
    { label: 'Lifestyle Edit',    Icon: Sparkles,       t: 'lifestyle-edit' },
    { label: 'Blog',              Icon: BookOpen,       t: 'blog' },
    { label: 'Marketplace',       Icon: ShoppingBag,    t: 'marketplace' },
    { label: 'UBP Team',          Icon: Users,          t: 'team' },
    { label: 'Money Moves',       Icon: Wallet,         t: 'money-moves' },
    { label: 'Coach Board',       Icon: Heart,          t: 'coach-board' },
    { label: 'Ad Board',          Icon: Tag,            t: 'ad-board' },
  ]
  std.forEach(e => { if (has(e.t)) toc.entries.push({ label: e.label, Icon: e.Icon, page: idx(e.t) }) })
  return pages
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function WeeklyBlueprintScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  // Cream strip under the status bar — the global light icons are invisible
  // here without this (L3).
  useLightBackgroundStatusBar()
  const insets = useSafeAreaInsets()
  const { user, isPro } = useAuth()
  const { enabled: foundationOpen } = useFoundationEnabled()
  const [modalVisible, setModalVisible] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [progressReady, setProgressReady] = useState(false)
  const [screenData, setScreenData] = useState({
    issue: null, content: {}, wrapped: null, deals: [], coaches: [], foundationTopics: FOUNDATION_TOPICS.slice(0, 2),
    lifestylePartners: [], marketplaceAds: [], curatedAds: CURATED_ADS, liveBoardAds: [],
  })
  const PAGES = useMemo(
    () => buildPages(foundationOpen, screenData.content, screenData.wrapped),
    [foundationOpen, screenData.content, screenData.wrapped],
  )
  const scrollRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const turnX = useSharedValue(0)
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    let alive = true
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (alive) setReduce(!!v) }).catch(() => {})
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => setReduce(!!v))
    return () => { alive = false; sub?.remove?.() }
  }, [])
  const turnScroll = useAnimatedScrollHandler(e => {
    turnX.value = e.contentOffset.x
    runOnJS(setPageIndex)(Math.round(e.contentOffset.x / SCREEN_W))
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      // Promise.allSettled, not Promise.all: a network hiccup on any one of
      // these must not leave the whole screen stuck on the loading spinner
      // forever — each query degrades to empty data on its own, the rest
      // still render.
      const [issueRes, dealsRes, marketplaceRes, liveAdsRes, progressRes] = await Promise.allSettled([
        supabase.rpc('get_current_weekly_issue'),
        supabase.from('deals').select('*, partners(*)').eq('active', true),
        supabase.from('ads').select('*').eq('active', true).contains('boards', ['marketplace']),
        supabase.from('ads').select('*').eq('active', true).overlaps('boards', ['cross-ireland', 'campus', 'course']),
        user?.id
          ? supabase.from('weekly_issue_reading_progress').select('issue_id, last_page').eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      if (cancelled) return

      let issue = (issueRes.status === 'fulfilled' ? issueRes.value.data?.[0] : null) || null
      let content = issue?.content || {}
      // Development only: EXPO_PUBLIC_WRAPPED_FIXTURE=1 loads sample Wrapped pages.
      if (__DEV__ && process.env.EXPO_PUBLIC_WRAPPED_FIXTURE === '1') {
        const fx = require('../dev/wrappedFixture.json')
        content = { ...content, wrapped: fx.wrapped }
        issue = issue || { id: 'fixture', issue_number: 1, theme: fx.theme, content }
      }
      // Ireland Wrapped pages (issue.content.wrapped). Absent or empty means the magazine is as it always was.
      const wrapped = normaliseWrapped(content.wrapped)
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
        wrapped,
        // Real partner deals from the roster first, then any real database rows for partners not already listed.
        deals: [
          ...getPartnerDeals(),
          ...((dealsRes.status === 'fulfilled' ? dealsRes.value.data : null) || [])
            .filter(r => isRealDeal(r) && !isListedPartner(r.partners))
            .map(r => ({
              key: `db-deal:${r.id}`, brand: r.partners?.name || 'UniBlueprint Partner', text: r.title,
              description: r.description || null, percent: r.discount_percent || 0, code: null, logo: null,
            })),
        ],
        coaches: [c1, c2].filter(Boolean),
        foundationTopics: fTopics,
        lifestylePartners: PARTNERS.filter(p => p.filterKey === 'fashion' && p.status === 'live'),
        marketplaceAds: (marketplaceRes.status === 'fulfilled' ? marketplaceRes.value.data : null) || [],
        curatedAds: CURATED_ADS,
        liveBoardAds: (liveAdsRes.status === 'fulfilled' ? liveAdsRes.value.data : null) || [],
      })

      // Continue-where-you-left-off: resume at the saved page only if it's
      // saved against this same issue — a stale position from a past issue
      // (or no saved position at all) falls back to page 1.
      const progress = progressRes.status === 'fulfilled' ? progressRes.value.data : null
      let startPage = 0
      if (progress && issue && progress.issue_id === issue.id) {
        const total = buildPages(foundationOpen, content, wrapped).length
        startPage = Math.min(Math.max(progress.last_page, 0), total - 1)
      }
      setPageIndex(startPage)
      setLoading(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ x: startPage * SCREEN_W, animated: false })
          setProgressReady(true)
        })
      })
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  // Persist the reading position, debounced, once the initial restore above
  // has actually happened — otherwise this would immediately overwrite a
  // saved position with 0 before the jump-to-saved-page runs.
  useEffect(() => {
    if (!progressReady || !user?.id || !screenData.issue?.id) return
    const t = setTimeout(() => {
      supabase.rpc('save_weekly_reading_progress', {
        p_issue_id: screenData.issue.id,
        p_last_page: pageIndex,
      }).then(({ error }) => { if (error) console.warn('save_weekly_reading_progress failed', error) })
    }, 600)
    return () => clearTimeout(t)
  }, [pageIndex, progressReady, user?.id, screenData.issue?.id])

  function jumpTo(rawIndex) {
    // Page numbers in Wrapped data can be wrong, so the target is kept in range.
    const last = Math.max(0, PAGES.length - 1)
    const n = Math.floor(Number(rawIndex))
    const index = Number.isFinite(n) ? Math.max(0, Math.min(last, n)) : 0
    // A long jump (say from the contents page into the middle of Wrapped) goes
    // straight there, so the pages in between are not mounted on the way.
    const far = Math.abs(index - pageIndex) > NEAR
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: !far })
    if (far) setPageIndex(index)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.getParent()?.navigate('AdBoard', { screen: 'AdBoardMain' }))}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={19} color={colors.chromeFg} strokeWidth={2} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarPageNum}>{pageIndex + 1} / {PAGES.length}</Text>
        <TouchableOpacity
          onPress={() => openMenu(navigation)}
          style={styles.menuBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={19} color={colors.chromeFg} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postBtn} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Plus size={14} color={colors.chromeBg} strokeWidth={2.5} />
          <Text style={styles.postBtnText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <UBPLogo height={26} color={colors.textPrimary} />
        </View>
      ) : (
        <>
          {reduce ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              onScroll={e => setPageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
            >
              {PAGES.map((page, i) => (
                <MagazinePage
                  key={i}
                  page={page}
                  index={i}
                  active={i === pageIndex}
                  near={Math.abs(i - pageIndex) <= NEAR}
                  scrollX={scrollX}
                  navigation={navigation}
                  onJump={jumpTo}
                  onOpenPost={() => { setModalVisible(true) }}
                  data={screenData}
                  isPro={isPro}
                  reduce
                />
              ))}
            </ScrollView>
          ) : TURN_OK ? (
            <Reanimated.ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              onScroll={turnScroll}
            >
              {PAGES.map((page, i) => (
                <TurnPage
                  key={i}
                  page={page}
                  index={i}
                  total={PAGES.length}
                  active={i === pageIndex}
                  near={Math.abs(i - pageIndex) <= NEAR}
                  turnX={turnX}
                  navigation={navigation}
                  onJump={jumpTo}
                  onOpenPost={() => { setModalVisible(true) }}
                  data={screenData}
                  isPro={isPro}
                />
              ))}
            </Reanimated.ScrollView>
          ) : (
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
                active={i === pageIndex}
                near={Math.abs(i - pageIndex) <= NEAR}
                scrollX={scrollX}
                navigation={navigation}
                onJump={jumpTo}
                onOpenPost={() => { setModalVisible(true) }}
                data={screenData}
                isPro={isPro}
              />
            ))}
          </Animated.ScrollView>
          )}

          <View style={[styles.pagerControls, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={styles.pagerBtn}
              activeOpacity={0.7}
              onPress={() => jumpTo(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              accessibilityState={{ disabled: pageIndex === 0 }}
            >
              <ChevronLeft size={18} color={pageIndex === 0 ? colors.light : colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.pagerTrack}>
              <View style={[styles.pagerFill, { width: `${((pageIndex + 1) / PAGES.length) * 100}%` }]} />
            </View>
            <TouchableOpacity
              style={styles.pagerBtn}
              activeOpacity={0.7}
              onPress={() => jumpTo(Math.min(PAGES.length - 1, pageIndex + 1))}
              disabled={pageIndex === PAGES.length - 1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Next page"
              accessibilityState={{ disabled: pageIndex === PAGES.length - 1 }}
            >
              <ChevronRight size={18} color={pageIndex === PAGES.length - 1 ? colors.light : colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <PostAdModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  topBar: {
    backgroundColor: colors.chromeBg, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.chromeFg },
  topBarPageNum: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.5)', fontVariant: ['tabular-nums'] },
  menuBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.chromeFg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.chromeBg },

  page: { width: SCREEN_W, flex: 1 },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 10 },
  pageInner: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  pageKicker: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' },
  pageKickerLight: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14 },
  pageHeading: { fontFamily: fonts.serif, fontSize: 25, color: colors.textPrimary, marginTop: 8, lineHeight: 32 },
  bodyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 12, lineHeight: 22 },
  emptyNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.light, fontStyle: 'italic', marginTop: 14 },
  needHelpLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 10 },

  // Cover / closing
  coverPage: { alignItems: 'flex-start', paddingLeft: 52, paddingRight: 28 },
  coverBadge: { backgroundColor: 'rgba(245,240,232,0.12)', borderWidth: 1, borderColor: 'rgba(245,240,232,0.25)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  coverBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.75)', letterSpacing: 1 },
  coverRule: { width: 40, height: 2, borderRadius: 1, backgroundColor: 'rgba(245,240,232,0.35)', marginTop: 18 },
  coverTitle: { fontFamily: fonts.serif, fontSize: 42, color: colors.chromeFg, marginTop: 16, lineHeight: 48 },
  coverSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.6)', marginTop: 14, lineHeight: 21, maxWidth: '86%' },
  coverSpineBand: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'space-evenly', alignItems: 'center' },
  coverStitch: { width: 1.5, height: 46, backgroundColor: 'rgba(245,240,232,0.28)' },
  coverFrame: { position: 'absolute', left: 38, right: 14, top: 14, bottom: 14, borderWidth: 1, borderColor: 'rgba(245,240,232,0.22)', borderRadius: 6 },
  coverOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F0E8', borderRadius: 24, height: 46, paddingLeft: 20, paddingRight: 14, alignSelf: 'flex-start', marginBottom: 14 },
  coverOpenText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: '#1E3A5F' },
  coverSwipeHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coverSwipeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
  backCoverText: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.65)', marginTop: 14, lineHeight: 22, textAlign: 'center' },
  closingBig: { fontFamily: fonts.serif, fontSize: 28, color: colors.chromeFg, marginTop: 14 },

  // TOC
  tocSheet: { flex: 1, marginTop: 20, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  tocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  tocRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  tocDot: { width: 8, height: 8, borderRadius: 4, marginLeft: -4 },
  tocNum: { fontFamily: fonts.serif, fontSize: 15, color: colors.textSecondary, width: 24 },
  tocLabel: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary, flexShrink: 1 },
  tocLeader: { flex: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderBottomColor: colors.border, marginTop: 6 },
  tocPageNum: { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary, minWidth: 22, textAlign: 'right' },
  tocHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 18, lineHeight: 17, fontStyle: 'italic' },

  // Deals
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  dealBrand: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dealTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary, marginTop: 2 },
  dealLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  dealLogoImg: { width: 38, height: 38 },
  dealMono: { fontFamily: fonts.sansBold, fontSize: 14, color: '#FFFFFF' },
  dealCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  dealCode: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary, backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  dealCopy: { backgroundColor: colors.accentBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  dealCopyText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.accentFg },
  dealDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 17 },
  dealPercentBadge: { backgroundColor: colors.surfaceAlt, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  dealPercentText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.textPrimary },

  // Coach spotlight
  coachAvatarRing: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  coachName: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginTop: 12 },
  coachTitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  coachExpertise: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary, marginTop: 8 },
  coachBio: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.muted, lineHeight: 21 },

  // CTA pill (reused across many pages)
  adRightCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 13, marginTop: 4,
  },
  adRightCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.accentFg },
  secondaryCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)', borderRadius: radius.button, paddingVertical: 12, marginTop: 12,
  },
  secondaryCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },

  // Events
  eventHighlightCard: {
    backgroundColor: '#B45309', borderRadius: radius.card,
    paddingHorizontal: 16, paddingVertical: 14, marginTop: 16,
  },
  eventHighlightKicker: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: 'rgba(245,240,232,0.75)', letterSpacing: 1, textTransform: 'uppercase' },
  // eventHighlightCard's own bg is a fixed brand-orange hex (unrelated to
  // the navy/cream dark-mode swap, like its kicker/sub siblings right above
  // and below which already use fixed rgba(245,240,232,…) literals) — the
  // literal colors.cream here happens to equal that same fixed value in
  // both palettes, so it's left as-is rather than swapped to a token whose
  // *role* (chrome/accent surface text) this card isn't.
  eventHighlightTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.cream, marginTop: 6, lineHeight: 22 },
  eventHighlightSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.75)', marginTop: 4 },
  eventRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  eventInstitution: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary, marginTop: 3 },
  eventMetaRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  eventMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  cityLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 4 },
  cityEvent: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginBottom: 3, lineHeight: 18 },

  // Student spotlight
  storyCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  storyName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  storyHeadline: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  storyTeaser: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 4, lineHeight: 17 },
  storyQuote: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginTop: 20, lineHeight: 28, fontStyle: 'italic' },
  storyByline: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted, marginTop: 10 },

  // Quotes (coach board)
  quoteCard: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  quoteRole: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.muted, letterSpacing: 0.6 },
  quoteText: { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary, marginTop: 4, lineHeight: 22 },
  quoteName: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, marginTop: 4 },

  // Ad Board list
  adBoardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  adBoardIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Blog
  blogCard: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  categoryPill: { alignSelf: 'flex-start', backgroundColor: colors.accentBg, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  categoryPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.accentFg, letterSpacing: 0.3 },
  blogTitle: { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary, marginTop: 8, lineHeight: 21 },
  blogMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  blogMetaText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.light },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.light },

  // Bullets (UBP board / week ahead)
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textPrimary, marginTop: 7, flexShrink: 0 },
  bulletText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, flex: 1, lineHeight: 21 },
  sectionDivider: { height: 1, backgroundColor: 'rgba(30,58,95,0.08)', marginVertical: 24 },

  // Post/upsell gradient pages
  postPage: { backgroundColor: colors.chromeBg, alignItems: 'center' },
  postPageTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.chromeFg, marginTop: 10, textAlign: 'center', lineHeight: 30 },
  postPageBody: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.75)', textAlign: 'center', lineHeight: 20, maxWidth: '90%' },
  postPageCta: { backgroundColor: colors.chromeFg, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 13, marginTop: 18 },
  postPageCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.chromeBg },

  // Pager controls
  pagerControls: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingTop: 12, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  pagerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pagerTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(30,58,95,0.1)', overflow: 'hidden' },
  pagerFill: { height: 4, borderRadius: 2, backgroundColor: colors.accentBg },
  })
}
