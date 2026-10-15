import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native'
import { CreditCard, AlertCircle } from 'lucide-react-native'
import { fonts, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

// The real payment step for Ad Board ads and Marketplace "Providing
// Services" listings (pricing doc §1.6/§1.7). Same shape as
// FoundationCheckoutModal (task #95) — reused here rather than reinvented:
//
//   const checkoutRef = useRef(null)
//   <BoardListingCheckoutModal ref={checkoutRef} />
//   const row = await checkoutRef.current.start({ listingKind: 'ad_board', payload })
//
// start() resolves with the created ads/marketplace_skills row once it
// actually exists — either immediately (the free-this-month case, created
// synchronously by create-board-listing-checkout-session) or once
// stripe-webhook has confirmed payment and inserted it — or rejects
// (cancelled / failed). Payment itself never happens in this app, on any
// platform (same app-wide rule FoundationCheckoutModal already follows):
// create-board-listing-checkout-session returns a Stripe-hosted Checkout
// URL, this opens it in the device's external browser (Linking.openURL)
// and polls public.board_listing_payments — which the client can only ever
// read, never write — until it carries created_listing_id, then fetches
// that row.
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes — generous for a Checkout page, not infinite

const TARGET_TABLE = { ad_board: 'ads', marketplace_skill: 'marketplace_skills' }

function formatEuro(cents) {
  return `€${(cents / 100).toFixed(2)}`
}

const BoardListingCheckoutModal = forwardRef(function BoardListingCheckoutModal(_props, ref) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const [state, setState] = useState({ visible: false, phase: 'idle', error: null, amountCents: null })
  const resolverRef = useRef(null)
  const pollTimerRef = useRef(null)
  const pollDeadlineRef = useRef(0)
  const paramsRef = useRef(null)
  const paymentIdRef = useRef(null)
  const checkingRef = useRef(false)

  useEffect(() => () => stopPolling(), [])

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  async function checkOnce() {
    const paymentId = paymentIdRef.current
    const params = paramsRef.current
    if (!paymentId || !params || checkingRef.current) return
    checkingRef.current = true
    try {
      const { data, error } = await supabase
        .from('board_listing_payments')
        .select('status, created_listing_id')
        .eq('id', paymentId)
        .maybeSingle()

      if (!error && data?.status === 'paid' && data.created_listing_id) {
        const targetTable = TARGET_TABLE[params.listingKind]
        const { data: row } = await supabase.from(targetTable).select('*').eq('id', data.created_listing_id).maybeSingle()
        stopPolling()
        setState({ visible: false, phase: 'idle', error: null, amountCents: null })
        resolverRef.current?.resolve(row || null)
        resolverRef.current = null
        return
      }
      if (!error && data?.status === 'failed') {
        stopPolling()
        setState(s => ({ ...s, phase: 'error', error: 'Your payment did not go through. Please try again.' }))
        return
      }
      if (Date.now() > pollDeadlineRef.current) {
        stopPolling()
        setState(s => ({
          ...s,
          phase: 'error',
          error: "We haven't seen your payment go through yet. If you completed checkout, wait a moment and tap “I've paid — check again”. Otherwise tap Cancel and try again.",
        }))
      }
    } finally {
      checkingRef.current = false
    }
  }

  function beginPolling() {
    stopPolling()
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS
    pollTimerRef.current = setInterval(checkOnce, POLL_INTERVAL_MS)
  }

  async function run(params) {
    paramsRef.current = params
    setState({ visible: true, phase: 'creating', error: null, amountCents: null })
    try {
      const { data, error } = await supabase.functions.invoke('create-board-listing-checkout-session', {
        body: { listing_kind: params.listingKind, payload: params.payload },
      })
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Could not start checkout. Please try again.')
      }

      if (data.free) {
        setState({ visible: false, phase: 'idle', error: null, amountCents: null })
        resolverRef.current?.resolve(data.row || null)
        resolverRef.current = null
        return
      }

      paymentIdRef.current = data.payment_id
      setState(s => ({ ...s, phase: 'awaiting_payment', amountCents: data.amount_cents ?? null }))
      await Linking.openURL(data.url)
      beginPolling()
    } catch (err) {
      setState(s => ({ ...s, phase: 'error', error: err?.message || 'Something went wrong. Please try again.' }))
    }
  }

  function start(params) {
    return new Promise((resolve, reject) => {
      resolverRef.current = { resolve, reject }
      run(params)
    })
  }

  function handleCancel() {
    stopPolling()
    setState({ visible: false, phase: 'idle', error: null, amountCents: null })
    resolverRef.current?.reject(new Error('Payment cancelled.'))
    resolverRef.current = null
  }

  function handleRetry() {
    if (paramsRef.current) run(paramsRef.current)
  }

  useImperativeHandle(ref, () => ({ start }))

  const { visible, phase, error, amountCents } = state

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={() => {}}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {(phase === 'creating' || phase === 'awaiting_payment') && (
            <>
              <View style={styles.iconBox}>
                <CreditCard size={28} color={colors.textPrimary} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>
                {phase === 'creating' ? 'Preparing checkout…' : 'Waiting for payment'}
              </Text>
              <Text style={styles.body}>
                {phase === 'creating'
                  ? 'One moment.'
                  : `Complete your ${amountCents != null ? formatEuro(amountCents) + ' ' : ''}payment in the browser tab that just opened, then come back here.`}
              </Text>
              <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginTop: 18 }} />
              {phase === 'awaiting_payment' && (
                <>
                  <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={checkOnce}>
                    <Text style={styles.primaryBtnText}>I've paid — check again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.75} onPress={handleCancel}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {phase === 'error' && (
            <>
              <View style={[styles.iconBox, styles.iconBoxError]}>
                <AlertCircle size={28} color={colors.destructive} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>Payment not confirmed</Text>
              <Text style={styles.body}>{error}</Text>
              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={checkOnce}>
                <Text style={styles.primaryBtnText}>I've paid — check again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryBtn} activeOpacity={0.8} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>Start checkout again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.75} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  )
})

export default BoardListingCheckoutModal

function getStyles(colors) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(30,58,95,0.15)', marginBottom: 18,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(30,58,95,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  iconBoxError: { backgroundColor: 'rgba(220,38,38,0.08)' },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  body: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    textAlign: 'center', marginTop: 10, lineHeight: 20, maxWidth: 300,
  },
  primaryBtn: {
    marginTop: 22, backgroundColor: colors.accentBg, borderRadius: radius.button,
    paddingHorizontal: 28, paddingVertical: 13, width: '100%', alignItems: 'center',
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.accentFg },
  retryBtn: { marginTop: 12, paddingVertical: 4 },
  retryBtnText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textPrimary },
  cancelBtn: { marginTop: 14, paddingVertical: 4 },
  cancelBtnText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.muted },
  })
}
