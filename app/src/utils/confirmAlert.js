import { Alert } from 'react-native'

/**
 * Promise-wrapped confirm dialog — resolves `true` on the confirm button,
 * `false` on Cancel (or if the alert is dismissed). Used before any paid
 * action (Ad Board / Marketplace listing checkout) to disclose exactly
 * what the user is about to be charged and why, before checkout starts.
 */
export function confirmAsync(title, message, confirmLabel = 'Continue to payment') {
  return new Promise(resolve => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) })
  })
}
