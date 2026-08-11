import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeftRight, Users, Inbox, ShieldAlert, TrendingUp, Image as ImageIcon, X,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ImageUploader from '../../components/ui/ImageUploader'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { COACHES, coachSlug } from '../ElevationScreen'
import { PARTNERS } from '../LifestyleScreen'

const LIVE_COACHES  = COACHES.filter(c => !c.shell)
const LIVE_PARTNERS = PARTNERS.filter(p => p.status === 'live')

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
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={pm.sub}>
            Replacing this photo updates it live for every user — no re-upload elsewhere needed.
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
      <Text style={styles.metricValue}>{value ?? '—'}</Text>
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
            <Text style={styles.urgencyText}>{queue?.red_count ?? 0} red</Text>
            <View style={[styles.urgencyDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.urgencyText}>{queue?.amber_count ?? 0} amber</Text>
            <View style={[styles.urgencyDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.urgencyText}>{queue?.green_count ?? 0} green</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

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

  photoGroupLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, marginTop: 14, marginBottom: 2 },
  photoPill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  photoPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
})
