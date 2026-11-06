import Constants from 'expo-constants'

// Crash reporting — there was none at all before this, which meant a real
// device crash (the "app closes on its own after a while" report) left
// zero trace to diagnose from. Reads the DSN from EXPO_PUBLIC_SENTRY_DSN
// (same EXPO_PUBLIC_ convention .env.local already uses for the Supabase
// keys) rather than hardcoding one, since no Sentry project exists yet.
//
// Expo Go is a shared, pre-built container app with no compiled-in Sentry
// native module. A plain `import * as Sentry from '@sentry/react-native'`
// still pulls in that native binding at module-load time, and on this SDK
// version that throws a fatal *native* exception just from being imported —
// not a catchable JS error, so ErrorBoundary never sees it and the whole
// Expo Go app closes instead of showing a redbox. So the package is only
// `require()`d (never statically imported) and only outside Expo Go; every
// other call site goes through the no-op-safe wrapper below instead of the
// raw SDK, so nothing needs its own null check.
const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient'

let SentryNative = null
if (!isExpoGo) {
  try {
    // eslint-disable-next-line global-require
    SentryNative = require('@sentry/react-native')
  } catch {
    SentryNative = null
  }
}

// Deliberately a no-op, not a crash, when the DSN isn't set or we're in
// Expo Go: every other developer's local checkout (and this one, until the
// real DSN is added) must keep working exactly as before. init() is safe to
// call unconditionally from index.js.
//
// Default integrations (enabled automatically, nothing extra to wire up
// here) cover: unhandled JS exceptions, unhandled promise rejections, and
// — once this ships inside a real EAS build rather than Expo Go — native
// crashes and out-of-memory kills. If the "closes after a while" bug turns
// out to be native/OOM, it will only show up in Sentry once tested through
// a custom dev client or EAS build (`eas build --profile development`),
// not Expo Go.
export function initSentry() {
  if (!SentryNative) return
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
  if (!dsn) return
  try {
    SentryNative.init({
      dsn,
      // Session Replay / tracing aren't worth the overhead for a bug hunt —
      // just want crash/error signal. Can be raised later if useful.
      tracesSampleRate: 0,
    })
  } catch {}
}

export const Sentry = {
  captureException(...args) {
    if (!SentryNative) return
    try {
      SentryNative.captureException(...args)
    } catch {}
  },
}
