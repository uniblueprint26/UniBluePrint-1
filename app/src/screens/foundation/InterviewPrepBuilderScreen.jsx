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
  { value: 'blended', label: 'Blended (mix of all, most common)' },
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
  { key: 'x_date', label: 'Interview date', title: 'When is the interview?', kind: 'line', subtitle: 'So the prep can be paced to the time you have.', placeholder: 'e.g. Thursday 4 December, 10am' },
  { key: 'x_company_known', label: 'About the employer', title: 'What do you already know about the organisation?', kind: 'text', subtitle: 'Products, values, news, people you have spoken to.' },
  { key: 'x_panel', label: 'Who is interviewing', title: 'Who will interview you and how long will it be?', kind: 'text', subtitle: 'A panel, a manager, an assessor. Any detail you have been given.' },
  { key: 'x_stories', label: 'Stories you could use', title: 'Examples from work, study or life you could talk about', kind: 'text', subtitle: 'A time you led, solved a problem, failed or worked under pressure.', minHeight: 160 },
  { key: 'x_worries', label: 'What worries you', title: 'What worries you most about this interview?', kind: 'text', subtitle: 'Nerves, a gap on your CV, a topic you find hard. We will prepare for it directly.' },
  { key: 'x_experience_level', label: 'Interview experience', title: 'How many interviews have you done?', kind: 'choice', options: [{ value: 'none', label: 'None yet' }, { value: 'few', label: 'One to three' }, { value: 'many', label: 'Four or more' }] },
]

const DEFAULT_VALUES = {
  ...extraDefaults(EXTRAS),
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
    subtitle: 'Target role is required, it decides the whole prep pack, right down to the format we prepare you for.',
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
    subtitle: 'Behavioural asks about past examples, technical is role-specific problem-solving, strengths-based is about what energises you, blended is a realistic mix, most large graduate employers use blended.',
    render: (value, onChange) => <ChoiceGrid options={INTERVIEW_TYPES} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'background_summary',
    title: 'Your relevant background',
    subtitle: 'A short summary of your relevant background for this interview, leave blank and we\'ll pull from your profile.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." minHeight={120} />,
  },
  {
    key: 'unsure_about',
    title: 'Anything you\'re unsure how to prepare for?',
    subtitle: 'A format you\'ve never done, a weak area, a gap you don\'t know how to field, tell us and your Handler will double-check it specifically.',
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
  const { clearDraft } = useDraftAutosave(user ? `foundation_draft:interview_prep:${user.id}` : null, values, setValues)
  const checkoutRef = useRef(null)
  const { enabled: orderingOpen } = useFoundationOrdering()
  const safeGoBack = useSafeGoBack(navigation)

  // iOS and Android never order in the app. While ordering is closed the builder
  // opens for everyone, saves a draft and shows "Ordering opens in January".
  if (IS_IOS && orderingOpen) {
    return <FoundationIOSNotice navigation={navigation} serviceTitle="Interview Preparation" />
  }

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      extra_detail: extraDetail(v, EXTRAS),
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
    if (insertErr || !doc) {
      console.error('[InterviewPrepBuilder] could not create interview_prep_packs row', insertErr)
      throw new Error('We couldn’t save your answers. Please check your connection and try again.')
    }

    // 2. Real payment (task #95) — blocks until Stripe confirms the charge
    // for this document+tier; throws on cancel/failure.
    await checkoutRef.current.start({ documentTable: 'interview_prep_packs', documentId: doc.id, tier: v.tier })

    // 3. Run the generator against it — entirely server-side (see
    // generate-interview-prep Edge Function). Nothing about the actual
    // generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-interview-prep', {
      body: { pack_id: doc.id },
    })
    if (genErr || genData?.error) {
      console.error('[InterviewPrepBuilder] generate-interview-prep failed', genErr, genData)
      throw new Error(genData?.error || 'We couldn’t generate your interview prep pack. Please try again in a moment.')
    }

    // 4. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here. Service names must
    // match the `services` table exactly or service_id ends up null — the
    // seeded rows are "Interview Preparation — Standard Pack" / "... Premium
    // Pack" (the "Pack" suffix was missing here, verified against the live
    // ozpeofkvnpikhopkgcxc project's services table).
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'interview_prep_packs',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Interview Preparation, Premium Pack' : 'Interview Preparation, Standard Pack',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) {
      console.error('[InterviewPrepBuilder] submit_document_for_review failed', submitErr)
      throw new Error('Your interview prep pack was generated, but we couldn’t submit it for review. Please try again.')
    }

    await clearDraft()
    navigation.replace('GenerationSubmitted', { serviceTitle: 'Interview Preparation', tier: v.tier })
  }

  return (
    <>
      <QuestionFlow
        steps={[...STEPS.slice(0, -1), ...extraSteps(EXTRAS), STEPS[STEPS.length - 1]]}
        serviceTitle="Interview Preparation"
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
