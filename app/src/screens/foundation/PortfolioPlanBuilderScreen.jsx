import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'

// Portfolio Building intake — simplest of the Foundation Blueprint services,
// on the CV Optimisation pattern (QuestionFlow + a portfolio_plans-shaped
// table + submit_document_for_review + a generate-* Edge Function). Field
// names and validation match supabase/functions/generate-portfolio-plan/
// index.ts exactly: field is the only required top-level column, work_type
// the only required input.* field, and career_goal falls back to the
// student's profile goals server-side if left blank here.

const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
  field: '',
  work_type: '',
  existing_presence: '',
  career_goal: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: 'field',
    title: 'What field is this portfolio for?',
    subtitle: 'This decides everything — a developer\'s portfolio (GitHub) looks nothing like a designer\'s (Behance) or a teacher\'s (a teaching portfolio of lesson plans and placement reports).',
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. Software Development, Graphic Design, Teaching" />,
    validate: value => (isBlank(value) ? 'Please tell us what field this is for.' : null),
  },
  {
    key: 'work_type',
    title: 'What kind of work do you want to showcase?',
    subtitle: 'Projects, coursework, freelance work, coaching sessions, designs — be specific about what you actually have or want to build.',
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Tell us what you'd showcase..." minHeight={120} />,
    validate: value => (isBlank(value) ? 'Please tell us what you want to showcase.' : null),
  },
  {
    key: 'existing_presence',
    title: 'Do you already have anything online?',
    subtitle: 'A GitHub, a Behance, a site, an Instagram — tell us what exists already so we build on it rather than starting you over.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'career_goal',
    title: 'What\'s this portfolio ultimately for?',
    subtitle: 'Landing a specific role, freelance clients, a course application — whatever the end goal is.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Leave blank and we'll use your profile goals instead..." />,
  },
  {
    key: 'tier',
    title: 'Standard or Premium delivery?',
    render: (value, onChange) => <ChoiceGrid options={TIERS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose a tier.'),
  },
]

export default function PortfolioPlanBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      work_type: v.work_type,
      career_goal: v.career_goal || null,
      existing_presence: v.existing_presence || null,
    }

    // 1. Create the draft plan row.
    const { data: doc, error: insertErr } = await supabase
      .from('portfolio_plans')
      .insert({
        user_id: user.id,
        field: v.field,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see
    // generate-portfolio-plan Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-portfolio-plan', {
      body: { plan_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'portfolio_plans',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Portfolio Building — Premium' : 'Portfolio Building — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'Portfolio Building', tier: v.tier })
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
