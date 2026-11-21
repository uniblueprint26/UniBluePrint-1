import { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Plus, Smartphone, Info, ChevronRight, Trash2 } from 'lucide-react-native'
import { ToolScreen, Card, Eyebrow, H2, Body, Btn, Chip, Field, FormSheet } from '../../components/explore/ToolBits'
import { useLocalList, newId } from '../../lib/explore/localStore'
import {
  DEFAULT_BANDS, BAND_ORDER, bandFor, bandMeta, num, overall, pendingModules, neededFor, neededWords, round1,
} from '../../lib/explore/grades'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Grade calculator. Overall result first, then what the next exam must score,
// then the modules behind it. A member can keep as many calculators as they
// like (one per year, one per course). Everything stays on this phone.

const TARGETS = [
  { key: 'third', label: 'Pass' },
  { key: 'h22', label: '2:2' },
  { key: 'h21', label: '2:1' },
  { key: 'first', label: 'First' },
]

function blankCalc(name) {
  return { id: newId('calc'), name, totalCredits: '60', target: 'h21', bands: { ...DEFAULT_BANDS }, modules: [] }
}

export default function GradeCalculatorScreen({ navigation }) {
  const { colors } = useTheme()
  const [calcs, setCalcs, loaded] = useLocalList('grade_calcs')
  const [selectedId, setSelectedId] = useState(null)
  const [newName, setNewName] = useState('')
  const [moduleDraft, setModuleDraft] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (loaded && calcs.length > 0 && !calcs.some(c => c.id === selectedId)) setSelectedId(calcs[0].id)
  }, [loaded, calcs, selectedId])

  const calc = calcs.find(c => c.id === selectedId) || null

  function patchCalc(patch) {
    setCalcs(list => list.map(c => (c.id === selectedId ? { ...c, ...patch } : c)))
  }

  function createCalc() {
    const name = newName.trim() || `Calculator ${calcs.length + 1}`
    const c = blankCalc(name)
    setCalcs(list => [...list, c])
    setSelectedId(c.id)
    setNewName('')
  }

  function removeCalc() {
    setCalcs(list => list.filter(c => c.id !== selectedId))
    setSelectedId(null)
    setShowSettings(false)
  }

  function saveModule() {
    const d = moduleDraft
    if (!d || !d.name.trim() || !(num(d.credits) > 0)) return
    const clean = {
      id: d.id || newId('mod'),
      name: d.name.trim(),
      credits: String(num(d.credits)),
      pending: !!d.pending,
      grade: d.pending ? null : num(d.grade),
      cwWeight: d.pending ? num(d.cwWeight) : null,
      cwScore: d.pending ? num(d.cwScore) : null,
    }
    patchCalc({
      modules: d.id
        ? calc.modules.map(m => (m.id === d.id ? clean : m))
        : [...calc.modules, clean],
    })
    setModuleDraft(null)
  }

  function removeModule(id) {
    patchCalc({ modules: calc.modules.filter(m => m.id !== id) })
    setModuleDraft(null)
  }

  const bands = calc ? { ...DEFAULT_BANDS, ...calc.bands } : DEFAULT_BANDS
  const result = useMemo(() => (calc ? overall(calc.modules) : { credits: 0, avg: null }), [calc])
  const band = bandFor(result.avg, bands)
  const pend = calc ? pendingModules(calc.modules) : []
  const targetPct = calc ? bands[calc.target] : null
  const targetLabel = TARGETS.find(t => t.key === calc?.target)?.label

  return (
    <ToolScreen navigation={navigation} title="Grade calculator">
      <View style={s.saved}>
        <Smartphone size={14} color={colors.textSecondary} strokeWidth={1.8} />
        <Text style={[s.savedText, { color: colors.textSecondary }]}>Saved on this phone. For college modules.</Text>
      </View>

      {loaded && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} style={s.chipScroll}>
          {calcs.map(c => (
            <Chip key={c.id} label={c.name} active={c.id === selectedId} onPress={() => { setSelectedId(c.id); setShowSettings(false) }} />
          ))}
          {calcs.length > 0 && (
            <Chip label="New calculator" onPress={() => setSelectedId('__new')} />
          )}
        </ScrollView>
      )}

      {loaded && (!calc || selectedId === '__new') && (
        <Card style={{ marginTop: 14 }}>
          <H2>{calcs.length === 0 ? 'Make your first calculator' : 'New calculator'}</H2>
          <Body secondary style={{ marginTop: 6 }}>
            Give it a name, like Year 2 or Semester 1. You can keep as many as you like.
          </Body>
          <Field label="Name" value={newName} onChangeText={setNewName} placeholder="Year 2" maxLength={40} />
          <Btn label="Create calculator" onPress={createCalc} Icon={Plus} style={{ marginTop: 18 }} />
        </Card>
      )}

      {calc && selectedId !== '__new' && (
        <>
          {/* Overall */}
          <Card style={{ marginTop: 14 }}>
            <Eyebrow>Overall so far</Eyebrow>
            <View style={s.overallRow}>
              <Text style={[s.big, { color: colors.textPrimary }]} accessibilityLabel={result.avg == null ? 'No result yet' : `${round1(result.avg)} percent`}>
                {result.avg == null ? '--' : round1(result.avg)}
                <Text style={s.bigUnit}>%</Text>
              </Text>
              {!!band && (
                <View style={s.bandRight}>
                  <Text style={[s.bandName, { color: colors.textPrimary }]}>{bandMeta(band).label}</Text>
                  <Text style={[s.bandLong, { color: colors.textSecondary }]}>{bandMeta(band).long}</Text>
                </View>
              )}
            </View>
            <BandScale active={band} />
            <View style={s.infoRow}>
              <Info size={16} color={colors.textSecondary} strokeWidth={1.8} style={{ marginTop: 2 }} />
              <Text style={[s.infoText, { color: colors.textSecondary }]}>
                {result.credits} of {num(calc.totalCredits) || 0} credits entered. Typical bands. Your college's own rules come first.
              </Text>
            </View>
          </Card>

          {/* What do I need */}
          <View style={[s.need, { backgroundColor: colors.accentBg }]}>
            <Text style={[s.needEyebrow, { color: colors.accentFg }]}>WHAT DO I NEED</Text>
            <View style={s.needChips}>
              {TARGETS.map(t => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => patchCalc({ target: t.key })}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: calc.target === t.key }}
                  accessibilityLabel={`Aim for ${t.label}`}
                  style={[s.needChip, { borderColor: colors.accentFg, backgroundColor: calc.target === t.key ? colors.accentFg : 'transparent' }]}
                >
                  <Text style={[s.needChipText, { color: calc.target === t.key ? colors.accentBg : colors.accentFg }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <NeedLine calc={calc} pend={pend} targetPct={targetPct} targetLabel={targetLabel} accentFg={colors.accentFg} />
          </View>

          {/* Modules */}
          <View style={s.modHead}>
            <H2>Modules</H2>
            <Btn
              label="Add"
              kind="secondary"
              Icon={Plus}
              onPress={() => setModuleDraft({ name: '', credits: '5', grade: '', pending: false, cwWeight: '', cwScore: '' })}
              style={{ minHeight: 40, paddingHorizontal: 14 }}
            />
          </View>
          {calc.modules.length === 0 ? (
            <Card>
              <Body secondary>No modules yet. Add one with its credits and the percent you got. If an exam is still to come, say so and add what you have scored so far.</Body>
            </Card>
          ) : (
            <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {calc.modules.map((m, i) => (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.75}
                  onPress={() => setModuleDraft({ ...m, credits: String(m.credits), grade: m.grade == null ? '' : String(m.grade), cwWeight: m.cwWeight == null ? '' : String(m.cwWeight), cwScore: m.cwScore == null ? '' : String(m.cwScore) })}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${m.name}`}
                  style={[s.modRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.modName, { color: colors.textPrimary }]} numberOfLines={2}>{m.name}</Text>
                    <Text style={[s.modSub, { color: colors.textSecondary }]}>{m.credits} credits</Text>
                  </View>
                  <Text style={[m.pending ? s.modPending : s.modGrade, { color: m.pending ? colors.textSecondary : colors.textPrimary }]}>
                    {m.pending ? 'Exam to come' : m.grade == null ? 'No grade' : `${round1(m.grade)}%`}
                  </Text>
                  <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Key numbers */}
          <TouchableOpacity
            onPress={() => setShowSettings(v => !v)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: showSettings }}
            style={s.settingsToggle}
          >
            <Text style={[s.settingsToggleText, { color: colors.textPrimary }]}>{showSettings ? 'Hide key numbers' : 'Edit key numbers'}</Text>
          </TouchableOpacity>
          {showSettings && (
            <Card>
              <Field label="Name" value={calc.name} onChangeText={t => patchCalc({ name: t })} maxLength={40} style={{ marginTop: 0 }} />
              <Field label="Total credits this calculator covers" value={String(calc.totalCredits ?? '')} onChangeText={t => patchCalc({ totalCredits: t.replace(/[^0-9.]/g, '') })} keyboardType="numeric" />
              <Text style={[s.bandsTitle, { color: colors.textSecondary }]}>Lowest percent for each band</Text>
              <View style={s.bandInputs}>
                {[['third', 'Third'], ['h22', '2:2'], ['h21', '2:1'], ['first', 'First']].map(([k, label]) => (
                  <View key={k} style={{ flex: 1 }}>
                    <Field
                      label={label}
                      value={String(bands[k] ?? '')}
                      onChangeText={t => patchCalc({ bands: { ...bands, [k]: num(t.replace(/[^0-9.]/g, '')) ?? '' } })}
                      keyboardType="numeric"
                      style={{ marginTop: 8 }}
                    />
                  </View>
                ))}
              </View>
              <Btn label="Reset bands" kind="quiet" onPress={() => patchCalc({ bands: { ...DEFAULT_BANDS } })} style={{ marginTop: 6, alignSelf: 'flex-start' }} />
              <Btn label="Delete this calculator" kind="quiet" Icon={Trash2} onPress={removeCalc} style={{ alignSelf: 'flex-start' }} />
            </Card>
          )}
        </>
      )}

      <FormSheet visible={!!moduleDraft} onClose={() => setModuleDraft(null)} title={moduleDraft?.id ? 'Edit module' : 'Add a module'}>
        {!!moduleDraft && (
          <View>
            <Field label="Module name" value={moduleDraft.name} onChangeText={t => setModuleDraft({ ...moduleDraft, name: t })} placeholder="Module name" maxLength={60} />
            <Field label="Credits" value={moduleDraft.credits} onChangeText={t => setModuleDraft({ ...moduleDraft, credits: t.replace(/[^0-9.]/g, '') })} keyboardType="numeric" />
            <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Result</Text>
            <View style={s.chipRowInline}>
              <Chip label="I have my result" active={!moduleDraft.pending} onPress={() => setModuleDraft({ ...moduleDraft, pending: false })} />
              <Chip label="Exam still to come" active={!!moduleDraft.pending} onPress={() => setModuleDraft({ ...moduleDraft, pending: true })} />
            </View>
            {moduleDraft.pending ? (
              <>
                <Field label="Coursework counts for (percent)" value={moduleDraft.cwWeight} onChangeText={t => setModuleDraft({ ...moduleDraft, cwWeight: t.replace(/[^0-9.]/g, '') })} keyboardType="numeric" placeholder="40" hint="The exam counts for the rest." />
                <Field label="Coursework score so far (percent)" value={moduleDraft.cwScore} onChangeText={t => setModuleDraft({ ...moduleDraft, cwScore: t.replace(/[^0-9.]/g, '') })} keyboardType="numeric" placeholder="58" />
              </>
            ) : (
              <Field label="Final grade (percent)" value={moduleDraft.grade} onChangeText={t => setModuleDraft({ ...moduleDraft, grade: t.replace(/[^0-9.]/g, '') })} keyboardType="numeric" placeholder="58" />
            )}
            <Btn label="Save module" onPress={saveModule} disabled={!moduleDraft.name.trim() || !(num(moduleDraft.credits) > 0)} style={{ marginTop: 20 }} />
            {!!moduleDraft.id && <Btn label="Delete module" kind="quiet" onPress={() => removeModule(moduleDraft.id)} style={{ marginTop: 4 }} />}
          </View>
        )}
      </FormSheet>
    </ToolScreen>
  )
}

function NeedLine({ calc, pend, targetPct, targetLabel, accentFg }) {
  if (pend.length === 0) {
    return (
      <Text style={[s.needText, { color: accentFg }]}>
        Add a module with an exam still to come and this will say what it must score.
      </Text>
    )
  }
  const next = pend[0]
  const r = neededFor(calc.modules, next, targetPct)
  const w = neededWords(r?.needExam ?? r?.needFinal)
  if (!r || !w) return null
  const what = r.needExam != null ? `in the ${next.name} exam` : `overall in ${next.name}`
  return (
    <>
      {w.tone === 'ok' ? (
        <Text style={[s.needText, { color: accentFg }]}>
          To reach a {targetLabel}, you need <Text style={s.needStrong}>{w.text}</Text> {what}.
        </Text>
      ) : (
        <Text style={[s.needText, { color: accentFg }]}>{w.text}</Text>
      )}
      <Text style={[s.needSmall, { color: accentFg }]}>
        Worked out on the credits you have entered plus this module.
      </Text>
    </>
  )
}

function BandScale({ active }) {
  const { colors } = useTheme()
  return (
    <View style={s.scale} accessible accessibilityLabel={`Band scale. You are in ${active ? bandMeta(active).label : 'no band yet'}`}>
      {BAND_ORDER.map(b => (
        <View key={b.key} style={{ flex: 1, alignItems: 'center' }}>
          <View style={[s.seg, { backgroundColor: b.key === active ? colors.textPrimary : colors.tabFill }]} />
          <Text style={[s.segLabel, { color: b.key === active ? colors.textPrimary : colors.textSecondary, fontFamily: b.key === active ? fonts.sansSemiBold : fonts.sansMedium }]}>{b.label}</Text>
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  saved: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, marginTop: -6 },
  savedText: { fontFamily: fonts.sans, fontSize: 14 },
  chipScroll: { marginHorizontal: -16, marginTop: 16 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chipRowInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overallRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  big: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 60 },
  bigUnit: { fontSize: 22 },
  bandRight: { alignItems: 'flex-end', flexShrink: 1, paddingBottom: 6 },
  bandName: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  bandLong: { fontFamily: fonts.sans, fontSize: 13, textAlign: 'right', marginTop: 2 },
  scale: { flexDirection: 'row', gap: 8, marginTop: 14 },
  seg: { height: 8, borderRadius: 4, alignSelf: 'stretch' },
  segLabel: { fontSize: 12.5, marginTop: 8 },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  infoText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20 },

  need: { borderRadius: 18, padding: 20, marginTop: 16 },
  needEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1.1, opacity: 0.75 },
  needChips: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  needChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  needChipText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },
  needText: { fontFamily: fonts.sans, fontSize: 18, lineHeight: 27, marginTop: 16 },
  needStrong: { fontFamily: fonts.sansBold },
  needSmall: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 10, opacity: 0.75 },

  modHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 12 },
  list: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, minHeight: 64 },
  modName: { fontFamily: fonts.sansSemiBold, fontSize: 15.5 },
  modSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  modGrade: { fontFamily: fonts.sansBold, fontSize: 17 },
  modPending: { fontFamily: fonts.sansMedium, fontSize: 13 },

  settingsToggle: { alignSelf: 'flex-start', paddingVertical: 14, marginTop: 8 },
  settingsToggleText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, textDecorationLine: 'underline' },
  bandsTitle: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 18 },
  bandInputs: { flexDirection: 'row', gap: 8 },
  fieldLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 16, marginBottom: 8 },
})
