import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { Upload, X, Check, FileText, Link2 } from 'lucide-react-native'
import Sheet, { FieldLabel } from '../campusConnect/Sheet'
import { Chip, PrimaryButton, useTone } from '../campusConnect/CampusKit'
import { useAuth } from '../../context/AuthContext'
import { useCampus } from '../../lib/campus'
import { fonts } from '../../constants/theme'
import {
  YEARS, SESSIONS, FILE_MIME_TYPES, FILE_HELP, validateLink, fileProblem, uploadFile, textProblem, createResource,
} from '../../lib/studyResources'

// Add a file or a link to the shared resources. Works for both scopes: the
// audience chips choose Course Connect (everyone in Ireland) or Campus Connect
// (your own community). `suggest` is the "Suggest a resource" path: it adds a
// link and flags it for the UBP team to look at.
export default function AddResourceSheet({ visible, onClose, scope = 'course', suggest = false, initialType = 'note', onAdded }) {
  const { user, profile } = useAuth()
  const campus = useCampus()
  const { colors, accent } = useTone(scope === 'campus' ? 'campus' : 'course')
  const hasCampus = !!(profile?.campus_community || campus.institution)

  const [type, setType] = useState(initialType)
  const [format, setFormat] = useState(suggest ? 'link' : 'file')
  const [audience, setAudience] = useState(scope)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [course, setCourse] = useState('')
  const [module, setModule] = useState('')
  const [year, setYear] = useState('')
  const [session, setSession] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [asset, setAsset] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!visible) return
    setType(initialType); setFormat(suggest ? 'link' : 'file'); setAudience(scope)
    setTitle(''); setSubject(''); setCourse(''); setModule(''); setYear(''); setSession('')
    setDescription(''); setLink(''); setAsset(null); setBusy(false); setError(null)
  }, [visible, scope, suggest, initialType])

  async function pick() {
    setError(null)
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: FILE_MIME_TYPES, copyToCacheDirectory: true, multiple: false })
      if (result.canceled || !result.assets?.length) return
      const a = result.assets[0]
      const problem = fileProblem(a)
      if (problem) { setError(problem); return }
      setAsset(a)
    } catch {
      setError('Could not open your files. Please try again.')
    }
  }

  async function submit() {
    if (busy) return
    setError(null)
    const isNote = type === 'note'
    if (isNote && !title.trim()) return setError('Add a title.')
    if (!subject.trim()) return setError('Add the subject.')
    if (!course.trim()) return setError('Add the course or programme.')
    if (isNote && !year) return setError('Choose the year of study.')
    if (!isNote && !year.trim()) return setError('Add the exam year, for example 2023.')
    if (!isNote && !session) return setError('Choose the exam session.')
    const bad = textProblem(title, subject, course, module, description)
    if (bad) return setError(bad)
    let linkUrl = null
    if (format === 'link') {
      const v = validateLink(link)
      if (!v.ok) return setError(v.error)
      linkUrl = v.url
    } else if (!asset) {
      return setError('Choose a file to share.')
    }
    if (audience === 'campus' && !hasCampus) return setError('Add your campus in Settings first.')
    setBusy(true)
    try {
      let file = null
      if (format === 'file') file = await uploadFile(user.id, asset)
      const row = await createResource({
        type, scope: audience, title, subject, course, module, year: year.trim(), examSession: session,
        description, link: linkUrl, file, suggest: suggest && format === 'link',
        userId: user.id,
        posterName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A member',
        institution: profile?.institution || user?.user_metadata?.institution || null,
      })
      setBusy(false)
      onAdded?.(row)
      onClose()
    } catch (e) {
      setBusy(false)
      setError(e?.message && e.message.length < 140 ? e.message : 'Could not save. Please try again.')
    }
  }

  const input = [s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]
  const ph = colors.textTertiary
  const title0 = suggest ? 'Suggest a resource' : 'Add a resource'

  return (
    <Sheet visible={visible} onClose={onClose} title={title0}
      subtitle={suggest ? 'Share a useful link. The UBP team may add it to the starter list.' : 'Share something useful with other members.'}>
      <FieldLabel>What is it</FieldLabel>
      <View style={s.chips}>
        <Chip kind={scope} label="Notes" active={type === 'note'} onPress={() => setType('note')} />
        <Chip kind={scope} label="Past paper" active={type === 'paper'} onPress={() => setType('paper')} />
      </View>

      {!suggest && (
        <>
          <FieldLabel>How are you sharing it</FieldLabel>
          <View style={s.chips}>
            <Chip kind={scope} label="A file" active={format === 'file'} onPress={() => setFormat('file')} />
            <Chip kind={scope} label="A link" active={format === 'link'} onPress={() => setFormat('link')} />
          </View>
        </>
      )}

      <FieldLabel>Who can see it</FieldLabel>
      <View style={s.chips}>
        <Chip kind={scope} label="Course Connect" active={audience === 'course'} onPress={() => setAudience('course')} />
        <Chip kind={scope} label="Campus Connect" active={audience === 'campus'} onPress={() => setAudience('campus')} />
      </View>
      <Text style={[s.help, { color: colors.textSecondary }]}>
        {audience === 'course'
          ? 'Everyone on Course Connect across Ireland.'
          : hasCampus ? 'Only people in your own campus community.' : 'Add your campus in Settings to share here.'}
      </Text>

      {type === 'note' && (
        <>
          <FieldLabel>Title</FieldLabel>
          <TextInput value={title} onChangeText={setTitle} placeholder="For example, Week 7 summary" placeholderTextColor={ph} style={input} maxLength={120} accessibilityLabel="Title" />
        </>
      )}
      <FieldLabel>Subject</FieldLabel>
      <TextInput value={subject} onChangeText={setSubject} placeholder="For example, Consumer Behaviour" placeholderTextColor={ph} style={input} maxLength={80} accessibilityLabel="Subject" />
      <FieldLabel>Course or programme</FieldLabel>
      <TextInput value={course} onChangeText={setCourse} placeholder="For example, Business and Marketing" placeholderTextColor={ph} style={input} maxLength={80} accessibilityLabel="Course or programme" />
      <FieldLabel>Module (optional)</FieldLabel>
      <TextInput value={module} onChangeText={setModule} placeholder="For example, MG4021" placeholderTextColor={ph} style={input} maxLength={60} accessibilityLabel="Module" />

      {type === 'note' ? (
        <>
          <FieldLabel>Year of study</FieldLabel>
          <View style={s.chips}>
            {YEARS.map(y => <Chip key={y} kind={scope} label={y} active={year === y} onPress={() => setYear(y)} />)}
          </View>
        </>
      ) : (
        <>
          <FieldLabel>Exam year</FieldLabel>
          <TextInput value={year} onChangeText={setYear} placeholder="For example, 2023" placeholderTextColor={ph} style={input} maxLength={9} keyboardType="numbers-and-punctuation" accessibilityLabel="Exam year" />
          <FieldLabel>Exam session</FieldLabel>
          <View style={s.chips}>
            {SESSIONS.map(x => <Chip key={x} kind={scope} label={x} active={session === x} onPress={() => setSession(x)} />)}
          </View>
        </>
      )}

      <FieldLabel>Description (optional)</FieldLabel>
      <TextInput value={description} onChangeText={setDescription} placeholder="One or two lines on what is inside" placeholderTextColor={ph}
        style={[...input, { minHeight: 80, textAlignVertical: 'top' }]} multiline maxLength={600} accessibilityLabel="Description" />

      {format === 'link' ? (
        <>
          <FieldLabel>Web address</FieldLabel>
          <TextInput value={link} onChangeText={setLink} placeholder="https://" placeholderTextColor={ph} style={input}
            autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={500} accessibilityLabel="Web address" />
          <Text style={[s.help, { color: colors.textSecondary }]}>Only share links you are happy for others to open. Links must start with https.</Text>
        </>
      ) : (
        <>
          <FieldLabel>File</FieldLabel>
          {asset ? (
            <View style={[s.picked, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FileText size={18} color={accent} strokeWidth={1.8} />
              <Text style={[s.pickedName, { color: colors.textPrimary }]} numberOfLines={1}>{asset.name}</Text>
              <TouchableOpacity onPress={() => setAsset(null)} accessibilityRole="button" accessibilityLabel="Remove file" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={colors.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pick} activeOpacity={0.85} accessibilityRole="button" style={[s.pick, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Upload size={18} color={accent} strokeWidth={1.8} />
              <Text style={[s.pickText, { color: colors.textPrimary }]}>Choose a file</Text>
            </TouchableOpacity>
          )}
          <Text style={[s.help, { color: colors.textSecondary }]}>{FILE_HELP}</Text>
        </>
      )}

      {!!error && <Text style={[s.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text>}

      <PrimaryButton label={busy ? 'Saving' : (suggest ? 'Send suggestion' : 'Share')} Icon={busy ? undefined : (format === 'link' ? Link2 : Check)} onPress={submit} disabled={busy} style={{ marginBottom: 12 }} />
      {busy && <ActivityIndicator color={colors.textPrimary} style={{ marginBottom: 12 }} />}
    </Sheet>
  )
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.sans, fontSize: 16 },
  help: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 8 },
  pick: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 18 },
  pickText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  pickedName: { flex: 1, fontFamily: fonts.sans, fontSize: 14 },
  error: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 20, marginTop: 14 },
})
