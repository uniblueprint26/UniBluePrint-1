import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronDown, ExternalLink, Info } from 'lucide-react-native'
import { ToolScreen, Eyebrow, Btn, openLink } from '../../components/explore/ToolBits'
import { SCHOLARSHIP_GUIDES, SCHOLARSHIPS_CHECKED } from '../../constants/scholarshipGuides'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Scholarships. Real Irish scholarships, grants and bursaries with a short
// guide each: who can apply, what it is worth, how to apply, and the official
// source. Written from the official pages, nothing invented.
export default function ScholarshipsScreen({ navigation }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(null)

  return (
    <ToolScreen navigation={navigation} title="Scholarships" subtitle="Funding you can apply for">
      <View style={s.noteRow}>
        <Info size={16} color={colors.textSecondary} strokeWidth={1.8} style={{ marginTop: 2 }} />
        <Text style={[s.note, { color: colors.textSecondary }]}>
          Guides checked on {SCHOLARSHIPS_CHECKED}. Amounts and dates change each year, so always read the official page before you apply.
        </Text>
      </View>

      {SCHOLARSHIP_GUIDES.map(g => {
        const isOpen = open === g.key
        return (
          <View key={g.key} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpen(isOpen ? null : g.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={g.name}
              style={s.head}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.name, { color: colors.textPrimary }]}>{g.name}</Text>
                <Text style={[s.by, { color: colors.textSecondary }]}>{g.by}</Text>
                <Text style={[s.blurb, { color: colors.textPrimary }]}>{g.blurb}</Text>
              </View>
              <ChevronDown size={20} color={colors.textTertiary} strokeWidth={1.8} style={isOpen ? { transform: [{ rotate: '180deg' }] } : null} />
            </TouchableOpacity>

            {isOpen && (
              <View style={s.body}>
                <View style={[s.status, { backgroundColor: colors.tabFill }]}>
                  <Text style={[s.statusText, { color: colors.textPrimary }]}>{g.status}</Text>
                </View>
                <Section title="Who can apply" items={g.who} />
                <Section title="What it is worth" text={g.worth} />
                <Section title="How to apply" items={g.howto} numbered />
                {!!g.good?.length && <Section title="Good to know" items={g.good} />}
                <Btn label={g.urlLabel} Icon={ExternalLink} onPress={() => openLink(g.url)} style={{ marginTop: 20 }} />
                <Text style={[s.source, { color: colors.textSecondary }]}>Source: {g.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</Text>
              </View>
            )}
          </View>
        )
      })}
      <Text style={[s.foot, { color: colors.textSecondary }]}>
        Know a scholarship we should add? Email support@uniblueprint.ie and we will check it before we list it.
      </Text>
    </ToolScreen>
  )
}

function Section({ title, items, text, numbered }) {
  const { colors } = useTheme()
  return (
    <View style={s.section}>
      <Eyebrow>{title}</Eyebrow>
      {!!text && <Text style={[s.p, { color: colors.textPrimary }]}>{text}</Text>}
      {(items || []).map((t, i) => (
        <View key={i} style={s.li}>
          <Text style={[s.bullet, { color: colors.textSecondary }]}>{numbered ? `${i + 1}.` : '•'}</Text>
          <Text style={[s.p, s.liText, { color: colors.textPrimary }]}>{t}</Text>
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  noteRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 2, marginBottom: 8 },
  note: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18 },
  name: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27 },
  by: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 4 },
  blurb: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  body: { paddingHorizontal: 18, paddingBottom: 20 },
  status: { borderRadius: 12, padding: 12 },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 20 },
  section: { marginTop: 20 },
  p: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, marginTop: 6 },
  li: { flexDirection: 'row', gap: 10 },
  bullet: { fontFamily: fonts.sansMedium, fontSize: 14.5, lineHeight: 22, marginTop: 6, width: 18 },
  liText: { flex: 1 },
  source: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 12, textAlign: 'center' },
  foot: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 20, paddingHorizontal: 4 },
})
