import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Home, BookOpen, Users, Heart, MoreHorizontal } from 'lucide-react-native'
import HomeScreen from '../screens/HomeScreen'
import BlueprintScreen from '../screens/BlueprintScreen'
import ConnectScreen from '../screens/ConnectScreen'
import LifestyleScreen from '../screens/LifestyleScreen'
import MoreScreen from '../screens/MoreScreen'
import { colors, fonts } from '../constants/theme'

const Tab = createBottomTabNavigator()

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: 'rgba(30,58,95,0.08)',
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Blueprint"
        component={BlueprintScreen}
        options={{
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Connect"
        component={ConnectScreen}
        options={{
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Lifestyle"
        component={LifestyleScreen}
        options={{
          tabBarIcon: ({ color }) => <Heart size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ color }) => <MoreHorizontal size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}
