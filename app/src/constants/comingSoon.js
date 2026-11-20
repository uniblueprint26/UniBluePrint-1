import { useAppFlag, getAppFlag } from '../hooks/useAppFlags'

// The remote switch for every "coming soon" tile, sheet and label.
//
// It is the app_flags row `coming_soon_tiles`, and it is OFF (false) by default
// so nothing says "coming soon" during store review. When the founder turns it
// on, the tiles appear and use the shared copy below.
//
//   const comingSoonOn = useComingSoonEnabled()   // inside a component
//   if (isComingSoonEnabledNow()) { ... }         // outside React
//
// COMING_SOON_ENABLED is the same helper under its flag style name, so
// `const COMING_SOON_ENABLED = useComingSoon()` reads naturally in a component.

export const COMING_SOON_FLAG = 'coming_soon_tiles'

// The one copy used wherever a coming soon label is shown. Nothing more.
export const COMING_SOON_COPY = 'Stay tuned. Coming soon.'
export const COMING_SOON_TITLE = 'Coming soon'

export function useComingSoonEnabled() {
  return useAppFlag(COMING_SOON_FLAG).value
}

export const useComingSoon = useComingSoonEnabled

export function isComingSoonEnabledNow() {
  return getAppFlag(COMING_SOON_FLAG)
}

export const COMING_SOON_ENABLED = useComingSoonEnabled
