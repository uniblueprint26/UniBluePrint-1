import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { X, Zap, ZapOff, Radio, Camera, Smartphone, Settings } from 'lucide-react-native'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

// Live, step 1: the camera moment.
//
// One shutter takes the back camera shot and then, straight after, the front
// camera shot, so both are in the moment. A phone that cannot switch in time
// keeps just the back shot (LiveCompose handles a missing front shot). There is
// no gallery button and no import: the only way in is the camera.
//
// Before the system camera prompt the member sees one plain screen saying what
// the camera is for (Allow camera or Not now). If the camera is refused for
// good, a "Camera is off" screen has an Open Settings button.
//
// The camera cannot run in the web preview, so web shows a clear note instead.
// Everything past the shutter (LiveCompose) is the same on every platform.

const SWITCH_DELAY_MS = 1100
const SHOT_TIMEOUT_MS = 5000

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(v => { clearTimeout(t); resolve(v) }, e => { clearTimeout(t); reject(e) })
  })
}

export default function LiveCaptureScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const camRef = useRef(null)
  const [facing, setFacing] = useState('back')
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)

  const close = () => navigation.goBack()

  // ── Web: no camera here ──
  if (Platform.OS === 'web') {
    return (
      <Shell insets={insets} onClose={close} colors={colors}>
        <InfoCard
          Icon={Smartphone}
          title="Live needs the phone camera"
          body="Open UniBlueprint on your iPhone or Android phone to post a Live. It cannot use the camera in a web browser."
          colors={colors}
        />
      </Shell>
    )
  }

  if (!permission) {
    return (
      <Shell insets={insets} onClose={close} colors={colors}>
        <ActivityIndicator color="#fff" />
      </Shell>
    )
  }

  // ── Refused for good: Camera is off ──
  if (!permission.granted && !permission.canAskAgain) {
    return (
      <Shell insets={insets} onClose={close} colors={colors}>
        <InfoCard
          Icon={Camera}
          title="Camera is off"
          body="Live needs your camera. You can turn it on for UniBlueprint in your phone Settings."
          colors={colors}
          primary={{ label: 'Open Settings', Icon: Settings, onPress: () => Linking.openSettings().catch(() => {}) }}
          secondary={{ label: 'Not now', onPress: close }}
        />
      </Shell>
    )
  }

  // ── Plain explainer before the system prompt ──
  if (!permission.granted) {
    return (
      <Shell insets={insets} onClose={close} colors={colors}>
        <InfoCard
          Icon={Radio}
          title="Live needs your camera"
          body="UBP uses it only when you open Live, takes the shot with both cameras, and never records in the background. You can change this in Settings."
          colors={colors}
          primary={{
            label: 'Allow camera',
            Icon: Camera,
            onPress: () => { requestPermission() },
          }}
          secondary={{ label: 'Not now', onPress: close }}
        />
      </Shell>
    )
  }

  async function shoot() {
    if (busy || !camRef.current) return
    setBusy(true)
    setNote(null)
    try {
      const back = await camRef.current.takePictureAsync({ quality: 0.7, exif: false })
      let frontUri = null
      try {
        setFacing('front')
        await sleep(SWITCH_DELAY_MS)
        const front = await withTimeout(camRef.current.takePictureAsync({ quality: 0.7, exif: false }), SHOT_TIMEOUT_MS)
        frontUri = front?.uri || null
      } catch {
        frontUri = null // this phone could not take the front shot: post with the back shot only
      }
      setFacing('back')
      navigation.navigate('LiveCompose', { backUri: back.uri, frontUri })
    } catch {
      setFacing('back')
      setNote('Could not take the shot. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[s.screen, { backgroundColor: '#0B0F18' }]}>
      <CameraView
        ref={camRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash ? 'on' : 'off'}
        mode="picture"
        mute
      />
      <View style={s.scrimTop} pointerEvents="none" />
      <View style={s.scrimBottom} pointerEvents="none" />

      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <RoundBtn label="Close" onPress={close}><X size={20} color="#fff" strokeWidth={2} /></RoundBtn>
        <View style={s.titleRow}>
          <Radio size={16} color="#fff" strokeWidth={1.9} />
          <Text style={s.title}>Live</Text>
        </View>
        <RoundBtn label={flash ? 'Turn flash off' : 'Turn flash on'} onPress={() => setFlash(f => !f)}>
          {flash ? <Zap size={19} color="#fff" strokeWidth={2} /> : <ZapOff size={19} color="#fff" strokeWidth={2} />}
        </RoundBtn>
      </View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 26 }]}>
        <View style={s.pill}>
          <Text style={s.pillText}>{busy ? 'Hold still, taking both shots' : 'Back and front camera, one shot'}</Text>
        </View>
        {!!note && <Text style={s.note}>{note}</Text>}
        <TouchableOpacity
          style={[s.shutterOuter, busy && { opacity: 0.5 }]}
          onPress={shoot}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Take your Live"
        >
          {busy ? <ActivityIndicator color="#0B0F18" /> : <View style={s.shutterInner} />}
        </TouchableOpacity>
        <Text style={s.fine}>No gallery. Only what is in front of you.</Text>
      </View>
    </View>
  )
}

function RoundBtn({ children, onPress, label }) {
  return (
    <TouchableOpacity style={s.round} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
      {children}
    </TouchableOpacity>
  )
}

// A dark page with a close button and one centred card.
function Shell({ children, insets, onClose, colors }) {
  return (
    <View style={[s.screen, { backgroundColor: '#0B0F18' }]}>
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <RoundBtn label="Close" onPress={onClose}><X size={20} color="#fff" strokeWidth={2} /></RoundBtn>
        <View style={s.titleRow}>
          <Radio size={16} color="#fff" strokeWidth={1.9} />
          <Text style={s.title}>Live</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.center}>{children}</View>
    </View>
  )
}

function InfoCard({ Icon, title, body, primary, secondary, colors }) {
  return (
    <View style={s.card}>
      <View style={s.cardIcon}><Icon size={26} color="#fff" strokeWidth={1.7} /></View>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardBody}>{body}</Text>
      {!!primary && (
        <TouchableOpacity style={s.primary} onPress={primary.onPress} activeOpacity={0.85} accessibilityRole="button">
          {primary.Icon ? <primary.Icon size={18} color="#0B0F18" strokeWidth={2} /> : null}
          <Text style={s.primaryText}>{primary.label}</Text>
        </TouchableOpacity>
      )}
      {!!secondary && (
        <TouchableOpacity style={s.secondary} onPress={secondary.onPress} accessibilityRole="button">
          <Text style={s.secondaryText}>{secondary.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 150, backgroundColor: 'rgba(0,0,0,0.28)' },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundColor: 'rgba(0,0,0,0.38)' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  round: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 18, paddingHorizontal: 24 },
  pill: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#fff' },
  note: { fontFamily: fonts.sans, fontSize: 13, color: '#FFB4B4', textAlign: 'center' },
  shutterOuter: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  fine: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { width: '100%', maxWidth: 420, alignItems: 'center', gap: 14 },
  cardIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  cardTitle: { fontFamily: fonts.serif, fontSize: 26, color: '#fff', textAlign: 'center' },
  cardBody: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: radius.pill, paddingVertical: 15, alignSelf: 'stretch', marginTop: 12,
  },
  primaryText: { fontFamily: fonts.sansBold, fontSize: 15.5, color: '#0B0F18' },
  secondary: { paddingVertical: 12, paddingHorizontal: 20 },
  secondaryText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: 'rgba(255,255,255,0.85)' },
})
