import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, Pressable, Switch, ScrollView, StyleSheet, Alert, Platform } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { DAY_LABELS, formatHour } from '../../lib/notificationPrefs'
import { syncBudgetNudges } from '../../lib/budgetNudges'

// What the member wants to hear about, and when not to be disturbed.
// Every switch saves at once. Budget nudges are off until the member turns them on.
const GROUPS = [
  { key: 'pillar_alerts',    title: 'Across the app',   hint: 'Weekly Blueprint, campus events, savings goals, Foundation opening' },
  { key: 'interest_alerts',  title: 'Your interests',   hint: 'Deals and coaches that match what you picked' },
  { key: 'trending_alerts',  title: 'Trending',         hint: 'When your post, or one from someone you follow, takes off' },
  { key: 'following_alerts', title: 'People and partners you follow', hint: 'Posts, plus updates from partners and coaches' },
]

export default function NotificationPrefsSheet({ visible, onClose, userId, prefs, save, failed }) {
  const { colors } = useTheme()
  const s = getStyles(colors)
  const [note, setNote] = useState('')

  async function setNudges(on) {
    const next = { ...prefs, budget_nudges: on }
    await save({ budget_nudges: on })
    const result = await syncBudgetNudges(userId, next)
    if (on && result === 'denied') {
      setNote('Notifications are off for UniBlueprint on this phone. Turn them on in your phone settings to get nudges.')
    } else setNote('')
  }

  async function toggleDay(d) {
    const has = prefs.night_out_days.includes(d)
    const days = has ? prefs.night_out_days.filter(x => x !== d) : [...prefs.night_out_days, d].sort()
    await save({ night_out_days: days })
    if (prefs.budget_nudges) await syncBudgetNudges(userId, { ...prefs, night_out_days: days })
  }

  async function shiftQuiet(field, delta) {
    const v = (prefs[field] + delta + 24) % 24
    await save({ [field]: v })
    if (prefs.budget_nudges) await syncBudgetNudges(userId, { ...prefs, [field]: v })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation?.()}>
          <View style={s.grabber} />
          <Text style={s.title}>Notification choices</Text>
          <Text style={s.hint}>You choose what reaches you. Change it any time.</Text>

          <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
            <View style={s.card}>
              {GROUPS.map((g, i) => (
                <View key={g.key} style={[s.row, i > 0 && s.rowBorder]}>
                  <View style={s.rowText}>
                    <Text style={s.rowTitle}>{g.title}</Text>
                    <Text style={s.rowHint}>{g.hint}</Text>
                  </View>
                  <Switch
                    value={!!prefs[g.key]}
                    onValueChange={v => save({ [g.key]: v })}
                    trackColor={{ false: colors.border, true: '#3F9B6B' }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={g.title}
                  />
                </View>
              ))}
            </View>

            <Text style={s.sectionLabel}>Budget nudges</Text>
            <View style={s.card}>
              <View style={s.row}>
                <View style={s.rowText}>
                  <Text style={s.rowTitle}>A nudge on nights out</Text>
                  <Text style={s.rowHint}>A short, funny reminder using the budget you saved. It stays on this phone.</Text>
                </View>
                <Switch
                  value={!!prefs.budget_nudges}
                  onValueChange={setNudges}
                  trackColor={{ false: colors.border, true: '#3F9B6B' }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Budget nudges on nights out"
                />
              </View>
              {prefs.budget_nudges && (
                <View style={[s.rowBorder, { paddingVertical: 14, paddingHorizontal: 14 }]}>
                  <Text style={s.rowTitle}>Your nights out</Text>
                  <View style={s.days}>
                    {DAY_LABELS.map((label, d) => {
                      const on = prefs.night_out_days.includes(d)
                      return (
                        <TouchableOpacity
                          key={label}
                          onPress={() => toggleDay(d)}
                          style={[s.day, on && s.dayOn]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          accessibilityLabel={`${label} night out`}
                        >
                          <Text style={[s.dayText, on && s.dayTextOn]}>{label}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              )}
            </View>
            {!!note && <Text style={s.note}>{note}</Text>}

            <Text style={s.sectionLabel}>Quiet hours</Text>
            <View style={s.card}>
              <View style={s.row}>
                <View style={s.rowText}>
                  <Text style={s.rowTitle}>Hold alerts while you rest</Text>
                  <Text style={s.rowHint}>They still wait for you in this list.</Text>
                </View>
                <Switch
                  value={!!prefs.quiet_enabled}
                  onValueChange={v => save({ quiet_enabled: v })}
                  trackColor={{ false: colors.border, true: '#3F9B6B' }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Quiet hours"
                />
              </View>
              {prefs.quiet_enabled && (
                <View style={[s.rowBorder, s.stepRow]}>
                  <Stepper label="From" value={formatHour(prefs.quiet_start)} onMinus={() => shiftQuiet('quiet_start', -1)} onPlus={() => shiftQuiet('quiet_start', 1)} colors={colors} s={s} />
                  <Stepper label="To" value={formatHour(prefs.quiet_end)} onMinus={() => shiftQuiet('quiet_end', -1)} onPlus={() => shiftQuiet('quiet_end', 1)} colors={colors} s={s} />
                </View>
              )}
            </View>
            {failed && <Text style={s.note}>Could not save that just now. Check your connection and try again.</Text>}
          </ScrollView>

          <TouchableOpacity style={s.done} activeOpacity={0.85} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={s.doneText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Stepper({ label, value, onMinus, onPlus, colors, s }) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
      <View style={s.stepControls}>
        <TouchableOpacity onPress={onMinus} style={s.stepBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${label} one hour earlier`}>
          <Minus size={15} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.stepValue}>{value}</Text>
        <TouchableOpacity onPress={onPlus} style={s.stepBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${label} one hour later`}>
          <Plus size={15} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
    grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 16 },
    title: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
    hint: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 6, marginBottom: 14 },
    sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
    card: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
    rowHint: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
    days: { flexDirection: 'row', gap: 6, marginTop: 10 },
    day: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    dayOn: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
    dayText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textPrimary },
    dayTextOn: { color: colors.accentFg },
    note: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 10 },
    stepRow: { flexDirection: 'row', gap: 12, padding: 14 },
    stepper: { flex: 1 },
    stepLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSecondary, marginBottom: 8 },
    stepControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 6, height: 44, backgroundColor: colors.surface },
    stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    stepValue: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
    done: { backgroundColor: colors.accentBg, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
    doneText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  })
}
