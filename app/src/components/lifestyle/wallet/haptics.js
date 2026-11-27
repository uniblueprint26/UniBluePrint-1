import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

// Small safe wrappers. Haptics only run on a real phone, never throw, never sound.
const on = Platform.OS !== 'web'

export function tick() { if (on) Haptics.selectionAsync().catch(() => {}) }
export function light() { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}) }
export function medium() { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}) }
export function heavy() { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}) }
export function done() { if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}) }
