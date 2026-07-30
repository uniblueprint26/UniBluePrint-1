import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react-native'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, spacing, radius } from '../../constants/theme'

export default function VerifyEmailScreen({ route, navigation }) {
  const email = route?.params?.email || ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')
  const insets = useSafeAreaInsets()
  const { resendVerification } = useAuth()

  async function handleResend() {
    if (!email) return
    setError('')
    setResending(true)
    try {
      await resendVerification(email)
      setResent(true)
    } catch (err) {
      setError(err.message || 'Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header]}>
        <Text style={styles.logo}>UniBlueprint</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Mail size={40} color={colors.navy} />
        </View>

        <Text style={styles.title}>Check your inbox.</Text>
        <Text style={styles.sub}>
          We've sent a verification link to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
          {'\n\n'}Click the link in the email to activate your account before signing in.
        </Text>

        {!!error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={15} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {resent && (
          <View style={styles.successBanner}>
            <CheckCircle size={15} color="#16A34A" />
            <Text style={styles.successText}>Verification email resent successfully.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.resendBtn, resending && { opacity: 0.7 }]}
          activeOpacity={0.8}
          onPress={handleResend}
          disabled={resending || resent}
        >
          <Text style={styles.resendBtnText}>
            {resending ? 'Sending…' : resent ? 'Email Resent' : 'Resend Verification Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.signInBtnText}>Go to Sign In →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: 20,
    paddingBottom: 32,
  },
  logo: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.xl, alignItems: 'center' },

  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.navy, textAlign: 'center' },
  sub: {
    fontFamily: fonts.sans, fontSize: 15, color: colors.muted,
    marginTop: 10, lineHeight: 24, textAlign: 'center',
  },
  emailText: { fontFamily: fonts.sansSemiBold, color: colors.navy },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: radius.button,
    borderWidth: 1, borderColor: '#FCA5A5',
    padding: 12, marginTop: spacing.lg, alignSelf: 'stretch',
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: '#DC2626', flex: 1, lineHeight: 19 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', borderRadius: radius.button,
    borderWidth: 1, borderColor: '#86EFAC',
    padding: 12, marginTop: spacing.lg, alignSelf: 'stretch',
  },
  successText: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#16A34A', flex: 1 },

  resendBtn: {
    borderWidth: 1.5, borderColor: colors.navy, borderRadius: radius.button,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xl, alignSelf: 'stretch',
  },
  resendBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },

  signInBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm, alignSelf: 'stretch',
  },
  signInBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
