import { Modal, View, Text, Pressable, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Mail, ExternalLink } from 'lucide-react-native'
import UbpStamp from '../ui/UbpStamp'
import { Btn, openLink } from './ToolBits'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// What a member sees when they tap a society: what it is, how to join, and how
// to message it. An example society says plainly that it is an example.
export default function SocietySheet({ item, onClose }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  if (!item) return null
  const isMail = !!item.url && /^mailto:/i.test(item.url)
  const steps = item.example
    ? [
        'A real society shows how to join right here.',
        'Societies often take new members at the start of term, or through your students\' union.',
      ]
    : [
        'Message the society and say you would like to join.',
        'You can also ask at your students\' union, or look for the society at the start of term.',
      ]

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]} onPress={e => e.stopPropagation?.()}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
          <View style={s.head}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.name, { color: colors.textPrimary }]}>{item.name}</Text>
              {!!item.institution && <Text style={[s.inst, { color: colors.textSecondary }]}>{item.institution}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          {item.example && <UbpStamp example style={{ marginTop: 10, marginLeft: 4 }} />}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
            {!!item.description && <Text style={[s.p, { color: colors.textPrimary, marginTop: 16 }]}>{item.description}</Text>}

            <Text style={[s.eyebrow, { color: colors.textSecondary }]}>HOW TO JOIN</Text>
            {steps.map((t, i) => (
              <View key={i} style={s.li}>
                <Text style={[s.num, { color: colors.textSecondary }]}>{i + 1}.</Text>
                <Text style={[s.p, { flex: 1, color: colors.textPrimary, marginTop: 0 }]}>{t}</Text>
              </View>
            ))}

            <Text style={[s.eyebrow, { color: colors.textSecondary }]}>MESSAGE THEM</Text>
            {item.url ? (
              <Btn
                label={isMail ? 'Email the society' : 'Open their page'}
                Icon={isMail ? Mail : ExternalLink}
                onPress={() => openLink(item.url)}
                style={{ marginTop: 10 }}
              />
            ) : (
              <Text style={[s.p, { color: colors.textSecondary, marginTop: 8 }]}>
                {item.example
                  ? 'This is an example, so there is nobody to message. Real societies show a way to get in touch here.'
                  : 'This society has not added a way to message them yet.'}
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32 },
  inst: { fontFamily: fonts.sans, fontSize: 14, marginTop: 4 },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, marginTop: 6 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1.1, marginTop: 24 },
  li: { flexDirection: 'row', gap: 10, marginTop: 10 },
  num: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22, width: 20 },
})
