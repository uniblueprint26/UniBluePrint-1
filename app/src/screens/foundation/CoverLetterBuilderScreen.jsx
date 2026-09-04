import { useState } from 'react'
import { View, Text } from 'react-native'
import { fonts, colors } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid, YesNoToggle } from '../../components/forms/FormControls'

// Cover Letter Assistance intake — same skeleton as CvBuilderScreen /
// LinkedinBuilderScreen (QuestionFlow + a cover_letters-shaped table +
// submit_document_for_review + a generate-* Edge Function). Field names and
// validation match supabase/functions/generate-cover-letter/index.ts exactly:
// target_role and target_company are the required top-level columns,
// relevant_experience is the only truly required input.* field — everything
// else (industry, background_summary, why_this_company, unsure_about) falls
// back server-side to the career profile when left blank.

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'modern', label: 'Modern' },
]
const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
  target_role: '', target_company: '', target_industry: '',
  job_description: '',
  has_no_experience: null,
  relevant_experience: '',
  background_summary: '',
  why_this_company: '',
  unsure_about: '',
  tone: null,
  tier: 'standard',
}

const STEPS = [
  {
    key: '_targeting',
    title: 'What role are you applying for?',
    subtitle: 'Role and company are required — this letter is written for this one application, not a generic template.',
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel required>Target role</FieldLabel><FormTextInput value={values.target_role} onChangeText={t => setValue('target_role', t)} placeholder="e.g. Marketing Intern" /></View>
        <View><FieldLabel required>Target company</FieldLabel><FormTextInput value={values.target_company} onChangeText={t => setValue('target_company', t)} placeholder="e.g. Stripe" /></View>
        <View><FieldLabel hint="Optional">Target industry</FieldLabel><FormTextInput value={values.target_industry} onChangeText={t => setValue('target_industry', t)} placeholder="e.g. Tech, Finance" /></View>
      </View>
    ),
    validate: (_, values) => {
      if (isBlank(values.target_role) || isBlank(values.target_company)) {
        return 'Target role and target company are both required.'
      }
      return null
    },
  },
  {
    key: 'job_description',
    title: 'Have the job ad?',
    subtitle: 'Paste the job ad if you have one — it sharpens the letter toward exactly what they asked for.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Paste the job ad if you have one..." minHeight={160} />,
  },
  {
    key: 'has_no_experience',
    title: 'Do you have any work experience yet?',
    subtitle: 'No formal work experience yet? That\'s fine — the letter\'s structure shifts accordingly.',
    render: (value, onChange) => <YesNoToggle value={value === null ? null : !value} onChange={v => onChange(!v)} yesLabel="Yes, I do" noLabel="Not yet" />,
    validate: value => (value === null ? 'Please choose one.' : null),
  },
  {
    key: 'relevant_experience',
    title: 'What\'s your strongest, most relevant point?',
    subtitle: 'What\'s the strongest, most relevant thing about your background for this specific role? If you have no formal experience, draw on academic work, societies, or volunteering instead.',
    render: (value, onChange, values) => (
      <View>
        {values.has_no_experience && (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginBottom: 12, fontStyle: 'italic' }}>
            You said you don't have experience yet — draw on coursework, projects, societies, or volunteering instead.
          </Text>
        )}
        <FormTextArea value={value} onChangeText={onChange} placeholder="What makes you right for this role?" minHeight={120} />
      </View>
    ),
    validate: value => (isBlank(value) ? 'Please tell us the strongest, most relevant thing about your background.' : null),
  },
  {
    key: 'background_summary',
    title: 'Any extra background context?',
    subtitle: 'A short summary of your background, if you want to add context beyond what you just wrote — leave blank and we\'ll pull from your profile instead.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'why_this_company',
    title: 'Why this company?',
    subtitle: 'Why this company, specifically? A real reason — a project they do, something true about them — beats a generic compliment.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'unsure_about',
    title: 'Anything you\'re unsure how to present?',
    subtitle: 'A gap, a career change, something unconventional — tell us and your Handler will double-check it specifically.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: 'tone',
    title: 'What tone should it strike?',
    render: (value, onChange) => <ChoiceGrid options={TONES} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'tier',
    title: 'Standard or Premium delivery?',
    render: (value, onChange) => <ChoiceGrid options={TIERS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose a tier.'),
  },
]

export default function CoverLetterBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      industry: v.target_industry || null,
      relevant_experience: v.relevant_experience,
      background_summary: v.background_summary || null,
      why_this_company: v.why_this_company || null,
      has_no_experience: !!v.has_no_experience,
      unsure_about: v.unsure_about || null,
      tone: v.tone,
    }

    // 1. Create the draft document row.
    const { data: doc, error: insertErr } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        target_role: v.target_role,
        target_company: v.target_company,
        job_description: v.job_description || null,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see generate-cover-letter
    // Edge Function). Nothing about the actual generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-cover-letter', {
      body: { document_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'cover_letters',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'Cover Letter Assistance — Premium' : 'Cover Letter Assistance — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'Cover Letter Assistance', tier: v.tier })
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
