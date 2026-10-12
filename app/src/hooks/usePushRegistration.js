/**
 * usePushRegistration — the client half of real push notifications: asks
 * for permission at a sensible point (once the signed-in person has reached
 * the main app, never cold on launch — see pushNotifications.js's header)
 * and keeps the registered Expo push token current afterwards.
 *
 * Mounted once in AppShell (navigation/index.jsx), which only renders once
 * a user is signed in and past the first-launch tour — same reasoning
 * AuthContext's own email-reverification-on-foreground effect documents for
 * running something on AppState changes: it needs a live round trip, not
 * just whatever this app instance already has cached.
 *
 * import { usePushRegistration } from '../hooks/usePushRegistration'
 * usePushRegistration() // call once near the app's root, no return value
 */

import { useEffect } from 'react'
import { AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../context/AuthContext'
import {
  requestAndRegisterAsync,
  reRegisterIfAlreadyGrantedAsync,
  onDeviceTokenChangedAsync,
} from '../lib/pushNotifications'

export function usePushRegistration() {
  const { user } = useAuth()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return

    // First-ever call for this account+device: prompts if not already
    // asked, silently re-registers if permission was already granted.
    requestAndRegisterAsync(userId)

    // A token can go stale, or Expo can roll it, while the app is
    // backgrounded — re-check (never re-prompt) every time it comes back
    // to the foreground.
    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') reRegisterIfAlreadyGrantedAsync(userId)
    })

    // The rarer in-session case: Expo rolls the underlying device token
    // while the app is already open and foregrounded.
    const tokenSub = Notifications.addPushTokenListener(() => {
      onDeviceTokenChangedAsync(userId)
    })

    return () => {
      appStateSub.remove()
      tokenSub.remove()
    }
  }, [userId])
}
