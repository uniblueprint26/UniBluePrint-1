import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import ComingSoonSheet from '../ui/ComingSoonSheet'
import LiveCountdownRing from './LiveCountdownRing'
import { formatClock, tryOpenLive } from './useLiveWindow'

export { useLiveWindow } from './useLiveWindow'

// The centred "Live is open" card. Not mounted anywhere yet: the Live
// feature lands later. Use it like:
//
//   const { open, secondsLeft } = useLiveWindow(notifications)
//   <LiveWindowPopup visible={open && !dismissed} secondsLeft={secondsLeft}
//                    navigation={navigation} onClose={() => setDismissed(true)} />
//
// "Go Live" opens the LiveCapture screen if the app has one registered,
// otherwise shows the Coming Soon sheet. Pass `onGoLive` to override.
export default function LiveWindowPopup({ visible, secondsLeft, totalSeconds = 120, navigation, onClose, onGoLive }) {
  const { colors } = useTheme()
  const [soon, setSoon] = useState(false)

  useEffect(() => { if (!visible) setSoon(false) }, [visible])

  function goLive() {
    if (onGoLive) { onGoLive(); return }
    if (tryOpenLive(navigation)) { onClose?.(); return }
    setSoon(true)
  }

  return (
    <>
      <Modal visible={!!visible && !soon} transparent animationType="fade" onRequestClose={onClose}>
        <View style={[s.backdrop, { backgroundColor: 'rgba(8,16,28,0.72)' }]}>
          <View style={s.card} accessibilityViewIsModal>
            <View style={s.liveRow}>
              <View style={s.dot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
            <Text style={[s.title, { color: colors.cream }]}>Live is open</Text>
            <Text style={s.sub}>You have 2 minutes. No gallery, just now.</Text>

            <View style={s.ringWrap}>
              <LiveCountdownRing
                size={148} stroke={7}
                secondsLeft={secondsLeft} totalSeconds={totalSeconds}
                color={colors.cream} track="rgba(245,240,232,0.2)"
              >
                <Text style={[s.clock, { color: colors.cream }]}>{formatClock(secondsLeft)}</Text>
                <Text style={s.left}>LEFT</Text>
              </LiveCountdownRing>
            </View>

            <TouchableOpacity
              onPress={goLive}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Go Live"
              style={[s.primary, { backgroundColor: colors.cream }]}
            >
              <Text style={[s.primaryText, { color: colors.navy }]}>Go Live</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} accessibilityRole="button" style={s.quiet}>
              <Text style={s.quietText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ComingSoonSheet
        visible={!!visible && soon}
        onClose={() => { setSoon(false); onClose?.() }}
        title="Live is coming soon"
        message="Two minute captures are on their way. We will let you know when you can go Live."
      />
    </>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%', maxWidth: 340, borderRadius: 28, backgroundColor: '#2A4A75',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.14)',
    paddingTop: 22, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6EE7A8' },
  liveText: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.2, color: 'rgba(245,240,232,0.75)' },
  title: { fontFamily: fonts.serif, fontSize: 32, marginTop: 10 },
  sub: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, textAlign: 'center', color: 'rgba(245,240,232,0.78)', marginTop: 8, maxWidth: 240 },
  ringWrap: { marginTop: 26, marginBottom: 28 },
  clock: { fontFamily: fonts.serif, fontSize: 40 },
  left: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.4, color: 'rgba(245,240,232,0.7)', marginTop: 2 },
  primary: { width: '100%', height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: fonts.sansBold, fontSize: 16 },
  quiet: { paddingVertical: 14, paddingHorizontal: 20, marginTop: 4 },
  quietText: { fontFamily: fonts.sansMedium, fontSize: 14.5, color: 'rgba(245,240,232,0.72)' },
})
