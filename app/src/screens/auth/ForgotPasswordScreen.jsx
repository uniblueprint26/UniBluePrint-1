import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react-native'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const insets = useSafeAreaInsets()
  const { resetPassword } = useAuth()

  async function handleReset() {
    if (!email) { setError('Please enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.logo}>UniBlueprint</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Reset your password.</Text>
          <Text style={styles.sub}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {sent ? (
            <View style={styles.successBanner}>
              <CheckCircle size={20} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Email sent!</Text>
                <Text style={styles.successSub}>
                  Check your inbox for a password reset link. It may take a minute to arrive.
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputWrap}>
                  <Mail size={16} color={colors.muted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.light}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.backBtnText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 32,
  },
  logo: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.xl },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.navy },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: colors.muted, marginTop: 6, lineHeight: 22 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: radius.button,
    borderWidth: 1, borderColor: '#FCA5A5',
    padding: 12, marginTop: spacing.md,
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: '#DC2626', flex: 1, lineHeight: 19 },

  successBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#F0FDF4', borderRadius: radius.card,
    borderWidth: 1, borderColor: '#86EFAC',
    padding: 16, marginTop: spacing.xl,
  },
  successTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#15803D', marginBottom: 4 },
  successSub: { fontFamily: fonts.sans, fontSize: 13, color: '#166534', lineHeight: 19 },

  field: { marginTop: spacing.lg },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    ...shadows.card,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.navy },

  primaryBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xl,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },

  backBtn: { alignItems: 'center', marginTop: spacing.lg },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
})
