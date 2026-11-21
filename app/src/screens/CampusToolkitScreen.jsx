import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CloudSun, Wind, Droplets, Shirt, ExternalLink, Route, CreditCard, Moon, Bus, Train, TramFront, MapPinned } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Card, EmptyNote, PrimaryButton, SectionRow, useTone } from '../components/campusConnect/CampusKit'
import { useCampus, useWeather } from '../lib/campus'
import { fonts } from '../constants/theme'

// Campus toolkit: two read only pages. Weather and what to wear uses open-meteo
// (free, no key). Transport is a set of official links that open in the phone
// browser. UBP shows no timetables of its own, so nothing here can go out of date.

const LINKS = [
  { group: 'Plan and pay', rows: [
    { title: 'Journey planner', sub: 'Transport for Ireland', url: 'https://www.transportforireland.ie', Icon: Route },
    { title: 'Leap Card', sub: 'Top up and manage', url: 'https://about.leapcard.ie', Icon: CreditCard },
    { title: 'Night services', sub: 'Dublin Bus night routes', url: 'https://www.dublinbus.ie', Icon: Moon },
  ] },
  { group: 'Bus', rows: [
    { title: 'Dublin Bus', sub: 'dublinbus.ie', url: 'https://www.dublinbus.ie', Icon: Bus },
    { title: 'Bus Eireann', sub: 'buseireann.ie', url: 'https://www.buseireann.ie', Icon: Bus },
    { title: 'Local Link', sub: 'Rural services', url: 'https://www.transportforireland.ie/tfi-local-link/', Icon: MapPinned },
  ] },
  { group: 'Rail and tram', rows: [
    { title: 'Irish Rail', sub: 'irishrail.ie', url: 'https://www.irishrail.ie', Icon: Train },
    { title: 'Luas', sub: 'luas.ie', url: 'https://www.luas.ie', Icon: TramFront },
  ] },
]

function open(url) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener')
  else Linking.openURL(url)
}

export default function CampusToolkitScreen({ navigation, route }) {
  const view = route?.params?.view === 'transport' ? 'transport' : 'weather'
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const campus = useCampus()
  const { loading, error, data, reload } = useWeather(campus.city)

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PageTitle
          title={view === 'weather' ? 'Weather' : 'Transport'}
          subtitle={view === 'weather' ? `And what to wear${campus.city ? `, ${campus.city}` : ''}` : 'Official links. They open in your browser.'}
        />
        <View style={s.body}>
          {view === 'weather' ? (
            loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
            : error || !data ? (
              <EmptyNote Icon={CloudSun} title="Weather is not available" body="Check your connection and try again.">
                <PrimaryButton label="Try again" onPress={reload} />
              </EmptyNote>
            ) : (
              <>
                <Card>
                  <View style={s.top}>
                    <View style={[s.icon, { backgroundColor: tint }]}><CloudSun size={26} color={accent} strokeWidth={1.7} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.temp, { color: colors.textPrimary }]}>{data.temp}°</Text>
                      <Text style={[s.meta, { color: colors.textSecondary }]}>{data.label}, feels like {data.feelsLike}°</Text>
                    </View>
                  </View>
                  <View style={s.stats}>
                    <Stat Icon={Droplets} label="Rain chance" value={`${data.rainChance}%`} />
                    <Stat Icon={Wind} label="Wind" value={`${data.wind} km/h`} />
                    <Stat Icon={CloudSun} label="High and low" value={`${data.high}° ${data.low}°`} />
                  </View>
                  <Text style={[s.meta, { color: colors.textSecondary, marginTop: 12 }]}>{data.place}. Weather by Open-Meteo.</Text>
                </Card>
                <SectionRow title="What to wear today" />
                <Card>
                  {data.wear.map((t, i) => (
                    <View key={t} style={[s.wearRow, i > 0 && { marginTop: 12 }]}>
                      <View style={[s.dot, { backgroundColor: tint }]}><Shirt size={16} color={accent} strokeWidth={1.8} /></View>
                      <Text style={[s.wear, { color: colors.textPrimary }]}>{t}</Text>
                    </View>
                  ))}
                </Card>
              </>
            )
          ) : (
            <>
              <Text style={[s.meta, { color: colors.textSecondary }]}>
                UBP does not show timetables, live times or tickets. Every row opens the official site.
              </Text>
              {LINKS.map(g => (
                <View key={g.group}>
                  <SectionRow title={g.group} />
                  <Card style={{ padding: 4 }}>
                    {g.rows.map((r, i) => (
                      <TouchableOpacity
                        key={r.title}
                        onPress={() => open(r.url)}
                        activeOpacity={0.8}
                        accessibilityRole="link"
                        accessibilityLabel={`${r.title}, opens in your browser`}
                        style={[s.link, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}
                      >
                        <View style={[s.dot, { backgroundColor: tint }]}><r.Icon size={18} color={accent} strokeWidth={1.8} /></View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.linkTitle, { color: colors.textPrimary }]}>{r.title}</Text>
                          <Text style={[s.meta, { color: colors.textSecondary }]}>{r.sub}</Text>
                        </View>
                        <ExternalLink size={16} color={colors.textSecondary} strokeWidth={1.8} />
                      </TouchableOpacity>
                    ))}
                  </Card>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )

  function Stat({ Icon, label, value }) {
    return (
      <View style={{ flex: 1 }}>
        <Icon size={16} color={colors.textSecondary} strokeWidth={1.8} />
        <Text style={[s.statVal, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[s.meta, { color: colors.textSecondary, fontSize: 12 }]}>{label}</Text>
      </View>
    )
  }
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  temp: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50 },
  meta: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statVal: { fontFamily: fonts.sansSemiBold, fontSize: 15, marginTop: 6 },
  wearRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wear: { fontFamily: fonts.sansMedium, fontSize: 15, flex: 1, lineHeight: 21 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  linkTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
})
