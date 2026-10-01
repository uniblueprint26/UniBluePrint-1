// Production error reporting, via Sentry. Without this, an unhandled render
// crash (caught by ErrorBoundary.jsx) or an uncaught exception anywhere else
// only ever reaches the browser console of whoever happened to be looking —
// invisible to the team during launch week, when it matters most.
//
// Opt-in by design: with no VITE_SENTRY_DSN set, init() is a no-op and
// reportError() just falls through — Vite inlines that as `if (!undefined)`
// at build time, so esbuild dead-code-eliminates the entire @sentry/react
// import today, shipping zero extra bytes. No code change needed to turn
// this on later, but since Vite env vars are compiled in at BUILD time (not
// read at runtime like a server secret), adding VITE_SENTRY_DSN to Netlify
// requires a new deploy to actually take effect, not just saving the var.

import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export function initErrorReporting() {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Keep this conservative at launch — full session/performance tracing
    // can be turned up later once there's a sense of real traffic volume.
    tracesSampleRate: 0.1,
  })
}

export function reportError(error, context) {
  if (!dsn) return
  Sentry.captureException(error, context ? { extra: context } : undefined)
}
