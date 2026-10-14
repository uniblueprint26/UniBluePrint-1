/**
 * useSafeGoBack — guards navigation.goBack() against the
 * "The action 'GO_BACK' was not handled by any navigator" crash, which
 * fires whenever goBack() is called on a screen with no back history:
 * reached directly via a deep link, via a push-notification tap
 * (useNotificationDeepLinking), or as the first screen after a stack
 * reset.
 *
 * Usage (replaces `onPress={() => navigation.goBack()}` /
 * `onBack={() => navigation.goBack()}`):
 *
 *   const safeGoBack = useSafeGoBack(navigation)
 *   <TouchableOpacity onPress={safeGoBack}>
 *   <ScreenHeader onBack={safeGoBack} />
 *
 * When there IS back history, this behaves exactly like
 * `navigation.goBack()`. When there isn't, it falls back to a sensible
 * in-app destination instead of crashing:
 *
 *   1. An explicit `fallbackRoute`, if given and present in the current
 *      navigator (e.g. 'Foundation' for a screen that should prefer that
 *      over Home when landed on directly).
 *   2. The current navigator's own "<Something>Main" screen, if it has one
 *      — every root tab stack (HomeStack, AdBoardStack, MessagesStack,
 *      DirectoryStack, ProfileStack) registers its landing screen this way
 *      (see navigation/index.jsx), so this lands back on whichever section
 *      the screen already belongs to rather than always jumping to Home.
 *   3. goToHome(navigation) — walks up to the Home tab's HomeMain screen,
 *      the same fallback the UBP logo's tap-to-home already uses.
 */

import { useCallback } from 'react'
import { goToHome } from '../navigation/helpers'

function routeExistsInCurrentNavigator(navigation, routeName) {
  if (!routeName) return false
  try {
    return !!navigation?.getState?.()?.routeNames?.includes(routeName)
  } catch {
    return false
  }
}

function goToSafeFallback(navigation, fallbackRoute) {
  if (routeExistsInCurrentNavigator(navigation, fallbackRoute)) {
    navigation.navigate(fallbackRoute)
    return
  }
  try {
    const mainRoute = navigation?.getState?.()?.routeNames?.find(name => name.endsWith('Main'))
    if (mainRoute) {
      navigation.navigate(mainRoute)
      return
    }
  } catch {}
  goToHome(navigation)
}

/**
 * @param {object} navigation - the screen's `navigation` prop/object. Safe
 *   to call even when this is null/undefined (no-ops, matching how the
 *   unguarded `navigation?.goBack()` call sites already behaved).
 * @param {string} [fallbackRoute] - a screen name in the SAME navigator to
 *   prefer over the generic fallback when there's no back history.
 * @returns {() => void} a stable callback safe to pass directly to
 *   onPress / onBack.
 */
export function useSafeGoBack(navigation, fallbackRoute) {
  return useCallback(() => {
    if (!navigation) return
    if (navigation.canGoBack?.()) {
      navigation.goBack()
      return
    }
    goToSafeFallback(navigation, fallbackRoute)
  }, [navigation, fallbackRoute])
}
