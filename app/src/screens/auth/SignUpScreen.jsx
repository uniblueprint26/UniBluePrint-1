import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { User, Mail, Lock, GraduationCap, BookOpen, Eye, EyeOff } from 'lucide-react-native'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

const UNIVERSITIES = [
  'University College Dublin', 'Trinity College Dublin', 'University College Cork',
  'Dublin City University', 'University of Galway', 'University of Limerick',
  'Maynooth University', 'Technological University Dublin', 'RCSI University',
  'Atlantic Technological University', 'Technological University of the Shannon',
  'South East Technological University', 'Other',
]

function Field({ label, icon: Icon, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Icon size={16} color={colors.muted} style={{ marginRight: 10, flexShrink: 0 }} />
        {children}
      </View>
    </View>
  )
}

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [university, setUniversity] = useState('')
  const [course, setCourse] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showUniPicker, setShowUniPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()
  const { login } = useAuth()

  function handleSignUp() {
    if (!name || !email || !password) return
    setLoading(true)
    setTimeout(() => { setLoading(false); login() }, 800)
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.logo}>UniBlueprint</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Create your account.</Text>
          <Text style={styles.sub}>Free to join. No credit card required.</Text>

          <Field label="Full Name" icon={User}>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.light}
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          </Field>

          <Field label="Email Address" icon={Mail}>
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
          </Field>

          {/* University picker */}
          <View style={styles.field}>
            <Text style={styles.label}>University / College</Text>
            <TouchableOpacity
              style={styles.inputWrap}
              activeOpacity={0.8}
              onPress={() => setShowUniPicker(!showUniPicker)}
            >
              <GraduationCap size={16} color={colors.muted} style={{ marginRight: 10 }} />
              <Text style={[styles.input, { flex: 1, color: university ? colors.navy : colors.light }]}>
                {university || 'Select your university'}
              </Text>
            </TouchableOpacity>
            {showUniPicker && (
              <View style={styles.picker}>
                {UNIVERSITIES.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={styles.pickerItem}
                    activeOpacity={0.7}
                    onPress={() => { setUniversity(u); setShowUniPicker(false) }}
                  >
                    <Text style={[styles.pickerItemText, university === u && styles.pickerItemActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Field label="Course / Programme" icon={BookOpen}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Business, Computer Science"
              placeholderTextColor={colors.light}
              value={course}
              onChangeText={setCourse}
            />
          </Field>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={16} color={colors.muted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} activeOpacity={0.7}>
                {showPw
                  ? <EyeOff size={16} color={colors.muted} />
                  : <Eye size={16} color={colors.muted} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.signInBtnText}>Already have an account? Sign in →</Text>
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

  field: { marginTop: spacing.lg },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 14, minHeight: 52,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    ...shadows.card,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.navy, paddingVertical: 14 },

  picker: {
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    marginTop: 4, ...shadows.elevated,
    maxHeight: 220, overflow: 'hidden',
  },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  pickerItemText: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy },
  pickerItemActive: { fontFamily: fonts.sansSemiBold, color: colors.navy },

  terms: {
    fontFamily: fonts.sans, fontSize: 12,
    color: colors.muted, lineHeight: 18, marginTop: spacing.lg,
  },
  termsLink: { fontFamily: fonts.sansMedium, color: colors.navy },

  primaryBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },

  signInBtn: { alignItems: 'center', marginTop: spacing.lg },
  signInBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
})
