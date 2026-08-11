import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Home, Megaphone, MessageSquare, Users, User } from 'lucide-react-native'
import { Platform, View, Animated } from 'react-native'
import { useRef, useEffect } from 'react'
import UBPLogo from '../components/ui/UBPLogo'
import UnverifiedEmailBanner from '../components/ui/UnverifiedEmailBanner'

import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'

// Main screens
import HomeScreen          from '../screens/HomeScreen'
import FoundationScreen    from '../screens/FoundationScreen'
import ElevationScreen     from '../screens/ElevationScreen'
import CampusConnectScreen from '../screens/CampusConnectScreen'
import CourseConnectScreen from '../screens/CourseConnectScreen'
import LifestyleScreen     from '../screens/LifestyleScreen'
import AdBoardScreen       from '../screens/AdBoardScreen'
import BudgetingScreen     from '../screens/BudgetingScreen'
import MessagesScreen      from '../screens/MessagesScreen'
import DirectoryScreen     from '../screens/DirectoryScreen'
import ProfileScreen       from '../screens/ProfileScreen'

// Home sub-screens
import NotificationsScreen  from '../screens/NotificationsScreen'
import CoachProfileScreen   from '../screens/CoachProfileScreen'
import ChatRoomScreen       from '../screens/ChatRoomScreen'
import CompassScreen        from '../screens/CompassScreen'

// Dual Portal — The Blueprint Studio (Handlers) / The Elevation Studio (Coaches)
import StudioQueueScreen    from '../screens/studio/StudioQueueScreen'
import PromptLibraryScreen  from '../screens/studio/PromptLibraryScreen'
import AvailabilityScreen   from '../screens/studio/AvailabilityScreen'
import SpecialismScreen     from '../screens/studio/SpecialismScreen'
import CoachStudioScreen    from '../screens/studio/CoachStudioScreen'

// Dual Portal — Founder / Operations / Partner (business)
import FounderPortalScreen    from '../screens/portals/FounderPortalScreen'
import OperationsPortalScreen from '../screens/portals/OperationsPortalScreen'
import PartnerPortalScreen    from '../screens/portals/PartnerPortalScreen'

// Profile sub-screens
import AboutScreen       from '../screens/AboutScreen'
import FAQsScreen        from '../screens/FAQsScreen'
import HelpScreen        from '../screens/HelpScreen'
import PrivacyDataScreen from '../screens/PrivacyDataScreen'

// Auth screens
import WelcomeScreen        from '../screens/auth/WelcomeScreen'
import SignInScreen         from '../screens/auth/SignInScreen'
import SignUpScreen         from '../screens/auth/SignUpScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'
import VerifyEmailScreen    from '../screens/auth/VerifyEmailScreen'

const Tab   = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const noHeader   = { headerShown: false, animation: 'slide_from_right' }
const backHeader = {
  animation: 'slide_from_right',
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.cream,
  headerTitleStyle: { fontFamily: fonts.sansSemiBold },
}

// Home tab — includes feature screens pushed from sidebar / Quick Access
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="HomeMain"      component={HomeScreen}         />
      <Stack.Screen name="Foundation"    component={FoundationScreen}    />
      <Stack.Screen name="Elevation"     component={ElevationScreen}     />
      <Stack.Screen name="CampusConnect" component={CampusConnectScreen} />
      <Stack.Screen name="CourseConnect" component={CourseConnectScreen} />
      <Stack.Screen name="Lifestyle"     component={LifestyleScreen}     />
      <Stack.Screen name="Budgeting"     component={BudgetingScreen}    />
      <Stack.Screen name="Notifications" component={NotificationsScreen}/>
      <Stack.Screen name="CoachProfile"  component={CoachProfileScreen} />
      <Stack.Screen name="ChatRoom"      component={ChatRoomScreen}     />
      <Stack.Screen name="Compass"       component={CompassScreen}      />

      {/* Dual Portal — The Blueprint Studio (Handlers) / The Elevation Studio (Coaches) */}
      <Stack.Screen name="StudioQueue"      component={StudioQueueScreen}   />
      <Stack.Screen name="PromptLibrary"    component={PromptLibraryScreen} />
      <Stack.Screen name="Availability"     component={AvailabilityScreen}  />
      <Stack.Screen name="Specialism"       component={SpecialismScreen}    />
      <Stack.Screen name="CoachStudio"      component={CoachStudioScreen}   />

      {/* Dual Portal — Founder / Operations / Partner (business) */}
      <Stack.Screen name="FounderPortal"    component={FounderPortalScreen}    />
      <Stack.Screen name="OperationsPortal" component={OperationsPortalScreen} />
      <Stack.Screen name="PartnerPortalApp" component={PartnerPortalScreen}    />
    </Stack.Navigator>
  )
}

function AdBoardStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="AdBoardMain" component={AdBoardScreen} />
      <Stack.Screen name="ChatRoom"    component={ChatRoomScreen} />
    </Stack.Navigator>
  )
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
      <Stack.Screen name="ChatRoom"     component={ChatRoomScreen} />
    </Stack.Navigator>
  )
}

function DirectoryStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="DirectoryMain" component={DirectoryScreen} />
    </Stack.Navigator>
  )
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="ProfileMain"  component={ProfileScreen}     />
      <Stack.Screen name="About"        component={AboutScreen}       />
      <Stack.Screen name="FAQs"         component={FAQsScreen}        />
      <Stack.Screen name="Help"         component={HelpScreen}        />
      <Stack.Screen name="PrivacyData"  component={PrivacyDataScreen} />
    </Stack.Navigator>
  )
}

function MainTabs() {
  // Rendered once here, above the Tab.Navigator, so it persists across every
  // tab and every screen within it — matching the spec: "Banner appears on
  // every screen within the app every session until email is verified."
  // A per-screen banner would need re-adding to every screen individually
  // and would be trivial to accidentally miss on a new one; this can't be.
  //
  // No paddingTop is applied here: every screen already manages its own
  // top safe-area inset independently. The banner reserves the status-bar
  // gap for itself (see UnverifiedEmailBanner) and simply adds its own
  // height above the Tab.Navigator, pushing screens down exactly as any
  // other stacked element would — it does not touch how those screens
  // compute their own insets.
  return (
    <View style={{ flex: 1 }}>
      <UnverifiedEmailBanner />
      <MainTabsInner />
    </View>
  )
}

function MainTabsInner() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: 'rgba(30,58,95,0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 10,
        },
        tabBarActiveTintColor:   colors.navy,
        tabBarInactiveTintColor: colors.light,
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarIcon: ({ color }) => <Home size={22} color={color} />, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="AdBoard"
        component={AdBoardStack}
        options={{ tabBarIcon: ({ color }) => <Megaphone size={22} color={color} />, tabBarLabel: 'Ad Board' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{ tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />, tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Directory"
        component={DirectoryStack}
        options={{ tabBarIcon: ({ color }) => <Users size={22} color={color} />, tabBarLabel: 'Directory' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} />, tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Welcome"        component={WelcomeScreen}       />
      <Stack.Screen name="SignIn"         component={SignInScreen}         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SignUp"         component={SignUpScreen}         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="VerifyEmail"    component={VerifyEmailScreen}    options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  )
}

// ── Splash Screen ─────────────────────────────────────────────────────────────
// Shown while auth state resolves. Fade + scale matches Apple launch-screen feel.
function SplashScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.88)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 640, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 640, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'flex-start' }}>
        <UBPLogo height={80} color={colors.cream} variant="wordmark" />
      </Animated.View>
    </View>
  )
}

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return <SplashScreen />
  }

  return user ? <MainTabs /> : <AuthStack />
}
