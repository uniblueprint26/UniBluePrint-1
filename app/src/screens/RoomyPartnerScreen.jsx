import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExternalLink, Home, Search, MessageCircle } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Card, Pill, PrimaryButton, SectionRow, useTone } from '../components/campusConnect/CampusKit'
import { RoomyMark } from '../components/campusConnect/RoomyMark'
import { fonts } from '../constants/theme'

// Roomy.ie, UBP's accommodation partner. The partner page is short: who they
// are, what to do there, and a link out. UBP does not take rent or deposits and
// is not a party to any rental.
export const ROOMY_URL = 'https://www.roomy.ie'

export function openRoomy() {
  if (Platform.OS === 'web') window.open(ROOMY_URL, '_blank', 'noopener')
  else Linking.openURL(ROOMY_URL)
}

export default function RoomyPartnerScreen({ navigation }) {
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PageTitle title="Roomy.ie" subtitle="Our accommodation partner." />
        <View style={s.body}>
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <RoomyMark size={84} />
            <Text style={[s.h, { color: colors.textPrimary }]}>Find a place to live</Text>
            <Text style={[s.p, { color: colors.textSecondary }]}>
              Roomy.ie is where UBP points members who are looking for a room or a houseshare. Browse on their site and message the landlord or housemates there.
            </Text>
            <Pill label="UBP partner" tone="accent" style={{ marginTop: 12 }} />
            <PrimaryButton label="Open roomy.ie" Icon={ExternalLink} onPress={openRoomy} style={{ alignSelf: 'stretch' }} />
          </Card>

          <SectionRow title="How it works" />
          <Card style={{ gap: 16 }}>
            {[
              [Search, 'Search on Roomy.ie', 'Pick your area and what you can spend.'],
              [MessageCircle, 'Talk to them directly', 'Ask questions and arrange viewings on their site.'],
              [Home, 'Post on the board', 'Members can also post a room or ask for one on the Accommodation board.'],
            ].map(([Icon, t, d]) => (
              <View key={t} style={s.row}>
                <View style={[s.icon, { backgroundColor: tint }]}><Icon size={18} color={accent} strokeWidth={1.8} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.t, { color: colors.textPrimary }]}>{t}</Text>
                  <Text style={[s.p, { color: colors.textSecondary, textAlign: 'left', marginTop: 2 }]}>{d}</Text>
                </View>
              </View>
            ))}
          </Card>
          <Text style={[s.small, { color: colors.textSecondary }]}>
            UBP never takes rent or deposits. Never send money before you have seen a place and met the person.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  h: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, marginTop: 18, textAlign: 'center' },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 16 },
})
