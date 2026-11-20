import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, Switch, ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FileText, Plus, Check, ChevronRight, Bell } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { publishGoals } from './personalStats'
import { openInHomeStack } from '../../navigation/helpers'
import { CAREER_SERVICES } from '../../screens/FoundationScreen'
import { useFoundationEnabled } from '../../hooks/useAppFlags'
import { REMIND_OPTIONS, syncGoalReminder, cancelGoalReminder } from './goalReminders'

// "Your goals": one closed folder per Foundation Blueprint service (the real
// list, read from FoundationScreen), then your own goals, then an "Add your
// own" tile. Goals live in public.user_goals; if that table can't be reached
// they fall back to AsyncStorage keyed per user so the feature still works.
//
// Adding a goal (your own, or a Foundation tile) also asks how often to remind
// you, what the reminder should say, and whether we may send notifications for
// it. Those answers are saved as remind_every ('daily' | 'weekly' | 'monthly' |
// null), remind_message (up to 140 characters) and remind_ok (boolean), in
// user_goals or in the AsyncStorage fallback, and honoured by a local
// notification (see goalReminders.js).

// Short tile names for the service titles in FoundationScreen.
const SHORT_TITLES = {
  'CV Optimisation': 'CV',
  'Portfolio Building': 'Portfolio',
  'LinkedIn Optimisation': 'LinkedIn',
  'Cover Letter Assistance': 'Cover letter',
  'Personal Statement': 'Personal statement',
  'Application Form Assistance': 'Application forms',
  'Interview Preparation': 'Interview prep',
  'Job Search Support': 'Job search',
}

const FOUNDATION_TILES = CAREER_SERVICES.map(svc => ({
  key: svc.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
  title: SHORT_TITLES[svc.title] || svc.title,
}))

const GAP = 10
const COLS = 3

const storageKey = userId => `ubp_user_goals_${userId}`

// ── data: user_goals with an AsyncStorage fallback ──────────────────────────

const REMIND_FIELDS = ['remind_every', 'remind_message', 'remind_ok']

function stripRemind(fields) {
  const out = { ...fields }
  REMIND_FIELDS.forEach(f => delete out[f])
  return out
}

// Goals for this user: your own ('custom') and Foundation services you chose to
// make a goal ('foundation', with service_key).
function useGoals(userId) {
  const [goals, setGoals] = useState([])
  const [ready, setReady] = useState(false)
  const localMode = useRef(false)

  const readLocal = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey(userId))
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }, [userId])

  const writeLocal = useCallback(async next => {
    try { await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)) } catch {}
  }, [userId])

  useEffect(() => {
    if (!userId) { setGoals([]); return }
    let cancelled = false
    ;(async () => {
      let rows
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .in('source', ['custom', 'foundation'])
          .order('created_at', { ascending: true })
        if (error) throw error
        localMode.current = false
        rows = data || []
      } catch {
        localMode.current = true
        rows = await readLocal()
      }
      if (cancelled) return
      setGoals(rows)
      setReady(true)
      // Keep local reminders in step with what is saved (phones only).
      rows.forEach(g => { if (g.remind_ok && g.remind_every) syncGoalReminder(g) })
    })()
    return () => { cancelled = true }
  }, [userId, readLocal])

  // fields: { title, source, service_key, remind_every, remind_message, remind_ok }
  const add = useCallback(async fields => {
    const base = { user_id: userId, source: 'custom', service_key: null, ...fields }
    let saved = null
    if (!localMode.current) {
      try {
        let res = await supabase.from('user_goals').insert(base).select('*').single()
        // The reminder columns arrive with a database update. If they are not
        // there yet, save the goal without them rather than lose it.
        if (res.error) res = await supabase.from('user_goals').insert(stripRemind(base)).select('*').single()
        if (res.error) throw res.error
        saved = { ...base, ...res.data }
      } catch { localMode.current = true }
    }
    if (!saved) {
      saved = { id: `local-${Date.now()}`, done: false, created_at: new Date().toISOString(), ...base }
      setGoals(prev => { const next = [...prev, saved]; writeLocal(next); return next })
    } else {
      setGoals(prev => [...prev, saved])
    }
    syncGoalReminder(saved)
    return saved
  }, [userId, writeLocal])

  // Change a goal's reminder choices (or title).
  const update = useCallback(async (goal, patch) => {
    const merged = { ...goal, ...patch }
    setGoals(prev => {
      const next = prev.map(g => g.id === goal.id ? merged : g)
      if (localMode.current) writeLocal(next)
      return next
    })
    if (!localMode.current && !String(goal.id).startsWith('local-')) {
      try {
        const { error } = await supabase.from('user_goals').update(patch).eq('id', goal.id).eq('user_id', userId)
        if (error) throw error
      } catch { /* kept on screen; saved for real once the database has the columns */ }
    }
    syncGoalReminder(merged)
  }, [userId, writeLocal])

  const toggle = useCallback(async goal => {
    const done = !goal.done
    setGoals(prev => {
      const next = prev.map(g => g.id === goal.id ? { ...g, done } : g)
      if (localMode.current) writeLocal(next)
      return next
    })
    syncGoalReminder({ ...goal, done })
    if (!localMode.current && !String(goal.id).startsWith('local-')) {
      try {
        const { error } = await supabase.from('user_goals').update({ done }).eq('id', goal.id).eq('user_id', userId)
        if (error) throw error
      } catch {
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, done: !done } : g))
      }
    }
  }, [userId, writeLocal])

  const remove = useCallback(async goal => {
    const prevGoals = goals
    setGoals(prev => {
      const next = prev.filter(g => g.id !== goal.id)
      if (localMode.current) writeLocal(next)
      return next
    })
    cancelGoalReminder(goal.id)
    if (!localMode.current && !String(goal.id).startsWith('local-')) {
      try {
        const { error } = await supabase.from('user_goals').delete().eq('id', goal.id).eq('user_id', userId)
        if (error) throw error
      } catch { setGoals(prevGoals) }
    }
  }, [goals, userId, writeLocal])

  // Tell Today's Digest what changed so its goals count stays in step.
  useEffect(() => { if (userId && ready) publishGoals(goals) }, [goals, userId, ready])

  return { goals, add, update, toggle, remove }
}

// ── folder tile ──────────────────────────────────────────────────────────────

function FolderTile({ title, width, done, onPress, onLongPress, checkable, added, reminding, label, colors, s }) {
  return (
    <TouchableOpacity
      style={[s.tileWrap, { width }, done && { opacity: 0.6 }]}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={checkable ? 'checkbox' : 'button'}
      accessibilityState={checkable ? { checked: !!done } : undefined}
      accessibilityLabel={label || title}
    >
      <View style={s.folderTab} />
      <View style={s.folderBody}>
        <View style={s.topRow}>
          <View style={s.iconChip}>
            <FileText size={15} color={colors.textPrimary} strokeWidth={1.8} />
          </View>
          <View style={s.topRight}>
            {reminding && <Bell size={13} color={colors.textSecondary} strokeWidth={2} />}
            {checkable && (
              <View style={[s.tick, done && s.tickDone]}>
                {done && <Check size={12} color={colors.accentFg} strokeWidth={3} />}
              </View>
            )}
            {added && !checkable && (
              <View style={[s.tick, s.tickDone]}>
                <Check size={12} color={colors.accentFg} strokeWidth={3} />
              </View>
            )}
          </View>
        </View>
        <Text style={[s.tileTitle, done && s.tileTitleDone]} numberOfLines={2}>{title}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ── the section ──────────────────────────────────────────────────────────────

function GoalSheet({ target, name, onClose, onSave, onOpenFoundation, onRemove, colors, s }) {
  const goal = target?.goal || null
  const isFoundation = target?.kind === 'foundation'
  const [title, setTitle] = useState('')
  const [every, setEvery] = useState('weekly')
  const [message, setMessage] = useState('')
  const [ok, setOk] = useState(false)

  // Reset the form each time the sheet opens on a different goal.
  useEffect(() => {
    if (!target) return
    const g = target.goal
    setTitle(g?.title || target.title || '')
    setEvery(g ? (g.remind_every || 'never') : 'weekly')
    setMessage(g?.remind_message || '')
    setOk(!!g?.remind_ok)
  }, [target])

  if (!target) return null
  const editing = !!goal
  const reminding = every !== 'never'
  const canSave = title.trim().length > 0

  function save() {
    if (!canSave) return
    onSave({
      title: title.trim(),
      remind_every: reminding ? every : null,
      remind_message: reminding && message.trim() ? message.trim() : null,
      remind_ok: reminding && ok,
    })
  }

  const heading = isFoundation
    ? (editing ? `Your ${target.title} goal` : `Make ${target.title} a goal`)
    : (editing ? 'Edit your goal' : 'Add your own goal')

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.backdrop} onPress={onClose}>
          <Pressable style={s.sheet} onPress={e => e.stopPropagation?.()}>
            <View style={s.grabber} />
            <ScrollView style={{ maxHeight: 620 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>{heading}</Text>
              {isFoundation ? (
                <TouchableOpacity onPress={onOpenFoundation} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Open ${target.title} in Foundation Blueprint`}>
                  <Text style={s.sheetLink}>{`Open ${target.title} in Foundation`}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={s.sheetHint}>Something you want to get done this term.</Text>
              )}

              {!isFoundation && (
                <TextInput
                  style={s.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="For example: Finish my dissertation outline"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={80}
                  autoFocus={!editing}
                  returnKeyType="done"
                  accessibilityLabel="Goal"
                />
              )}

              <Text style={s.fieldLabel}>{name ? `${name}, how often would you like a reminder?` : 'How often would you like a reminder?'}</Text>
              <View style={s.chipRow}>
                {REMIND_OPTIONS.map(o => {
                  const active = every === o.key
                  return (
                    <TouchableOpacity
                      key={o.key}
                      style={[s.chip, active && s.chipActive]}
                      activeOpacity={0.8}
                      onPress={() => setEvery(o.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Remind me ${o.label.toLowerCase()}`}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {reminding && (
                <>
                  <Text style={s.fieldLabel}>What should the reminder say? <Text style={s.optional}>Optional</Text></Text>
                  <TextInput
                    style={[s.input, s.inputMulti]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="For example: Ten minutes on this today. You've got it."
                    placeholderTextColor={colors.textTertiary}
                    maxLength={140}
                    multiline
                    accessibilityLabel="What should the reminder say"
                  />
                  <Text style={s.counter}>{message.length}/140</Text>

                  <View style={s.okRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.okTitle}>OK to send me notifications for this</Text>
                      <Text style={s.okSub}>We only message you about this goal. You can change this any time.</Text>
                    </View>
                    <Switch
                      value={ok}
                      onValueChange={setOk}
                      trackColor={{ false: colors.border, true: "#3F9B6B" }}
                      activeThumbColor="#FFFFFF"
                      thumbColor="#FFFFFF"
                      accessibilityLabel="OK to send me notifications for this goal"
                    />
                  </View>
                  {!ok && <Text style={s.okNote}>Switch this on and we will send the reminder. Otherwise it stays off.</Text>}
                </>
              )}

              <TouchableOpacity
                style={[s.saveBtn, !canSave && { opacity: 0.4 }]}
                activeOpacity={0.85}
                disabled={!canSave}
                onPress={save}
                accessibilityRole="button"
                accessibilityLabel="Save goal"
              >
                <Text style={s.saveText}>{editing ? 'Save changes' : 'Save goal'}</Text>
              </TouchableOpacity>
              {editing && isFoundation && (
                <TouchableOpacity style={s.removeBtn} onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove this goal">
                  <Text style={s.removeText}>Remove this goal</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function GoalsGrid({ navigation, userId, name }) {
  const { colors, isDark } = useTheme()
  const s = getStyles(colors, isDark)
  const { goals, add, update, toggle, remove } = useGoals(userId)
  // The recommended Foundation folders only show once Foundation is open.
  const { enabled: foundationOpen } = useFoundationEnabled()
  const foundationTiles = foundationOpen ? FOUNDATION_TILES : []
  const [gridWidth, setGridWidth] = useState(0)
  const [target, setTarget] = useState(null) // { kind: 'custom' | 'foundation', title?, key?, goal? }

  const tileWidth = gridWidth > 0 ? Math.floor((gridWidth - GAP * (COLS - 1)) / COLS) : 100

  const customGoals = goals.filter(g => g.source !== 'foundation')
  const foundationGoal = key => goals.find(g => g.source === 'foundation' && g.service_key === key)

  async function handleSave(fields) {
    const t = target
    setTarget(null)
    if (t.goal) { await update(t.goal, fields); return }
    if (t.kind === 'foundation') {
      await add({ ...fields, title: t.title, source: 'foundation', service_key: t.key })
    } else {
      await add({ ...fields, source: 'custom' })
    }
  }

  function confirmRemove(goal) {
    if (Platform.OS === 'web') { remove(goal); return }
    Alert.alert('Remove this goal?', goal.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(goal) },
    ])
  }

  return (
    <View style={s.section}>
      <Text style={[s.heading, foundationTiles.length === 0 && { marginBottom: 16 }]}>Your goals</Text>
      {foundationTiles.length > 0 && <Text style={s.sub}>Recommended by UBP</Text>}

      <View style={s.grid} onLayout={e => setGridWidth(e.nativeEvent.layout.width)}>
        {foundationTiles.map(t => {
          const g = foundationGoal(t.key)
          return (
            <FolderTile
              key={t.key} title={t.title} width={tileWidth} added={!!g} reminding={!!g?.remind_ok && !!g?.remind_every}
              label={g ? `${t.title}, one of your goals. Tap to change the reminder.` : `${t.title}. Tap to make it a goal.`}
              onPress={() => setTarget({ kind: 'foundation', title: t.title, key: t.key, goal: g || null })}
              colors={colors} s={s}
            />
          )
        })}
        {customGoals.map(g => (
          <FolderTile
            key={g.id} title={g.title} width={tileWidth} done={g.done} checkable reminding={!!g.remind_ok && !!g.remind_every}
            label={`${g.title}, ${g.done ? 'done' : 'not done'}. Tap to change. Hold to edit or remove.`}
            onPress={() => toggle(g)}
            onLongPress={() => (Platform.OS === 'web' ? setTarget({ kind: 'custom', goal: g }) : Alert.alert(g.title, undefined, [
              { text: 'Edit reminder', onPress: () => setTarget({ kind: 'custom', goal: g }) },
              { text: 'Remove', style: 'destructive', onPress: () => confirmRemove(g) },
              { text: 'Cancel', style: 'cancel' },
            ]))}
            colors={colors} s={s}
          />
        ))}
      </View>

      <TouchableOpacity
        style={s.addTile}
        activeOpacity={0.8}
        onPress={() => setTarget({ kind: 'custom' })}
        accessibilityRole="button"
        accessibilityLabel="Add your own goal"
      >
        <Plus size={18} color={colors.textPrimary} strokeWidth={2} />
        <Text style={s.addText}>Add your own</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.seeAll}
        activeOpacity={0.7}
        onPress={() => openInHomeStack(navigation, 'MyBlueprint')}
        accessibilityRole="button"
        accessibilityLabel="See everything in My Blueprint"
      >
        <Text style={s.seeAllText}>See everything in My Blueprint</Text>
        <ChevronRight size={15} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>

      <GoalSheet
        target={target}
        name={name}
        colors={colors}
        s={s}
        onClose={() => setTarget(null)}
        onSave={handleSave}
        onOpenFoundation={() => { setTarget(null); navigation.navigate('Foundation') }}
        onRemove={() => { const g = target?.goal; setTarget(null); if (g) remove(g) }}
      />
    </View>
  )
}

function getStyles(colors, isDark) {
  const folder = colors.surface
  const edge = colors.border
  return StyleSheet.create({
    section: { paddingHorizontal: 16 },
    heading: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
    sub: {
      fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.9, marginTop: 4, marginBottom: 16,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },

    tileWrap: { paddingTop: 8 },
    folderTab: {
      position: 'absolute', top: 0, left: 0, width: 44, height: 14,
      borderTopLeftRadius: 8, borderTopRightRadius: 8,
      backgroundColor: folder, borderWidth: 1, borderBottomWidth: 0, borderColor: edge,
    },
    folderBody: {
      minHeight: 84, backgroundColor: folder, borderRadius: 12, borderTopLeftRadius: 0,
      borderWidth: 1, borderColor: edge,
      paddingHorizontal: 11, paddingTop: 11, paddingBottom: 10, justifyContent: 'space-between',
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tick: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.textSecondary,
      alignItems: 'center', justifyContent: 'center',
    },
    tickDone: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
    iconChip: {
      width: 26, height: 26, borderRadius: 8, backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
    },
    tileTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, lineHeight: 16, color: colors.textPrimary, marginTop: 10 },
    tileTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },

    addTile: {
      marginTop: GAP + 2, height: 52, borderRadius: 12,
      borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textSecondary,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    addText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },

    seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 14 },
    seeAllText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSecondary },

    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
      paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30,
    },
    grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 16 },
    sheetTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
    sheetHint: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
    input: {
      fontFamily: fonts.sans, fontSize: 15.5, color: colors.textPrimary,
      backgroundColor: colors.background, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 13,
    },
    sheetLink: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textSecondary, textDecorationLine: 'underline', marginTop: 4, marginBottom: 6 },
    fieldLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary, marginTop: 22, marginBottom: 10 },
    optional: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: {
      flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
    chipText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary },
    chipTextActive: { color: colors.accentFg },
    inputMulti: { minHeight: 68, textAlignVertical: 'top' },
    counter: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSecondary, textAlign: 'right', marginTop: 6 },
    okRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14,
      backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    okTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
    okSub: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 3 },
    okNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
    removeBtn: { alignSelf: 'center', paddingVertical: 14 },
    removeText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textSecondary },
    saveBtn: {
      marginTop: 16, backgroundColor: colors.accentBg, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', height: 50,
    },
    saveText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  })
}
