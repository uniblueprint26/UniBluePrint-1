import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeftRight, Users, Inbox, ShieldAlert, TrendingUp, Image as ImageIcon, X, Newspaper, ChevronRight,
  Sparkles, Plus, Trash2,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ImageUploader from '../../components/ui/ImageUploader'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { formatNumber } from '../../utils/formatNumber'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { COACHES, coachSlug } from '../ElevationScreen'
import { CAREER_SERVICES } from '../FoundationScreen'
import { PARTNERS } from '../../data/lifestylePartners'
import { CAMPUS_BOARDS } from '../../constants/campusBoards'
import { COURSE_BOARDS } from '../../constants/courseConnectBoards'

const LIVE_COACHES  = COACHES.filter(c => !c.shell)
const LIVE_PARTNERS = PARTNERS.filter(p => p.status === 'live')

// ── Home "Spotlight" carousel — minimal curation UI ─────────────────────────
// Full CRUD lives in the featured_content table (RLS: Founder/Operations
// only); this is a lightweight pick-from-real-data-and-post UI rather than
// a full editor — see Task #13 notes for why a richer admin screen (custom
// images, scheduling windows) was left for a later pass. Every option here
// is drawn from the exact same real registries the carousel itself resolves
// against (lib/featuredContent.js), so nothing added here can be fake.
const FEATURED_TYPES = [
  {
    type: 'foundation_service', label: 'Foundation Service',
    options: CAREER_SERVICES.map(s => ({ refId: s.title, name: s.title })),
  },
  {
    type: 'coach', label: 'Coach',
    options: LIVE_COACHES.map(c => ({ refId: String(c.id), name: c.name })),
  },
  {
    type: 'lifestyle_partner', label: 'Lifestyle Partner',
    options: LIVE_PARTNERS.map(p => ({ refId: p.id, name: p.brand })),
  },
  {
    type: 'campus_board', label: 'Campus Board',
    options: CAMPUS_BOARDS.map(b => ({ refId: b.key, name: b.title })),
  },
  {
    type: 'course_board', label: 'Course Board',
    options: COURSE_BOARDS.map(b => ({ refId: b.key, name: b.title })),
  },
]
const FEATURED_TYPE_LABEL = Object.fromEntries(FEATURED_TYPES.map(t => [t.type, t.label]))
function nameForFeatured(row) {
  const group = FEATURED_TYPES.find(t => t.type === row.content_type)
  return group?.options.find(o => o.refId === row.ref_id)?.name || row.ref_id
}

// ── Photo picker modal ──────────────────────────────────────────────────────
// One modal, reused for both coaches and partners — upserts by slug so a
// photo can be set even before that entity has any other live database
// record. See migration 20260811090000 for why coach_profiles.user_id is
// nullable: most coaches/partners are not registered platform accounts.
function PhotoPickerModal({ visible, onClose, entity }) {
  const [currentUrl, setCurrentUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible || !entity) return
    setLoading(true)
    const query = entity.kind === 'coach'
      ? supabase.from('coach_profiles').select('photo_url').eq('coach_slug', entity.slug).maybeSingle()
      : supabase.from('partners').select('logo_url').eq('partner_slug', entity.slug).maybeSingle()
    query.then(({ data }) => {
      setCurrentUrl(entity.kind === 'coach' ? data?.photo_url : data?.logo_url)
      setLoading(false)
    })
  }, [visible, entity])

  async function handleUpload(url) {
    setCurrentUrl(url)
    if (entity.kind === 'coach') {
      await supabase.from('coach_profiles')
        .upsert({ coach_slug: entity.slug, photo_url: url }, { onConflict: 'coach_slug' })
    } else {
      await supabase.from('partners')
        .upsert({ partner_slug: entity.slug, name: entity.name, logo_url: url }, { onConflict: 'partner_slug' })
    }
  }

  if (!entity) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={pm.backdrop}>
        <View style={pm.sheet}>
          <View style={pm.headerRow}>
            <Text style={pm.title}>{entity.name}</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={pm.sub}>
            Replacing this photo updates it live for every user. No re-upload elsewhere needed.
          </Text>
          {!loading && (
            <ImageUploader
              bucket={entity.kind === 'coach' ? 'coach-photos' : 'partner-logos'}
              storagePath={`${entity.slug}/photo.jpg`}
              currentUrl={currentUrl}
              onUpload={handleUpload}
              label={entity.kind === 'coach' ? 'Coach Photo' : 'Partner Logo'}
              size={96}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const pm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.lg, width: '100%', maxWidth: 360 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17, marginBottom: 16 },
})

// ── Metric tile ──────────────────────────────────────────────────────────────
function MetricTile({ label, value, border }) {
  return (
    <View style={[styles.metricTile, border && styles.metricTileBorder]}>
      <Text style={styles.metricValue}>{value != null ? formatNumber(value) : '—'}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

export default function FounderPortalScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { setPortalMode } = useAuth()

  const [loading, setLoading]   = useState(true)
  const [userCount, setUserCount] = useState(null)
  const [roleCounts, setRoleCounts] = useState({})
  const [proCount, setProCount] = useState(null)
  const [queue, setQueue]       = useState(null)
  const [gdprPending, setGdprPending] = useState(null)
  const [photoEntity, setPhotoEntity] = useState(null)

  // ── Spotlight carousel curation ──────────────────────────────────────────
  const [featuredList, setFeaturedList]     = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [addOpen, setAddOpen]     = useState(false)
  const [addType, setAddType]     = useState(FEATURED_TYPES[0].type)
  const [addRefId, setAddRefId]   = useState(null)
  const [addCaption, setAddCaption] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadFeatured() {
    setFeaturedLoading(true)
    const { data } = await supabase
      .from('featured_content').select('*')
      .order('priority', { ascending: true }).order('created_at', { ascending: true })
    setFeaturedList(data || [])
    setFeaturedLoading(false)
  }
  useEffect(() => { loadFeatured() }, [])

  function openAdd() {
    setAddType(FEATURED_TYPES[0].type)
    setAddRefId(null)
    setAddCaption('')
    setAddOpen(true)
  }

  async function confirmAdd() {
    if (!addRefId || saving) return
    setSaving(true)
    const nextPriority = featuredList.reduce((max, r) => Math.max(max, r.priority), -1) + 1
    await supabase.from('featured_content').insert({
      content_type: addType,
      ref_id: addRefId,
      caption: addCaption.trim() || null,
      priority: nextPriority,
    })
    setSaving(false)
    setAddOpen(false)
    loadFeatured()
  }

  async function removeFeatured(id) {
    await supabase.from('featured_content').delete().eq('id', id)
    setFeaturedList(list => list.filter(r => r.id !== id))
  }

  function backToMyBlueprint() {
    setPortalMode('personal')
    navigation.navigate('HomeMain')
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [
        { count: totalUsers },
        { data: roles },
        { count: activePro },
        { data: queueSnapshot },
        { count: pendingGdpr },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('role'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.rpc('get_ops_queue_snapshot'),
        supabase.from('gdpr_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      if (cancelled) return
      setUserCount(totalUsers ?? 0)
      const counts = {}
      ;(roles || []).forEach(r => { counts[r.role] = (counts[r.role] || 0) + 1 })
      setRoleCounts(counts)
      setProCount(activePro ?? 0)
      setQueue(queueSnapshot?.[0] || null)
      setGdprPending(pendingGdpr ?? 0)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerEyebrow}>FOUNDER DASHBOARD</Text>
          <TouchableOpacity style={styles.backLink} activeOpacity={0.75} onPress={backToMyBlueprint}>
            <ArrowLeftRight size={12} color="rgba(245,240,232,0.6)" strokeWidth={2} />
            <Text style={styles.backLinkText}>My Blueprint</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Platform Overview</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Users size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>PLATFORM</Text>
        </View>
        <View style={styles.metricRow}>
          <MetricTile label="Total Users" value={userCount} />
          <MetricTile label="Active Pro Members" value={proCount} border />
        </View>
        <View style={styles.pillWrap}>
          {Object.entries(roleCounts).map(([role, count]) => (
            <View key={role} style={styles.rolePill}>
              <Text style={styles.rolePillText}>{role}: {count}</Text>
            </View>
          ))}
          {!loading && Object.keys(roleCounts).length === 0 && (
            <Text style={styles.emptyText}>No roles assigned to any account yet.</Text>
          )}
        </View>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Inbox size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>REQUEST QUEUE</Text>
        </View>
        <Card style={styles.queueCard}>
          <View style={styles.queueRow}>
            <MetricTile label="Queued" value={queue?.queued} />
            <MetricTile label="In Progress" value={queue?.in_progress} border />
            <MetricTile label="Completed Today" value={queue?.completed_today} border />
          </View>
          <View style={styles.urgencyRow}>
            <View style={[styles.urgencyDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.urgencyText}>{formatNumber(queue?.red_count ?? 0)} red</Text>
            <View style={[styles.urgencyDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.urgencyText}>{formatNumber(queue?.amber_count ?? 0)} amber</Text>
            <View style={[styles.urgencyDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.urgencyText}>{formatNumber(queue?.green_count ?? 0)} green</Text>
          </View>
        </Card>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <ShieldAlert size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>COMPLIANCE</Text>
        </View>
        <Card style={styles.complianceCard}>
          <Text style={styles.complianceValue}>{gdprPending ?? 0}</Text>
          <Text style={styles.complianceLabel}>GDPR requests awaiting action</Text>
        </Card>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Newspaper size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>THE WEEKLY BLUEPRINT</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('WeeklyIssueEditor')}>
          <Card style={styles.weeklyLinkCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.weeklyLinkTitle}>Manage this week's issue</Text>
              <Text style={styles.weeklyLinkSub}>Theme, events, student spotlight, coach board, founders' note, and more.</Text>
            </View>
            <ChevronRight size={16} color={colors.light} />
          </Card>
        </TouchableOpacity>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Sparkles size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>HOME SPOTLIGHT CAROUSEL</Text>
        </View>
        <Text style={styles.sectionCaption}>
          What rotates on the Home dashboard's Spotlight carousel — every item is real,
          live-pulled content (a real service, coach, partner, or board), never a placeholder.
        </Text>

        {!featuredLoading && featuredList.length === 0 && (
          <Text style={styles.emptyText}>Nothing pinned yet — the carousel is hidden on Home until you add something.</Text>
        )}

        {featuredList.map(row => (
          <Card key={row.id} style={styles.featuredRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.featuredType}>{FEATURED_TYPE_LABEL[row.content_type]}</Text>
              <Text style={styles.featuredName} numberOfLines={1}>{nameForFeatured(row)}</Text>
              {!!row.caption && <Text style={styles.featuredCaption} numberOfLines={1}>“{row.caption}”</Text>}
            </View>
            <TouchableOpacity
              onPress={() => removeFeatured(row.id)}
              style={styles.featuredRemoveBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${nameForFeatured(row)} from the Spotlight carousel`}
            >
              <Trash2 size={14} color={colors.destructive} />
            </TouchableOpacity>
          </Card>
        ))}

        <TouchableOpacity style={styles.addFeaturedBtn} activeOpacity={0.8} onPress={openAdd}>
          <Plus size={15} color={colors.navy} strokeWidth={2.2} />
          <Text style={styles.addFeaturedBtnText}>Add to Spotlight</Text>
        </TouchableOpacity>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <ImageIcon size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>MANAGE PHOTOS</Text>
        </View>
        <Text style={styles.sectionCaption}>
          Tap any coach or partner to replace their live photo instantly, no separate upload
          step for them.
        </Text>

        <Text style={styles.photoGroupLabel}>Coaches</Text>
        <View style={styles.pillWrap}>
          {LIVE_COACHES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.photoPill}
              activeOpacity={0.75}
              onPress={() => setPhotoEntity({ kind: 'coach', slug: coachSlug(c.id), name: c.name })}
            >
              <Text style={styles.photoPillText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.photoGroupLabel}>Lifestyle Partners</Text>
        <View style={styles.pillWrap}>
          {LIVE_PARTNERS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.photoPill}
              activeOpacity={0.75}
              onPress={() => setPhotoEntity({ kind: 'partner', slug: p.id, name: p.brand })}
            >
              <Text style={styles.photoPillText}>{p.brand}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      <PhotoPickerModal
        visible={!!photoEntity}
        onClose={() => setPhotoEntity(null)}
        entity={photoEntity}
      />

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={pm.backdrop}>
          <View style={[pm.sheet, { maxHeight: '80%' }]}>
            <View style={pm.headerRow}>
              <Text style={pm.title}>Add to Spotlight</Text>
              <TouchableOpacity onPress={() => setAddOpen(false)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={pm.sub}>Pick a real item already in the app — nothing here is fabricated.</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.addLabel}>Type</Text>
              <View style={styles.pillWrap}>
                {FEATURED_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.type}
                    style={[styles.typePill, addType === t.type && styles.typePillActive]}
                    activeOpacity={0.75}
                    onPress={() => { setAddType(t.type); setAddRefId(null) }}
                  >
                    <Text style={[styles.typePillText, addType === t.type && styles.typePillTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.addLabel}>Item</Text>
              <View style={styles.pillWrap}>
                {FEATURED_TYPES.find(t => t.type === addType)?.options.map(o => (
                  <TouchableOpacity
                    key={o.refId}
                    style={[styles.typePill, addRefId === o.refId && styles.typePillActive]}
                    activeOpacity={0.75}
                    onPress={() => setAddRefId(o.refId)}
                  >
                    <Text style={[styles.typePillText, addRefId === o.refId && styles.typePillTextActive]} numberOfLines={1}>{o.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.addLabel}>Caption (optional)</Text>
              <TextInput
                value={addCaption}
                onChangeText={setAddCaption}
                placeholder="e.g. Founder's pick this month"
                placeholderTextColor={colors.light}
                style={styles.captionInput}
                maxLength={80}
              />

              <TouchableOpacity
                style={[styles.confirmAddBtn, !addRefId && { opacity: 0.4 }]}
                activeOpacity={0.85}
                disabled={!addRefId || saving}
                onPress={confirmAdd}
              >
                <Text style={styles.confirmAddBtnText}>{saving ? 'Adding…' : 'Add to carousel'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },

  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backLinkText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: -4, marginBottom: 10, lineHeight: 17 },

  metricRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.card, padding: 16, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card },
  metricTile: { flex: 1 },
  metricTileBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14, marginLeft: 4 },
  metricValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  metricLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  rolePill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  rolePillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, textTransform: 'capitalize' },
  emptyText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, fontStyle: 'italic' },

  queueCard: {},
  queueRow: { flexDirection: 'row', marginBottom: 14 },
  urgencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginRight: 8 },

  complianceCard: { alignItems: 'center', paddingVertical: 20 },
  complianceValue: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy },
  complianceLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 4 },

  weeklyLinkCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weeklyLinkTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  weeklyLinkSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },

  photoGroupLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, marginTop: 14, marginBottom: 2 },
  photoPill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  photoPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, padding: 14 },
  featuredType: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  featuredName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy, marginTop: 2 },
  featuredCaption: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 2, fontStyle: 'italic' },
  featuredRemoveBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(220,38,38,0.08)' },

  addFeaturedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 11, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.18)', borderStyle: 'dashed',
    backgroundColor: 'rgba(30,58,95,0.03)',
  },
  addFeaturedBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  addLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  typePill: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)', maxWidth: 220 },
  typePillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  typePillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
  typePillTextActive: { color: colors.cream },
  captionInput: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.navy,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)', borderRadius: radius.button,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  confirmAddBtn: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center', marginTop: 18, marginBottom: 4 },
  confirmAddBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.cream },
})
