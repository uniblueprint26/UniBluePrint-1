// DEV ONLY. A gallery that renders the real card and coach components in isolation on
// the WEB build, so they can be screenshotted. It is reached at /__cards, for example
//   /__cards?view=card&id=energie&side=front
//   /__cards?view=card&id=energie&side=back
//   /__cards?view=coachcard&slug=milan-piroska
//   /__cards?view=screen&name=wallet            (wallet | open-pouvoirs | open-energie |
//                                                partner-elect | elevation | coach-milan | coach-<slug>)
// It is only loaded from App.jsx when Platform.OS is 'web' AND __DEV__ is true, so it is
// never registered in the native navigator and never reaches a release build.
import { useEffect, useMemo } from 'react'
import { View, Animated } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthContext } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { seedWallet } from '../lib/walletStore'
import { PARTNERS } from '../data/lifestylePartners'
import { getCardConfig } from '../data/partnerCards'
import { memberCode } from '../lib/memberCode'
import BankCard from '../components/lifestyle/wallet/BankCard'
import CardBack from '../components/lifestyle/wallet/CardBack'
import CodeArea from '../components/lifestyle/wallet/CodeArea'
import { CoachHeroCard } from '../components/elevation/FeaturedCoaches'
import LifestyleScreen from '../screens/LifestyleScreen'
import PartnerProfileScreen from '../screens/PartnerProfileScreen'
import ElevationScreen, { COACHES } from '../screens/ElevationScreen'
import CoachProfileScreen from '../screens/CoachProfileScreen'

const PREVIEW_USER = 'preview-member'
const MOCK_AUTH = {
  user: { id: PREVIEW_USER },
  loading: false,
  isPro: true,
  subscriptionLoading: false,
  roles: [],
  hasRole: () => false,
}

const Stack = createNativeStackNavigator()

function q() {
  try { return Object.fromEntries(new URLSearchParams(window.location.search)) } catch { return {} }
}

function transparentPage() {
  if (typeof document === 'undefined') return
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
}

function CardView({ id, side }) {
  const partner = PARTNERS.find(p => p.id === id)
  const cfg = useMemo(() => (partner ? getCardConfig(partner) : null), [partner])
  const code = useMemo(() => memberCode(PREVIEW_USER, id), [id])
  const tilt = useMemo(() => new Animated.Value(0), [])
  useEffect(() => { transparentPage() }, [])
  if (!partner) return null
  const chips = [partner.county || (partner.counties || []).join(', ') || null, partner.category].filter(Boolean)
  return (
    <View nativeID="shot" testID="shot" style={{ alignSelf: 'flex-start', width: 358 }}>
      {side === 'back' ? (
        <CardBack partner={partner} cfg={cfg} width={358} code={code} revealed todaySpecial={cfg.todaySpecial} />
      ) : (
        <BankCard
          partner={partner}
          cfg={cfg}
          width={358}
          variant="open"
          sheen={tilt}
          chips={chips}
          codeArea={<CodeArea code={code} scratched onScratched={() => {}} color={cfg.textColor} s={1} />}
        />
      )}
    </View>
  )
}

function CoachCardView({ slug, w }) {
  const coach = COACHES.find(c => c.slug === slug)
  useEffect(() => { transparentPage() }, [])
  if (!coach) return null
  return (
    <View nativeID="shot" testID="shot" style={{ alignSelf: 'flex-start' }}>
      <CoachHeroCard coach={coach} width={Number(w) || 300} style={{ shadowOpacity: 0, elevation: 0 }} />
    </View>
  )
}

function ScreenView({ name }) {
  const { colors } = useTheme()
  let initial = 'Lifestyle'
  let params = {}
  if (name === 'open-pouvoirs') params = { highlightId: 'pouvoirs' }
  else if (name === 'open-energie') params = { highlightId: 'energie' }
  else if (name === 'partner-elect') { initial = 'PartnerProfile'; params = { partnerId: 'elect' } }
  else if (name === 'partner-energie') { initial = 'PartnerProfile'; params = { partnerId: 'energie' } }
  else if (name === 'elevation') initial = 'Elevation'
  else if (name.startsWith('coach-')) {
    initial = 'CoachProfile'
    const slug = name === 'coach-milan' ? 'milan-piroska' : name.slice(6)
    params = { coach: COACHES.find(c => c.slug === slug) }
  }
  useEffect(() => {
    // A few favourites and uses so the wallet shows the pinned group and the Regular chip.
    if (name === 'wallet' || name.startsWith('open-')) {
      seedWallet(PREVIEW_USER, { favs: name === 'wallet' ? ['energie'] : [], uses: {}, scratched: { pouvoirs: true, energie: name === 'open-energie' } })
    }
  }, [name])
  return (
    <View nativeID="shot" testID="shot" style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="Lifestyle" component={LifestyleScreen} initialParams={initial === 'Lifestyle' ? params : undefined} />
          <Stack.Screen name="PartnerProfile" component={PartnerProfileScreen} initialParams={initial === 'PartnerProfile' ? params : undefined} />
          <Stack.Screen name="Elevation" component={ElevationScreen} />
          <Stack.Screen name="CoachProfile" component={CoachProfileScreen} initialParams={initial === 'CoachProfile' ? params : undefined} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  )
}

export default function CardGallery() {
  const p = q()
  return (
    <AuthContext.Provider value={MOCK_AUTH}>
      {p.view === 'card' && <CardView id={p.id} side={p.side} />}
      {p.view === 'coachcard' && <CoachCardView slug={p.slug} w={p.w} />}
      {p.view === 'screen' && <ScreenView name={p.name || 'wallet'} />}
    </AuthContext.Provider>
  )
}
