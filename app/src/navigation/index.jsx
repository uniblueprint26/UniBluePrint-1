import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Home, BookOpen, Users, Heart, MoreHorizontal } from 'lucide-react-native'
import { Platform } from 'react-native'

import HomeScreen from '../screens/HomeScreen'
import BlueprintScreen from '../screens/BlueprintScreen'
import ConnectScreen from '../screens/ConnectScreen'
import LifestyleScreen from '../screens/LifestyleScreen'
import MoreScreen from '../screens/MoreScreen'

import { colors, fonts } from '../constants/theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const screenOptions = { headerShown: false, animation: 'slide_from_right' }

function HomeStack()      { return <Stack.Navigator screenOptions={screenOptions}><Stack.Screen name="HomeMain" component={HomeScreen} /></Stack.Navigator> }
function BlueprintStack() { return <Stack.Navigator screenOptions={screenOptions}><Stack.Screen name="BlueprintMain" component={BlueprintScreen} /></Stack.Navigator> }
function ConnectStack()   { return <Stack.Navigator screenOptions={screenOptions}><Stack.Screen name="ConnectMain" component={ConnectScreen} /></Stack.Navigator> }
function LifestyleStack() { return <Stack.Navigator screenOptions={screenOptions}><Stack.Screen name="LifestyleMain" component={LifestyleScreen} /></Stack.Navigator> }
function MoreStack()      { return <Stack.Navigator screenOptions={screenOptions}><Stack.Screen name="MoreMain" component={MoreScreen} /></Stack.Navigator> }

export default function RootNavigator() {
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
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.light,
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen name="Home"      component={HomeStack}      options={{ tabBarIcon: ({ color }) => <Home      size={22} color={color} />, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Blueprint" component={BlueprintStack} options={{ tabBarIcon: ({ color }) => <BookOpen  size={22} color={color} />, tabBarLabel: 'Blueprint' }} />
      <Tab.Screen name="Connect"   component={ConnectStack}   options={{ tabBarIcon: ({ color }) => <Users     size={22} color={color} />, tabBarLabel: 'Connect' }} />
      <Tab.Screen name="Lifestyle" component={LifestyleStack} options={{ tabBarIcon: ({ color }) => <Heart     size={22} color={color} />, tabBarLabel: 'Lifestyle' }} />
      <Tab.Screen name="More"      component={MoreStack}      options={{ tabBarIcon: ({ color }) => <MoreHorizontal size={22} color={color} />, tabBarLabel: 'More' }} />
    </Tab.Navigator>
  )
}
