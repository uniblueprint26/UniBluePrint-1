import { useState, useRef, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image, Linking, Share,
  StyleSheet, useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Clipboard from 'expo-clipboard'
import {
  BookOpen, MapPin, Quote as QuoteIcon, Share2, MessageSquarePlus, Check, X, Play,
  Music, Vote, Sparkles, Hourglass, Trophy, Camera, ChevronRight, Smartphone, PenLine,
} from 'lucide-react-native'
import UBPLogo from '../ui/UBPLogo'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import {
  accentFill, onColor, mixHex, cap, coverSnippets, pictureCredits, issueCode,
  shareText, openTakeComposer, hasRoute, goToRoute, WRAPPED_TAG,
} from '../../lib/wrapped'

// ─── Ireland Wrapped pages ──────────────────────────────────────────────────
// One component per page kind, all driven by the cleaned data from
// lib/wrapped.js (normaliseWrapped). Colours come from useTheme(); section
// accents are used as fills (with readable text picked by onColor) and, in a
// lighter or darker shade, as text on the page.

// Quiz answers are remembered here so a page that scrolls out of the mounted
// window and back keeps what the reader picked.
const quizMemory = {}

function useAccent(accent) {
  const { colors, isDark } = useTheme()
  const fill = accentFill(accent, isDark)
  return {
    colors, isDark, fill,
    ink: onColor(fill),
    // Accent as text on the page background.
    text: isDark ? mixHex(accent || fill, 0.5) : mixHex(accent || fill, -0.15),
  }
}

// ── Small shared pieces ─────────────────────────────────────────────────────

function Btn({ label, Icon, onPress, variant = 'primary', colors, accessibilityLabel }) {
  const primary = variant === 'primary'
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={[
        base.btn,
        { flexGrow: 1, flexShrink: 1 },
        primary
          ? { backgroundColor: colors.accentBg }
          : { borderWidth: 1.5, borderColor: colors.border },
      ]}
    >
      {Icon ? <Icon size={16} color={primary ? colors.accentFg : colors.textPrimary} strokeWidth={2.2} /> : null}
      <Text style={[base.btnText, { color: primary ? colors.accentFg : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// Share through the system share sheet. A page card image needs
// react-native-view-shot, which is not installed, so this shares short text
// that ends with the site name. If the sheet is not available (web), the text
// is copied instead.
function useShare() {
  const [note, setNote] = useState('')
  const timer = useRef(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const share = async (title, line) => {
    const message = shareText(title, line)
    try {
      await Share.share({ message })
    } catch {
      try {
        await Clipboard.setStringAsync(message)
        setNote('Copied. Paste it anywhere you like.')
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setNote(''), 2600)
      } catch {}
    }
  }
  return { share, note }
}

function FromUBP({ colors }) {
  return (
    <View style={base.fromRow} accessibilityLabel="From UBP">
      <UBPLogo height={16} color={colors.textSecondary} />
      <Text style={[base.fromText, { color: colors.textSecondary }]}>From UBP</Text>
    </View>
  )
}

function Kicker({ children, color }) {
  if (!children) return null
  return <Text style={[base.kicker, { color }]} numberOfLines={2}>{children}</Text>
}

function SourceLine({ page, colors }) {
  if (!page.source) return null
  const open = page.sourceUrl ? () => Linking.openURL(page.sourceUrl).catch(() => {}) : undefined
  return (
    <Text
      style={[base.source, { color: colors.textSecondary }]}
      onPress={open}
      accessibilityRole={open ? 'link' : undefined}
    >
      Source: {page.source}
    </Text>
  )
}

// A picture with its credit line, or a bold colour block when there is none.
function Pic({ image, a, Icon = Sparkles, height = 170, label }) {
  const [failed, setFailed] = useState(false)
  const { colors } = a
  if (image && !failed) {
    return (
      <View style={{ marginBottom: 6 }}>
        <Image
          source={{ uri: image.url }}
          style={[base.pic, { height, backgroundColor: colors.surfaceSunk }]}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={label || 'Picture'}
        />
        {!!image.credit && (
          <Text style={[base.credit, { color: colors.textSecondary }]}>
            Photo: {image.credit}{image.licence ? `, ${image.licence}` : ''}
          </Text>
        )}
      </View>
    )
  }
  return (
    <View style={[base.pic, { height: Math.min(height, 110), backgroundColor: a.fill, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }]}>
      <Icon size={34} color={a.ink} strokeWidth={1.6} />
    </View>
  )
}

// The page frame: scrolls when the content is long, actions pinned to the end.
// `pinned` keeps the actions on screen under a long page (top 10, quiz, awards).
function Frame({ colors, children, actions, note, pinned }) {
  const noteEl = note ? <Text style={[base.note, { color: colors.textSecondary }]} accessibilityLiveRegion="polite">{note}</Text> : null
  return (
    <View style={[base.frame, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={base.frameScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {children}
        <View style={{ flex: 1, minHeight: 20 }} />
        {!pinned && noteEl}
        {!pinned && actions ? <View style={base.actions}>{actions}</View> : null}
      </ScrollView>
      {pinned && actions ? (
        <View style={[base.pinBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {noteEl}
          <View style={base.pinRow}>{actions}</View>
        </View>
      ) : null}
    </View>
  )
}

// ── Page kinds ──────────────────────────────────────────────────────────────

function SectionPage({ page, section }) {
  const a = useAccent(section?.accent)
  return (
    <View style={[base.frame, { backgroundColor: a.fill }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[base.frameScroll, { justifyContent: 'center' }]} showsVerticalScrollIndicator={false}>
        {!!page.kicker && <Text style={[base.dividerKicker, { color: a.ink, opacity: 0.8 }]}>{page.kicker}</Text>}
        <Text style={[base.dividerTitle, { color: a.ink }]} accessibilityRole="header">{page.heading}</Text>
        <View style={[base.dividerRule, { backgroundColor: a.ink, opacity: 0.55 }]} />
        {!!page.body && <Text style={[base.dividerBody, { color: a.ink }]}>{page.body}</Text>}
        {!!page.gaeilge && <Text style={[base.dividerGaeilge, { color: a.ink }]}>{page.gaeilge}</Text>}
      </ScrollView>
    </View>
  )
}

function StoryPage({ page, section }) {
  const a = useAccent(section?.accent)
  return (
    <Frame colors={a.colors}>
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      <Pic image={page.image} a={a} Icon={BookOpen} label={page.heading} />
      {!!page.heading && <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>}
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      <SourceLine page={page} colors={a.colors} />
    </Frame>
  )
}

function statSize(len) {
  if (len <= 3) return 104
  if (len <= 5) return 84
  if (len <= 7) return 64
  if (len <= 10) return 48
  return 38
}

function StatPage({ page, section }) {
  const a = useAccent(section?.accent)
  const { share, note } = useShare()
  const size = statSize(page.stat.length)
  return (
    <Frame
      colors={a.colors}
      note={note}
      actions={<Btn colors={a.colors} variant="secondary" Icon={Share2} label="Share outside UBP" onPress={() => share(`${page.stat} ${page.statLabel}`.trim(), page.heading)} />}
    >
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.lg }}>
        <Text
          style={[base.bigStat, { color: a.text, fontSize: size, lineHeight: Math.round(size * 1.1) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`${page.stat} ${page.statLabel}`}
        >
          {page.stat}
        </Text>
        {!!page.statLabel && <Text style={[base.statLabel, { color: a.colors.textPrimary }]}>{page.statLabel}</Text>}
        {!!page.heading && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.heading}</Text>}
        {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      </View>
      <SourceLine page={page} colors={a.colors} />
      <FromUBP colors={a.colors} />
    </Frame>
  )
}

function ListPage({ page, section }) {
  const a = useAccent(section?.accent)
  const rows = page.items.length ? page.items : page.bullets
  return (
    <Frame colors={a.colors}>
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      {!!page.heading && <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>}
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      <View style={{ marginTop: spacing.md }}>
        {rows.map((r, i) => (
          <View key={i} style={[base.listRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: a.colors.border }]}>
            <View style={[base.listDot, { backgroundColor: a.fill }]} />
            <Text style={[base.listText, { color: a.colors.textPrimary }]}>{r}</Text>
          </View>
        ))}
      </View>
      <SourceLine page={page} colors={a.colors} />
    </Frame>
  )
}

function QuotePage({ page, section }) {
  const a = useAccent(section?.accent)
  return (
    <Frame colors={a.colors}>
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.lg }}>
        <QuoteIcon size={40} color={a.text} strokeWidth={1.6} />
        <Text style={[base.quoteText, { color: a.colors.textPrimary }]}>{page.body}</Text>
        {!!page.heading && <Text style={[base.quoteBy, { color: a.text }]}>{page.heading}</Text>}
        <SourceLine page={page} colors={a.colors} />
      </View>
    </Frame>
  )
}

function CollagePage({ page, section }) {
  const a = useAccent(section?.accent)
  const { width } = useWindowDimensions()
  const gap = 10
  const tile = Math.floor((width - spacing.lg * 2 - gap * 2) / 3)
  const rows = page.items.length ? page.items : page.bullets.map(t => ({ text: t, label: '' }))
  const shades = [0, -0.18, 0.18, -0.08, 0.08, -0.26]
  return (
    <Frame colors={a.colors}>
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      {!!page.heading && <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>}
      <View style={[base.collage, { gap }]}>
        {rows.slice(0, 12).map((t, i) => {
          const fill = mixHex(a.fill, shades[i % shades.length])
          return (
            <View key={i} style={[base.tile, { width: tile, minHeight: tile, backgroundColor: fill }]}>
              {!!t.label && <Text style={[base.tileLabel, { color: onColor(fill) }]} numberOfLines={1}>{t.label}</Text>}
              <Text style={[base.tileText, { color: onColor(fill) }]} numberOfLines={5}>{t.text}</Text>
            </View>
          )
        })}
      </View>
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
    </Frame>
  )
}

// Quiet and muted. Never shows a portrait, even if an image is supplied.
function TributePage({ page, section }) {
  const { colors } = useTheme()
  return (
    <View style={[base.frame, { backgroundColor: colors.surfaceAlt }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[base.frameScroll, { justifyContent: 'center' }]} showsVerticalScrollIndicator={false}>
        <View style={[base.tributeRule, { backgroundColor: colors.border }]} />
        <Text style={[base.tributeKicker, { color: colors.textSecondary }]}>{page.kicker || 'In memory'}</Text>
        {!!page.heading && <Text style={[base.tributeHeading, { color: colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>}
        {!!page.body && <Text style={[base.tributeBody, { color: colors.textSecondary }]}>{page.body}</Text>}
        {page.bullets.map((b, i) => <Text key={i} style={[base.tributeBody, { color: colors.textSecondary }]}>{b}</Text>)}
        <SourceLine page={page} colors={colors} />
        <View style={[base.tributeRule, { backgroundColor: colors.border, marginTop: spacing.lg }]} />
      </ScrollView>
    </View>
  )
}

function CreditsPage({ page, pics }) {
  const { colors } = useTheme()
  const lines = page.items.length ? page.items : page.bullets
  return (
    <Frame colors={colors}>
      <Kicker color={colors.textSecondary}>{page.kicker || 'Credits'}</Kicker>
      <Text style={[base.heading, { color: colors.textPrimary }]} accessibilityRole="header">{page.heading || 'Thank you'}</Text>
      {!!page.body && <Text style={[base.body, { color: colors.textSecondary }]}>{page.body}</Text>}
      {lines.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          {lines.map((l, i) => <Text key={i} style={[base.creditLine, { color: colors.textPrimary }]}>{l}</Text>)}
        </View>
      )}
      {pics.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[base.kicker, { color: colors.textSecondary }]}>Picture credits</Text>
          {pics.map((l, i) => <Text key={i} style={[base.picCredit, { color: colors.textSecondary }]}>{l}</Text>)}
        </View>
      )}
      <View style={{ marginTop: spacing.lg }}><FromUBP colors={colors} /></View>
    </Frame>
  )
}

function TakeAndShare({ a, navigation, title, line, share }) {
  return (
    <>
      <Btn colors={a.colors} Icon={MessageSquarePlus} label="Give your take" onPress={() => openTakeComposer(navigation, title)} />
      <Btn colors={a.colors} variant="secondary" Icon={Share2} label="Share outside UBP" onPress={() => share(title, line)} />
    </>
  )
}

function Top10Page({ page, section, navigation }) {
  const a = useAccent(section?.accent)
  const { share, note } = useShare()
  const title = page.heading || 'Top 10'
  const line = page.items.slice(0, 3).map(it => `${it.rank}. ${it.title}`).join(', ')
  return (
    <Frame pinned colors={a.colors} note={note} actions={<TakeAndShare a={a} navigation={navigation} title={title} line={line} share={share} />}>
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{title}</Text>
      <View style={{ marginTop: spacing.md }}>
        {page.items.map((it, i) => (
          <View key={i} style={[base.rankRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: a.colors.border }]}>
            <Text style={[base.rankNum, { color: a.text }]} accessibilityLabel={`Number ${it.rank}`}>{it.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[base.rankTitle, { color: a.colors.textPrimary }]}>{it.title}</Text>
              {!!it.blurb && <Text style={[base.rankBlurb, { color: a.colors.textSecondary }]}>{it.blurb}</Text>}
              {!!it.source && <Text style={[base.rankSource, { color: a.colors.textSecondary }]}>Source: {it.source}</Text>}
            </View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: spacing.md }}><FromUBP colors={a.colors} /></View>
    </Frame>
  )
}

function MonthPage({ page, section, navigation }) {
  const a = useAccent(section?.accent)
  const { share, note } = useShare()
  const title = `${page.kicker}: ${page.heading}`
  return (
    <Frame colors={a.colors} note={note} actions={<TakeAndShare a={a} navigation={navigation} title={title} line={cap(page.body, 110)} share={share} />}>
      <Text style={[base.monthName, { color: a.text }]} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">{page.kicker}</Text>
      <View style={[base.monthBar, { backgroundColor: a.fill }]} />
      <Pic image={page.image} a={a} Icon={Sparkles} height={120} label={page.heading} />
      <Text style={[base.heading, { color: a.colors.textPrimary }]}>{page.heading}</Text>
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      <SourceLine page={page} colors={a.colors} />
      <View style={{ marginTop: spacing.md }}><FromUBP colors={a.colors} /></View>
    </Frame>
  )
}

function QuizQuestion({ q, qkey, a }) {
  const { colors } = a
  const [picked, setPicked] = useState(quizMemory[qkey] ?? null)
  const done = picked !== null
  const choose = i => { if (done) return; quizMemory[qkey] = i; setPicked(i) }
  return (
    <View style={[base.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[base.quizQ, { color: colors.textPrimary }]}>{q.question}</Text>
      <View style={{ gap: 8, marginTop: 12 }}>
        {q.options.map((o, i) => {
          const right = done && i === q.answerIndex
          const wrong = done && i === picked && i !== q.answerIndex
          const tone = right ? colors.success : wrong ? colors.destructive : colors.border
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              disabled={done}
              onPress={() => choose(i)}
              accessibilityRole="button"
              accessibilityLabel={`${o}${right ? ', correct' : wrong ? ', not quite' : ''}`}
              accessibilityState={{ disabled: done }}
              style={[base.quizOpt, { borderColor: tone, borderWidth: right || wrong ? 2 : 1, backgroundColor: right ? colors.successBg : colors.background }]}
            >
              <Text style={[base.quizOptText, { color: colors.textPrimary }]}>{o}</Text>
              {right ? <Check size={18} color={colors.success} strokeWidth={2.6} /> : null}
              {wrong ? <X size={18} color={colors.destructive} strokeWidth={2.6} /> : null}
            </TouchableOpacity>
          )
        })}
      </View>
      {done && (
        <View style={{ marginTop: 12 }}>
          <Text style={[base.quizVerdict, { color: picked === q.answerIndex ? colors.success : colors.textPrimary }]}>
            {picked === q.answerIndex ? 'Right.' : 'Not quite.'}
          </Text>
          {!!q.note && <Text style={[base.quizNote, { color: colors.textSecondary }]}>{q.note}</Text>}
        </View>
      )}
    </View>
  )
}

function QuizPage({ page, section, pageKey }) {
  const a = useAccent(section?.accent)
  const { share, note } = useShare()
  return (
    <Frame
      pinned
      colors={a.colors}
      note={note}
      actions={<Btn colors={a.colors} variant="secondary" Icon={Share2} label="Share outside UBP" onPress={() => share(page.heading || 'Ireland 2026 quiz', 'Think you know your Irish year? Have a go.')} />}
    >
      <Kicker color={a.text}>{page.kicker || 'Quiz'}</Kicker>
      <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading || 'How well do you know 2026?'}</Text>
      <View style={{ gap: 14, marginTop: spacing.md }}>
        {page.items.map((q, i) => <QuizQuestion key={i} q={q} qkey={`${pageKey}:${i}`} a={a} />)}
      </View>
      <View style={{ marginTop: spacing.md }}><FromUBP colors={a.colors} /></View>
    </Frame>
  )
}

function CountyPage({ page, section }) {
  const a = useAccent(section?.accent)
  return (
    <Frame colors={a.colors}>
      <Kicker color={a.text}>{page.kicker || section?.title || 'County by county'}</Kicker>
      <View style={{ gap: spacing.xl, marginTop: spacing.xl }}>
        {page.items.map((c, i) => (
          <View key={i} style={[base.countyBlock, { borderLeftColor: a.fill }]}>
            <View style={base.countyHead}>
              <MapPin size={18} color={a.text} strokeWidth={2} />
              <Text style={[base.countyName, { color: a.colors.textPrimary }]} accessibilityRole="header">{c.county}</Text>
            </View>
            <Text style={[base.countyLine, { color: a.colors.textPrimary }]}>{c.line}</Text>
            {!!c.source && <Text style={[base.rankSource, { color: a.colors.textSecondary }]}>Source: {c.source}</Text>}
          </View>
        ))}
      </View>
    </Frame>
  )
}

function AwardsPage({ page, section, navigation }) {
  const a = useAccent(section?.accent)
  const { share, note } = useShare()
  const canVote = hasRoute(navigation, 'AwardsVoting')
  const actions = (
    <>
      {canVote && <Btn colors={a.colors} Icon={Vote} label="Vote" onPress={() => goToRoute(navigation, 'AwardsVoting')} />}
      <Btn colors={a.colors} variant="secondary" Icon={Share2} label="Share outside UBP" onPress={() => share(page.heading || 'UBP Awards', 'Nominees for the Ireland 2026 awards.')} />
    </>
  )
  return (
    <Frame pinned colors={a.colors} note={note} actions={actions}>
      <Kicker color={a.text}>{page.kicker || section?.title || 'UBP Awards'}</Kicker>
      {!!page.heading && <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>}
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      <View style={{ gap: spacing.lg, marginTop: spacing.md }}>
        {page.categories.map(cat => (
          <View key={cat.key}>
            <View style={[base.catHead, { backgroundColor: a.fill }]}>
              <Trophy size={16} color={a.ink} strokeWidth={2} />
              <Text style={[base.catTitle, { color: a.ink }]}>{cat.title}</Text>
            </View>
            {cat.nominees.map((n, i) => (
              <View key={i} style={[base.nomRow, { borderBottomColor: a.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[base.nomName, { color: a.colors.textPrimary }]}>{n.name}</Text>
                  {!!n.why && <Text style={[base.nomWhy, { color: a.colors.textSecondary }]}>{n.why}</Text>}
                  {!!n.source && <Text style={[base.rankSource, { color: a.colors.textSecondary }]}>Source: {n.source}</Text>}
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => openTakeComposer(navigation, `${n.name}, ${cat.title}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Give your take on ${n.name}`}
                  style={[base.nomBtn, { borderColor: a.colors.border }]}
                >
                  <MessageSquarePlus size={14} color={a.colors.textPrimary} strokeWidth={2.2} />
                  <Text style={[base.nomBtnText, { color: a.colors.textPrimary }]}>Your take</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={{ marginTop: spacing.md }}><FromUBP colors={a.colors} /></View>
    </Frame>
  )
}

function PlaylistPage({ page, section }) {
  const a = useAccent(section?.accent)
  return (
    <Frame colors={a.colors}>
      <Kicker color={a.text}>{page.kicker || section?.title || 'Playlist'}</Kicker>
      <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading || 'The Ireland 2026 playlist'}</Text>
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      <View style={{ marginTop: spacing.md }}>
        {page.items.map((s, i) => (
          <View key={i} style={[base.songRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: a.colors.border }]}>
            <View style={[base.songIcon, { backgroundColor: a.fill }]}><Music size={16} color={a.ink} strokeWidth={2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[base.songTitle, { color: a.colors.textPrimary }]}>{s.title}</Text>
              {!!s.artist && <Text style={[base.songArtist, { color: a.colors.textSecondary }]}>{s.artist}</Text>}
            </View>
            {s.url ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Linking.openURL(s.url).catch(() => {})}
                accessibilityRole="button"
                accessibilityLabel={`Play ${s.title}`}
                style={[base.playBtn, { backgroundColor: a.colors.accentBg }]}
              >
                <Play size={14} color={a.colors.accentFg} fill={a.colors.accentFg} />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>
    </Frame>
  )
}

function runCta(navigation, cta) {
  if (!cta) return
  if (cta.route && hasRoute(navigation, cta.route)) { goToRoute(navigation, cta.route); return }
  if (cta.url) Linking.openURL(cta.url).catch(() => {})
}

function UbpPage({ page, section, navigation }) {
  const a = useAccent(section?.accent)
  const cta = page.cta && ((page.cta.route && hasRoute(navigation, page.cta.route)) || page.cta.url) ? page.cta : null
  return (
    <Frame colors={a.colors} actions={cta ? <Btn colors={a.colors} Icon={ChevronRight} label={cta.label} onPress={() => runCta(navigation, cta)} /> : null}>
      <View style={[base.ubpBadge, { backgroundColor: a.colors.accentBg }]}>
        <Text style={[base.ubpBadgeText, { color: a.colors.accentFg }]}>From UBP</Text>
      </View>
      <Text style={[base.heading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>
      {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      <View style={base.shotWrap}>
        {page.image ? (
          <Pic image={page.image} a={a} Icon={Smartphone} height={240} label={`${page.heading} in the app`} />
        ) : (
          <View style={[base.shotFrame, { borderColor: a.colors.border, backgroundColor: a.colors.surface }]} accessibilityLabel="App screenshot goes here">
            <View style={[base.shotNotch, { backgroundColor: a.colors.border }]} />
            <Smartphone size={30} color={a.text} strokeWidth={1.5} />
            <Text style={[base.shotText, { color: a.colors.textSecondary }]}>App screenshot</Text>
          </View>
        )}
      </View>
    </Frame>
  )
}

function MomentPage({ page, section, navigation }) {
  const a = useAccent(section?.accent)
  return (
    <Frame
      colors={a.colors}
      actions={<Btn colors={a.colors} Icon={Camera} label={page.cta?.label || 'Add your moment'} onPress={() => openTakeComposer(navigation, 'My moment of 2026')} />}
    >
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.lg }}>
        <View style={[base.momentIcon, { backgroundColor: a.fill }]}><PenLine size={28} color={a.ink} strokeWidth={1.8} /></View>
        <Text style={[base.bigHeading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>
        {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
        <Text style={[base.note, { color: a.colors.textSecondary, textAlign: 'left', marginTop: spacing.md }]}>Your Take is tagged {WRAPPED_TAG}.</Text>
      </View>
    </Frame>
  )
}

function CapsulePage({ page, section, navigation }) {
  const a = useAccent(section?.accent)
  const can = hasRoute(navigation, 'TimeCapsule')
  return (
    <Frame
      colors={a.colors}
      actions={can ? <Btn colors={a.colors} Icon={Hourglass} label={page.cta?.label || 'Write your note'} onPress={() => goToRoute(navigation, 'TimeCapsule')} /> : null}
    >
      <Kicker color={a.text}>{page.kicker || section?.title}</Kicker>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.lg }}>
        <View style={[base.momentIcon, { backgroundColor: a.fill }]}><Hourglass size={28} color={a.ink} strokeWidth={1.8} /></View>
        <Text style={[base.bigHeading, { color: a.colors.textPrimary }]} accessibilityRole="header">{page.heading}</Text>
        {!!page.body && <Text style={[base.body, { color: a.colors.textSecondary }]}>{page.body}</Text>}
      </View>
    </Frame>
  )
}

// ── Cover ───────────────────────────────────────────────────────────────────

export function WrappedCover({ wrapped, issue, onOpen }) {
  const title = cap(wrapped?.cover?.title || issue?.theme, 40) || 'Ireland 2026'
  const byline = cap(wrapped?.cover?.byline, 40) || 'by UniBlueprint'
  const code = issueCode(issue?.issue_number)
  const snippets = coverSnippets(wrapped, 6)
  return (
    <TouchableOpacity activeOpacity={0.96} style={{ flex: 1 }} onPress={onOpen} accessibilityRole="button" accessibilityLabel="Open the issue">
      <LinearGradient colors={['#0F2240', '#1B3659', '#26486F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={base.coverScroll} showsVerticalScrollIndicator={false}>
          <View style={base.coverTop}>
            <UBPLogo height={26} color="#F5F0E8" />
            <View style={base.coverBadge}><Text style={base.coverBadgeText}>ISSUE {code}</Text></View>
          </View>
          <Text style={base.coverTitle} accessibilityRole="header">{title}</Text>
          <Text style={base.coverBy}>{byline}</Text>
          <View style={base.coverGrid}>
            {snippets.map((s, i) => {
              // The cover is navy in both modes, so the plain accent is used.
              const fill = accentFill(s.accent, false)
              const ink = onColor(fill)
              return (
                <View key={s.key} style={[base.coverTile, { backgroundColor: fill }]}>
                  <Text style={[base.coverTileLabel, { color: ink }]} numberOfLines={1}>{s.label}</Text>
                  {!!s.big && <Text style={[base.coverTileBig, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit>{s.big}</Text>}
                  <Text style={[base.coverTileText, { color: ink }]} numberOfLines={s.big ? 2 : 4}>{s.text}</Text>
                </View>
              )
            })}
          </View>
          <View style={{ flex: 1, minHeight: 12 }} />
          <View style={base.coverOpenBtn}>
            <Text style={base.coverOpenText}>Open the issue</Text>
            <ChevronRight size={16} color="#1E3A5F" strokeWidth={2.4} />
          </View>
          <Text style={base.coverSwipe}>Or swipe to turn the page</Text>
        </ScrollView>
      </LinearGradient>
    </TouchableOpacity>
  )
}

// ── Router ──────────────────────────────────────────────────────────────────

export function WrappedPage({ page, section, navigation, allPages, pageKey }) {
  if (!page) return null
  switch (page.kind) {
    case 'section': return <SectionPage page={page} section={section} />
    case 'story': return <StoryPage page={page} section={section} />
    case 'stat': return <StatPage page={page} section={section} />
    case 'list': return <ListPage page={page} section={section} />
    case 'quote': return <QuotePage page={page} section={section} />
    case 'collage': return <CollagePage page={page} section={section} />
    case 'tribute': return <TributePage page={page} section={section} />
    case 'credits': return <CreditsPage page={page} pics={pictureCredits(allPages)} />
    case 'top10': return <Top10Page page={page} section={section} navigation={navigation} />
    case 'month': return <MonthPage page={page} section={section} navigation={navigation} />
    case 'quiz': return <QuizPage page={page} section={section} pageKey={pageKey} />
    case 'county': return <CountyPage page={page} section={section} />
    case 'awards': return <AwardsPage page={page} section={section} navigation={navigation} />
    case 'playlist': return <PlaylistPage page={page} section={section} />
    case 'ubp': return <UbpPage page={page} section={section} navigation={navigation} />
    case 'moment': return <MomentPage page={page} section={section} navigation={navigation} />
    case 'capsule': return <CapsulePage page={page} section={section} navigation={navigation} />
    default: return null
  }
}

// ── Styles (layout only; every colour is set from the theme at render) ──────

const base = StyleSheet.create({
  frame: { flex: 1 },
  frameScroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg + 8 },
  actions: { gap: 10, marginTop: spacing.md },
  pinBar: { paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth },
  pinRow: { flexDirection: 'row', gap: 10 },
  note: { fontFamily: fonts.sans, fontSize: 12.5, textAlign: 'center', marginBottom: 6 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.button, paddingVertical: 13, paddingHorizontal: 16, minHeight: 46 },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, flexShrink: 1, textAlign: 'center' },

  kicker: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6 },
  heading: { fontFamily: fonts.serif, fontSize: 27, lineHeight: 34, marginTop: 6 },
  bigHeading: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 40, marginTop: spacing.md },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, marginTop: 12 },
  source: { fontFamily: fonts.sans, fontSize: 12, marginTop: 14, lineHeight: 17 },
  credit: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 15, marginTop: 5 },
  pic: { width: '100%', borderRadius: radius.card, marginTop: 6 },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  fromText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  dividerKicker: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 14 },
  dividerTitle: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 52 },
  dividerRule: { width: 56, height: 3, borderRadius: 2, marginTop: 22 },
  dividerBody: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 25, marginTop: 20, opacity: 0.92 },
  dividerGaeilge: { fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 26, marginTop: 28, opacity: 0.9 },

  bigStat: { fontFamily: fonts.serif, textAlign: 'left' },
  statLabel: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31, marginTop: 10 },

  listRow: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  listDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8, flexShrink: 0 },
  listText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, flex: 1 },

  quoteText: { fontFamily: fonts.serifItalic, fontSize: 26, lineHeight: 36, marginTop: 14 },
  quoteBy: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginTop: 18 },

  collage: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  tile: { borderRadius: 12, padding: 10, justifyContent: 'flex-end' },
  tileLabel: { fontFamily: fonts.sansSemiBold, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.85, marginBottom: 4 },
  tileText: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 18 },

  tributeRule: { width: 48, height: 1.5 },
  tributeKicker: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 24 },
  tributeHeading: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 36, marginTop: 10, opacity: 0.9 },
  tributeBody: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 25, marginTop: 14 },

  creditLine: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24 },
  picCredit: { fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 17, marginTop: 4 },

  rankRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, alignItems: 'flex-start' },
  rankNum: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, minWidth: 50, textAlign: 'center' },
  rankTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  rankBlurb: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, marginTop: 3 },
  rankSource: { fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 16, marginTop: 4 },

  monthName: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 58, textTransform: 'uppercase' },
  monthBar: { width: 56, height: 4, borderRadius: 2, marginTop: 4, marginBottom: 14 },

  quizCard: { borderWidth: 1, borderRadius: radius.card, padding: 16 },
  quizQ: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26 },
  quizOpt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 46 },
  quizOptText: { fontFamily: fonts.sansMedium, fontSize: 14.5, lineHeight: 20, flex: 1 },
  quizVerdict: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  quizNote: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, marginTop: 4 },

  countyBlock: { borderLeftWidth: 4, paddingLeft: 16, paddingVertical: 6 },
  countyHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countyName: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 38, flexShrink: 1 },
  countyLine: { fontFamily: fonts.sans, fontSize: 15.5, lineHeight: 24, marginTop: 8 },

  catHead: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  catTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, flex: 1, lineHeight: 19 },
  nomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  nomName: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21 },
  nomWhy: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
  nomBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.2, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 10 },
  nomBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },

  songRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  songIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  songTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21 },
  songArtist: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 1 },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  ubpBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  ubpBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  shotWrap: { alignItems: 'center', marginTop: spacing.lg },
  shotFrame: { width: 150, height: 250, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 10 },
  shotNotch: { position: 'absolute', top: 10, width: 44, height: 5, borderRadius: 3 },
  shotText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  momentIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  coverScroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 24 },
  coverTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coverBadge: { borderWidth: 1, borderColor: 'rgba(245,240,232,0.3)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  coverBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: 'rgba(245,240,232,0.85)', letterSpacing: 1.1 },
  coverTitle: { fontFamily: fonts.serif, fontSize: 50, lineHeight: 56, color: '#F5F0E8', marginTop: 28 },
  coverBy: { fontFamily: fonts.sansMedium, fontSize: 16, color: 'rgba(245,240,232,0.75)', marginTop: 6, letterSpacing: 0.3 },
  coverGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 26 },
  coverTile: { width: '48%', flexGrow: 1, minHeight: 92, borderRadius: 14, padding: 12, justifyContent: 'flex-end' },
  coverTileLabel: { fontFamily: fonts.sansSemiBold, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.85, marginBottom: 3 },
  coverTileBig: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  coverTileText: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 18 },
  coverOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F0E8', borderRadius: 24, height: 46, paddingLeft: 20, paddingRight: 14, alignSelf: 'flex-start', marginTop: 22 },
  coverOpenText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: '#1E3A5F' },
  coverSwipe: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.65)', marginTop: 12 },
})
