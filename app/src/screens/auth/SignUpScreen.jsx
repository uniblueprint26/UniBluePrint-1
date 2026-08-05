import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  User, Mail, Lock, GraduationCap, BookOpen,
  Eye, EyeOff, AlertCircle, ChevronLeft, Check,
} from 'lucide-react-native'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { INSTITUTIONS, searchInstitutions } from '../../data/institutions'

// ── Situations ────────────────────────────────────────────────────────────────

const SITUATIONS = [
  {
    key:      'in_college',
    label:    'In College or University',
    sub:      'Currently enrolled in a third-level programme',
    hasDetails: true,
  },
  {
    key:      'plc',
    label:    'PLC',
    sub:      'Post-Leaving Certificate course',
    hasDetails: true,
  },
  {
    key:      'apprenticeship',
    label:    'Apprenticeship',
    sub:      'SOLAS or ETB registered apprenticeship',
    hasDetails: false,
  },
  {
    key:      'working',
    label:    'Working',
    sub:      'In employment, full-time or part-time',
    hasDetails: false,
  },
  {
    key:      'gap_year',
    label:    'Gap Year',
    sub:      'Between study or planning your next move',
    hasDetails: false,
  },
  {
    key:      'recent_grad',
    label:    'Recent Graduate',
    sub:      'Finished your degree in the last two years',
    hasDetails: false,
  },
  {
    key:      'prospective',
    label:    'Prospective Student',
    sub:      'Applying through CAO or researching options',
    hasDetails: false,
  },
  {
    key:      'other',
    label:    'Not Currently Studying',
    sub:      'Something else entirely',
    hasDetails: false,
  },
]

// ── Step progress dots ────────────────────────────────────────────────────────

function StepDots({ current, total }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dot.pip, i + 1 === current && dot.pipActive, i + 1 < current && dot.pipDone]}
        />
      ))}
    </View>
  )
}

const dot = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 6, alignSelf: 'center', marginBottom: spacing.xl },
  pip:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(30,58,95,0.18)' },
  pipActive:{ width: 20, backgroundColor: colors.navy },
  pipDone:  { backgroundColor: 'rgba(30,58,95,0.45)' },
})

// ── Field wrapper ─────────────────────────────────────────────────────────────

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

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { signUp } = useAuth()
  const scrollRef = useRef(null)

  // Step: 1 = basics, 2 = situation, 3 = details
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]               = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Step 2
  const [situation, setSituation] = useState('')

  // Step 3 — institution (in_college)
  const [institutionQuery, setInstitutionQuery]     = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [showInstList, setShowInstList]             = useState(false)

  // Step 3 — PLC
  const [plcInstitution, setPlcInstitution] = useState('')

  // Step 3 — shared
  const [course, setCourse] = useState('')

  // Meta
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [step])

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep1() {
    if (!name.trim())                          return 'Full name is required.'
    if (!email)                                return 'Email address is required.'
    if (!/\S+@\S+\.\S+/.test(email))           return 'Enter a valid email address.'
    if (!password)                             return 'Password is required.'
    if (password.length < 8)                   return 'Password must be at least 8 characters.'
    if (password !== confirmPassword)          return 'Passwords do not match.'
    return null
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goBack() {
    setError('')
    if (step === 2) { setStep(1); return }
    if (step === 3) { setStep(2); return }
    navigation.goBack()
  }

  function handleStep1Continue() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  function handleStep2Continue() {
    if (!situation) { setError('Please select your current situation.'); return }
    setError('')
    const selected = SITUATIONS.find(s => s.key === situation)
    if (selected?.hasDetails) {
      setStep(3)
    } else {
      doSignUp()
    }
  }

  async function doSignUp() {
    setLoading(true)
    setError('')
    try {
      const metadata = { full_name: name.trim(), situation }

      if (situation === 'in_college' && selectedInstitution) {
        metadata.institution       = selectedInstitution.name
        metadata.institution_short = selectedInstitution.short
        metadata.university        = selectedInstitution.name  // backward compat
        if (course.trim()) metadata.course = course.trim()
      } else if (situation === 'plc') {
        metadata.institution       = plcInstitution.trim() || null
        metadata.institution_short = null
        if (course.trim()) metadata.course = course.trim()
      }

      await signUp(email.trim(), password, metadata)
      navigation.navigate('VerifyEmail', { email: email.trim() })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Institution search ──────────────────────────────────────────────────────

  const instResults = institutionQuery.trim()
    ? searchInstitutions(institutionQuery).slice(0, 8)
    : []

  function selectInstitution(inst) {
    setSelectedInstitution(inst)
    setInstitutionQuery(inst.name)
    setShowInstList(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={18} color={colors.cream} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.logo}>UniBlueprint</Text>
        </View>

        <View style={styles.body}>
          <StepDots current={step} total={3} />

          {!!error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Step 1: Basics ─────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Text style={styles.stepLabel}>Step 1 of 3</Text>
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
                  <TouchableOpacity onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                    {showPw ? <EyeOff size={16} color={colors.muted} /> : <Eye size={16} color={colors.muted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Lock size={16} color={colors.muted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.light}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPw}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPw(v => !v)} activeOpacity={0.7}>
                    {showConfirmPw ? <EyeOff size={16} color={colors.muted} /> : <Eye size={16} color={colors.muted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.terms}>
                By creating an account you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={handleStep1Continue}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SignIn')}
              >
                <Text style={styles.secondaryBtnText}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Situation ───────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <Text style={styles.stepLabel}>Step 2 of 3</Text>
              <Text style={styles.title}>What best describes you?</Text>
              <Text style={styles.sub}>
                This helps us show you the right features and content.
              </Text>

              <View style={styles.situationList}>
                {SITUATIONS.map(s => {
                  const isSelected = situation === s.key
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.situationCard, isSelected && styles.situationCardActive]}
                      activeOpacity={0.8}
                      onPress={() => { setSituation(s.key); setError('') }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.situationLabel, isSelected && styles.situationLabelActive]}>
                          {s.label}
                        </Text>
                        <Text style={[styles.situationSub, isSelected && styles.situationSubActive]}>
                          {s.sub}
                        </Text>
                      </View>
                      <View style={[styles.situationRadio, isSelected && styles.situationRadioActive]}>
                        {isSelected && <Check size={12} color={colors.cream} strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: spacing.xl }]}
                activeOpacity={0.85}
                onPress={handleStep2Continue}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Creating account…' : 'Continue'}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 3: Details ─────────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={styles.stepLabel}>Step 3 of 3</Text>

              {/* In College / University */}
              {situation === 'in_college' && (
                <>
                  <Text style={styles.title}>Your institution.</Text>
                  <Text style={styles.sub}>
                    Used to personalise Campus Connect and your community feed.
                  </Text>

                  {/* Institution search */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Institution</Text>
                    <View style={[
                      styles.inputWrap,
                      showInstList && instResults.length > 0 && styles.inputWrapOpen,
                    ]}>
                      <GraduationCap size={16} color={colors.muted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Search by name or short form…"
                        placeholderTextColor={colors.light}
                        value={institutionQuery}
                        onChangeText={text => {
                          setInstitutionQuery(text)
                          setSelectedInstitution(null)
                          setShowInstList(true)
                        }}
                        onFocus={() => setShowInstList(true)}
                        autoCorrect={false}
                        autoCapitalize="words"
                      />
                      {selectedInstitution && (
                        <View style={styles.shortBadge}>
                          <Text style={styles.shortBadgeText}>{selectedInstitution.short}</Text>
                        </View>
                      )}
                    </View>

                    {/* Results dropdown */}
                    {showInstList && instResults.length > 0 && (
                      <View style={styles.instDropdown}>
                        {instResults.map((inst, i) => (
                          <TouchableOpacity
                            key={inst.id}
                            style={[
                              styles.instItem,
                              i < instResults.length - 1 && styles.instItemDivider,
                              selectedInstitution?.id === inst.id && styles.instItemSelected,
                            ]}
                            onPress={() => selectInstitution(inst)}
                            activeOpacity={0.75}
                          >
                            <View style={styles.instItemShort}>
                              <Text style={styles.instItemShortText}>{inst.short}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.instItemName} numberOfLines={1}>{inst.name}</Text>
                              {inst.city ? <Text style={styles.instItemCity}>{inst.city}</Text> : null}
                            </View>
                            {selectedInstitution?.id === inst.id && (
                              <Check size={13} color={colors.navy} strokeWidth={2.5} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Hint when field is empty and no results */}
                    {showInstList && !institutionQuery.trim() && (
                      <View style={styles.instHint}>
                        <Text style={styles.instHintText}>
                          Type to search — e.g. "UCD", "TU Dublin", "MTU"
                        </Text>
                      </View>
                    )}
                  </View>

                  <Field label="Course or Programme (optional)" icon={BookOpen}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Business, Computer Science"
                      placeholderTextColor={colors.light}
                      value={course}
                      onChangeText={setCourse}
                    />
                  </Field>
                </>
              )}

              {/* PLC */}
              {situation === 'plc' && (
                <>
                  <Text style={styles.title}>Where are you studying?</Text>
                  <Text style={styles.sub}>
                    Enter your college or PLC provider. You can leave this blank and update it later.
                  </Text>

                  <Field label="College or Provider" icon={GraduationCap}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Coláiste Dhúlaigh CFE"
                      placeholderTextColor={colors.light}
                      value={plcInstitution}
                      onChangeText={setPlcInstitution}
                      autoCapitalize="words"
                    />
                  </Field>

                  <Field label="Course (optional)" icon={BookOpen}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Business Studies"
                      placeholderTextColor={colors.light}
                      value={course}
                      onChangeText={setCourse}
                    />
                  </Field>

                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                      Not all PLC providers are listed in our directory yet. Type yours above and we'll add it to the list.
                    </Text>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: spacing.xl }, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={doSignUp}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={doSignUp} disabled={loading}>
                <Text style={styles.skipBtnText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(245,240,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  logo: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.xl },

  stepLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  title:     { fontFamily: fonts.serif, fontSize: 30, color: colors.navy, lineHeight: 36 },
  sub:       { fontFamily: fonts.sans, fontSize: 15, color: colors.muted, marginTop: 6, lineHeight: 22 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: radius.button,
    borderWidth: 1, borderColor: '#FCA5A5',
    padding: 12, marginBottom: spacing.md,
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: '#DC2626', flex: 1, lineHeight: 19 },

  field: { marginTop: spacing.lg },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 14, minHeight: 52,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    ...shadows.card,
  },
  inputWrapOpen: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.navy, paddingVertical: 14 },

  shortBadge: {
    backgroundColor: colors.navy, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6,
  },
  shortBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },

  // Institution dropdown
  instDropdown: {
    backgroundColor: colors.white,
    borderWidth: 1, borderTopWidth: 0,
    borderColor: 'rgba(30,58,95,0.12)',
    borderBottomLeftRadius: radius.button,
    borderBottomRightRadius: radius.button,
    ...shadows.elevated,
  },
  instItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  instItemDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  instItemSelected: { backgroundColor: 'rgba(30,58,95,0.04)' },
  instItemShort: {
    width: 68, flexShrink: 0,
    backgroundColor: colors.cream, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'center',
  },
  instItemShortText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy },
  instItemName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
  instItemCity: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },

  instHint: {
    backgroundColor: colors.white,
    borderWidth: 1, borderTopWidth: 0,
    borderColor: 'rgba(30,58,95,0.12)',
    borderBottomLeftRadius: radius.button, borderBottomRightRadius: radius.button,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  instHintText: { fontFamily: fonts.sans, fontSize: 13, color: colors.light, fontStyle: 'italic' },

  // Info card (PLC note)
  infoCard: {
    backgroundColor: '#EFF6FF', borderRadius: radius.card,
    padding: 14, marginTop: spacing.md,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.10)',
  },
  infoText: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },

  // Situation selector
  situationList: { gap: 10, marginTop: spacing.lg },
  situationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.10)',
    paddingHorizontal: 16, paddingVertical: 14,
    ...shadows.card,
  },
  situationCardActive: {
    borderColor: colors.navy,
    backgroundColor: 'rgba(30,58,95,0.04)',
  },
  situationLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginBottom: 2 },
  situationLabelActive: { color: colors.navy },
  situationSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17 },
  situationSubActive: { color: colors.muted },
  situationRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(30,58,95,0.20)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  situationRadioActive: { backgroundColor: colors.navy, borderColor: colors.navy },

  terms: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: spacing.lg },
  termsLink: { fontFamily: fonts.sansMedium, color: colors.navy },

  primaryBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },

  secondaryBtn: { alignItems: 'center', marginTop: spacing.lg },
  secondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },

  skipBtn: { alignItems: 'center', marginTop: spacing.md },
  skipBtnText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
})
