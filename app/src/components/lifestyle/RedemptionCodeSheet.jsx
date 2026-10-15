/**
 * RedemptionCodeSheet — "Show code" flow for claiming a Lifestyle Blueprint
 * partner deal in person (founder decision, Oct 2026 — see
 * supabase/migrations/20261015141000_deal_redemption_codes.sql for the
 * backend side this renders).
 *
 * ═══ Why a code at all, and why this specific display ═══════════════════
 * There's no partner-side scanning app or portal — a partner only ever
 * reads this code with their own eyes (a cashier glancing at a phone
 * screen), never verifies it against a backend. That's a deliberate,
 * known limitation (see the migration's own header), not an oversight.
 * This screen compensates the only way a client can: showing the account
 * holder's own name + photo (and Verified Student badge, when they have
 * one) directly alongside the code, so a screenshot forwarded to a friend
 * visibly doesn't match whoever is actually holding the phone, plus a
 * large, hard-to-miss countdown so a stale screenshot is also visibly
 * expired. Neither of those is cryptographic proof of anything — just the
 * best a no-partner-verification flow can do.
 *
 * ═══ Code lifecycle ════════════════════════════════════════════════════
 * generate_deal_redemption_code() issues a fresh 6-digit code valid for 90
 * seconds and invalidates whatever code was still valid before it — so
 * requesting a new one (on open, or via "Get a new code" once expired/at
 * any time) is always safe, never multiplies live codes. The countdown
 * here is purely a client-side render of `expires_at`; the server is what
 * actually enforces expiry (there's nothing to enforce against here since
 * nothing scans it, but the column exists for a future partner-verification
 * feature per the migration's own note).
 *
 * `requires_pro` comes back from the RPC instead of a code when the caller
 * doesn't have Lifestyle Blueprint claim access (Pro / Mental Health
 * partner / Founder/Operations) — same decision get_lifestyle_partner_contact()
 * already makes for the contact-chip flow, reused here rather than
 * re-derived, so this shows the same upgrade prompt instead of a code.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Image, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Timer, RotateCcw } from 'lucide-react-native'
import VerifiedBadge from '../ui/VerifiedBadge'
import ProUpgradeGate from '../ui/ProUpgradeGate'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function useOwnHolderProfile(enabled) {
  const { user } = useAuth()
  const [holder, setHolder] = useState(null)

  useEffect(() => {
    if (!enabled || !user?.id) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('full_name, avatar_url, verified_student')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setHolder(data || null) })
      .catch(() => { if (!cancelled) setHolder(null) })
    return () => { cancelled = true }
  }, [enabled, user?.id])

  return holder
}

export default function RedemptionCodeSheet({ partner, visible, onClose }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const holder = useOwnHolderProfile(visible && !!partner)

  const [state, setState] = useState({ loading: false, code: null, expiresAt: null, requiresPro: false, error: false })
  const [secondsLeft, setSecondsLeft] = useState(0)
  const tickRef = useRef(null)

  const fetchCode = useCallback(() => {
    if (!partner?.id) return
    setState(s => ({ ...s, loading: true, error: false }))
    supabase.rpc('generate_deal_redemption_code', {
      _partner_slug: partner.id,
      _deal_label: partner.deal || null,
    }).then(({ data, error }) => {
      const row = !error && Array.isArray(data) ? data[0] : null
      if (!row) {
        setState({ loading: false, code: null, expiresAt: null, requiresPro: false, error: true })
        return
      }
      setState({
        loading: false,
        code: row.requires_pro ? null : row.code,
        expiresAt: row.requires_pro ? null : row.expires_at,
        requiresPro: !!row.requires_pro,
        error: false,
      })
    }).catch(() => {
      setState({ loading: false, code: null, expiresAt: null, requiresPro: false, error: true })
    })
  }, [partner?.id, partner?.deal])

  // Fetch a fresh code each time the sheet opens for this partner.
  useEffect(() => {
    if (!visible || !partner?.id) return
    fetchCode()
  }, [visible, partner?.id, fetchCode])

  // Client-side countdown, ticking every second off the server's expires_at.
  useEffect(() => {
    clearInterval(tickRef.current)
    if (!state.expiresAt) {
      setSecondsLeft(0)
      return
    }
    const update = () => {
      const left = Math.max(0, Math.round((new Date(state.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(left)
    }
    update()
    tickRef.current = setInterval(update, 1000)
    return () => clearInterval(tickRef.current)
  }, [state.expiresAt])

  if (!partner) return null
  const expired = !!state.expiresAt && secondsLeft <= 0
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={e => e.stopPropagation?.()}
        >
          <View style={styles.handle} />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={16} color={colors.muted} />
          </TouchableOpacity>

          <Text style={styles.title}>Show this to redeem</Text>
          <Text style={styles.subtitle}>{partner.brand}{partner.deal ? ` · ${partner.deal}` : ''}</Text>

          {state.loading && !state.code && !state.requiresPro && (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={colors.gold} />
            </View>
          )}

          {!state.loading && state.requiresPro && (
            <ProUpgradeGate
              variant="inline"
              title="Redemption codes are a Pro feature"
              message={`Pro unlocks the redemption code needed to claim ${partner.brand}'s deal in person. Mental Health & Wellbeing partners stay free for everyone.`}
              style={{ marginTop: 10, marginHorizontal: 0 }}
            />
          )}

          {!state.loading && state.error && !state.requiresPro && (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>Couldn't generate a code. Please try again.</Text>
              <TouchableOpacity style={styles.regenBtn} onPress={fetchCode} activeOpacity={0.8}>
                <RotateCcw size={14} color={colors.accentFg} />
                <Text style={styles.regenBtnText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!state.requiresPro && !state.error && state.code && (
            <>
              {/* Account holder — the only thing standing in for real
                  partner-side verification: a cashier compares this name/
                  photo against whoever is holding the phone. */}
              <View style={styles.holderRow}>
                {holder?.avatar_url ? (
                  <Image source={{ uri: holder.avatar_url }} style={styles.holderAvatar} />
                ) : (
                  <View style={[styles.holderAvatar, styles.holderAvatarFallback]}>
                    <Text style={styles.holderAvatarInitial}>
                      {(holder?.full_name || '?').trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.holderName} numberOfLines={1}>{holder?.full_name || 'Account holder'}</Text>
                  {!!holder?.verified_student && (
                    <VerifiedBadge verified label="Verified Student" compact style={{ marginTop: 3 }} />
                  )}
                </View>
              </View>

              <View style={[styles.codeBlock, expired && styles.codeBlockExpired]}>
                <Text style={[styles.codeText, expired && styles.codeTextExpired]}>
                  {state.code.split('').join(' ')}
                </Text>
              </View>

              <View style={styles.countdownRow}>
                <Timer size={13} color={expired ? colors.destructive : colors.muted} />
                <Text style={[styles.countdownText, expired && styles.countdownTextExpired]}>
                  {expired ? 'Expired' : `Valid for ${minutes}:${seconds}`}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.regenBtn, expired && styles.regenBtnUrgent]}
                onPress={fetchCode}
                activeOpacity={0.8}
                disabled={state.loading}
              >
                <RotateCcw size={14} color={expired ? '#FFFFFF' : colors.accentFg} />
                <Text style={[styles.regenBtnText, expired && styles.regenBtnTextUrgent]}>
                  {expired ? 'Get a new code' : 'Regenerate code'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.card + 4,
      borderTopRightRadius: radius.card + 4,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    handle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: 'rgba(30,58,95,0.15)', alignSelf: 'center', marginBottom: 14,
    },
    closeBtn: {
      position: 'absolute', top: 14, right: 14, zIndex: 1,
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary, textAlign: 'center' },
    subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 18 },

    loadingBlock: { paddingVertical: 28, alignItems: 'center' },

    errorBlock: { alignItems: 'center', paddingVertical: 10, gap: 12 },
    errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },

    holderRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.surfaceAlt, borderRadius: radius.button,
      padding: 10, marginBottom: 16,
    },
    holderAvatar: { width: 40, height: 40, borderRadius: 20 },
    holderAvatarFallback: {
      backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center',
    },
    holderAvatarInitial: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFFFFF' },
    holderName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },

    codeBlock: {
      backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
      paddingVertical: 24, alignItems: 'center', ...shadows.card,
    },
    codeBlockExpired: { opacity: 0.4 },
    codeText: {
      fontFamily: fonts.sansBold, fontSize: 36, letterSpacing: 4,
      color: colors.textPrimary,
    },
    codeTextExpired: { textDecorationLine: 'line-through' },

    countdownRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      marginTop: 12, marginBottom: 18,
    },
    countdownText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
    countdownTextExpired: { color: colors.destructive, fontFamily: fonts.sansSemiBold },

    regenBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 12, borderRadius: radius.button,
      backgroundColor: colors.accentBg,
    },
    regenBtnUrgent: { backgroundColor: colors.destructive },
    regenBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },
    regenBtnTextUrgent: { color: '#FFFFFF' },
  })
}
