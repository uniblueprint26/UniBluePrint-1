import * as Sentry from '@sentry/react-native'

// Crash reporting — there was none at all before this, which meant a real
// device crash (the "app closes on its own after a while" report) left
// zero trace to diagnose from. Reads the DSN from EXPO_PUBLIC_SENTRY_DSN
// (same EXPO_PUBLIC_ convention .env.local already uses for the Supabase
// keys) rather than hardcoding one, since no Sentry project exists yet.
//
// Deliberately a no-op, not a crash, when the DSN isn't set: every other
// developer's local checkout (and this one, until the real DSN is added)
// must keep working exactly as before. init() is safe to call unconditionally
// from index.js — it just does nothing if DSN is missing.
//
// Default integrations (enabled automatically, nothing extra to wire up
// here) cover: unhandled JS exceptions, unhandled promise rejections, and
// — once this ships inside a real EAS build rather than Expo Go, see below
// — native crashes and out-of-memory kills.
//
// Expo Go caveat: Expo Go is a shared, pre-built container app — it cannot
// load Sentry's native module, so while testing through plain `expo start`
// + Expo Go, only JS-level errors (exceptions, promise rejections) are
// captured, not a true native crash or OOM kill. If the "closes after a
// while" bug turns out to be native/OOM, it will only show up in Sentry
// once tested through a custom dev client or EAS build
// (`eas build --profile development`), not Expo Go.
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    // Session Replay / tracing aren't worth the overhead for a bug hunt —
    // just want crash/error signal. Can be raised later if useful.
    tracesSampleRate: 0,
  })
}

export { Sentry }
