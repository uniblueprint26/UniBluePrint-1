// Share a page as a picture (native). Captures a view with react-native-view-shot
// and opens the share sheet with the image. Everything here is defensive: when
// the native module is not in this build (an older dev client) or anything goes
// wrong, shareCard() returns false and the caller falls back to sharing text.
//
// The web build uses shareCard.web.js instead, so react-native-view-shot (which
// needs html2canvas on web) is never bundled there.

import { Platform, Share } from 'react-native'

let ViewShot = null
let Sharing = null
try { ViewShot = require('react-native-view-shot') } catch { ViewShot = null }
try { Sharing = require('expo-sharing') } catch { Sharing = null }

export function canShareCard() {
  return !!(ViewShot && typeof ViewShot.captureRef === 'function')
}

function toFileUri(uri) {
  if (typeof uri !== 'string' || !uri) return null
  return /^[a-z][a-z0-9+.-]*:/i.test(uri) ? uri : `file://${uri}`
}

// ref: a React ref to the card view (collapsable={false}).
// Returns true when the share sheet was opened with the picture (even if the
// reader then closed it), false when the caller should share text instead.
export async function shareCard(ref, { message, title } = {}) {
  if (!canShareCard() || !ref || !ref.current) return false
  let uri = null
  try {
    uri = toFileUri(await ViewShot.captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' }))
  } catch { return false }
  if (!uri) return false
  try {
    if (Platform.OS === 'ios') {
      // iOS shows the picture with the short text beside it.
      await Share.share({ url: uri, message })
      return true
    }
    // The built in Android share cannot attach a file, so expo-sharing is used.
    if (Sharing && typeof Sharing.shareAsync === 'function' && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title || 'Share' })
      return true
    }
  } catch { return false }
  return false
}
