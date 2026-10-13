/**
 * useNotificationDeepLinking — tapping a push notification (app
 * backgrounded, or killed and launched by the tap) now goes to the same
 * screen tapping the row in NotificationsScreen already goes to, instead of
 * just opening the app to wherever it last was.
 *
 * send-push-notification/index.ts already puts everything needed for this
 * on every push payload's `data` (notification_id, category,
 * related_entity_type, related_entity_id) — it says as much in its own
 * header comment ("the client resolves the deep link itself on tap"). This
 * is that client half: `goToRelatedEntity` (lib/notificationRouting.js) is
 * the exact same routing logic NotificationsScreen's in-app row tap uses,
 * just driven by `navigationRef` instead of a screen's own `navigation`
 * prop, since a tap on the OS notification itself has no screen to get one
 * from.
 *
 * Mounted once in AppShell (navigation/index.jsx), same as
 * usePushRegistration — AppShell only renders once signed in, which is the
 * earliest point `goToRelatedEntity`'s coach_booking case (it needs the
 * signed-in user's id) and the read-marking update below can run.
 *
 * import { useNotificationDeepLinking } from '../hooks/useNotificationDeepLinking'
 * useNotificationDeepLinking() // call once near the app's root, no return value
 */

import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { goToRelatedEntity } from '../lib/notificationRouting'
import { navigationRef } from '../navigation/navigationRef'

// navigationRef is attached to the app's single <NavigationContainer> (see
// App.jsx) which is always already mounted above AppShell — but on a true
// cold start (app launched BY the notification tap) React is still in its
// very first render pass when this effect first fires, a beat before
// `isReady()` flips. Poll briefly rather than give up — same "don't drop a
// real tap" reasoning as everywhere else push-adjacent in this app.
function waitForNavigationReady(maxAttempts = 20) {
  return new Promise(resolve => {
    let attempts = 0
    const tick = () => {
      if (navigationRef.isReady() || attempts >= maxAttempts) { resolve(navigationRef.isReady()); return }
      attempts += 1
      setTimeout(tick, 150)
    }
    tick()
  })
}

export function useNotificationDeepLinking() {
  const { user } = useAuth()
  const userId = user?.id
  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  // Dedupes within this mount — `lastNotificationResponse` is a stable
  // reference until a genuinely new tap arrives (see expo-notifications'
  // own determineNextResponse), but guarding on the notification's own id
  // too means a sign-out/sign-in remount can't replay the same tap twice
  // before clearLastNotificationResponseAsync below has had a chance to run.
  const handledIdRef = useRef(null)

  useEffect(() => {
    if (!userId || !lastNotificationResponse) return

    const data = lastNotificationResponse.notification?.request?.content?.data
    const notificationId = data?.notification_id
    if (!notificationId || handledIdRef.current === notificationId) return
    handledIdRef.current = notificationId

    let cancelled = false
    ;(async () => {
      // Best-effort — mirrors NotificationsScreen.handlePress's own
      // read-marking, but must never block navigating on a failed write.
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId).then(
        () => {}, () => {},
      )

      const ready = await waitForNavigationReady()
      if (cancelled || !ready) return

      await goToRelatedEntity(navigationRef, data, userId)

      // Clears the native-side cached response so a later remount (e.g. a
      // sign-out/sign-in cycle re-mounting AppShell) doesn't replay this
      // same tap — `determineNextResponse`'s reference-stability only
      // covers this mount's lifetime, not across them.
      await Notifications.clearLastNotificationResponseAsync().catch(() => {})
    })()

    return () => { cancelled = true }
  }, [userId, lastNotificationResponse])
}
