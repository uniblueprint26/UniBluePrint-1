import { View, Text } from 'react-native'
import { fonts, colors } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import QuestionFlow from '../../components/forms/QuestionFlow'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid, TagInput, YesNoToggle } from '../../components/forms/FormControls'

// LinkedIn Optimisation intake — second Foundation Blueprint service on the
// CV Optimisation pattern (QuestionFlow + a *_documents-shaped table +
// submit_document_for_review + a generate-* Edge Function). Field names and
// validation match supabase/functions/generate-linkedin/index.ts exactly:
// current_status is the only truly required input.* field, target_industry
// is the one required top-level column, key_skills needs 3+ (merged
// server-side with career-profile skills if this form gives fewer), and
// there's no personal_info step here — LinkedIn doesn't collect a name.

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
  current_status: '',
  has_no_experience: null,
  target_role: '', target_industry: '',
  key_skills: [],
  experience: '',
  notable_achievements: '',
  target_connections: '',
  unsure_about: '',
  tone: null,
  tier: 'standard',
}

const STEPS = [
  {
    key: 'current_status',
    title: 'How should we introduce you?',
    subtitle: 'Your year and course, or your current role — this is what a recruiter sees you as right now.',
    render: (value, onChange) => <FormTextInput value={value} onChangeText={onChange} placeholder="e.g. Final-year Computer Science student at UCD" />,
    validate: value => (isBlank(value) ? 'Please tell us how to introduce you.' : null),
  },
  {
    key: 'has_no_experience',
    title: 'Do you have relevant work experience yet?',
    subtitle: 'No experience? Your headline and About section carry the profile instead — a real, recruiter-recognised shape for a student profile, not a lesser one.',
    render: (value, onChange) => <YesNoToggle value={value === null ? null : !value} onChange={v => onChange(!v)} yesLabel="Yes, I do" noLabel="Not yet" />,
    validate: value => (value === null ? 'Please choose one.' : null),
  },
  {
    key: '_targeting',
    title: 'What are you aiming for?',
    subtitle: 'Target industry is required — it decides which keywords and skills we prioritise.',
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel required>Target industry</FieldLabel><FormTextInput value={values.target_industry} onChangeText={t => setValue('target_industry', t)} placeholder="e.g. Tech, Finance, Marketing" /></View>
        <View><FieldLabel hint="Optional">Target role</FieldLabel><FormTextInput value={values.target_role} onChangeText={t => setValue('target_role', t)} placeholder="e.g. Marketing Intern" /></View>
      </View>
    ),
    validate: (_, values) => (isBlank(values.target_industry) ? 'Target industry is required.' : null),
  },
  {
    key: 'key_skills',
    title: 'Your key skills',
    subtitle: 'Add at least 3 — we\'ll suggest relevant industry skills on top of these.',
    render: (value, onChange) => <TagInput values={value} onChange={onChange} placeholder="e.g. Python, Public Speaking" />,
    validate: value => ((value || []).length >= 3 ? null : 'Add at least 3 skills — or go back and we\'ll top up from your profile if it has some.'),
  },
  {
    key: 'experience',
    title: 'Your experience',
    subtitle: 'A short summary of your roles or internships — leave blank and we\'ll pull from your profile instead.',
    optional: true,
    render: (value, onChange, values) => (
      <View>
        {values.has_no_experience && (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginBottom: 12, fontStyle: 'italic' }}>
            You said you don't have experience yet — feel free to skip this.
          </Text>
        )}
        <FormTextArea value={value} onChangeText={onChange} placeholder="What have you done so far?" minHeight={120} />
      </View>
    ),
  },
  {
    key: 'notable_achievements',
    title: 'Anything you want to highlight?',
    subtitle: 'Projects, awards, societies — things worth featuring or pinning to your profile.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Tell us what you're proud of..." />,
  },
  {
    key: 'target_connections',
    title: 'Who are you trying to reach?',
    subtitle: 'Recruiters in a specific field, clients, collaborators — whoever you want your profile to speak to.',
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

export default function LinkedinBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      current_status: v.current_status,
      has_no_experience: !!v.has_no_experience,
      key_skills: v.key_skills,
      experience: v.has_no_experience ? '' : (v.experience || null),
      notable_achievements: v.notable_achievements || null,
      target_connections: v.target_connections || null,
      unsure_about: v.unsure_about || null,
      tone: v.tone,
    }

    // 1. Create the draft document row.
    const { data: doc, error: insertErr } = await supabase
      .from('linkedin_documents')
      .insert({
        user_id: user.id,
        target_industry: v.target_industry,
        target_role: v.target_role || null,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see generate-linkedin
    // Edge Function). Nothing about the actual generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-linkedin', {
      body: { document_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'linkedin_documents',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'LinkedIn Optimisation — Premium' : 'LinkedIn Optimisation — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'LinkedIn Optimisation', tier: v.tier })
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
