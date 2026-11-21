import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Route, CreditCard, Moon, Bus, TrainFront, TramFront, ExternalLink, Car, ChevronRight } from 'lucide-react-native'
import { ToolScreen, Card, Btn, LinkRow, openLink } from '../../components/explore/ToolBits'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Transport. A journey planner up top, two quick tiles, then plain rows for
// each operator. Every link is an official site and opens in the browser. UBP
// does not show live times here; the operators do.

const PLANNER = 'https://journeyplanner.transportforireland.ie'

const TILES = [
  { key: 'leap', title: 'Leap Card', sub: 'leapcard.ie', url: 'https://www.leapcard.ie', Icon: CreditCard },
  { key: 'night', title: 'Night services', sub: 'dublinbus.ie', url: 'https://www.dublinbus.ie', Icon: Moon },
]

const OPERATORS = [
  { key: 'dublin-bus', title: 'Dublin Bus', sub: 'dublinbus.ie', url: 'https://www.dublinbus.ie', Icon: Bus },
  { key: 'bus-eireann', title: 'Bus Éireann', sub: 'buseireann.ie', url: 'https://www.buseireann.ie', Icon: Bus },
  { key: 'irish-rail', title: 'Irish Rail', sub: 'irishrail.ie', url: 'https://www.irishrail.ie', Icon: TrainFront },
  { key: 'luas', title: 'Luas', sub: 'luas.ie', url: 'https://luas.ie', Icon: TramFront },
  { key: 'go-ahead', title: 'Go-Ahead Ireland', sub: 'goaheadireland.ie', url: 'https://www.goaheadireland.ie', Icon: Bus },
  { key: 'local-link', title: 'Local Link', sub: 'locallink.ie', url: 'https://www.locallink.ie', Icon: Bus },
]

export default function TransportScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const footer = (
    <View style={[s.source, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
      <ExternalLink size={18} color={colors.textSecondary} strokeWidth={1.8} style={{ marginTop: 2 }} />
      <Text style={[s.sourceText, { color: colors.textSecondary }]}>
        <Text style={{ fontFamily: fonts.sansBold, color: colors.textPrimary }}>Source: official sites.</Text>
        {' '}Links open in your browser. Times and fares come from the operators, not from UBP.
      </Text>
    </View>
  )

  return (
    <ToolScreen navigation={navigation} title="Transport" subtitle="Plan a journey, on any night or any day." footer={footer}>
      <Card style={{ padding: 20 }}>
        <View style={s.plannerHead}>
          <View style={[s.iconBox, { backgroundColor: colors.tabFill }]}>
            <Route size={22} color={colors.textPrimary} strokeWidth={1.7} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.plannerTitle, { color: colors.textPrimary }]}>Journey planner</Text>
            <Text style={[s.plannerSub, { color: colors.textSecondary }]}>Transport for Ireland</Text>
          </View>
        </View>
        <Btn label="Open planner" Icon={ExternalLink} onPress={() => openLink(PLANNER)} style={{ marginTop: 18 }} />
      </Card>

      <View style={s.tiles}>
        {TILES.map(t => (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.8}
            onPress={() => openLink(t.url)}
            accessibilityRole="link"
            accessibilityLabel={`${t.title}, ${t.sub}`}
            style={[s.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[s.iconBox, { backgroundColor: colors.tabFill }]}>
              <t.Icon size={20} color={colors.textPrimary} strokeWidth={1.7} />
            </View>
            <Text style={[s.tileTitle, { color: colors.textPrimary }]}>{t.title}</Text>
            <Text style={[s.tileSub, { color: colors.textSecondary }]}>{t.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {OPERATORS.map((o, i) => (
          <LinkRow key={o.key} Icon={o.Icon} title={o.title} sub={o.sub} url={o.url} last={i === OPERATORS.length - 1} />
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BoardDetail', { boardKey: 'carpool' })}
        accessibilityRole="button"
        accessibilityLabel="Need a lift? Carpooling in Campus Connect"
        style={[s.carpool, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.infoBg, borderColor: colors.border }]}
      >
        <View style={[s.iconBox, { backgroundColor: colors.tabFill }]}>
          <Car size={20} color={colors.textPrimary} strokeWidth={1.7} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.tileTitle, { color: colors.textPrimary, marginTop: 0 }]}>Need a lift?</Text>
          <Text style={[s.tileSub, { color: colors.textSecondary }]}>See carpooling in Campus Connect</Text>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
      </TouchableOpacity>
    </ToolScreen>
  )
}

const s = StyleSheet.create({
  plannerHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  plannerTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  plannerSub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 14 },
  tile: { flex: 1, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, minHeight: 128 },
  tileTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, marginTop: 14 },
  tileSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  list: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginTop: 14 },
  carpool: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginTop: 14 },
  source: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  sourceText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
})
