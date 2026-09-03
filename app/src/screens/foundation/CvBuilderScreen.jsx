import { useState } from 'react'
import { View, Text } from 'react-native'
import { fonts, colors } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import QuestionFlow from '../../components/forms/QuestionFlow'
import RepeatingList from '../../components/forms/RepeatingList'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid, TagInput, YesNoToggle } from '../../components/forms/FormControls'

// CV Optimisation intake — the reference pattern for the other 7 Foundation
// Blueprint services (same skeleton: QuestionFlow + a cv_documents-shaped table +
// submit_document_for_review + a generate-* Edge Function). Field names and
// validation match supabase/functions/generate-cv/index.ts exactly — this isn't a
// separate, invented shape, it's collecting precisely what that function reads
// from cv_documents.input, plus the top-level target_role/target_industry/
// target_company/job_description columns it also reads directly off the row.
//
// The generation itself always runs before a student sees anything — every output
// is reviewed by a Campus Handler before delivery (the existing FoundationScreen
// copy already promises this), so this screen never shows the raw generated CV.
// It ends at a confirmation state once submitted for review.

const EMPTY_EDUCATION = { institution: '', degree: '', year: '', grade: '', modules: '', awards: '' }
const EMPTY_EXPERIENCE = { job_title: '', company: '', dates: '', responsibilities: '' }

const YEARS_BANDS = [
  { value: 'none', label: 'None yet' },
  { value: 'under_1', label: 'Under 1 year' },
  { value: '1_2', label: '1–2 years' },
  { value: '3_5', label: '3–5 years' },
  { value: '5_plus', label: '5+ years' },
]
const OPPORTUNITY_TYPES = [
  { value: 'graduate_scheme', label: 'Graduate scheme' },
  { value: 'internship', label: 'Internship' },
  { value: 'part_time', label: 'Part time' },
  { value: 'full_time', label: 'Full time' },
  { value: 'placement_year', label: 'Placement year' },
]
const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'modern', label: 'Modern' },
]
const LENGTHS = [
  { value: 'one_page', label: 'One page' },
  { value: 'two_page', label: 'Two page' },
]
const TIERS = [
  { value: 'standard', label: 'Standard — delivered within 48 hours' },
  { value: 'premium', label: 'Premium — priority queue, same-day delivery' },
]

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

const DEFAULT_VALUES = {
  personal_full_name: '', personal_email: '', personal_phone: '', personal_location: '',
  personal_linkedin: '', personal_portfolio: '',
  has_no_experience: null,
  years_experience_band: null,
  education: [EMPTY_EDUCATION],
  experience: [EMPTY_EXPERIENCE],
  skills_technical: [], skills_soft: [], skills_languages: [], skills_tools: [],
  achievements_highlight: '',
  existing_cv_text: '',
  unsure_about: '',
  target_role: '', target_industry: '', target_company: '', job_description: '',
  opportunity_type: null,
  tone: null,
  length: null,
  specific_requests: '',
  tier: 'standard',
}

const STEPS = [
  {
    key: '_personal',
    title: 'A little about you',
    subtitle: 'This goes at the top of your CV — make sure it’s accurate.',
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel required>Full name</FieldLabel><FormTextInput value={values.personal_full_name} onChangeText={t => setValue('personal_full_name', t)} placeholder="Aoife Murphy" /></View>
        <View><FieldLabel required>Email</FieldLabel><FormTextInput value={values.personal_email} onChangeText={t => setValue('personal_email', t)} placeholder="aoife@example.ie" keyboardType="email-address" autoCapitalize="none" /></View>
        <View><FieldLabel required>Phone</FieldLabel><FormTextInput value={values.personal_phone} onChangeText={t => setValue('personal_phone', t)} placeholder="+353 87 000 0000" keyboardType="phone-pad" /></View>
        <View><FieldLabel required>Location</FieldLabel><FormTextInput value={values.personal_location} onChangeText={t => setValue('personal_location', t)} placeholder="Dublin, Ireland" /></View>
        <View><FieldLabel hint="Optional">LinkedIn URL</FieldLabel><FormTextInput value={values.personal_linkedin} onChangeText={t => setValue('personal_linkedin', t)} placeholder="linkedin.com/in/..." autoCapitalize="none" /></View>
        <View><FieldLabel hint="Optional">Portfolio URL</FieldLabel><FormTextInput value={values.personal_portfolio} onChangeText={t => setValue('personal_portfolio', t)} placeholder="yourportfolio.com" autoCapitalize="none" /></View>
      </View>
    ),
    validate: (_, values) => {
      if (isBlank(values.personal_full_name) || isBlank(values.personal_email) ||
          isBlank(values.personal_phone) || isBlank(values.personal_location)) {
        return 'Name, email, phone, and location are all required.'
      }
      return null
    },
  },
  {
    key: 'has_no_experience',
    title: 'Do you have any work experience yet?',
    subtitle: 'No experience? That’s completely fine — we build a different, equally strong CV structure for it.',
    render: (value, onChange) => <YesNoToggle value={value === null ? null : !value} onChange={v => onChange(!v)} yesLabel="Yes, I do" noLabel="Not yet" />,
    validate: value => (value === null ? 'Please choose one.' : null),
  },
  {
    key: 'years_experience_band',
    title: 'Roughly how much experience?',
    render: (value, onChange) => <ChoiceGrid options={YEARS_BANDS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'education',
    title: 'Your education',
    subtitle: 'Add every institution you’ve studied at — most recent first.',
    render: (value, onChange) => (
      <RepeatingList
        entries={value}
        onChange={onChange}
        emptyEntry={EMPTY_EDUCATION}
        addLabel="Add another"
        renderEntry={(entry, onChangeEntry) => (
          <View style={{ gap: 10 }}>
            <FormTextInput value={entry.institution} onChangeText={t => onChangeEntry({ ...entry, institution: t })} placeholder="Institution (e.g. UCD)" />
            <FormTextInput value={entry.degree} onChangeText={t => onChangeEntry({ ...entry, degree: t })} placeholder="Degree / course title" />
            <FormTextInput value={entry.year} onChangeText={t => onChangeEntry({ ...entry, year: t })} placeholder="Year (e.g. 2023–2027)" />
            <FormTextInput value={entry.grade} onChangeText={t => onChangeEntry({ ...entry, grade: t })} placeholder="Grade so far (optional)" />
          </View>
        )}
      />
    ),
    validate: value => {
      const first = (value || [])[0]
      if (!first || isBlank(first.institution) || isBlank(first.degree) || isBlank(first.year)) {
        return 'At least one education entry needs an institution, degree, and year.'
      }
      return null
    },
  },
  {
    key: 'experience',
    title: 'Your work experience',
    subtitle: 'Jobs, internships, placements — anything relevant.',
    optional: true,
    render: (value, onChange, values) => (
      <View>
        {values.has_no_experience && (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginBottom: 12, fontStyle: 'italic' }}>
            You said you don't have experience yet — feel free to skip this.
          </Text>
        )}
        <RepeatingList
          entries={value}
          onChange={onChange}
          emptyEntry={EMPTY_EXPERIENCE}
          addLabel="Add another"
          renderEntry={(entry, onChangeEntry) => (
            <View style={{ gap: 10 }}>
              <FormTextInput value={entry.job_title} onChangeText={t => onChangeEntry({ ...entry, job_title: t })} placeholder="Job title" />
              <FormTextInput value={entry.company} onChangeText={t => onChangeEntry({ ...entry, company: t })} placeholder="Company" />
              <FormTextInput value={entry.dates} onChangeText={t => onChangeEntry({ ...entry, dates: t })} placeholder="Dates (e.g. Jun 2024 – Aug 2024)" />
              <FormTextArea value={entry.responsibilities} onChangeText={t => onChangeEntry({ ...entry, responsibilities: t })} placeholder="What did you actually do? Be specific." minHeight={80} />
            </View>
          )}
        />
      </View>
    ),
    validate: (value, values) => {
      if (values.has_no_experience) return null
      const hasValid = (value || []).some(r => !isBlank(r.job_title) && !isBlank(r.company) && !isBlank(r.dates))
      if (!hasValid) return 'Add at least one role with a job title, company, and dates — or go back and say you have no experience yet.'
      return null
    },
  },
  {
    key: '_skills',
    title: 'Your skills',
    subtitle: 'Add at least 3 across these categories.',
    render: (_, __, values, setValue) => (
      <View style={{ gap: 18 }}>
        <View><FieldLabel>Technical</FieldLabel><TagInput values={values.skills_technical} onChange={v => setValue('skills_technical', v)} placeholder="e.g. Excel, Python" /></View>
        <View><FieldLabel>Soft skills</FieldLabel><TagInput values={values.skills_soft} onChange={v => setValue('skills_soft', v)} placeholder="e.g. Teamwork" /></View>
        <View><FieldLabel>Languages</FieldLabel><TagInput values={values.skills_languages} onChange={v => setValue('skills_languages', v)} placeholder="e.g. Irish, French" /></View>
        <View><FieldLabel>Tools</FieldLabel><TagInput values={values.skills_tools} onChange={v => setValue('skills_tools', v)} placeholder="e.g. Figma, Git" /></View>
      </View>
    ),
    validate: (_, values) => {
      const total = ['skills_technical', 'skills_soft', 'skills_languages', 'skills_tools']
        .reduce((n, k) => n + (values[k]?.length || 0), 0)
      return total >= 3 ? null : 'Add at least 3 skills across these categories.'
    },
  },
  {
    key: 'achievements_highlight',
    title: 'What do you most want us to highlight?',
    subtitle: 'Societies, awards, projects, volunteering — anything that makes you stand out.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Tell us what you're proud of..." />,
  },
  {
    key: 'existing_cv_text',
    title: 'Have an existing CV?',
    subtitle: 'Paste it here and we’ll use it as a real source — improving the writing, not starting from nothing.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Paste your existing CV text..." minHeight={160} />,
  },
  {
    key: 'unsure_about',
    title: 'Anything you’re unsure how to present?',
    subtitle: 'A gap year, a career change, something unconventional — tell us and your Handler will double-check it specifically.',
    optional: true,
    render: (value, onChange) => <FormTextArea value={value} onChangeText={onChange} placeholder="Optional..." />,
  },
  {
    key: '_targeting',
    title: 'Targeting a specific role?',
    subtitle: 'Optional, but it sharpens the CV toward exactly what you’re applying for.',
    optional: true,
    render: (_, __, values, setValue) => (
      <View style={{ gap: 14 }}>
        <View><FieldLabel hint="Optional">Target role</FieldLabel><FormTextInput value={values.target_role} onChangeText={t => setValue('target_role', t)} placeholder="e.g. Marketing Intern" /></View>
        <View><FieldLabel hint="Optional">Target industry</FieldLabel><FormTextInput value={values.target_industry} onChangeText={t => setValue('target_industry', t)} placeholder="e.g. Tech, Finance" /></View>
        <View><FieldLabel hint="Optional">Target company</FieldLabel><FormTextInput value={values.target_company} onChangeText={t => setValue('target_company', t)} placeholder="e.g. Stripe" /></View>
        <View><FieldLabel hint="Optional">Job description</FieldLabel><FormTextArea value={values.job_description} onChangeText={t => setValue('job_description', t)} placeholder="Paste the job ad if you have one..." /></View>
      </View>
    ),
  },
  {
    key: 'opportunity_type',
    title: 'What kind of opportunity is this for?',
    optional: true,
    render: (value, onChange) => <ChoiceGrid options={OPPORTUNITY_TYPES} value={value} onChange={onChange} />,
  },
  {
    key: 'tone',
    title: 'What tone should it strike?',
    render: (value, onChange) => <ChoiceGrid options={TONES} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'length',
    title: 'How long should it be?',
    render: (value, onChange) => <ChoiceGrid options={LENGTHS} value={value} onChange={onChange} />,
    validate: value => (value ? null : 'Please choose one.'),
  },
  {
    key: 'specific_requests',
    title: 'Anything else specific you want included?',
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

export default function CvBuilderScreen({ navigation }) {
  const { user } = useAuth()
  const [values, setValues] = useState(DEFAULT_VALUES)

  function onChange(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function handleComplete(v) {
    if (!user) throw new Error('You need to be signed in to submit a request.')

    const input = {
      personal_info: {
        full_name: v.personal_full_name,
        email: v.personal_email,
        phone: v.personal_phone,
        location: v.personal_location,
        linkedin_url: v.personal_linkedin || null,
        portfolio_url: v.personal_portfolio || null,
      },
      education: v.education,
      has_no_experience: !!v.has_no_experience,
      experience: v.has_no_experience ? [] : v.experience,
      skills: {
        technical: v.skills_technical,
        soft: v.skills_soft,
        languages: v.skills_languages,
        tools: v.skills_tools,
      },
      achievements_highlight: v.achievements_highlight || null,
      existing_cv_text: v.existing_cv_text || null,
      unsure_about: v.unsure_about || null,
      years_experience_band: v.years_experience_band || null,
      opportunity_type: v.opportunity_type || null,
      target_emphasis: null,
      tone: v.tone,
      length: v.length,
      specific_requests: v.specific_requests || null,
    }

    // 1. Create the draft document row.
    const { data: doc, error: insertErr } = await supabase
      .from('cv_documents')
      .insert({
        user_id: user.id,
        title: `${v.personal_full_name}'s CV`,
        target_role: v.target_role || null,
        target_industry: v.target_industry || null,
        target_company: v.target_company || null,
        job_description: v.job_description || null,
        input,
      })
      .select()
      .single()
    if (insertErr || !doc) throw new Error(insertErr?.message || 'Could not save your answers. Please try again.')

    // 2. Run the generator against it — entirely server-side (see generate-cv
    // Edge Function). Nothing about the actual generation happens on this device.
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-cv', {
      body: { document_id: doc.id },
    })
    if (genErr || genData?.error) {
      throw new Error(genData?.error || genErr?.message || 'Generation failed. Please try again — you won’t be charged twice for this.')
    }

    // 3. Queue it for Campus Handler review — this creates the submissions row
    // the student and Operations actually track from here.
    const { error: submitErr } = await supabase.rpc('submit_document_for_review', {
      p_table: 'cv_documents',
      p_document_id: doc.id,
      p_service_name: v.tier === 'premium' ? 'CV Optimisation — Premium' : 'CV Optimisation — Standard',
      p_notes: null,
      p_tier: v.tier,
    })
    if (submitErr) throw new Error(submitErr.message || 'Could not submit for review. Please try again.')

    navigation.replace('GenerationSubmitted', { serviceTitle: 'CV Optimisation', tier: v.tier })
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
