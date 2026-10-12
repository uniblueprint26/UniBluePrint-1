import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native'
import { CreditCard, AlertCircle } from 'lucide-react-native'
import { colors, fonts, radius, spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

// The real payment step for Foundation Blueprint (task #95), reused by all
// 8 builder screens: `const checkoutRef = useRef(null)`, render
// `<FoundationCheckoutModal ref={checkoutRef} />` once alongside
// `<QuestionFlow>`, then inside handleComplete(), right after inserting the
// draft document row and before generating anything:
//
//   await checkoutRef.current.start({
//     documentTable: 'cv_documents', documentId: doc.id, tier: v.tier,
//   })
//
// start() resolves once Stripe has actually confirmed the charge, or
// rejects (cancelled / failed) — a rejection propagates up through
// QuestionFlow's own try/catch exactly like any other handleComplete
// error, so generation and submit_document_for_review never run without
// a real payment.
//
// Payment itself never happens in this app, on any platform — same
// app-wide rule every other money flow here already follows (constants/
// site.js's own header comment). create-foundation-checkout-session
// returns a Stripe-hosted Checkout URL; this opens it in the device's
// external browser (Linking.openURL) and polls public.foundation_payments
// — which the client can only ever read, never write (see that table's
// migration comment) — until stripe-webhook has flipped it to 'paid'.
// There's no deep-link return trip to wire up: the app just keeps
// checking while the student is away in the browser tab.
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes — generous for a Checkout page, not infinite

function formatEuro(cents) {
  return `€${(cents / 100).toFixed(2)}`
}

const FoundationCheckoutModal = forwardRef(function FoundationCheckoutModal(_props, ref) {
  const [state, setState] = useState({ visible: false, phase: 'idle', error: null, amountCents: null })
  const resolverRef = useRef(null)
  const pollTimerRef = useRef(null)
  const pollDeadlineRef = useRef(0)
  const paramsRef = useRef(null)
  const checkingRef = useRef(false)

  useEffect(() => () => stopPolling(), [])

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  async function checkOnce() {
    const params = paramsRef.current
    if (!params || checkingRef.current) return
    checkingRef.current = true
    try {
      const { data, error } = await supabase
        .from('foundation_payments')
        .select('status')
        .eq('document_table', params.documentTable)
        .eq('document_id', params.documentId)
        .eq('tier', params.tier)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle()
      if (!error && data) {
        stopPolling()
        setState({ visible: false, phase: 'idle', error: null, amountCents: null })
        resolverRef.current?.resolve()
        resolverRef.current = null
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
      const { data, error } = await supabase.functions.invoke('create-foundation-checkout-session', {
        body: { document_table: params.documentTable, document_id: params.documentId, tier: params.tier },
      })
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Could not start checkout. Please try again.')
      }

      if (data.already_paid) {
        setState({ visible: false, phase: 'idle', error: null, amountCents: null })
        resolverRef.current?.resolve()
        resolverRef.current = null
        return
      }

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
                <CreditCard size={28} color={colors.navy} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>
                {phase === 'creating' ? 'Preparing checkout…' : 'Waiting for payment'}
              </Text>
              <Text style={styles.body}>
                {phase === 'creating'
                  ? 'One moment.'
                  : `Complete your ${amountCents != null ? formatEuro(amountCents) + ' ' : ''}payment in the browser tab that just opened, then come back here.`}
              </Text>
              <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 18 }} />
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

export default FoundationCheckoutModal

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
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
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, textAlign: 'center' },
  body: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    textAlign: 'center', marginTop: 10, lineHeight: 20, maxWidth: 300,
  },
  primaryBtn: {
    marginTop: 22, backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 28, paddingVertical: 13, width: '100%', alignItems: 'center',
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.cream },
  retryBtn: { marginTop: 12, paddingVertical: 4 },
  retryBtnText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.navy },
  cancelBtn: { marginTop: 14, paddingVertical: 4 },
  cancelBtnText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.muted },
})
