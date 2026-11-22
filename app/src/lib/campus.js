import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'
import { INSTITUTIONS } from '../data/institutions'

// Shared helpers for Campus Connect and Course Connect.

// A college must have at least this many members before it shows in Campus
// ranked. The database enforces the same floor (campus_ranking).
export const RANKING_MIN_MEMBERS = 25

// The member's campus community. Students have a campus (profiles.institution).
// Apprentices have a training provider and workers have an industry, and those
// are their community. The server reads the same order in my_institution():
// campus_community, then institution, then training_provider, then industry.
// User metadata is the fallback for accounts made before the profile columns.
export function useCampus() {
  const { user, profile } = useAuth()
  const meta = user?.user_metadata || {}
  const pick = (...vals) => vals.map(v => (typeof v === 'string' ? v.trim() : '')).find(Boolean) || null
  const institution = pick(
    profile?.campus_community, profile?.institution, profile?.training_provider, profile?.industry,
    meta.institution, meta.training_provider, meta.industry,
  )
  const found = institution ? INSTITUTIONS.find(i => i.name === institution) : null
  const short = (found && meta.institution_short) || found?.short || institution
  return { institution, short, city: found?.city || null, hasCampus: !!institution }
}

export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'M'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

// Real live counts per board, from the database (campus_board_counts).
// Returns { [boardKey]: { total, week } }. Empty until loaded or on error.
export function useBoardCounts() {
  const [counts, setCounts] = useState({})
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('campus_board_counts')
        if (cancelled || error || !Array.isArray(data)) return
        const next = {}
        data.forEach(r => { next[r.board_key] = { total: Number(r.total) || 0, week: Number(r.this_week) || 0 } })
        setCounts(next)
      } catch { /* counts are optional */ }
    })()
    return () => { cancelled = true }
  }, [])
  return counts
}

export function countLine(c) {
  if (!c) return ''
  if (!c.total) return 'No posts yet'
  const base = `${c.total} post${c.total === 1 ? '' : 's'}`
  return c.week ? `${base}, ${c.week} new this week` : base
}

// Members on the same campus, for the community line. Hidden when unknown.
export function useCampusMemberCount(institution) {
  const [n, setN] = useState(null)
  useEffect(() => {
    if (!institution) { setN(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const { count, error } = await supabase
          .from('profiles').select('id', { count: 'exact', head: true }).eq('institution', institution)
        if (!cancelled && !error && typeof count === 'number') setN(count)
      } catch { /* optional */ }
    })()
    return () => { cancelled = true }
  }, [institution])
  return n
}

// ── Weather (open-meteo, free, no key, no account) ──────────────────────────
const WMO = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Part cloud', 3: 'Cloudy', 45: 'Fog', 48: 'Fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

export function whatToWear({ feelsLike, rainChance, wind, code }) {
  const tips = []
  if (feelsLike <= 3) tips.push('A warm coat, hat and gloves')
  else if (feelsLike <= 9) tips.push('A warm jacket and a scarf')
  else if (feelsLike <= 15) tips.push('A light jacket or a hoodie')
  else if (feelsLike <= 21) tips.push('A t-shirt and a light layer for the evening')
  else tips.push('Light clothes and water')
  const wet = rainChance >= 50 || (code >= 51 && code <= 82)
  if (wet) tips.push('A waterproof jacket or umbrella')
  if (wind >= 35) tips.push('It is windy, so skip the umbrella and hood up')
  if (code === 0 && feelsLike >= 14) tips.push('Sunscreen if you are out long')
  if (code >= 71 && code <= 75) tips.push('Shoes with grip')
  return tips
}

export function useWeather(city) {
  const [state, setState] = useState({ loading: true, error: false, data: null })
  const load = useCallback(async () => {
    setState({ loading: true, error: false, data: null })
    try {
      const place = city || 'Dublin'
      const g = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&country_code=IE&language=en&format=json`,
      ).then(r => r.json())
      const hit = g?.results?.[0]
      if (!hit) throw new Error('no place')
      const w = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}` +
        '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m' +
        '&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Europe%2FDublin',
      ).then(r => r.json())
      const c = w?.current
      if (!c) throw new Error('no weather')
      const code = c.weather_code
      const rainChance = w?.daily?.precipitation_probability_max?.[0] ?? 0
      const data = {
        place: hit.name,
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        wind: Math.round(c.wind_speed_10m),
        code,
        label: WMO[code] || 'Weather',
        high: Math.round(w?.daily?.temperature_2m_max?.[0] ?? c.temperature_2m),
        low: Math.round(w?.daily?.temperature_2m_min?.[0] ?? c.temperature_2m),
        rainChance,
      }
      data.wear = whatToWear({ feelsLike: data.feelsLike, rainChance, wind: data.wind, code })
      setState({ loading: false, error: false, data })
    } catch {
      setState({ loading: false, error: true, data: null })
    }
  }, [city])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

// ── Next seven days for the ride share day row ──────────────────────────────
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function nextSevenDays() {
  const out = []
  const base = new Date()
  base.setHours(12, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 86400000)
    out.push({
      key: isoDate(d),
      dow: DOW[d.getDay()],
      day: d.getDate(),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DOW[d.getDay()],
    })
  }
  return out
}
export function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function dowOfIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return DOW[new Date(y, m - 1, d, 12).getDay()]
}
