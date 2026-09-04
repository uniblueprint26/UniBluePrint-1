import { useState } from 'react'
import { View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'

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
  { value: 'cao_mature', label: 'CAO — Mature applicant' },
  { value: 'postgrad', label: 'Postgraduate' },
]
const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
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
    subtitle: 'This changes the whole structure — UCAS now uses three short structured answers, not one long essay; CAO mature applicant statements carry most of the weight since there\'s no points-based assessment; postgraduate follows academic/skills/goals structure.',
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
    subtitle: 'Your genuine motivation and background — this is the core of the whole statement. Avoid the obvious openers (“I have always been passionate about...”) — we\'ll help sharpen it, but start from something true and specific.',
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Tell us the real story..." minHeight={160} />,
    validate: value => (isBlank(value) ? 'Please tell us your motivation and background — this is the core of the statement.' : null),
  },
  {
    key: 'relevant_experience',
    title: 'Any relevant experience — academic, work, extracurricular — that supports this application?',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'life_work_experience',
    title: 'Life or work experience',
    subtitle: 'Especially relevant if you\'re a mature applicant — real life and work experience count as genuine evidence here, not something to work around.',
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
    subtitle: 'A lower grade in one module, a gap, something that needs context — completely optional, and only used if you actually tell us about it. We never invent a weakness to seem balanced.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional — skip if there's nothing to add..." />,
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

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
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
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see
    // generate-personal-statement Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-personal-statement', {
      body: { document_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'personal_statements',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Personal Statement — Premium' : 'Personal Statement — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'Personal Statement', tier: v.tier })
  }

  return (
    <QuestionFlow
      steps={STEPS}
      values={values}
      onChange={onChange}
      onComplete={handleComplete}
      onExit={() => navigation.goBack()}
      submitLabel="Submit for review"
    />
  )
}
