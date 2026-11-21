import { useState, useRef } from 'react'
import { View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useDraftAutosave } from '../../hooks/useDraftAutosave'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { extraDefaults, extraSteps, extraDetail } from '../../components/forms/ExtraSteps'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'
import FoundationIOSNotice, { IS_IOS } from '../../components/ui/FoundationIOSNotice'
import FoundationCheckoutModal from '../../components/foundation/FoundationCheckoutModal'
import { useFoundationOrdering, FOUNDATION_ORDERING_LINE } from '../../hooks/useAppFlags'
import { useSafeGoBack } from '../../hooks/useSafeGoBack'

// Personal Statement intake — Foundation Blueprint service on the CV Optimisation
// pattern (QuestionFlow + a personal_statements-shaped table +
// submit_document_for_review + a generate-* Edge Function). Field names and
// validation match supabase/functions/generate-personal-statement/index.ts
// exactly: pathway, target_course, and target_institution are required
// top-level columns, background_and_motivation is the one truly required
// input.* field, and everything else (relevant_experience, life_work_experience,
// goals, weaknesses_or_gaps) is optional — some of it falls back to the career
// profile server-side if left blank.

const PATHWAYS = [
  { value: 'ucas', label: 'UCAS (UK universities)' },
  { value: 'cao_mature', label: 'CAO, Mature applicant' },
  { value: 'postgrad', label: 'Postgraduate' },
]
const TIERS = [
  { value: 'standard', label: 'Standard, delivered within 48 hours' },
  { value: 'premium', label: 'Premium, priority queue, delivered within 24 hours', accent: true },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

// Extra detailed questions, asked just before delivery. Optional, so nobody is blocked.
const EXTRAS = [
  { key: 'x_limit', label: 'Length limit', title: 'What is the length limit?', kind: 'line', subtitle: 'Characters, words or lines. Check the application guidance.', placeholder: 'e.g. 4000 characters' },
  { key: 'x_enjoy', label: 'Subjects you enjoy', title: 'Which subjects, modules or topics do you enjoy most, and why?', kind: 'text', subtitle: 'Name specific ones and what you liked about them.' },
  { key: 'x_awards', label: 'Awards and achievements', title: 'Awards, grades or achievements worth mentioning', kind: 'text', subtitle: 'Include the year and what it was for.' },
  { key: 'x_skills', label: 'Skills', title: 'Skills you have built that suit this course', kind: 'text', subtitle: 'For example writing, coding, leading a team, working with the public.' },
  { key: 'x_style', label: 'Style', title: 'How should it sound?', kind: 'choice', options: [{ value: 'personal', label: 'Personal and warm' }, { value: 'formal', label: 'Formal' }, { value: 'balanced', label: 'Balanced' }] },
  { key: 'x_leave_out', label: 'Leave out', title: 'Anything we should leave out?', kind: 'text', placeholder: 'Optional' },
]

const DEFAULT_VALUES = {
  ...extraDefaults(EXTRAS),
  pathway: null,
  target_course: '', target_institution: '',
  background_and_motivation: '',
  relevant_experience: '',
  life_work_experience: '',
  goals: '',
  weaknesses_or_gaps: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: 'pathway',
    title: 'Which application is this for?',
    subtitle: 'This changes the whole structure, UCAS now uses three short structured answers, not one long essay; CAO mature applicant statements carry most of the weight since there\'s no points-based assessment; postgraduate follows academic/skills/goals structure.',
    render: (value, onChange) => <ChoiceGrid options={PATHWAYS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: '_targeting',
    title: 'What are you applying for?',
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel required>Target course</FieldLabel><FormTextInput value={values.target_course} onChangeText={t => setValue('target_course', t)} placeholder="e.g. BSc Computer Science" /></View>
        <View><FieldLabel required>Target institution</FieldLabel><FormTextInput value={values.target_institution} onChangeText={t => setValue('target_institution', t)} placeholder="e.g. Trinity College Dublin" /></View>
      </View>
    ),
    validate: (_, values) => {
      if (isBlank(values.target_course) || isBlank(values.target_institution)) {
        return 'Both the course and institution are required.'
      }
      return null
    },
  },
  {
    key: 'background_and_motivation',
    title: 'Why this course, and why you?',
    subtitle: 'Your genuine motivation and background, this is the core of the whole statement. Avoid the obvious openers (“I have always been passionate about...”), we\'ll help sharpen it, but start from something true and specific.',
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Tell us the real story..." minHeight={160} />,
    validate: value => (isBlank(value) ? 'Please tell us your motivation and background, this is the core of the statement.' : null),
  },
  {
    key: 'relevant_experience',
    title: 'Any relevant experience, academic, work, extracurricular, that supports this application?',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'life_work_experience',
    title: 'Life or work experience',
    subtitle: 'Especially relevant if you\'re a mature applicant, real life and work experience count as genuine evidence here, not something to work around.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Leave blank and we'll pull from your profile instead..." />,
  },
  {
    key: 'goals',
    title: 'What are your longer-term goals, and how does this course fit them?',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Leave blank and we'll pull from your profile instead..." />,
  },
  {
    key: 'weaknesses_or_gaps',
    title: 'Anything you want addressed honestly?',
    subtitle: 'A lower grade in one module, a gap, something that needs context, completely optional, and only used if you actually tell us about it. We never invent a weakness to seem balanced.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional, skip if there's nothing to add..." />,
  },
  {
    key: 'tier',
    title: 'Standard or Premium delivery?',
    render: (value, onChange) => <ChoiceGrid options={TIERS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose a tier.'),
  },
]

export default function PersonalStatementBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)
  const { clearDraft } = useDraftAutosave(user ? `foundation_draft:personal_statement:${user.id}` : null, values, setValues)
  const checkoutRef = useRef(null)
  const { enabled: orderingOpen } = useFoundationOrdering()
  const safeGoBack = useSafeGoBack(navigation)

  // iOS and Android never order in the app. While ordering is closed the builder
  // opens for everyone, saves a draft and shows "Ordering opens in January".
  if (IS_IOS && orderingOpen) {
    return <FoundationIOSNotice navigation={navigation} serviceTitle="Personal Statement" />
  }

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      extra_detail: extraDetail(v, EXTRAS),
      background_and_motivation: v.background_and_motivation,
      relevant_experience: v.relevant_experience || null,
      life_work_experience: v.life_work_experience || null,
      weaknesses_or_gaps: v.weaknesses_or_gaps || null,
      goals: v.goals || null,
    }

    // 1. Create the draft document row.
    const { data: doc, error: insertErr } = await supabase
      .from('personal_statements')
      .insert({
        user_id: user.id,
        pathway: v.pathway,
        target_course: v.target_course,
        target_institution: v.target_institution,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) {
      console.error('[PersonalStatementBuilder] could not create personal_statements row', insertErr)
      throw new Error('We couldn’t save your answers. Please check your connection and try again.')
    }

    // 2. Real payment (task #95) — blocks until Stripe confirms the charge
    // for this document+tier; throws on cancel/failure.
    await checkoutRef.current.start({ documentTable: 'personal_statements', documentId: doc.id, tier: v.tier })

    // 3. Run the generator against it — entirely server-side (see
    // generate-personal-statement Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-personal-statement', {
      body: { document_id: doc.id },
    })
    if (genErr || genData?.error) {
      console.error('[PersonalStatementBuilder] generate-personal-statement failed', genErr, genData)
      throw new Error(genData?.error || 'We couldn’t generate your personal statement. Please try again in a moment.')
    }

    // 4. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'personal_statements',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Personal Statement, Premium' : 'Personal Statement, Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) {
      console.error('[PersonalStatementBuilder] submit_document_for_review failed', submitErr)
      throw new Error('Your personal statement was generated, but we couldn’t submit it for review. Please try again.')
    }

    await clearDraft()
    navigation.replace('GenerationSubmitted', { serviceTitle: 'Personal Statement', tier: v.tier })
  }

  return (
    <>
      <QuestionFlow
        steps={[...STEPS.slice(0, -1), ...extraSteps(EXTRAS), STEPS[STEPS.length - 1]]}
        serviceTitle="Personal Statement"
        values={values}
        onChange={onChange}
        onComplete={handleComplete}
        onExit={safeGoBack}
        navigation={navigation}
        submitLabel="Submit for review"
        closedNote={orderingOpen ? null : FOUNDATION_ORDERING_LINE}
      />
      <FoundationCheckoutModal ref={checkoutRef} />
    </>
  )
}
