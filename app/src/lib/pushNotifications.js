import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

// ─── Push notification registration ────────────────────────────────────────
//
// Client half of supabase/migrations/20261012110000_push_notifications.sql +
// supabase/functions/send-push-notification — those already turn every
// notifications insert (welcome, coach_booking, the four Foundation
// Blueprint moments, chat_message, board_reply) into a real Expo push send,
// the moment a device token is on file in public.push_tokens. This file is
// what gets a token onto that table in the first place.
//
// Three entry points, used from AppShell (see navigation/index.jsx):
//   requestAndRegisterAsync() — prompts for permission (first time only,
//     per the AsyncStorage flag below) and registers on success. Call this
//     once the person has actually landed in the main app, never cold on
//     launch or before they've signed in/seen the tour — same reasoning as
//     ImageUploader only asking for photo-library access right before it's
//     needed, not speculatively.
//   reRegisterIfAlreadyGrantedAsync() — no prompt, ever. Re-reads whatever
//     token Expo hands back and upserts it. Safe to call on every app
//     foreground (see hooks/usePushRegistration.js) because
//     register_push_token() is a plain upsert keyed on the token itself —
//     re-sending the same token is a no-op past the first call.
//   addPushTokenListener-based refresh — handled inside the hook, for the
//     rarer case where Expo rolls a token while the app is already running.
//
// Never nags: permission is requested at most once per (user, device) via
// the `push_perm_asked_` AsyncStorage flag below. A person who dismisses or
// denies the OS prompt is not asked again by this app — same "don't block,
// don't nag" rule PermissionsScreen-less flows in this app already follow.

export const PUSH_PERM_ASKED_KEY_PREFIX = 'push_perm_asked_'

// Without this, a notification that arrives while the app is open and
// foregrounded is delivered to the JS side silently — no banner, no sound —
// since expo-notifications leaves "what happens in foreground" to the app
// by design. Module-level (runs once on import, same style as App.jsx's own
// top-level SplashScreen.preventAutoHideAsync() call) rather than inside a
// component, since it's a one-time global registration, not per-render
// state.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Matches the single channel the Edge Function already assumes exists for
// Android sends (send-push-notification/index.ts sets channelId: 'default'
// on every Android message) — without creating it, Android 8+ silently
// drops notifications sent to a channel that was never registered.
async function ensureAndroidChannelAsync() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
  }).catch(() => {})
}

function platformKey() {
  // push_tokens.platform check constraint is ios | android | web.
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'android') return 'android'
  return 'web'
}

// Resolves an Expo push token for this device and upserts it via
// register_push_token(). Returns true on success, false on any failure —
// never throws, since a failed registration must not block anything else
// (same best-effort stance the server side already takes: the dispatch
// trigger swallows its own errors rather than ever blocking a notification
// insert).
async function fetchAndRegisterTokenAsync() {
  try {
    // No projectId passed — getExpoPushTokenAsync resolves it itself from
    // app.json's extra.eas.projectId (the EAS project id already set there).
    const { data: token } = await Notifications.getExpoPushTokenAsync()
    if (!token) return false

    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: platformKey(),
    })
    return !error
  } catch {
    return false
  }
}

// Call once the person is settled in the main app (see AppShell). Prompts
// for permission at most once per account+device — tracked in AsyncStorage,
// same pattern BlueprintTourScreen uses for "has this account seen the
// first-launch tour". A denial is respected silently: no retry, no nag.
export async function requestAndRegisterAsync(userId) {
  if (!userId) return
  // Web push needs a VAPID/service-worker setup this app doesn't have yet —
  // skip asking there rather than prompting into a flow that can't deliver.
  if (Platform.OS === 'web') return
  // Real devices only — a push token request on a simulator/emulator just
  // throws, with nothing for the person to grant.
  if (!Device.isDevice) return

  const askedKey = `${PUSH_PERM_ASKED_KEY_PREFIX}${userId}`
  const alreadyAsked = await AsyncStorage.getItem(askedKey).catch(() => null)

  const current = await Notifications.getPermissionsAsync().catch(() => null)

  if (current?.granted) {
    await ensureAndroidChannelAsync()
    await fetchAndRegisterTokenAsync()
    return
  }

  // Already asked once on this device for this account and it wasn't
  // granted — never prompt again, this app's permission flows don't nag.
  if (alreadyAsked) return

  const result = await Notifications.requestPermissionsAsync().catch(() => null)
  await AsyncStorage.setItem(askedKey, '1').catch(() => {})

  if (result?.granted) {
    await ensureAndroidChannelAsync()
    await fetchAndRegisterTokenAsync()
  }
}

// Call on app foreground / re-focus. Never prompts — only re-registers a
// token if permission is already granted, which covers Expo rolling the
// device's underlying token without this app's knowledge (the documented
// reason addPushTokenListener exists) and the normal "token can go stale
// after N days unused" case Expo's own docs call out.
export async function reRegisterIfAlreadyGrantedAsync(userId) {
  if (!userId || Platform.OS === 'web' || !Device.isDevice) return
  const current = await Notifications.getPermissionsAsync().catch(() => null)
  if (!current?.granted) return
  await ensureAndroidChannelAsync()
  await fetchAndRegisterTokenAsync()
}

// Re-derives and registers the Expo push token after addPushTokenListener
// fires — that listener hands back the raw native (FCM/APNs) device token,
// not an Expo-formatted one, so there's nothing to upsert directly from its
// payload; fetching the Expo token again is what actually picks up the
// change, since getExpoPushTokenAsync() internally reads the now-current
// device token under the hood. No permission check needed here: the device
// token changing at all implies permission was already granted.
export async function onDeviceTokenChangedAsync(userId) {
  if (!userId || Platform.OS === 'web') return
  await ensureAndroidChannelAsync()
  await fetchAndRegisterTokenAsync()
}
