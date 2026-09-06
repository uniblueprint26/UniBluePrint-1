import { DrawerActions } from '@react-navigation/native'

// Tapping the UBP logo anywhere in the app must land on the Home dashboard —
// no exceptions. Screens live at different nesting depths (some are pushed
// directly inside HomeStack, some are root tabs with their own stack, some
// are pushed inside a totally different tab's stack e.g. ChatRoomScreen), so
// a single hardcoded `navigation.navigate(...)` call can't work everywhere.
// This walks the current navigator's own route table first (cheap, no
// cross-tab jump needed if we're already inside the Home stack), and only
// reaches for the parent (the Tab.Navigator) when we're not.
export function goToHome(navigation) {
  if (!navigation) return
  try {
    const state = navigation.getState?.()
    if (state?.routeNames?.includes('HomeMain')) {
      navigation.navigate('HomeMain')
      return
    }
  } catch {}
  const parent = navigation.getParent?.()
  if (parent) {
    parent.navigate('Home', { screen: 'HomeMain' })
  } else {
    navigation.navigate('Home', { screen: 'HomeMain' })
  }
}

// Opens the root Drawer regardless of how deeply nested the calling screen
// is — the action bubbles up through parent navigators until the Drawer
// (which wraps the whole Tab.Navigator) handles it.
export function openMenu(navigation) {
  navigation?.dispatch?.(DrawerActions.openDrawer())
}
