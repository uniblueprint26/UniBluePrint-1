import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'

// Real personal numbers for Today's Digest. Nothing here is invented: each
// reader returns null when the number cannot be read, and the card then
// leaves that stat out or shows a dash.

// ── Goals: done out of total ────────────────────────────────────────────────
// Same source as the Your goals grid: public.user_goals, falling back to the
// per-user AsyncStorage list when the table cannot be reached.

const goalsKey = userId => `ubp_user_goals_${userId}`
const goalListeners = new Set()

// GoalsGrid calls this whenever its list changes, so the digest follows a tick
// or a new goal at once instead of waiting for Home to regain focus.
export function publishGoals(goals) {
  if (!Array.isArray(goals)) return
  const own = goals.filter(g => g && (g.source === 'custom' || g.source === 'foundation' || g.source == null))
  const summary = { done: own.filter(g => g.done).length, total: own.length }
  goalListeners.forEach(fn => fn(summary))
}

async function readGoalSummary(userId) {
  let rows
  try {
    const { data, error } = await supabase
      .from('user_goals')
      .select('done')
      .eq('user_id', userId)
      .in('source', ['custom', 'foundation'])
    if (error) throw error
    rows = data || []
  } catch {
    try {
      const raw = await AsyncStorage.getItem(goalsKey(userId))
      const parsed = raw ? JSON.parse(raw) : []
      rows = Array.isArray(parsed) ? parsed : []
    } catch { rows = [] }
  }
  return { done: rows.filter(g => g.done).length, total: rows.length }
}

export function useGoalSummary(userId) {
  const [summary, setSummary] = useState(null)

  useFocusEffect(useCallback(() => {
    if (!userId) { setSummary(null); return }
    let cancelled = false
    readGoalSummary(userId).then(s => { if (!cancelled) setSummary(s) }).catch(() => {})
    return () => { cancelled = true }
  }, [userId]))

  useEffect(() => {
    goalListeners.add(setSummary)
    return () => { goalListeners.delete(setSummary) }
  }, [])

  return summary
}

// ── Budget left this month ──────────────────────────────────────────────────
// Read the way BudgetingScreen saves it: AsyncStorage 'ub_budget_v1_<userId>'
// holds { period, income, expenses }, and money put toward savings goals comes
// off the balance (public.budget_goals.current_amount). Only shown when the
// saved budget is a monthly one with some figures, and only when the goals
// total can be read too, so the number always matches the Budgeting screen.

const budgetKey = userId => `ub_budget_v1_${userId}`
const sum = list => (Array.isArray(list) ? list : []).reduce((s, i) => s + (parseFloat(i?.amount) || 0), 0)

async function readBudgetLeft(userId) {
  try {
    const raw = await AsyncStorage.getItem(budgetKey(userId))
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved?.period !== 'month') return null
    const income = sum(saved.income)
    const expenses = sum(saved.expenses)
    if (income <= 0 && expenses <= 0) return null
    const { data, error } = await supabase.from('budget_goals').select('current_amount').eq('user_id', userId)
    if (error) return null
    const saved2 = (data || []).reduce((s, g) => s + (parseFloat(g.current_amount) || 0), 0)
    return income - expenses - saved2
  } catch { return null }
}

export function useBudgetLeft(userId) {
  const [left, setLeft] = useState(null)
  useFocusEffect(useCallback(() => {
    if (!userId) { setLeft(null); return }
    let cancelled = false
    readBudgetLeft(userId).then(v => { if (!cancelled) setLeft(v) }).catch(() => {})
    return () => { cancelled = true }
  }, [userId]))
  return left
}
