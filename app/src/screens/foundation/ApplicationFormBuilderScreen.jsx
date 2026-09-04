import { useState } from 'react'
import { View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import RepeatingList from '../../components/forms/RepeatingList'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'

// Application Form Assistance intake — same CV Optimisation pattern (QuestionFlow +
// an application_forms-shaped table + submit_document_for_review + a generate-*
// Edge Function). Field names and validation match
// supabase/functions/generate-application-answers/index.ts exactly: the backend
// only reads target_company/target_role off the row, questions[].question_text
// (at least one non-blank, everything else on a question object is ignored), and
// input.industry / input.unsure_about. It also requires the user's evidence bank
// to already have at least one story — that's out of scope here, but the intro
// step's subtitle says so up front rather than letting it surprise anyone at the
// generation step.

const EMPTY_QUESTION = { question_text: '' }

const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
  target_company: '', target_role: '',
  industry: '',
  questions: [EMPTY_QUESTION],
  unsure_about: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: '_targeting',
    title: 'Which application is this for?',
    subtitle: 'Optional, but it sharpens every answer toward exactly who\'s reading it. We draft from your evidence bank stories, so make sure you\'ve added a few before submitting.',
    optional: true,
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel hint="Optional">Target company</FieldLabel><FormTextInput value={values.target_company} onChangeText={t => setValue('target_company', t)} placeholder="e.g. Stripe" /></View>
        <View><FieldLabel hint="Optional">Target role</FieldLabel><FormTextInput value={values.target_role} onChangeText={t => setValue('target_role', t)} placeholder="e.g. Graduate Software Engineer" /></View>
      </View>
    ),
  },
  {
    key: 'industry',
    title: 'What field or industry is this application for?',
    optional: true,
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. Public Sector, Finance, Engineering" />,
  },
  {
    key: 'questions',
    title: 'The form\'s questions',
    subtitle: 'Add every question from the application form — we\'ll draft an answer for each, in your own real evidence.',
    render: (value, onChange) => (
      <RepeatingList
        entries={value}
        onChange={onChange}
        emptyEntry={EMPTY_QUESTION}
        addLabel="Add another question"
        renderEntry={(entry, onChangeEntry) => (
          <FormTextArea value={entry.question_text} onChangeText={t => onChangeEntry({ ...entry, question_text: t })} placeholder="Paste one question exactly as it appears on the form" />
        )}
      />
    ),
    validate: value => {
      const hasValid = (value || []).some(q => !isBlank(q.question_text))
      if (!hasValid) return 'Add at least one question first.'
      return null
    },
  },
  {
    key: 'unsure_about',
    title: 'Anything you\'re unsure how to present?',
    subtitle: 'A gap, a weak-fit story, a question you don\'t know how to angle — tell us and your Handler will double-check it specifically.',
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

export default function ApplicationFormBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      industry: v.industry || null,
      unsure_about: v.unsure_about || null,
    }

    // 1. Create the draft document row. Mirror the backend's own blank-filtering
    // here so what's stored is already clean — the required check itself already
    // ran in the questions step's validate above.
    const { data: doc, error: insertErr } = await supabase
      .from('application_forms')
      .insert({
        user_id: user.id,
        target_company: v.target_company || null,
        target_role: v.target_role || null,
        questions: v.questions.filter(q => q.question_text && q.question_text.trim()),
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see
    // generate-application-answers Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-application-answers', {
      body: { form_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'application_forms',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Application Form Assistance — Premium' : 'Application Form Assistance — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'Application Form Assistance', tier: v.tier })
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
