import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle } from 'lucide-react-native'
import { colors, fonts } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'

// September trial window used to switch the banner copy. Trial runs the
// whole of September; from the 15th the message shifts from a general
// verification nudge to one tied to the trial ending, per the spec.
const SEPT_START = new Date('2026-09-01T00:00:00Z')
const SEPT_MID   = new Date('2026-09-15T00:00:00Z')
const SEPT_END   = new Date('2026-09-30T23:59:59Z')

function bannerCopy() {
  const now = new Date()
  if (now >= SEPT_MID && now <= SEPT_END) {
    return 'Your free trial ends September 30th. Verify your email to receive your trial summary and subscription options.'
  }
  if (now >= SEPT_START && now < SEPT_MID) {
    return 'Your email is unverified. Add a verified email to receive important Blueprint updates.'
  }
  return 'Your email is unverified. Verify it to receive important Blueprint updates.'
}

/**
 * Persistent, non-dismissable banner for a signed-in user whose email is
 * unverified. Per the spec this must appear on every screen, every session,
 * until the email is verified, so it's rendered once at the top-level tab
 * navigator, not per-screen, and it renders nothing once verified rather
 * than offering a "don't show again" the user could opt out of.
 */
export default function UnverifiedEmailBanner() {
  const { user, resendVerification } = useAuth()
  const insets = useSafeAreaInsets()
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'

  if (!user) return null
  if (user.email_confirmed_at) return null

  async function handleResend() {
    if (status === 'sending') return
    setStatus('sending')
    try {
      await resendVerification(user.email)
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const resendLabel = status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : status === 'error' ? 'Try again' : 'Resend'

  return (
    // paddingTop covers the status bar itself, since this is the topmost
    // element on screen while it's visible — screens below it continue to
    // apply their own top inset unchanged, which trades a small amount of
    // extra whitespace under the banner for not having to touch every
    // screen's own layout individually.
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <AlertTriangle size={14} color="#92400E" strokeWidth={2} />
      <Text style={styles.text} numberOfLines={2}>{bannerCopy()}</Text>
      <TouchableOpacity onPress={handleResend} activeOpacity={0.75} style={styles.resendBtn} disabled={status === 'sending'}>
        <Text style={styles.resendText}>{resendLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#FDE68A',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 11.5, color: '#92400E', lineHeight: 15 },
  resendBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#92400E', borderRadius: 6, flexShrink: 0 },
  resendText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#FEF3C7' },
})
