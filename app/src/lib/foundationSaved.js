import AsyncStorage from '@react-native-async-storage/async-storage'
import { FOUNDATION_SERVICE_KEYS } from '../constants/foundationServices'

// Saved answers for the Foundation builders, for a store build where the app
// does not order. The answers live in the same draft the builders already
// autosave (`foundation_draft:<service>:<user id>`, see hooks/useDraftAutosave).
// Finishing a builder writes the final answers there and stamps a second key,
// `foundation_saved:<service>:<user id>`, with the time. The stamp is what makes
// the envelope read "Saved" and sends a member to the review page next time.
// Both keys are per account, so another person on the same phone never sees them.

const draftKey = (service, userId) => `foundation_draft:${service}:${userId}`
const savedKey = (service, userId) => `foundation_saved:${service}:${userId}`

// Writes the answers and the saved stamp. Throws if the phone refuses to store
// them, so the builder can say so instead of showing a false success.
export async function saveFoundationAnswers(service, userId, values) {
  if (!userId) throw new Error('You need to be signed in to save your answers.')
  try {
    await AsyncStorage.setItem(draftKey(service, userId), JSON.stringify(values))
    await AsyncStorage.setItem(savedKey(service, userId), new Date().toISOString())
  } catch (e) {
    console.error('[foundationSaved] could not save answers', e)
    throw new Error('We could not save your answers on this device. Please try again.')
  }
}

// { cv: '2026-12-26T10:00:00.000Z', ... } for the services this member has saved.
// A storage error gives an empty answer, so a hub never fails to draw.
export async function loadSavedStamps(userId) {
  if (!userId) return {}
  try {
    const pairs = await AsyncStorage.multiGet(FOUNDATION_SERVICE_KEYS.map(k => savedKey(k, userId)))
    const out = {}
    pairs.forEach(([key, value], i) => { if (value) out[FOUNDATION_SERVICE_KEYS[i]] = value })
    return out
  } catch {
    return {}
  }
}
