import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useDraftAutosave } from '../../hooks/useDraftAutosave'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { extraDefaults, extraSteps, extraDetail } from '../../components/forms/ExtraSteps'
import { FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'
import FoundationIOSNotice, { IS_IOS } from '../../components/ui/FoundationIOSNotice'
import FoundationCheckoutModal from '../../components/foundation/FoundationCheckoutModal'
import { useFoundationOrdering, FOUNDATION_ORDERING_LINE } from '../../hooks/useAppFlags'
import { useSafeGoBack } from '../../hooks/useSafeGoBack'

// Portfolio Building intake — simplest of the Foundation Blueprint services,
// on the CV Optimisation pattern (QuestionFlow + a portfolio_plans-shaped
// table + submit_document_for_review + a generate-* Edge Function). Field
// names and validation match supabase/functions/generate-portfolio-plan/
// index.ts exactly: field is the only required top-level column, work_type
// the only required input.* field, career_goal falls back to the student's
// profile goals server-side if left blank here, and unsure_about feeds a
// handler_notes flag so the reviewing Coach double-checks whatever the
// student flagged themselves as unsure about.

const TIERS = [
  { value: 'standard', label: 'Standard, delivered within 48 hours' },
  { value: 'premium', label: 'Premium, priority queue, delivered within 24 hours', accent: true },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

// Extra detailed questions, asked just before delivery. Optional, so nobody is blocked.
const EXTRAS = [
  { key: 'x_audience', label: 'Audience', title: 'Who will look at your portfolio?', kind: 'text', subtitle: 'Employers, clients, a college, followers. This changes what goes first.' },
  { key: 'x_pieces', label: 'Work so far', title: 'List the pieces or projects you have so far', kind: 'text', subtitle: 'One line each is fine. Say which you are most proud of.', minHeight: 160 },
  { key: 'x_tools', label: 'Tools', title: 'Tools and platforms you use', kind: 'line', subtitle: 'Separate them with commas.', placeholder: 'e.g. Figma, Premiere, GitHub, Canva' },
  { key: 'x_time', label: 'Time', title: 'How much time can you give this each week?', kind: 'choice', options: [{ value: '1_2', label: '1 to 2 hours' }, { value: '3_5', label: '3 to 5 hours' }, { value: '6_plus', label: '6 hours or more' }] },
  { key: 'x_inspiration', label: 'Portfolios you admire', title: 'Portfolios you admire and what you like about them', kind: 'text', subtitle: 'Links or names are fine.' },
  { key: 'x_deadline', label: 'Deadline', title: 'Is there a deadline?', kind: 'line', subtitle: 'An application date, an interview or a launch.', placeholder: 'e.g. Before 15 January' },
]

const DEFAULT_VALUES = {
  ...extraDefaults(EXTRAS),
  field: '',
  work_type: '',
  existing_presence: '',
  career_goal: '',
  unsure_about: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: 'field',
    title: 'What field is this portfolio for?',
    subtitle: 'This decides everything, a developer\'s portfolio (GitHub) looks nothing like a designer\'s (Behance) or a teacher\'s (a teaching portfolio of lesson plans and placement reports).',
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. Software Development, Graphic Design, Teaching" />,
    validate: value => (isBlank(value) ? 'Please tell us what field this is for.' : null),
  },
  {
    key: 'work_type',
    title: 'What kind of work do you want to showcase?',
    subtitle: 'Projects, coursework, freelance work, coaching sessions, designs, be specific about what you actually have or want to build.',
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Tell us what you'd showcase..." minHeight={120} />,
    validate: value => (isBlank(value) ? 'Please tell us what you want to showcase.' : null),
  },
  {
    key: 'existing_presence',
    title: 'Do you already have anything online?',
    subtitle: 'A GitHub, a Behance, a site, an Instagram, tell us what exists already so we build on it rather than starting you over.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'career_goal',
    title: 'What\'s this portfolio ultimately for?',
    subtitle: 'Landing a specific role, freelance clients, a course application, whatever the end goal is.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Leave blank and we'll use your profile goals instead..." />,
  },
  {
    key: 'unsure_about',
    title: 'Anything you\'re unsure about?',
    subtitle: 'Whether you have enough to show, how to present a weak or unfinished piece, something else, tell us and your Campus Handler will double-check it specifically.',
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

export default function PortfolioPlanBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)
  const { clearDraft } = useDraftAutosave(user ? `foundation_draft:portfolio_plan:${user.id}` : null, values, setValues)
  const checkoutRef = useRef(null)
  const { enabled: orderingOpen } = useFoundationOrdering()
  const safeGoBack = useSafeGoBack(navigation)

  // iOS and Android never order in the app. While ordering is closed the builder
  // opens for everyone, saves a draft and shows "Ordering opens in January".
  if (IS_IOS && orderingOpen) {
    return <FoundationIOSNotice navigation={navigation} serviceTitle="Portfolio Building" />
  }

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      extra_detail: extraDetail(v, EXTRAS),
      work_type: v.work_type,
      career_goal: v.career_goal || null,
      existing_presence: v.existing_presence || null,
      unsure_about: v.unsure_about || null,
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
    if (insertErr || !doc) {
      console.error('[PortfolioPlanBuilder] could not create portfolio_plans row', insertErr)
      throw new Error('We couldn’t save your answers. Please check your connection and try again.')
    }

    // 2. Real payment (task #95) — blocks until Stripe confirms the charge
    // for this document+tier; throws on cancel/failure.
    await checkoutRef.current.start({ documentTable: 'portfolio_plans', documentId: doc.id, tier: v.tier })

    // 3. Run the generator against it — entirely server-side (see
    // generate-portfolio-plan Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-portfolio-plan', {
      body: { plan_id: doc.id },
    })
    if (genErr || genData?.error) {
      console.error('[PortfolioPlanBuilder] generate-portfolio-plan failed', genErr, genData)
      throw new Error(genData?.error || 'We couldn’t put together your portfolio plan. Please try again in a moment.')
    }

    // 4. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'portfolio_plans',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Portfolio Building, Premium' : 'Portfolio Building, Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) {
      console.error('[PortfolioPlanBuilder] submit_document_for_review failed', submitErr)
      throw new Error('Your portfolio plan was generated, but we couldn’t submit it for review. Please try again.')
    }

    await clearDraft()
    navigation.replace('GenerationSubmitted', { serviceTitle: 'Portfolio Building', tier: v.tier })
  }

  return (
    <>
      <QuestionFlow
        steps={[...STEPS.slice(0, -1), ...extraSteps(EXTRAS), STEPS[STEPS.length - 1]]}
        serviceTitle="Portfolio Building"
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
