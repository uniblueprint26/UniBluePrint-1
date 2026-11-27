import { useEffect, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../context/AuthContext'

// Everything the deal wallet remembers, on this device, per account.
//   favs      partner ids the member hearted (pinned to the top of the wallet)
//   uses      { partnerId: count } of "I used this deal" taps
//   scratched { partnerId: true } once the scratch panel has been rubbed off
//   secrets   { 1..6: true } the cosmetic Easter eggs found, badges only
//   hints     { key: true } one time hints already shown
// One AsyncStorage key per account. Signed out falls back to a "guest" key.
// Every read and write is wrapped, so a storage problem never breaks a screen.

export const SECRET_COUNT = 6
export const SECRETS = {
  1: 'Scratch or hold to reveal',
  2: 'Hidden slogan',
  3: 'Confetti',
  4: 'Shake to flip',
  5: 'Tap the wave',
  6: 'Peel back',
}
export const REGULAR_AFTER = 3

const EMPTY = { favs: [], uses: {}, scratched: {}, secrets: {}, hints: {} }
const keyFor = userId => `ubp_wallet_v1:${userId || 'guest'}`

const states = new Map()      // userId -> state
const listeners = new Map()   // userId -> Set(fn)
const loading = new Map()

function norm(raw) {
  const o = raw && typeof raw === 'object' ? raw : {}
  return {
    favs: Array.isArray(o.favs) ? o.favs.filter(x => typeof x === 'string') : [],
    uses: o.uses && typeof o.uses === 'object' ? o.uses : {},
    scratched: o.scratched && typeof o.scratched === 'object' ? o.scratched : {},
    secrets: o.secrets && typeof o.secrets === 'object' ? o.secrets : {},
    hints: o.hints && typeof o.hints === 'object' ? o.hints : {},
  }
}

function emit(uid) {
  listeners.get(uid)?.forEach(fn => { try { fn() } catch {} })
}

export async function loadWallet(userId) {
  const uid = userId || 'guest'
  if (states.has(uid)) return states.get(uid)
  if (loading.has(uid)) return loading.get(uid)
  const p = (async () => {
    let next = { ...EMPTY }
    try {
      const raw = await AsyncStorage.getItem(keyFor(uid))
      if (raw) next = norm(JSON.parse(raw))
    } catch { /* start empty */ }
    // Keep anything changed while the read was in flight.
    states.set(uid, states.get(uid) || next)
    emit(uid)
    return states.get(uid)
  })().finally(() => loading.delete(uid))
  loading.set(uid, p)
  return p
}

function commit(uid, next) {
  states.set(uid, next)
  emit(uid)
  AsyncStorage.setItem(keyFor(uid), JSON.stringify(next)).catch(() => {})
}

// Preview and test helper. Not used by the app screens.
export function seedWallet(userId, partial) {
  const uid = userId || 'guest'
  states.set(uid, norm({ ...EMPTY, ...partial }))
  emit(uid)
}

export function useWallet() {
  const { user } = useAuth()
  const uid = user?.id || 'guest'
  const [, bump] = useState(0)

  useEffect(() => {
    const fn = () => bump(n => n + 1)
    if (!listeners.has(uid)) listeners.set(uid, new Set())
    listeners.get(uid).add(fn)
    loadWallet(uid)
    return () => { listeners.get(uid)?.delete(fn) }
  }, [uid])

  const state = states.get(uid) || EMPTY
  const ready = states.has(uid)

  const update = useCallback(fn => {
    // Never write before the saved data has been read, or it would be wiped.
    if (states.has(uid)) commit(uid, fn(states.get(uid)))
    else loadWallet(uid).then(cur => commit(uid, fn(cur || EMPTY)))
  }, [uid])

  const toggleFav = useCallback(id => update(s => ({
    ...s, favs: s.favs.includes(id) ? s.favs.filter(x => x !== id) : [id, ...s.favs],
  })), [update])

  const addUse = useCallback(id => update(s => ({ ...s, uses: { ...s.uses, [id]: (s.uses[id] || 0) + 1 } })), [update])
  const markScratched = useCallback(id => update(s => (s.scratched[id] ? s : { ...s, scratched: { ...s.scratched, [id]: true } })), [update])
  const findSecret = useCallback(n => update(s => (s.secrets[n] ? s : { ...s, secrets: { ...s.secrets, [n]: true } })), [update])
  const markHint = useCallback(k => update(s => (s.hints[k] ? s : { ...s, hints: { ...s.hints, [k]: true } })), [update])

  const dealsUsed = Object.values(state.uses).reduce((a, b) => a + (Number(b) || 0), 0)
  const secretsFound = Object.keys(state.secrets).filter(k => state.secrets[k]).length

  return {
    ready,
    userId: user?.id || null,
    favs: state.favs,
    uses: state.uses,
    scratched: state.scratched,
    secrets: state.secrets,
    hints: state.hints,
    dealsUsed,
    secretsFound,
    isFav: id => state.favs.includes(id),
    isRegular: id => (state.uses[id] || 0) >= REGULAR_AFTER,
    toggleFav, addUse, markScratched, findSecret, markHint,
  }
}
