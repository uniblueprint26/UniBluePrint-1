import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  User, Mail, Lock, GraduationCap, BookOpen, Briefcase, MapPin, Calendar,
  Eye, EyeOff, AlertCircle, ChevronLeft, Check,
} from 'lucide-react-native'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'
import { searchInstitutions } from '../../data/institutions'
import { searchTrades, searchProviders } from '../../data/apprenticeships'
import { INTERESTS, MAX_INTERESTS } from '../../data/interests'
import { WEBSITE_LINKS } from '../../constants/site'
import { TERMS_VERSION, PRIVACY_VERSION } from '../../constants/legal'

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
    hasDetails: true,
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

// ── Status options for step 3 availability selector ──────────────────────────

const STATUS_OPTIONS = [
  {
    key:   'open',
    label: 'Open to Connect',
    sub:   'Happy to connect with others across the platform.',
  },
  {
    key:   'study',
    label: 'Looking for a Study Group',
    sub:   'Searching for others on the same module or course.',
  },
  {
    key:   'mentor',
    label: 'Happy to Mentor Others',
    sub:   'Willing to share advice or experience with others.',
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

  // Step 3, institution (in_college)
  const [institutionQuery, setInstitutionQuery]     = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [showInstList, setShowInstList]             = useState(false)

  // Step 3, PLC (reuses institutionQuery / selectedInstitution / showInstList from in_college)

  // Step 3, apprenticeship
  const [tradeQuery, setTradeQuery]           = useState('')
  const [selectedTrade, setSelectedTrade]     = useState(null)
  const [showTradeList, setShowTradeList]     = useState(false)
  const [providerQuery, setProviderQuery]     = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showProviderList, setShowProviderList] = useState(false)

  // Step 3, shared
  const [course, setCourse]         = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')

  // Step 3, interests and availability (all situations)
  const [selectedInterests, setSelectedInterests] = useState(new Set())
  const [selectedStatuses, setSelectedStatuses]   = useState(new Set())

  // Meta
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

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
    if (!agreedToTerms)                        return 'Please agree to the Terms of Service and Privacy Policy to continue.'
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
    setStep(3)  // everyone gets step 3 (interests + availability)
  }

  function toggleInterest(id) {
    setSelectedInterests(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < MAX_INTERESTS) next.add(id)
      return next
    })
  }

  function toggleStatus(key) {
    setSelectedStatuses(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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
        if (course.trim())       metadata.course        = course.trim()
        if (yearOfStudy.trim())  metadata.year_of_study = yearOfStudy.trim()
      } else if (situation === 'plc') {
        if (selectedInstitution) {
          metadata.institution       = selectedInstitution.name
          metadata.institution_short = selectedInstitution.short
        } else if (institutionQuery.trim()) {
          metadata.institution       = institutionQuery.trim()
          metadata.institution_short = null
        }
        if (course.trim())       metadata.course        = course.trim()
        if (yearOfStudy.trim())  metadata.year_of_study = yearOfStudy.trim()
      } else if (situation === 'apprenticeship') {
        if (selectedTrade) {
          metadata.trade          = selectedTrade.name
          metadata.trade_category = selectedTrade.category
        } else if (tradeQuery.trim()) {
          metadata.trade = tradeQuery.trim()
        }
        if (selectedProvider) {
          metadata.training_provider = selectedProvider.name
        } else if (providerQuery.trim()) {
          metadata.training_provider = providerQuery.trim()
        }
      }

      // Interests and availability, collected in step 3 for all situations
      const interestLabels = [...selectedInterests]
        .map(id => INTERESTS.find(i => i.id === id)?.label)
        .filter(Boolean)
      if (interestLabels.length)   metadata.interests = interestLabels
      if (selectedStatuses.size)   metadata.statuses  = [...selectedStatuses]

      const signUpData = await signUp(email.trim(), password, metadata)

      // Record versioned consent. Best-effort — a failure here must not block
      // account creation, which has already succeeded by this point.
      const newUserId = signUpData?.user?.id
      if (newUserId) {
        try {
          await supabase.from('legal_acknowledgements').insert([
            { user_id: newUserId, document_type: 'terms_of_service', version: TERMS_VERSION },
            { user_id: newUserId, document_type: 'privacy_policy',   version: PRIVACY_VERSION },
          ])
        } catch { /* best effort, account creation already succeeded */ }
      }

      navigation.navigate('VerifyEmail', { email: email.trim() })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Institution search ──────────────────────────────────────────────────────

  const instResults     = institutionQuery.trim()
    ? searchInstitutions(institutionQuery).slice(0, 8)
    : []

  const tradeResults    = tradeQuery.trim()
    ? searchTrades(tradeQuery).slice(0, 8)
    : []

  const providerResults = providerQuery.trim()
    ? searchProviders(providerQuery).slice(0, 8)
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

              <TouchableOpacity
                style={styles.termsRow}
                activeOpacity={0.75}
                onPress={() => setAgreedToTerms(v => !v)}
              >
                <View style={[styles.termsCheckbox, agreedToTerms && styles.termsCheckboxOn]}>
                  {agreedToTerms && <Check size={12} color={colors.cream} strokeWidth={3} />}
                </View>
                <Text style={styles.terms}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={() => Linking.openURL(WEBSITE_LINKS.terms)}>
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text style={styles.termsLink} onPress={() => Linking.openURL(WEBSITE_LINKS.privacy)}>
                    Privacy Policy
                  </Text>.
                </Text>
              </TouchableOpacity>

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

          {/* ── Step 3: Details + Interests + Availability ──────────────────── */}
          {step === 3 && (
            <>
              <Text style={styles.stepLabel}>Step 3 of 3</Text>

              {/* Generic title for situations without specific details */}
              {situation !== 'in_college' && situation !== 'plc' && situation !== 'apprenticeship' && (
                <>
                  <Text style={styles.title}>A bit about you.</Text>
                  <Text style={styles.sub}>
                    Your interests and availability help others find you in the Directory.
                  </Text>
                </>
              )}

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
                          Type to search, e.g. "UCD", "TU Dublin", "MTU"
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

                  <Field label="Year of Study (optional)" icon={Calendar}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1st Year, 3rd Year, Postgrad"
                      placeholderTextColor={colors.light}
                      value={yearOfStudy}
                      onChangeText={setYearOfStudy}
                      autoCapitalize="words"
                    />
                  </Field>
                </>
              )}

              {/* PLC */}
              {situation === 'plc' && (
                <>
                  <Text style={styles.title}>Where are you studying?</Text>
                  <Text style={styles.sub}>
                    Search for your FE college or PLC provider. Type freely if yours isn't listed.
                  </Text>

                  {/* Institution search, same mechanism as in_college */}
                  <View style={styles.field}>
                    <Text style={styles.label}>College or Provider</Text>
                    <View style={[
                      styles.inputWrap,
                      showInstList && instResults.length > 0 && styles.inputWrapOpen,
                    ]}>
                      <GraduationCap size={16} color={colors.muted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="e.g. Coláiste Dhúlaigh, BCFE, CSN…"
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
                              <Text style={styles.instItemShortText} numberOfLines={1}>{inst.short}</Text>
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

                    {showInstList && !institutionQuery.trim() && (
                      <View style={styles.instHint}>
                        <Text style={styles.instHintText}>
                          Type to search, e.g. "BCFE", "CSN", "Rathmines"
                        </Text>
                      </View>
                    )}
                  </View>

                  <Field label="Course (optional)" icon={BookOpen}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Business Studies"
                      placeholderTextColor={colors.light}
                      value={course}
                      onChangeText={setCourse}
                    />
                  </Field>

                  <Field label="Year of Study (optional)" icon={Calendar}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1st Year, 2nd Year"
                      placeholderTextColor={colors.light}
                      value={yearOfStudy}
                      onChangeText={setYearOfStudy}
                      autoCapitalize="words"
                    />
                  </Field>

                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                      Not listed? Type your college above and we will add it to the directory.
                    </Text>
                  </View>
                </>
              )}

              {/* Apprenticeship */}
              {situation === 'apprenticeship' && (
                <>
                  <Text style={styles.title}>Your apprenticeship.</Text>
                  <Text style={styles.sub}>
                    Select your trade from the SOLAS-recognised list. Both fields are optional.
                  </Text>

                  {/* Trade picker */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Trade or Craft</Text>
                    <View style={[
                      styles.inputWrap,
                      showTradeList && tradeResults.length > 0 && styles.inputWrapOpen,
                    ]}>
                      <Briefcase size={16} color={colors.muted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="e.g. Electrical, Plumbing, Software Developer"
                        placeholderTextColor={colors.light}
                        value={tradeQuery}
                        onChangeText={text => {
                          setTradeQuery(text)
                          setSelectedTrade(null)
                          setShowTradeList(true)
                        }}
                        onFocus={() => setShowTradeList(true)}
                        autoCorrect={false}
                        autoCapitalize="words"
                      />
                      {selectedTrade && (
                        <View style={styles.shortBadge}>
                          <Text style={styles.shortBadgeText}>{selectedTrade.category}</Text>
                        </View>
                      )}
                    </View>

                    {showTradeList && tradeResults.length > 0 && (
                      <View style={styles.instDropdown}>
                        {tradeResults.map((t, i) => (
                          <TouchableOpacity
                            key={t.id}
                            style={[
                              styles.instItem,
                              i < tradeResults.length - 1 && styles.instItemDivider,
                              selectedTrade?.id === t.id && styles.instItemSelected,
                            ]}
                            onPress={() => {
                              setSelectedTrade(t)
                              setTradeQuery(t.name)
                              setShowTradeList(false)
                            }}
                            activeOpacity={0.75}
                          >
                            <View style={[styles.instItemShort, styles.tradeCategoryBadge,
                              t.category === 'Craft' ? styles.tradeCraft : styles.tradeConsortium,
                            ]}>
                              <Text style={styles.tradeCategoryText}>{t.category}</Text>
                            </View>
                            <Text style={[styles.instItemName, { flex: 1 }]} numberOfLines={1}>{t.name}</Text>
                            {selectedTrade?.id === t.id && (
                              <Check size={13} color={colors.navy} strokeWidth={2.5} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {showTradeList && !tradeQuery.trim() && (
                      <View style={styles.instHint}>
                        <Text style={styles.instHintText}>
                          Type to search, e.g. "Electrical", "Plumbing", "Software"
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ETB provider picker */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Training Provider</Text>
                    <View style={[
                      styles.inputWrap,
                      showProviderList && providerResults.length > 0 && styles.inputWrapOpen,
                    ]}>
                      <MapPin size={16} color={colors.muted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="e.g. City of Dublin ETB, Cork ETB"
                        placeholderTextColor={colors.light}
                        value={providerQuery}
                        onChangeText={text => {
                          setProviderQuery(text)
                          setSelectedProvider(null)
                          setShowProviderList(true)
                        }}
                        onFocus={() => setShowProviderList(true)}
                        autoCorrect={false}
                        autoCapitalize="words"
                      />
                      {selectedProvider && (
                        <View style={styles.shortBadge}>
                          <Text style={styles.shortBadgeText}>{selectedProvider.short}</Text>
                        </View>
                      )}
                    </View>

                    {showProviderList && providerResults.length > 0 && (
                      <View style={styles.instDropdown}>
                        {providerResults.map((p, i) => (
                          <TouchableOpacity
                            key={p.id}
                            style={[
                              styles.instItem,
                              i < providerResults.length - 1 && styles.instItemDivider,
                              selectedProvider?.id === p.id && styles.instItemSelected,
                            ]}
                            onPress={() => {
                              setSelectedProvider(p)
                              setProviderQuery(p.name)
                              setShowProviderList(false)
                            }}
                            activeOpacity={0.75}
                          >
                            <View style={styles.instItemShort}>
                              <Text style={styles.instItemShortText} numberOfLines={1}>{p.short}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.instItemName} numberOfLines={1}>{p.name}</Text>
                              {p.city ? <Text style={styles.instItemCity}>{p.city}</Text> : null}
                            </View>
                            {selectedProvider?.id === p.id && (
                              <Check size={13} color={colors.navy} strokeWidth={2.5} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {showProviderList && !providerQuery.trim() && (
                      <View style={styles.instHint}>
                        <Text style={styles.instHintText}>
                          Type to search, e.g. "Dublin ETB", "Cork ETB", "Kildare"
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                      Trade list sourced from SOLAS. A registration number verification step is planned for a future release.
                    </Text>
                  </View>
                </>
              )}

              {/* ── Shared: Interests chip grid ─────────────────────────────── */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionLabel}>Your interests</Text>
              <Text style={styles.sectionSub}>
                Select up to {MAX_INTERESTS}. These help others find you in the Directory.
              </Text>
              <View style={styles.chipGrid}>
                {INTERESTS.map(interest => {
                  const isSelected = selectedInterests.has(interest.id)
                  const atMax = selectedInterests.size >= MAX_INTERESTS && !isSelected
                  return (
                    <TouchableOpacity
                      key={interest.id}
                      style={[styles.chip, isSelected && styles.chipActive, atMax && styles.chipDisabled]}
                      onPress={() => toggleInterest(interest.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {interest.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              {selectedInterests.size > 0 && (
                <Text style={styles.chipCount}>{selectedInterests.size} of {MAX_INTERESTS} selected</Text>
              )}

              {/* ── Shared: Availability ────────────────────────────────────── */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionLabel}>What are you open to?</Text>
              <Text style={styles.sectionSub}>Select all that apply.</Text>
              <View style={{ gap: 8 }}>
                {STATUS_OPTIONS.map(opt => {
                  const isSelected = selectedStatuses.has(opt.key)
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.statusOption, isSelected && styles.statusOptionActive]}
                      onPress={() => toggleStatus(opt.key)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.statusOptionLabel, isSelected && styles.statusOptionLabelActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.statusOptionSub}>{opt.sub}</Text>
                      </View>
                      <View style={[styles.statusCheck, isSelected && styles.statusCheckActive]}>
                        {isSelected && <Check size={12} color={colors.cream} strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>

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
    flexShrink: 0, minWidth: 48, maxWidth: 120,
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

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: spacing.lg },
  termsCheckbox: {
    width: 20, height: 20, borderRadius: 5, marginTop: 1,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.25)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  termsCheckboxOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  terms: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18 },
  termsLink: { fontFamily: fonts.sansMedium, color: colors.navy, textDecorationLine: 'underline' },

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

  // Trade category badges in apprenticeship dropdown
  tradeCategoryBadge: { flexShrink: 0, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', minWidth: 52 },
  tradeCraft:         { backgroundColor: '#EFF6FF' },
  tradeConsortium:    { backgroundColor: '#F0FDF4' },
  tradeCategoryText:  { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy },

  // Step 3 shared sections
  sectionDivider:  { height: 1, backgroundColor: 'rgba(30,58,95,0.08)', marginVertical: spacing.xl },
  sectionLabel:    { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginBottom: 4 },
  sectionSub:      { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: spacing.md },

  // Interest chips
  chipGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipCount:       { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 10, textAlign: 'right' },
  chip: {
    borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
  },
  chipActive:      { backgroundColor: colors.navy, borderColor: colors.navy },
  chipDisabled:    { opacity: 0.35 },
  chipText:        { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  chipTextActive:  { color: colors.cream },

  // Availability (status) multi-select
  statusOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.10)',
    paddingHorizontal: 16, paddingVertical: 14,
    ...shadows.card,
  },
  statusOptionActive:       { borderColor: colors.navy, backgroundColor: 'rgba(30,58,95,0.04)' },
  statusOptionLabel:        { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, marginBottom: 2 },
  statusOptionLabelActive:  { color: colors.navy },
  statusOptionSub:          { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17 },
  statusCheck: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 2, borderColor: 'rgba(30,58,95,0.20)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  statusCheckActive: { backgroundColor: colors.navy, borderColor: colors.navy },
})
