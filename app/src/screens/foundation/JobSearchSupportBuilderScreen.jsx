import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { FormTextInput, FormTextArea, ChoiceGrid, YesNoToggle } from '../../components/forms/FormControls'

// Job Search Support intake — the most complex Foundation Blueprint service,
// on the same CV Optimisation pattern (QuestionFlow + a *_sessions-shaped
// table + submit_document_for_review + a generate-* Edge Function). Field
// names and validation match supabase/functions/generate-job-search-support/
// index.ts exactly: field_or_industry and opportunity_type are the only two
// truly required input.* fields, everything else is optional context that
// sharpens the branching logic in the system prompt (urgency, interview
// conversion, registration status, non-university applicant type, etc).
// Unlike CV/LinkedIn, tier is also stored as a real top-level column on
// job_search_sessions, not just passed to the review RPC.

const OPPORTUNITY_TYPES = [
  { value: 'graduate_scheme', label: 'Graduate scheme' },
  { value: 'internship', label: 'Internship' },
  { value: 'part_time', label: 'Part time' },
  { value: 'full_time', label: 'Full time' },
  { value: 'placement_year', label: 'Placement year' },
]
const URGENCY = [
  { value: 'urgent', label: 'Urgent — I need income within a few weeks' },
  { value: 'moderate', label: 'Moderate — a few months timeline' },
  { value: 'flexible', label: 'No rush — just planning ahead' },
]
const INTERVIEW_CONVERSION = [
  { value: 'new_to_search', label: 'Just starting my search' },
  { value: 'not_getting_interviews', label: 'Applying, but not getting interviews' },
  { value: 'interviews_no_offers', label: 'Getting interviews, but no offers yet' },
]
const CV_STATUS = [
  { value: 'have_recent', label: 'I have an up-to-date CV' },
  { value: 'have_old', label: "I have one, but it's outdated" },
  { value: 'none', label: "I don't have one yet" },
]
const LINKEDIN_STATUS = [
  { value: 'optimised', label: "It's in good shape" },
  { value: 'needs_work', label: 'It exists, but needs work' },
  { value: 'none', label: "I don't have one" },
]
const NON_UNIVERSITY_TYPE = [
  { value: 'university_student', label: 'University / college student' },
  { value: 'apprentice', label: 'Apprentice' },
  { value: 'young_worker', label: 'Young worker looking to progress' },
  { value: 'secondary_student', label: '5th or 6th year student' },
]
const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
  field_or_industry: '',
  non_university_type: null,
  has_no_experience: null,
  opportunity_type: null,
  location: '',
  timeline: '',
  urgency: null,
  cv_status: null,
  linkedin_status: null,
  interview_conversion: null,
  applications_so_far: '',
  professional_registration_status: '',
  unsure_about: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: 'field_or_industry',
    title: 'What field or industry are you searching in?',
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. Healthcare and Nursing, Technology and Software" />,
    validate: value => (isBlank(value) ? 'Please tell us what field or industry you\'re searching in.' : null),
  },
  {
    key: 'non_university_type',
    title: 'Which best describes you?',
    subtitle: 'This changes which channels and advice actually apply to you.',
    optional: true,
    render: (value, onChange) => <ChoiceGrid options={NON_UNIVERSITY_TYPE} value={value} onChange={onChange} />,
  },
  {
    key: 'has_no_experience',
    title: 'Do you have any relevant work experience yet?',
    optional: true,
    render: (value, onChange) => <YesNoToggle value={value === null ? null : !value} onChange={v => onChange(!v)} yesLabel="Yes, I do" noLabel="Not yet" />,
  },
  {
    key: 'opportunity_type',
    title: 'What kind of opportunity are you looking for?',
    render: (value, onChange) => <ChoiceGrid options={OPPORTUNITY_TYPES} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'location',
    title: 'Where are you searching?',
    optional: true,
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. Dublin, Cork, remote" />,
  },
  {
    key: 'timeline',
    title: "What's your timeline?",
    optional: true,
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. ASAP, this September, flexible" />,
  },
  {
    key: 'urgency',
    title: 'How urgent is this for you?',
    optional: true,
    render: (value, onChange) => <ChoiceGrid options={URGENCY} value={value} onChange={onChange} />,
  },
  {
    key: 'cv_status',
    title: "What's the state of your CV?",
    optional: true,
    render: (value, onChange) => <ChoiceGrid options={CV_STATUS} value={value} onChange={onChange} />,
  },
  {
    key: 'linkedin_status',
    title: "What's the state of your LinkedIn?",
    optional: true,
    render: (value, onChange) => <ChoiceGrid options={LINKEDIN_STATUS} value={value} onChange={onChange} />,
  },
  {
    key: 'interview_conversion',
    title: 'How has your search gone so far?',
    optional: true,
    render: (value, onChange) => <ChoiceGrid options={INTERVIEW_CONVERSION} value={value} onChange={onChange} />,
  },
  {
    key: 'applications_so_far',
    title: 'What have you tried so far?',
    subtitle: "Applications sent, platforms used, anything — helps us avoid repeating advice you've already acted on.",
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'professional_registration_status',
    title: 'Any professional registration relevant to your field?',
    subtitle: 'e.g. NMBI, Teaching Council, CORU — leave blank if not applicable.',
    optional: true,
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'unsure_about',
    title: "Anything you're unsure how to present?",
    subtitle: 'A gap, a career change, something unconventional — tell us and your Handler will double-check it specifically.',
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

export default function JobSearchSupportBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      field_or_industry: v.field_or_industry,
      opportunity_type: v.opportunity_type,
      non_university_type: v.non_university_type || null,
      has_no_experience: !!v.has_no_experience,
      location: v.location || null,
      timeline: v.timeline || null,
      urgency: v.urgency || null,
      cv_status: v.cv_status || null,
      linkedin_status: v.linkedin_status || null,
      interview_conversion: v.interview_conversion || null,
      applications_so_far: v.applications_so_far || null,
      professional_registration_status: v.professional_registration_status || null,
      unsure_about: v.unsure_about || null,
    }

    // 1. Create the draft session row. tier is a real top-level column here,
    // not just passed to the review RPC.
    const { data: doc, error: insertErr } = await supabase
      .from('job_search_sessions')
      .insert({
        user_id: user.id,
        tier: v.tier,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see
    // generate-job-search-support Edge Function). Nothing about the actual
    // generation happens on this device. Note: this function's body param is
    // session_id, not document_id.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-job-search-support', {
      body: { session_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'job_search_sessions',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Job Search Support — Premium' : 'Job Search Support — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'Job Search Support', tier: v.tier })
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
