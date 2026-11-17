import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FileText, Plus, Check, ChevronRight } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { openInHomeStack } from '../../navigation/helpers'
import { CAREER_SERVICES } from '../../screens/FoundationScreen'

// "Your goals": one closed folder per Foundation Blueprint service (the real
// list, read from FoundationScreen), then your own goals, then an "Add your
// own" tile. Your own goals live in public.user_goals; if that table can't be
// reached they fall back to AsyncStorage keyed per user so the feature still
// works.

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

function useCustomGoals(userId) {
  const [goals, setGoals] = useState([])
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
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('source', 'custom')
          .order('created_at', { ascending: true })
        if (error) throw error
        localMode.current = false
        if (!cancelled) setGoals(data || [])
      } catch {
        localMode.current = true
        const local = await readLocal()
        if (!cancelled) setGoals(local)
      }
    })()
    return () => { cancelled = true }
  }, [userId, readLocal])

  const add = useCallback(async title => {
    const row = {
      id: `local-${Date.now()}`, user_id: userId, title, source: 'custom',
      service_key: null, done: false, created_at: new Date().toISOString(),
    }
    if (!localMode.current) {
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .insert({ user_id: userId, title, source: 'custom' })
          .select('*')
          .single()
        if (error) throw error
        setGoals(prev => [...prev, data])
        return
      } catch { localMode.current = true }
    }
    setGoals(prev => { const next = [...prev, row]; writeLocal(next); return next })
  }, [userId, writeLocal])

  const toggle = useCallback(async goal => {
    const done = !goal.done
    setGoals(prev => {
      const next = prev.map(g => g.id === goal.id ? { ...g, done } : g)
      if (localMode.current) writeLocal(next)
      return next
    })
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
    if (!localMode.current && !String(goal.id).startsWith('local-')) {
      try {
        const { error } = await supabase.from('user_goals').delete().eq('id', goal.id).eq('user_id', userId)
        if (error) throw error
      } catch { setGoals(prevGoals) }
    }
  }, [goals, userId, writeLocal])

  return { goals, add, toggle, remove }
}

// ── folder tile ──────────────────────────────────────────────────────────────

function FolderTile({ title, width, done, onPress, onLongPress, checkable, label, colors, s }) {
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
          {checkable && (
            <View style={[s.tick, done && s.tickDone]}>
              {done && <Check size={12} color={colors.accentFg} strokeWidth={3} />}
            </View>
          )}
        </View>
        <Text style={[s.tileTitle, done && s.tileTitleDone]} numberOfLines={2}>{title}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ── the section ──────────────────────────────────────────────────────────────

export default function GoalsGrid({ navigation, userId }) {
  const { colors, isDark } = useTheme()
  const s = getStyles(colors, isDark)
  const { goals, add, toggle, remove } = useCustomGoals(userId)
  const [gridWidth, setGridWidth] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const tileWidth = gridWidth > 0 ? Math.floor((gridWidth - GAP * (COLS - 1)) / COLS) : 100

  function openFoundation() { navigation.navigate('Foundation') }

  async function save() {
    const title = draft.trim()
    if (!title) return
    setSheetOpen(false)
    setDraft('')
    await add(title)
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
      <Text style={s.heading}>Your goals</Text>
      <Text style={s.sub}>Recommended by UBP</Text>

      <View style={s.grid} onLayout={e => setGridWidth(e.nativeEvent.layout.width)}>
        {FOUNDATION_TILES.map(t => (
          <FolderTile
            key={t.key} title={t.title} width={tileWidth}
            label={`${t.title}, open Foundation Blueprint`}
            onPress={openFoundation} colors={colors} s={s}
          />
        ))}
        {goals.map(g => (
          <FolderTile
            key={g.id} title={g.title} width={tileWidth} done={g.done} checkable
            label={`${g.title}, ${g.done ? 'done' : 'not done'}. Tap to change. Hold to remove.`}
            onPress={() => toggle(g)} onLongPress={() => confirmRemove(g)} colors={colors} s={s}
          />
        ))}
      </View>

      <TouchableOpacity
        style={s.addTile}
        activeOpacity={0.8}
        onPress={() => setSheetOpen(true)}
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

      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={s.backdrop} onPress={() => setSheetOpen(false)}>
            <Pressable style={s.sheet} onPress={() => {}}>
              <View style={s.grabber} />
              <Text style={s.sheetTitle}>Add your own goal</Text>
              <Text style={s.sheetHint}>Something you want to get done this term.</Text>
              <TextInput
                style={s.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="For example: Finish my dissertation outline"
                placeholderTextColor={colors.textTertiary}
                maxLength={80}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={save}
                accessibilityLabel="Goal"
              />
              <TouchableOpacity
                style={[s.saveBtn, !draft.trim() && { opacity: 0.4 }]}
                activeOpacity={0.85}
                disabled={!draft.trim()}
                onPress={save}
                accessibilityRole="button"
                accessibilityLabel="Save goal"
              >
                <Text style={s.saveText}>Save</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
    saveBtn: {
      marginTop: 16, backgroundColor: colors.accentBg, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', height: 50,
    },
    saveText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  })
}
