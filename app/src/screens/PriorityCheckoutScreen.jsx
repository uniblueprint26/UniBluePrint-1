import { useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, CreditCard, Lock, CheckCircle2, Ticket, Minus, Plus,
} from 'lucide-react-native'

import { priorityColors as pc, priorityFonts as pf, priorityGenres } from '../constants/priorityTheme'
import { findPriorityEvent } from '../constants/priorityEvents'
import { useAuth } from '../context/AuthContext'

// ─── Priority — Checkout ────────────────────────────────────────────────────
// Demo-only purchase screen: looks and behaves like a real ticket checkout
// (quantity, running total, card fields, a "Pay" action with a loading
// state and a confirmation), but makes no network call to any payment
// processor and charges no one. UniBlueprint's Stripe account is already
// wired up elsewhere in the codebase (see
// supabase/functions/create-checkout-session and stripe-webhook, used
// today for Pro subscriptions on the website) — this screen mirrors that
// same "hand off to Stripe, get a session back" shape so it's an easy
// follow-on, not a rewrite, once Priority ticketing goes live for real.
//
//   ┌───────────────────────────────────────────────────────────────────┐
//   │  REAL PAYMENT INTEGRATION GOES HERE.                               │
//   │  Replace `fakeSubmitOrder()` below with a call to a               │
//   │  `create-priority-checkout-session` Supabase Edge Function         │
//   │  (same pattern as create-checkout-session), passing eventId,       │
//   │  tierId and qty; have it create a Stripe Checkout Session in      │
//   │  `payment` mode with Priority's real line items, insert a         │
//   │  `priority_orders` row, and return the session url to open/        │
//   │  redirect to. Confirm the order server-side off the                │
//   │  `checkout.session.completed` webhook, the same way the           │
//   │  stripe-webhook function already confirms Pro subscriptions —     │
//   │  never mark an order paid from the client.                        │
//   └───────────────────────────────────────────────────────────────────┘

function fakeSubmitOrder({ event, tier, qty, email }) {
  // No API key lives here, no request leaves the device, and nothing is
  // charged. This only simulates the round trip so the flow feels real in
  // a demo. See the comment block above for exactly what replaces this.
  return new Promise(resolve => {
    setTimeout(() => resolve({ ok: true, orderRef: `DEMO-${event.id.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}` }), 1100)
  })
}

export default function PriorityCheckoutScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const event = findPriorityEvent(route?.params?.eventId)
  const tier = event?.tiers.find(t => t.id === route?.params?.tierId) || event?.tiers?.[0]

  const [qty, setQty] = useState(Math.max(1, route?.params?.qty || 1))
  const [email, setEmail] = useState(user?.email || '')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const subtotal = (tier?.price || 0) * qty
  const serviceFee = useMemo(() => Math.round(subtotal * 0.05 * 100) / 100, [subtotal])
  const total = Math.round((subtotal + serviceFee) * 100) / 100

  const canPay = !!email.trim() && !!cardName.trim()
    && cardNumber.replace(/\s/g, '').length >= 12
    && cardExpiry.trim().length >= 4
    && cardCvc.trim().length >= 3

  function dec() { setQty(q => Math.max(1, q - 1)) }
  function inc() { setQty(q => Math.min(8, q + 1)) }

  async function handlePay() {
    if (!canPay || submitting) return
    setErrorMsg(null)
    setSubmitting(true)
    try {
      const result = await fakeSubmitOrder({ event, tier, qty, email })
      setOrder(result)
    } catch {
      setErrorMsg('Something went wrong placing this demo order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!event || !tier) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFoundText}>Order details not found.</Text>
      </View>
    )
  }

  if (order) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.confirmWrap}>
          <View style={styles.confirmIconRing}><CheckCircle2 size={38} color={pc.success} strokeWidth={1.6} /></View>
          <Text style={styles.confirmTitle}>Order confirmed</Text>
          <Text style={styles.confirmSub}>
            (Demo) — no card was charged. In the live version, {qty} ticket{qty > 1 ? 's' : ''} to {event.title}
            {'\n'}would now be in your UBP account.
          </Text>

          <View style={styles.confirmTicket}>
            <View style={styles.confirmTicketRow}>
              <Ticket size={16} color={pc.gold} strokeWidth={2} />
              <Text style={styles.confirmTicketTitle}>{event.title}</Text>
            </View>
            <Text style={styles.confirmTicketMeta}>{event.dateLabel} · {event.venue}, {event.city}</Text>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmLineRow}>
              <Text style={styles.confirmLineLabel}>{tier.label} × {qty}</Text>
              <Text style={styles.confirmLineValue}>€{total.toFixed(2)}</Text>
            </View>
            <Text style={styles.confirmRef}>Reference: {order.orderRef}</Text>
          </View>

          <TouchableOpacity
            style={styles.confirmCta}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Priorities')}
          >
            <Text style={styles.confirmCtaText}>Back to Priority</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: pc.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={20} color={pc.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo checkout — this screen will not charge a card.</Text>
          </View>

          <View style={styles.orderCard}>
            <Text style={styles.orderEventTitle}>{event.title}</Text>
            <Text style={styles.orderEventMeta}>{event.dateLabel} · {event.venue}, {event.city}</Text>
            <View style={styles.orderDivider} />
            <View style={styles.orderRow}>
              <Text style={styles.orderRowLabel}>{tier.label}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={dec} style={styles.qtyBtn} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Decrease quantity">
                  <Minus size={13} color={pc.textPrimary} strokeWidth={2.4} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity onPress={inc} style={styles.qtyBtn} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Increase quantity">
                  <Plus size={13} color={pc.textPrimary} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
              <Text style={styles.orderRowValue}>€{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderRowLabelMuted}>Service fee</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.orderRowValueMuted}>€{serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.orderRow}>
              <Text style={styles.orderTotalLabel}>Total</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.orderTotalValue}>€{total.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>CONTACT</Text>
          <TextInput
            style={styles.input}
            placeholder="Email for your ticket"
            placeholderTextColor={pc.textFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.sectionLabel}>PAYMENT</Text>
          <View style={styles.cardFieldWrap}>
            <CreditCard size={16} color={pc.textMuted} strokeWidth={2} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.cardFieldInput}
              placeholder="Card number"
              placeholderTextColor={pc.textFaint}
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="MM/YY"
              placeholderTextColor={pc.textFaint}
              value={cardExpiry}
              onChangeText={setCardExpiry}
              keyboardType="number-pad"
              maxLength={5}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="CVC"
              placeholderTextColor={pc.textFaint}
              value={cardCvc}
              onChangeText={setCardCvc}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Name on card"
            placeholderTextColor={pc.textFaint}
            value={cardName}
            onChangeText={setCardName}
          />

          <View style={styles.secureRow}>
            <Lock size={12} color={pc.textFaint} strokeWidth={2} />
            <Text style={styles.secureText}>Demo form — no card details are sent or stored anywhere.</Text>
          </View>

          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity
            style={[styles.payBtn, (!canPay || submitting) && styles.payBtnDisabled]}
            activeOpacity={0.88}
            onPress={handlePay}
            disabled={!canPay || submitting}
          >
            {submitting
              ? <ActivityIndicator color={pc.bg} />
              : <Text style={styles.payBtnText}>Pay €{total.toFixed(2)}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pc.bg },
  notFoundText: { fontFamily: pf.sans, color: pc.textMuted },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  headerTitle: { fontFamily: pf.sansSemiBold, fontSize: 15, color: pc.textPrimary },

  demoBanner: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 16,
    backgroundColor: 'rgba(185,185,180,0.12)', borderWidth: 1, borderColor: pc.borderStrong,
  },
  demoBannerText: { fontFamily: pf.sansMedium, fontSize: 12, color: pc.goldLight, lineHeight: 17 },

  orderCard: { backgroundColor: pc.card, borderRadius: 14, borderWidth: 1, borderColor: pc.border, padding: 16 },
  orderEventTitle: { fontFamily: pf.serif, fontSize: 19, color: pc.textPrimary },
  orderEventMeta: { fontFamily: pf.sans, fontSize: 12.5, color: pc.textMuted, marginTop: 3 },
  orderDivider: { height: 1, backgroundColor: pc.border, marginVertical: 12 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  orderRowLabel: { fontFamily: pf.sansMedium, fontSize: 13.5, color: pc.textPrimary },
  orderRowLabelMuted: { fontFamily: pf.sans, fontSize: 13, color: pc.textMuted },
  orderRowValue: { fontFamily: pf.sansSemiBold, fontSize: 14, color: pc.textPrimary },
  orderRowValueMuted: { fontFamily: pf.sans, fontSize: 13, color: pc.textMuted },
  orderTotalLabel: { fontFamily: pf.sansBold, fontSize: 15, color: pc.textPrimary },
  orderTotalValue: { fontFamily: pf.sansBold, fontSize: 18, color: pc.gold },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: pc.cardAlt, borderWidth: 1, borderColor: pc.border,
  },
  qtyValue: { fontFamily: pf.sansBold, fontSize: 13, color: pc.textPrimary, minWidth: 16, textAlign: 'center' },

  sectionLabel: {
    fontFamily: pf.sansBold, fontSize: 11.5, letterSpacing: 1.2, color: pc.gold,
    marginTop: 24, marginBottom: 10,
  },
  input: {
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontFamily: pf.sans, fontSize: 14, color: pc.textPrimary,
  },
  cardFieldWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: pc.card, borderWidth: 1,
    borderColor: pc.border, borderRadius: 12, paddingHorizontal: 14,
  },
  cardFieldInput: { flex: 1, paddingVertical: 13, fontFamily: pf.sans, fontSize: 14, color: pc.textPrimary },

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  secureText: { fontFamily: pf.sans, fontSize: 11.5, color: pc.textFaint },
  errorText: { fontFamily: pf.sansMedium, fontSize: 12.5, color: pc.danger, marginTop: 14 },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: pc.surface, borderTopWidth: 1, borderTopColor: pc.border,
  },
  payBtn: { backgroundColor: pc.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.45 },
  payBtnText: { fontFamily: pf.sansBold, fontSize: 15, color: pc.bg },

  confirmWrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  confirmIconRing: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: pc.successBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  confirmTitle: { fontFamily: pf.serif, fontSize: 26, color: pc.textPrimary },
  confirmSub: { fontFamily: pf.sans, fontSize: 13, color: pc.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  confirmTicket: {
    width: '100%', backgroundColor: pc.card, borderRadius: 16, borderWidth: 1, borderColor: pc.border,
    padding: 18, marginTop: 26,
  },
  confirmTicketRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmTicketTitle: { fontFamily: pf.sansSemiBold, fontSize: 15, color: pc.textPrimary },
  confirmTicketMeta: { fontFamily: pf.sans, fontSize: 12, color: pc.textMuted, marginTop: 4 },
  confirmDivider: { height: 1, backgroundColor: pc.border, marginVertical: 12 },
  confirmLineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmLineLabel: { fontFamily: pf.sans, fontSize: 13, color: pc.textPrimary },
  confirmLineValue: { fontFamily: pf.sansSemiBold, fontSize: 13, color: pc.textPrimary },
  confirmRef: { fontFamily: pf.sans, fontSize: 11, color: pc.textFaint, marginTop: 10 },
  confirmCta: { marginTop: 28, backgroundColor: pc.gold, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 14 },
  confirmCtaText: { fontFamily: pf.sansBold, fontSize: 14, color: pc.bg },
})
