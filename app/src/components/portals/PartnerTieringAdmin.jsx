import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import {
  Layers, Settings2, History, X, Lock, Search as SearchIcon, Percent,
} from 'lucide-react-native'

import Card from '../ui/Card'
import PartnerTierBadge from '../ui/PartnerTierBadge'
import FoundingPartnerBadge from '../ui/FoundingPartnerBadge'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// ── Partner Tiering admin view ──────────────────────────────────────────────
// Shared by FounderPortalScreen and OperationsPortalScreen — both are
// is_partner_tier_admin() (founder/finance/operations), the audience the
// framework doc names for this tooling. Mounted as one section rather than
// its own screen, matching how every other piece of admin tooling on these
// two portals is laid out (a sectionRow + Card, not a separate route).
//
// This deliberately does not compute, suggest, or default any tier/payment
// option — docs/business/partner-tiering-framework.md is explicit that
// Access/Plus/Signature is a human Size/Service/Pricing judgment call, never
// derived. Every control here just calls the matching set_*()/record_*() RPC
// with exactly what the admin picked.
//
// The negotiated-rate recorder and negotiation history are additionally
// gated client-side to finance/founder — `canSeeNegotiatedRate` below — even
// though the backend (record_negotiated_rate / get_negotiation_history) and
// get_partner_tier_admin_list() (which nulls the rate for anyone else) both
// already enforce this server-side. Belt-and-suspenders: an Operations admin
// should never even see the control, not just have it fail if tapped.

const TIER_OPTIONS = [
  { value: 'access', label: 'Access' },
  { value: 'plus', label: 'Plus' },
  { value: 'signature', label: 'Signature' },
]
const PAYMENT_OPTIONS = [
  { value: 'fixed', label: 'Fixed (Option A)' },
  { value: 'negotiated', label: 'Negotiated (Option B)' },
]

function sameEntity(a, b) {
  return !!a && !!b && a.entity_type === b.entity_type && a.entity_id === b.entity_id
}

export default function PartnerTieringAdmin() {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const { isFinance, isFounder } = useAuth()
  // Anyone holding finance or founder — the backend's is_finance_or_founder()
  // check, mirrored client-side (see header comment).
  const canSeeNegotiatedRate = isFinance || isFounder

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')

  const [manageEntity, setManageEntity] = useState(null) // row being managed, or null
  const [historyEntity, setHistoryEntity] = useState(null) // row whose history modal is open, or null

  function loadList() {
    setLoading(true)
    setLoadError(null)
    supabase.rpc('get_partner_tier_admin_list').then(({ data, error }) => {
      if (error) {
        setLoadError('Could not load the partner/coach roster.')
      } else {
        setList(data || [])
      }
      setLoading(false)
    })
  }
  useEffect(loadList, [])

  // Keeps the roster list and the open "manage" modal (which reads from its
  // own snapshot of the row, not live off `list`) in sync after a write,
  // without a full reload round-trip for every single tap.
  function patchRow(entityType, entityId, patch) {
    setList(prev => prev.map(r => (
      r.entity_type === entityType && r.entity_id === entityId ? { ...r, ...patch } : r
    )))
    setManageEntity(prev => (
      prev && prev.entity_type === entityType && prev.entity_id === entityId
        ? { ...prev, ...patch }
        : prev
    ))
  }

  const filtered = search.trim()
    ? list.filter(r => (
      r.display_name?.toLowerCase().includes(search.trim().toLowerCase())
      || r.category?.toLowerCase().includes(search.trim().toLowerCase())
    ))
    : list

  return (
    <View>
      <View style={styles.sectionRow}>
        <Layers size={14} color={colors.navy} />
        <Text style={styles.sectionEyebrow}>PARTNER TIERING</Text>
      </View>
      <Text style={styles.sectionCaption}>
        Access/Plus/Signature tier, Option A/B payment choice, and the Founding Partner Badge for
        every marketplace partner and Elevation coach. Tier is always your own judgment call — nothing
        here is computed from a formula.
      </Text>

      <View style={styles.searchRow}>
        <SearchIcon size={14} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or category"
          placeholderTextColor={colors.light}
          style={styles.searchInput}
        />
      </View>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.navy} />
            <Text style={styles.stateText}>Loading roster…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateRow}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={loadList} activeOpacity={0.7} style={styles.retryBtn} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyRow}>
            {list.length === 0 ? 'No partners or coaches found.' : 'Nothing matches that search.'}
          </Text>
        ) : filtered.map((row, i, arr) => (
          <TouchableOpacity
            key={`${row.entity_type}-${row.entity_id}`}
            style={[styles.row, i < arr.length - 1 && styles.divider]}
            activeOpacity={0.75}
            onPress={() => setManageEntity(row)}
            accessibilityRole="button"
            accessibilityLabel={`Manage tiering for ${row.display_name}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName} numberOfLines={1}>{row.display_name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {row.entity_type === 'coach' ? 'Coach' : 'Partner'}{row.category ? ` · ${row.category}` : ''}
              </Text>
              <View style={styles.rowBadges}>
                {row.tier ? <PartnerTierBadge tier={row.tier} compact /> : (
                  <Text style={styles.rowUnset}>Not classified</Text>
                )}
                <FoundingPartnerBadge founding={!!row.founding_badge} compact />
                {!!row.payment_option && (
                  <Text style={styles.rowPaymentPill}>
                    {row.payment_option === 'negotiated' ? 'Option B' : 'Option A'}
                  </Text>
                )}
              </View>
            </View>
            <Settings2 size={16} color={colors.light} />
          </TouchableOpacity>
        ))}
      </Card>

      <ManageTierModal
        entity={manageEntity}
        onClose={() => setManageEntity(null)}
        onPatch={patchRow}
        canSeeNegotiatedRate={canSeeNegotiatedRate}
        onViewHistory={row => setHistoryEntity(row)}
      />

      <NegotiationHistoryModal
        entity={historyEntity}
        onClose={() => setHistoryEntity(null)}
      />
    </View>
  )
}

// ── Manage one entity's tier / payment option / founding badge ────────────
function ManageTierModal({ entity, onClose, onPatch, canSeeNegotiatedRate, onViewHistory }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [savingTier, setSavingTier] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [savingBadge, setSavingBadge] = useState(false)

  const [ratePct, setRatePct] = useState('')
  const [rateRationale, setRateRationale] = useState('')
  const [recordingRate, setRecordingRate] = useState(false)
  const [rateError, setRateError] = useState(null)
  const [rateSaved, setRateSaved] = useState(false)

  useEffect(() => {
    // Reset the negotiated-rate draft fields every time a different entity
    // (or the modal itself) opens — this is always a new entry, never an
    // edit of the last-shown rate (the log is append-only, see migration).
    setRatePct('')
    setRateRationale('')
    setRateError(null)
    setRateSaved(false)
  }, [entity?.entity_type, entity?.entity_id])

  if (!entity) return null

  async function pickTier(tier) {
    if (savingTier) return
    setSavingTier(true)
    const { error } = await supabase.rpc('set_partner_tier', {
      _entity_type: entity.entity_type, _entity_id: entity.entity_id, _tier: tier,
    })
    setSavingTier(false)
    if (error) {
      Alert.alert('Could not set tier', error.message || 'Please try again.')
      return
    }
    onPatch(entity.entity_type, entity.entity_id, { tier, tier_set_at: new Date().toISOString() })
  }

  async function pickPayment(option) {
    if (savingPayment) return
    setSavingPayment(true)
    const { error } = await supabase.rpc('set_payment_option', {
      _entity_type: entity.entity_type, _entity_id: entity.entity_id, _payment_option: option,
    })
    setSavingPayment(false)
    if (error) {
      Alert.alert('Could not set payment option', error.message || 'Please try again.')
      return
    }
    onPatch(entity.entity_type, entity.entity_id, { payment_option: option })
  }

  async function toggleBadge() {
    if (savingBadge) return
    setSavingBadge(true)
    const nextGranted = !entity.founding_badge
    const { error } = await supabase.rpc('set_founding_badge', {
      _entity_type: entity.entity_type, _entity_id: entity.entity_id, _granted: nextGranted,
    })
    setSavingBadge(false)
    if (error) {
      Alert.alert('Could not update the Founding Partner Badge', error.message || 'Please try again.')
      return
    }
    onPatch(entity.entity_type, entity.entity_id, {
      founding_badge: nextGranted, founding_badge_set_at: new Date().toISOString(),
    })
  }

  async function submitRate() {
    const pct = Number(ratePct)
    if (ratePct.trim() === '' || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setRateError('Enter a commission percentage between 0 and 100.')
      return
    }
    if (!rateRationale.trim()) {
      setRateError('A rationale is required — this is the documentation discipline the framework depends on.')
      return
    }
    setRateError(null)
    setRecordingRate(true)
    const { error } = await supabase.rpc('record_negotiated_rate', {
      _entity_type: entity.entity_type,
      _entity_id: entity.entity_id,
      _negotiated_commission_pct: pct,
      _rationale: rateRationale.trim(),
    })
    setRecordingRate(false)
    if (error) {
      setRateError(error.message || 'Could not record the negotiated rate.')
      return
    }
    onPatch(entity.entity_type, entity.entity_id, {
      payment_option: 'negotiated',
      negotiated_commission_pct: pct,
      negotiated_rationale: rateRationale.trim(),
      negotiated_effective_from: new Date().toISOString(),
    })
    setRatePct('')
    setRateRationale('')
    setRateSaved(true)
  }

  return (
    <Modal visible={!!entity} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>{entity.display_name}</Text>
              <Text style={styles.modalSubEntity}>{entity.entity_type === 'coach' ? 'Coach' : 'Partner'}</Text>
            </View>
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Tier</Text>
            <View style={styles.pillWrap}>
              {TIER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pill, entity.tier === opt.value && styles.pillActive]}
                  activeOpacity={0.75}
                  disabled={savingTier}
                  onPress={() => pickTier(opt.value)}
                >
                  <Text style={[styles.pillText, entity.tier === opt.value && styles.pillTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              {!!entity.tier && (
                <TouchableOpacity
                  style={styles.pillClear}
                  activeOpacity={0.75}
                  disabled={savingTier}
                  onPress={() => pickTier(null)}
                >
                  <Text style={styles.pillClearText}>Clear</Text>
                </TouchableOpacity>
              )}
              {savingTier && <ActivityIndicator size="small" color={colors.navy} />}
            </View>

            <Text style={styles.fieldLabel}>Payment option</Text>
            <View style={styles.pillWrap}>
              {PAYMENT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pill, entity.payment_option === opt.value && styles.pillActive]}
                  activeOpacity={0.75}
                  disabled={savingPayment}
                  onPress={() => pickPayment(opt.value)}
                >
                  <Text style={[styles.pillText, entity.payment_option === opt.value && styles.pillTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              {!!entity.payment_option && (
                <TouchableOpacity
                  style={styles.pillClear}
                  activeOpacity={0.75}
                  disabled={savingPayment}
                  onPress={() => pickPayment(null)}
                >
                  <Text style={styles.pillClearText}>Clear</Text>
                </TouchableOpacity>
              )}
              {savingPayment && <ActivityIndicator size="small" color={colors.navy} />}
            </View>

            <Text style={styles.fieldLabel}>Founding Partner Badge</Text>
            <Text style={styles.fieldHint}>
              Timing only — live before public launch, regardless of tier or payment option.
            </Text>
            <TouchableOpacity
              style={[styles.pill, entity.founding_badge && styles.pillActive, { alignSelf: 'flex-start' }]}
              activeOpacity={0.75}
              disabled={savingBadge}
              onPress={toggleBadge}
            >
              {savingBadge ? (
                <ActivityIndicator size="small" color={colors.navy} />
              ) : (
                <Text style={[styles.pillText, entity.founding_badge && styles.pillTextActive]}>
                  {entity.founding_badge ? 'Granted — tap to revoke' : 'Not granted — tap to grant'}
                </Text>
              )}
            </TouchableOpacity>

            {canSeeNegotiatedRate ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Record a negotiated rate (Option B)</Text>
                <Text style={styles.fieldHint}>
                  Finance/founder only. Every rate recorded here is appended to a permanent, append-only
                  log — a rationale is required and this also sets Payment option to Negotiated.
                </Text>
                {entity.negotiated_commission_pct != null && (
                  <View style={styles.currentRateBox}>
                    <View style={styles.currentRateHeaderRow}>
                      <Percent size={13} color={colors.goldDeep} />
                      <Text style={styles.currentRateValue}>Current: {entity.negotiated_commission_pct}%</Text>
                    </View>
                    {!!entity.negotiated_rationale && (
                      <Text style={styles.currentRateRationale}>“{entity.negotiated_rationale}”</Text>
                    )}
                  </View>
                )}
                <View style={styles.rateInputRow}>
                  <TextInput
                    value={ratePct}
                    onChangeText={t => { setRatePct(t.replace(/[^0-9.]/g, '')); setRateSaved(false) }}
                    placeholder="e.g. 12.5"
                    placeholderTextColor={colors.light}
                    keyboardType="decimal-pad"
                    style={styles.ratePctInput}
                  />
                  <Text style={styles.ratePctSuffix}>% commission</Text>
                </View>
                <TextInput
                  value={rateRationale}
                  onChangeText={t => { setRateRationale(t); setRateSaved(false) }}
                  placeholder="Rationale — why this rate, for this partner/coach, right now (required)"
                  placeholderTextColor={colors.light}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={styles.rationaleInput}
                />
                {!!rateError && <Text style={styles.rateErrorText}>{rateError}</Text>}
                {rateSaved && <Text style={styles.rateSavedText}>Recorded.</Text>}
                <TouchableOpacity
                  style={[styles.recordBtn, recordingRate && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                  disabled={recordingRate}
                  onPress={submitRate}
                >
                  <Text style={styles.recordBtnText}>{recordingRate ? 'Recording…' : 'Record negotiated rate'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.historyLinkRow}
                  activeOpacity={0.75}
                  onPress={() => onViewHistory(entity)}
                >
                  <History size={14} color={colors.navy} />
                  <Text style={styles.historyLinkText}>View full negotiation history</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.financeOnlyBox}>
                <Lock size={13} color={colors.muted} />
                <Text style={styles.financeOnlyText}>
                  Recording or viewing a negotiated rate is finance/founder only.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Negotiation history — finance/founder only (also enforced server-side
// by get_negotiation_history itself, which returns nothing to anyone else) ──
function NegotiationHistoryModal({ entity, onClose }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!entity) return
    setLoading(true)
    setLoadError(null)
    supabase.rpc('get_negotiation_history', {
      _entity_type: entity.entity_type, _entity_id: entity.entity_id,
    }).then(({ data, error }) => {
      if (error) {
        setLoadError('Could not load negotiation history.')
      } else {
        setRows(data || [])
      }
      setLoading(false)
    })
  }, [entity?.entity_type, entity?.entity_id])

  if (!entity) return null

  return (
    <Modal visible={!!entity} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { maxHeight: '75%' }]}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>{entity.display_name}</Text>
              <Text style={styles.modalSubEntity}>Negotiation history</Text>
            </View>
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

          {loading ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 16 }} />
          ) : loadError ? (
            <Text style={styles.rateErrorText}>{loadError}</Text>
          ) : rows.length === 0 ? (
            <Text style={styles.emptyRow}>No negotiated-rate events recorded for this entity yet.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {rows.map((r, i) => (
                <View key={r.id} style={[styles.historyRow, i > 0 && styles.divider]}>
                  <View style={styles.currentRateHeaderRow}>
                    <Percent size={13} color={colors.goldDeep} />
                    <Text style={styles.currentRateValue}>{r.negotiated_commission_pct}%</Text>
                    <Text style={styles.historyDate}>
                      {new Date(r.effective_from).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.currentRateRationale}>“{r.rationale}”</Text>
                  {!!r.recorded_by_role_snapshot && (
                    <Text style={styles.historyMeta}>Recorded by {r.recorded_by_role_snapshot}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 17 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy },

  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, justifyContent: 'space-between' },
  stateText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  errorText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.destructive, lineHeight: 18 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(220,38,38,0.1)' },
  retryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.destructive },
  emptyRow: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, fontStyle: 'italic', padding: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.06)' },
  rowName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy },
  rowSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 1, textTransform: 'capitalize' },
  rowBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  rowUnset: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, fontStyle: 'italic' },
  rowPaymentPill: {
    fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.navy,
    backgroundColor: 'rgba(30,58,95,0.06)', borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '88%',
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy },
  modalSubEntity: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 2 },

  fieldLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  fieldHint: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, lineHeight: 16, marginBottom: 8 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pill: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  pillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.navy },
  pillTextActive: { color: colors.cream },
  pillClear: { paddingHorizontal: 10, paddingVertical: 8 },
  pillClearText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted, textDecorationLine: 'underline' },

  currentRateBox: { backgroundColor: '#FFFBEB', borderRadius: radius.button, padding: 12, marginBottom: 10 },
  currentRateHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currentRateValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.goldDeep },
  currentRateRationale: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, fontStyle: 'italic', marginTop: 5, lineHeight: 17 },

  rateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ratePctInput: {
    width: 90, fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)', borderRadius: radius.button,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  ratePctSuffix: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted },
  rationaleInput: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.navy, minHeight: 70,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)', borderRadius: radius.button,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  rateErrorText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.destructive, marginBottom: 8, lineHeight: 17 },
  rateSavedText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.success, marginBottom: 8 },
  recordBtn: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  recordBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.cream },

  historyLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingVertical: 8 },
  historyLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.navy },
  historyRow: { paddingVertical: 12 },
  historyDate: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginLeft: 'auto' },
  historyMeta: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.light, marginTop: 4, textTransform: 'capitalize' },

  financeOnlyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18,
    backgroundColor: colors.infoBg, borderRadius: radius.button, padding: 12,
  },
  financeOnlyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17 },
  })
}
