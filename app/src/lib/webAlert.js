import { Alert, Platform } from 'react-native'

// react-native-web ships Alert.alert as an empty function, so on the web build
// every confirmation ("Discard this request?", "Delete", "Log out") silently
// does nothing and the button looks dead. This replaces it, on web only, with
// the browser's own alert and confirm so the same calls work everywhere.
//
// Rules, matching the native behaviour as closely as the browser allows:
//   no buttons or one button  -> window.alert, then that button's onPress
//   one cancel and one action -> window.confirm: OK runs the action, Cancel
//                                runs the cancel button's onPress
//   more actions              -> a numbered prompt; Cancel or a bad number
//                                runs the cancel button
// `options.onDismiss` runs when a prompt is dismissed and there is no cancel
// button.
//
// Import once, at app start (App.jsx). It does nothing on iOS and Android.
export function installWebAlert() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return
  if (Alert.__ubpWebAlert) return

  Alert.alert = function webAlert(title, message, buttons, options) {
    const text = [title, message].filter(Boolean).join('\n\n')
    const list = Array.isArray(buttons) ? buttons : []
    const cancel = list.find(b => b?.style === 'cancel')
    const actions = list.filter(b => b && b !== cancel)

    const dismissed = () => {
      if (cancel?.onPress) cancel.onPress()
      else options?.onDismiss?.()
    }

    try {
      if (actions.length === 0 && !cancel) {
        window.alert(text)
        return
      }
      if (actions.length === 0 && cancel) {
        window.alert(text)
        cancel.onPress?.()
        return
      }
      if (actions.length === 1) {
        if (!cancel) {
          window.alert(text)
          actions[0].onPress?.()
          return
        }
        if (window.confirm(text)) actions[0].onPress?.()
        else dismissed()
        return
      }
      const menu = actions.map((b, i) => `${i + 1}. ${b.text || 'OK'}`).join('\n')
      const answer = window.prompt(`${text}\n\n${menu}\n\nType a number.`)
      const picked = answer == null ? null : actions[Number.parseInt(answer, 10) - 1]
      if (picked) picked.onPress?.()
      else dismissed()
    } catch {
      // A blocked or missing dialog must never break the screen.
    }
  }
  Alert.__ubpWebAlert = true
}
