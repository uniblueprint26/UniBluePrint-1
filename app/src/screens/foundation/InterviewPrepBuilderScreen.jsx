import { useState } from 'react'
import { View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'

// Interview Preparation intake — on the CV Optimisation pattern (QuestionFlow +
// an interview_prep_packs-shaped table + submit_document_for_review + a
// generate-* Edge Function). Field names and validation match
// supabase/functions/generate-interview-prep/index.ts exactly: target_role is
// the only required top-level column (target_company is optional, and
// interview_type has a real default but is still a required choice), and
// every input.* field — industry, background_summary, unsure_about — is
// optional, with the Edge Function falling back to the career profile/target
// when they're left blank.

const INTERVIEW_TYPES = [
  { value: 'behavioural', label: 'Behavioural / competency-based' },
  { value: 'technical', label: 'Technical' },
  { value: 'strengths_based', label: 'Strengths-based' },
  { value: 'blended', label: 'Blended (mix of all — most common)' },
]
const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
  target_role: '', target_company: '', industry: '',
  interview_type: 'blended',
  background_summary: '',
  unsure_about: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: '_targeting',
    title: 'What role is this interview for?',
    subtitle: 'Target role is required — it decides the whole prep pack, right down to the format we prepare you for.',
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel required>Target role</FieldLabel><FormTextInput value={values.target_role} onChangeText={t => setValue('target_role', t)} placeholder="e.g. Marketing Intern" /></View>
        <View><FieldLabel hint="Optional">Target company</FieldLabel><FormTextInput value={values.target_company} onChangeText={t => setValue('target_company', t)} placeholder="e.g. Stripe" /></View>
        <View><FieldLabel hint="Optional">Industry</FieldLabel><FormTextInput value={values.industry} onChangeText={t => setValue('industry', t)} placeholder="e.g. Tech, Finance" /></View>
      </View>
    ),
    validate: (_, values) => (isBlank(values.target_role) ? 'Target role is required.' : null),
  },
  {
    key: 'interview_type',
    title: 'What kind of interview is this?',
    subtitle: 'Behavioural asks about past examples, technical is role-specific problem-solving, strengths-based is about what energises you, blended is a realistic mix — most large graduate employers use blended.',
    render: (value, onChange) => <ChoiceGrid options={INTERVIEW_TYPES} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'background_summary',
    title: 'Your relevant background',
    subtitle: 'A short summary of your relevant background for this interview — leave blank and we\'ll pull from your profile.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." minHeight={120} />,
  },
  {
    key: 'unsure_about',
    title: 'Anything you\'re unsure how to prepare for?',
    subtitle: 'A format you\'ve never done, a weak area, a gap you don\'t know how to field — tell us and your Handler will double-check it specifically.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'tier',
    title: 'Standard or Premium delivery?',
    render: (value, onChange) => <ChoiceGrid options={TIERS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose a tier.'),
  },
]

export default function InterviewPrepBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      industry: v.industry || null,
      background_summary: v.background_summary || null,
      unsure_about: v.unsure_about || null,
    }

    // 1. Create the draft pack row.
    const { data: doc, error: insertErr } = await supabase
      .from('interview_prep_packs')
      .insert({
        user_id: user.id,
        target_role: v.target_role,
        target_company: v.target_company || null,
        interview_type: v.interview_type,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see
    // generate-interview-prep Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-interview-prep', {
      body: { pack_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'interview_prep_packs',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Interview Preparation — Premium' : 'Interview Preparation — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'Interview Preparation', tier: v.tier })
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
