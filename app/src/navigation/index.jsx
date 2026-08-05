import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Home, Megaphone, MessageSquare, Users, User } from 'lucide-react-native'
import { Platform, View } from 'react-native'
import UBPLogo from '../components/ui/UBPLogo'

import { useAuth } from '../context/AuthContext'
import { colors, fonts } from '../constants/theme'

// Main screens
import HomeScreen       from '../screens/HomeScreen'
import BlueprintScreen  from '../screens/BlueprintScreen'
import ConnectScreen    from '../screens/ConnectScreen'
import LifestyleScreen  from '../screens/LifestyleScreen'
import AdBoardScreen    from '../screens/AdBoardScreen'
import BudgetingScreen  from '../screens/BudgetingScreen'
import MessagesScreen   from '../screens/MessagesScreen'
import DirectoryScreen  from '../screens/DirectoryScreen'
import ProfileScreen    from '../screens/ProfileScreen'

// Home sub-screens
import NotificationsScreen from '../screens/NotificationsScreen'

// Profile sub-screens
import AboutScreen  from '../screens/AboutScreen'
import FAQsScreen   from '../screens/FAQsScreen'
import HelpScreen   from '../screens/HelpScreen'

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

// Home tab — includes blueprint/connect/lifestyle as sub-screens pushed from sidebar
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="HomeMain"      component={HomeScreen}      />
      <Stack.Screen name="Blueprint"     component={BlueprintScreen}     />
      <Stack.Screen name="Connect"       component={ConnectScreen}       />
      <Stack.Screen name="Lifestyle"     component={LifestyleScreen}     />
      <Stack.Screen name="Budgeting"     component={BudgetingScreen}     />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  )
}

function AdBoardStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="AdBoardMain" component={AdBoardScreen} />
    </Stack.Navigator>
  )
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
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
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="About"  component={AboutScreen}  />
      <Stack.Screen name="FAQs"   component={FAQsScreen}   />
      <Stack.Screen name="Help"   component={HelpScreen}   />
    </Stack.Navigator>
  )
}

function MainTabs() {
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

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <UBPLogo height={48} color={colors.cream} />
      </View>
    )
  }

  return user ? <MainTabs /> : <AuthStack />
}
