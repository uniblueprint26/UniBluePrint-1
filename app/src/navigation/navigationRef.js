import { createNavigationContainerRef } from '@react-navigation/native'

// Lets code outside the component tree (the push-notification tap handler in
// useNotificationDeepLinking.js, which fires from an expo-notifications
// listener, not from a screen's own `navigation` prop) drive navigation the
// same way a screen would. Attached via `ref={navigationRef}` on the single
// <NavigationContainer> in App.jsx — ready once that's mounted, which for
// every real tap (app already running, or launched by the tap itself) is by
// the time AppShell's effects run.
export const navigationRef = createNavigationContainerRef()
