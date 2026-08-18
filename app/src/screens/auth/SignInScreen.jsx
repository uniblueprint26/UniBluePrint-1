import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

// TEMPORARY — remove once the "network request failed" sign-in issue is resolved.
// Runs three isolated network checks so a single screenshot tells us exactly
// which layer is failing instead of guessing through another round trip.
async function runDiagnostic() {
  const lines = []

  lines.push(`URL configured: ${process.env.EXPO_PUBLIC_SUPABASE_URL || '(none — using placeholder)'}`)
  lines.push(`Key configured: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'yes (' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length + ' chars)' : 'no'}`)

  try {
    const r = await fetch('https://www.google.com')
    lines.push(`1. Plain internet fetch: OK (status ${r.status})`)
  } catch (e) {
    lines.push(`1. Plain internet fetch: FAILED — ${e.name}: ${e.message}`)
  }

  try {
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`
    const r = await fetch(url, { headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '' } })
    const body = await r.text()
    lines.push(`2. Raw fetch to Supabase: OK (status ${r.status}) — ${body.slice(0, 80)}`)
  } catch (e) {
    lines.push(`2. Raw fetch to Supabase: FAILED — ${e.name}: ${e.message}`)
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email: 'diagnostic-probe@example.com', password: 'wrongpassword123' })
    lines.push(error
      ? `3. Supabase client call: server responded — ${error.name}: ${error.message}`
      : `3. Supabase client call: unexpectedly succeeded`)
  } catch (e) {
    lines.push(`3. Supabase client call: FAILED — ${e.name}: ${e.message}${e.cause ? ' | cause: ' + JSON.stringify(e.cause) : ''}`)
  }

  Alert.alert('Diagnostic results', lines.join('\n\n'))
}

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const insets = useSafeAreaInsets()
  const { signIn } = useAuth()

  async function handleSignIn() {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
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
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.sub}>Sign in to your account to continue.</Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <Lock size={16} color={colors.muted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} activeOpacity={0.7}>
                {showPw
                  ? <EyeOff size={16} color={colors.muted} />
                  : <Eye size={16} color={colors.muted} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          {/* TEMPORARY — diagnostic button, remove once network issue is resolved */}
          <TouchableOpacity
            style={styles.diagnosticBtn}
            activeOpacity={0.7}
            onPress={runDiagnostic}
          >
            <Text style={styles.diagnosticBtnText}>Run connection diagnostic</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.secondaryBtnText}>Create an Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Welcome')}
          >
            <Text style={styles.backBtnText}>← Back to Welcome</Text>
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

  field: { marginTop: spacing.lg },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotLink: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },

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

  diagnosticBtn: { alignItems: 'center', marginTop: spacing.md, padding: 8 },
  diagnosticBtnText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textDecorationLine: 'underline' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(30,58,95,0.1)' },
  dividerText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  secondaryBtn: {
    borderWidth: 1.5, borderColor: colors.navy, borderRadius: radius.button,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm,
  },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },

  backBtn: { alignItems: 'center', marginTop: spacing.lg },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
})
