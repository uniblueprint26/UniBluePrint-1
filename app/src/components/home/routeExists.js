// True when `name` is registered on this navigator or any parent of it.
export function routeExists(navigation, name) {
  let nav = navigation
  while (nav) {
    try {
      if (nav.getState?.()?.routeNames?.includes(name)) return true
    } catch {}
    nav = nav.getParent?.()
  }
  return false
}
