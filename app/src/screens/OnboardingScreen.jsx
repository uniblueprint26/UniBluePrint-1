import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ChevronLeft, Check, FileText, Wallet, Users, TrendingUp, Bell, Layers, Heart, UserPlus,
  CalendarDays, Moon,
} from 'lucide-react-native'
import { PILLARS } from '../constants/pillars'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useUserType } from '../hooks/useUserType'
import { useNotificationPrefs } from '../lib/notificationPrefs'
import { requestDeviceCalendar } from '../lib/calendar/device'
import { supabase } from '../lib/supabase'
import { TOUR_SEEN_KEY_PREFIX } from './BlueprintTourScreen'

// First launch, after sign up. These are steps 5 to 10 of the 11 step
// onboarding. Steps 1 to 4 are Welcome, Create your account, Who are you and
// Your details (the sign up screens). Step 11 is Home. Same look as the
// founder's earlier onboarding choice: navy screen, a progress bar, a centred
// title and a cream Continue button.
const FIRST = 5
const TOTAL = 11

const FOCUS = [
  { key: 'job', label: 'Getting a job or internship sorted', Icon: FileText },
  { key: 'money', label: 'Managing money day to day', Icon: Wallet },
  { key: 'people', label: 'Finding my people', Icon: Users },
  { key: 'next', label: 'Figuring out what is next', Icon: TrendingUp },
]

const TUNE = [
  { key: 'pillar_alerts', label: 'The pillars', sub: 'Foundation, Elevation, Lifestyle, Campus and Course Connect', Icon: Layers },
  { key: 'interest_alerts', label: 'Your interests', sub: 'New things that match what you picked', Icon: Heart },
  { key: 'trending_alerts', label: 'Trending', sub: 'What people across Ireland are talking about', Icon: TrendingUp },
  { key: 'following_alerts', label: 'People you follow', sub: 'Coaches and partners you follow', Icon: UserPlus },
]

const PILLAR_LINES = [
  ['foundation', 'Documents and career help, from CV to interview prep'],
  ['elevation', 'Coaches and sessions to take you further'],
  ['lifestyle', 'Our partners, places and offers'],
  ['campus', 'Your own community in the same situation'],
  ['course', 'Everyone across Ireland, on the same course of life'],
]

export default function OnboardingScreen({ onFinish }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const { label: userTypeLabel } = useUserType()
  const { prefs, save } = useNotificationPrefs(user?.id)
  const [i, setI] = useState(0)
  const [focus, setFocus] = useState('')
  const [calendar, setCalendar] = useState('')
  const [asking, setAsking] = useState(false)

  const bg = colors.chromeBg
  const fg = colors.chromeFg
  const soft = 'rgba(245,240,232,0.7)'
  const card = 'rgba(255,255,255,0.08)'
  const titles = ['One more thing', 'Notifications', 'Tune what you hear', 'Your calendar', 'The five places', 'You are set']
  const last = i === titles.length - 1

  async function saveFocus(next) {
    setFocus(next)
    try { await supabase.auth.updateUser({ data: { home_focus: next } }) } catch { /* best effort */ }
  }

  async function connectCalendar() {
    setAsking(true)
    const result = await requestDeviceCalendar()
    setCalendar(result)
    setAsking(false)
  }

  function finish() {
    if (user?.id) AsyncStorage.setItem(`${TOUR_SEEN_KEY_PREFIX}${user.id}`, '1').catch(() => {})
    onFinish?.()
  }

  const enabledCount = TUNE.filter(t => prefs[t.key]).length

  return (
    <View style={[s.screen, { backgroundColor: bg, paddingTop: insets.top + 8 }]}>
      <View style={s.top}>
        <TouchableOpacity
          style={[s.back, i === 0 && { opacity: 0 }]}
          disabled={i === 0}
          onPress={() => setI(v => Math.max(0, v - 1))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={26} color={soft} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={[s.topTitle, { color: fg }]}>{titles[i]}</Text>
        <View style={s.back} />
      </View>
      <View style={s.bar} accessibilityLabel={`Step ${FIRST + i} of ${TOTAL}`}>
        {titles.map((_, k) => (
          <View key={k} style={[s.seg, { backgroundColor: k <= i ? fg : 'rgba(255,255,255,0.2)' }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={[s.step, { color: soft }]}>Step {FIRST + i} of {TOTAL}</Text>

        {i === 0 && (
          <>
            <Text style={[s.h1, { color: fg }]}>What is most on your mind right now?</Text>
            <Text style={[s.sub, { color: soft }]}>Pick one. We use it to suggest what to look at first. You can change it any time.</Text>
            <View style={s.list}>
              {FOCUS.map(o => {
                const on = focus === o.key
                return (
                  <TouchableOpacity
                    key={o.key}
                    activeOpacity={0.85}
                    onPress={() => saveFocus(o.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[s.option, { backgroundColor: on ? 'rgba(255,255,255,0.16)' : card, borderColor: on ? fg : 'transparent' }]}
                  >
                    <o.Icon size={22} color={on ? fg : soft} strokeWidth={1.8} />
                    <Text style={[s.optionText, { color: on ? fg : soft }, on && { fontFamily: fonts.sansSemiBold }]}>{o.label}</Text>
                    {on && <Check size={20} color={fg} strokeWidth={2.2} />}
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}

        {i === 1 && (
          <>
            <Text style={[s.h1, { color: fg }]}>What we will send you</Text>
            <Text style={[s.sub, { color: soft }]}>Short, useful alerts. Nothing you cannot switch off.</Text>
            <View style={s.list}>
              {[
                [Bell, 'Deadlines, sessions and replies', 'Things you asked us to keep an eye on.'],
                [Moon, 'Quiet hours are on', 'No alerts from 10pm to 8am unless you change it.'],
                [Wallet, 'Money nudges are off', 'You can turn on friendly budget nudges in Settings.'],
              ].map(([Icon, t, b]) => (
                <View key={t} style={[s.info, { backgroundColor: card }]}>
                  <Icon size={22} color={fg} strokeWidth={1.8} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoTitle, { color: fg }]}>{t}</Text>
                    <Text style={[s.infoBody, { color: soft }]}>{b}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={[s.note, { color: soft }]}>When you finish, your phone will ask if UniBlueprint can send notifications. Saying no is fine.</Text>
          </>
        )}

        {i === 2 && (
          <>
            <Text style={[s.sub, { color: soft, marginTop: 4 }]}>These are on by default for the things most people want. Change any of it later in Settings.</Text>
            <View style={[s.list, { marginTop: 18 }]}>
              {TUNE.map((t, k) => (
                <View key={t.key} style={[s.toggleRow, k > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.18)' }]}>
                  <t.Icon size={22} color={fg} strokeWidth={1.8} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoTitle, { color: fg }]}>{t.label}</Text>
                    <Text style={[s.infoBody, { color: soft }]}>{t.sub}</Text>
                  </View>
                  <Switch
                    value={!!prefs[t.key]}
                    onValueChange={v => save({ [t.key]: v })}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.chromeFg }}
                    thumbColor={prefs[t.key] ? colors.chromeBg : '#FFFFFF'}
                    accessibilityLabel={t.label}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {i === 3 && (
          <>
            <Text style={[s.h1, { color: fg }]}>Bring your calendar in</Text>
            <Text style={[s.sub, { color: soft }]}>See lectures, shifts and plans next to your UniBlueprint exams and goals. We only read it on this phone and never copy it to our servers.</Text>
            <View style={[s.info, { backgroundColor: card, marginTop: 22 }]}>
              <CalendarDays size={24} color={fg} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={[s.infoTitle, { color: fg }]}>This phone&apos;s calendar</Text>
                <Text style={[s.infoBody, { color: soft }]}>
                  {calendar === 'granted' ? 'Connected. Choose which calendars to show in Calendar.'
                    : calendar === 'denied' ? 'No access. You can allow it later in your phone settings.'
                    : calendar === 'unavailable' ? 'Not available on this device. You can still paste a calendar link in Calendar.'
                    : 'You will be asked for permission.'}
                </Text>
              </View>
            </View>
            {!calendar && (
              <TouchableOpacity style={[s.secondary, { borderColor: fg }]} onPress={connectCalendar} disabled={asking} accessibilityRole="button">
                {asking ? <ActivityIndicator color={fg} /> : <Text style={[s.secondaryText, { color: fg }]}>Connect this phone&apos;s calendar</Text>}
              </TouchableOpacity>
            )}
          </>
        )}

        {i === 4 && (
          <>
            <Text style={[s.h1, { color: fg }]}>Where things live</Text>
            <Text style={[s.sub, { color: soft }]}>Tap the menu any time. Or use the search at the top to find anything.</Text>
            <View style={s.list}>
              {PILLAR_LINES.map(([key, line]) => {
                const p = PILLARS[key]
                return (
                  <View key={key} style={[s.info, { backgroundColor: card }]}>
                    <View style={s.pillarTile}><p.Icon size={22} color={p.color} strokeWidth={1.8} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.infoTitle, { color: fg }]}>{p.label}</Text>
                      <Text style={[s.infoBody, { color: soft }]}>{line}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {i === 5 && (
          <>
            <Text style={[s.h1, { color: fg }]}>You are all set</Text>
            <Text style={[s.sub, { color: soft }]}>Here is what we saved. Change any of it in Settings.</Text>
            <View style={s.list}>
              {[
                ['Who you are', userTypeLabel],
                ['On your mind', FOCUS.find(f => f.key === focus)?.label || 'Not chosen'],
                ['Notifications', `${enabledCount} of ${TUNE.length} types on`],
                ['Calendar', calendar === 'granted' ? 'Connected' : 'Not connected'],
              ].map(([k, v]) => (
                <View key={k} style={[s.recap, { backgroundColor: card }]}>
                  <Text style={[s.recapKey, { color: soft }]}>{k}</Text>
                  <Text style={[s.recapVal, { color: fg }]}>{v}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.cta, { backgroundColor: fg }]}
          activeOpacity={0.9}
          onPress={() => (last ? finish() : setI(v => v + 1))}
          accessibilityRole="button"
        >
          <Text style={[s.ctaText, { color: bg }]}>{last ? 'Go to Home' : 'Continue'}</Text>
        </TouchableOpacity>
        {!last && (i === 0 || i === 3) && (
          <TouchableOpacity style={s.skip} onPress={() => setI(v => v + 1)} accessibilityRole="button">
            <Text style={[s.skipText, { color: soft }]}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 48 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 17 },
  bar: { flexDirection: 'row', gap: 6, marginHorizontal: 20, marginTop: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  step: { fontFamily: fonts.sans, fontSize: 14, marginBottom: 10 },
  h1: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38 },
  sub: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, marginTop: 10 },
  list: { marginTop: 24, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 18 },
  optionText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 16.5, lineHeight: 22 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 18 },
  infoTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16.5 },
  infoBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 2 },
  note: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, marginTop: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  secondary: { marginTop: 18, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  pillarTile: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#F5F0E8', alignItems: 'center', justifyContent: 'center' },
  recap: { borderRadius: 16, padding: 16 },
  recapKey: { fontFamily: fonts.sans, fontSize: 13, marginBottom: 4 },
  recapVal: { fontFamily: fonts.sansSemiBold, fontSize: 17 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  cta: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 17 },
  skip: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  skipText: { fontFamily: fonts.sansMedium, fontSize: 15 },
})
