import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Plus, ShieldCheck, Check, Bell, Pencil, Repeat, Receipt, Trash2 } from 'lucide-react-native'
import { ToolScreen, Card, Eyebrow, H2, Body, Btn, Chip, Field, FormSheet } from '../../components/explore/ToolBits'
import Avatar from '../../components/directory/Avatar'
import { supabase } from '../../lib/supabase'
import { checkText, GUIDELINES_MESSAGE, moderationMessage } from '../../lib/moderation'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/theme'

// Split the bill and split subscriptions. Tracking only: UBP never holds, moves
// or collects money. It just remembers who paid, who is in and who has settled.
// Only friends (people you both follow) can be added. Everyone in a split sees
// it. Only the person who made it edits amounts. Changes go through database
// functions (see migration 20261120500000), which also send the notifications.

const GOLD = '#B4923A'
const GOLD_DARK = '#D4B766'
const CADENCES = [['weekly', 'Every week'], ['monthly', 'Every month'], ['yearly', 'Every year']]

export const money = c => `€${((c || 0) / 100).toFixed(2)}`

function parseCents(text) {
  const t = String(text || '').replace(/[€\s]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  const c = Math.round(parseFloat(t) * 100)
  return c > 0 && c <= 1000000 ? c : null
}

// Equal split in cents. Any odd cents go to the first people.
export function equalShares(totalCents, ids) {
  const n = ids.length
  if (!n || !totalCents) return {}
  const base = Math.floor(totalCents / n)
  const extra = totalCents - base * n
  const out = {}
  ids.forEach((id, i) => { out[id] = base + (i < extra ? 1 : 0) })
  return out
}

// What a split means for the signed-in member.
function summarise(split, me) {
  const members = split.bill_split_members || []
  const others = members.filter(m => m.user_id !== split.paid_by)
  const open = others.filter(m => !m.settled)
  const mine = members.find(m => m.user_id === me)
  let owed = 0
  let owe = 0
  if (split.paid_by === me) owed = open.reduce((a, m) => a + m.share_cents, 0)
  else if (mine && !mine.settled) owe = mine.share_cents
  return { owed, owe, others, open, allSettled: open.length === 0 }
}

export default function SplitBillScreen({ navigation, route }) {
  const { colors, isDark } = useTheme()
  const { user } = useAuth()
  const me = user?.id
  const gold = isDark ? GOLD_DARK : GOLD
  const [splits, setSplits] = useState([])
  const [people, setPeople] = useState({})
  const [friends, setFriends] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(route?.params?.splitId || null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!me) return
    try {
      const { data, error: e } = await supabase
        .from('bill_splits')
        .select('*, bill_split_members(*)')
        .order('created_at', { ascending: false })
      if (e) throw e
      const rows = data || []
      setSplits(rows)
      const map = {}
      if (rows.length) {
        const { data: p } = await supabase.rpc('get_bill_split_people', { p_split_ids: rows.map(r => r.id) })
        ;(p || []).forEach(x => { map[x.user_id] = { id: x.user_id, full_name: x.full_name, avatar_url: x.avatar_url } })
      }
      setPeople(map)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [me])

  const loadFriends = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_split_friends')
      setFriends((data || []).map(f => ({ id: f.user_id, full_name: f.full_name, avatar_url: f.avatar_url })))
    } catch {
      setFriends([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load(); loadFriends() }, [load, loadFriends]))
  useEffect(() => { if (route?.params?.splitId) setOpenId(route.params.splitId) }, [route?.params?.splitId])

  const nameOf = id => (id === me ? 'You' : people[id]?.full_name || friends.find(f => f.id === id)?.full_name || 'A friend')
  const personOf = id => people[id] || friends.find(f => f.id === id) || { id, full_name: nameOf(id) }

  const visible = useMemo(() => splits.filter(s => filter === 'all' || s.kind === filter), [splits, filter])
  const totals = useMemo(() => splits.reduce((a, s) => {
    const x = summarise(s, me)
    return { owed: a.owed + x.owed, owe: a.owe + x.owe }
  }, { owed: 0, owe: 0 }), [splits, me])

  const opened = splits.find(s => s.id === openId) || null

  // ── Form ──────────────────────────────────────────────────────────────────
  function openNew(kind = 'bill') {
    setError('')
    setForm({ id: null, title: '', kind, cadence: 'monthly', total: '', paidBy: me, mode: 'equal', ids: [me], custom: {} })
  }

  function openEdit(split) {
    setError('')
    const ms = split.bill_split_members || []
    const custom = {}
    ms.forEach(m => { custom[m.user_id] = (m.share_cents / 100).toFixed(2) })
    setOpenId(null)
    setForm({
      id: split.id, title: split.title, kind: split.kind, cadence: split.cadence || 'monthly',
      total: (split.total_cents / 100).toFixed(2), paidBy: split.paid_by, mode: split.split_mode,
      ids: ms.map(m => m.user_id), custom,
    })
  }

  const formCents = form ? parseCents(form.total) : null
  const shares = useMemo(() => {
    if (!form) return {}
    if (form.mode === 'equal') return formCents ? equalShares(formCents, form.ids) : {}
    const out = {}
    form.ids.forEach(id => { out[id] = parseCents(form.custom[id]) ?? 0 })
    return out
  }, [form, formCents])
  const assigned = form ? form.ids.reduce((a, id) => a + (shares[id] || 0), 0) : 0
  const left = formCents ? formCents - assigned : 0

  const candidates = useMemo(() => {
    if (!form) return []
    const seen = new Set([me])
    const list = []
    friends.forEach(f => { if (!seen.has(f.id)) { seen.add(f.id); list.push(f) } })
    form.ids.forEach(id => { if (!seen.has(id)) { seen.add(id); list.push(personOf(id)) } })
    return list
  }, [form, friends, me, people])

  function toggleId(id) {
    setForm(f => {
      const has = f.ids.includes(id)
      const ids = has ? f.ids.filter(x => x !== id) : [...f.ids, id]
      return { ...f, ids, paidBy: ids.includes(f.paidBy) ? f.paidBy : me }
    })
  }

  async function save() {
    if (busy) return
    const title = form.title.trim()
    if (!title) { setError('Say what it was for.'); return }
    if (!checkText(title).ok) { setError(GUIDELINES_MESSAGE); return }
    if (!formCents) { setError('Add the total, for example 48.00.'); return }
    if (form.ids.length < 2) { setError('Pick at least one friend.'); return }
    if (assigned !== formCents) { setError(`The shares need to add up to ${money(formCents)}.`); return }
    setBusy(true)
    setError('')
    const members = form.ids.map(id => ({ user_id: id, share_cents: shares[id] || 0 }))
    try {
      const { error: e } = form.id
        ? await supabase.rpc('update_bill_split', { p_split: form.id, p_title: title, p_total_cents: formCents, p_paid_by: form.paidBy, p_split_mode: form.mode, p_members: members })
        : await supabase.rpc('create_bill_split', { p_title: title, p_kind: form.kind, p_cadence: form.kind === 'subscription' ? form.cadence : null, p_total_cents: formCents, p_paid_by: form.paidBy, p_split_mode: form.mode, p_members: members })
      if (e) throw e
      setForm(null)
      await load()
    } catch (e) {
      setError(moderationMessage(e, 'That did not save. Check your connection and try again.'))
    } finally {
      setBusy(false)
    }
  }

  // ── Actions on a split ────────────────────────────────────────────────────
  async function run(fn) {
    if (busy) return
    setBusy(true)
    try { await fn(); await load() } catch { setError('That did not work. Try again.') } finally { setBusy(false) }
  }
  const settle = (split, uid, v) => run(async () => {
    const { error: e } = await supabase.rpc('set_bill_split_settled', { p_split: split.id, p_user: uid, p_settled: v })
    if (e) throw e
  })
  const remind = split => run(async () => {
    const { error: e } = await supabase.rpc('remind_bill_split', { p_split: split.id })
    if (e) throw e
  })
  const newRound = split => run(async () => {
    const { error: e } = await supabase.rpc('reset_bill_split_round', { p_split: split.id })
    if (e) throw e
  })
  const remove = split => run(async () => {
    const { error: e } = await supabase.rpc('delete_bill_split', { p_split: split.id })
    if (e) throw e
    setOpenId(null)
  })

  const tracking = (
    <View style={[s.notice, { backgroundColor: colors.tabFill }]}>
      <ShieldCheck size={20} color={colors.textPrimary} strokeWidth={1.8} style={{ marginTop: 1 }} />
      <Text style={[s.noticeText, { color: colors.textPrimary }]}>
        <Text style={{ fontFamily: fonts.sansSemiBold }}>Tracking only. </Text>
        UBP never moves money. Settle up in person or in your own bank app, then mark it here.
      </Text>
    </View>
  )

  return (
    <ToolScreen navigation={navigation} title="Split the bill" subtitle="Share a bill or a subscription with friends.">
      {tracking}

      {state === 'loading' && <ActivityIndicator style={{ marginTop: 40 }} color={colors.textSecondary} />}

      {state === 'error' && (
        <Card style={{ marginTop: 20 }}>
          <H2>Could not load your splits</H2>
          <Body secondary style={{ marginTop: 6 }}>Check your connection and try again.</Body>
          <Btn label="Try again" kind="secondary" onPress={() => { setState('loading'); load() }} style={{ marginTop: 16 }} />
        </Card>
      )}

      {state === 'ready' && (
        <>
          <View style={s.totals}>
            <Card style={s.total}>
              <Eyebrow>You are owed</Eyebrow>
              <Text style={[s.amount, { color: gold }]}>{money(totals.owed)}</Text>
            </Card>
            <Card style={s.total}>
              <Eyebrow>You owe</Eyebrow>
              <Text style={[s.amount, { color: gold }]}>{money(totals.owe)}</Text>
            </Card>
          </View>

          {splits.length === 0 ? (
            <Card style={{ marginTop: 20 }}>
              <H2>Nothing to split yet</H2>
              <Body secondary style={{ marginTop: 6 }}>
                Add a bill, like a takeaway or a night out, or a shared subscription. You can add friends, which means people you both follow.
              </Body>
              <Btn label="New split" Icon={Plus} onPress={() => openNew('bill')} style={{ marginTop: 18 }} />
              <Btn label="Split a subscription" kind="secondary" Icon={Repeat} onPress={() => openNew('subscription')} style={{ marginTop: 10 }} />
            </Card>
          ) : (
            <>
              <View style={s.filters}>
                {[['all', 'All'], ['bill', 'Bills'], ['subscription', 'Subscriptions']].map(([k, l]) => (
                  <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />
                ))}
              </View>
              <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Your splits</Eyebrow>
              {visible.length === 0 && <Body secondary>Nothing here yet.</Body>}
              {visible.map(sp => (
                <SplitRow key={sp.id} split={sp} me={me} gold={gold} nameOf={nameOf} onPress={() => { setError(''); setOpenId(sp.id) }} />
              ))}
              <Btn label="New split" Icon={Plus} onPress={() => openNew('bill')} style={{ marginTop: 18 }} />
              <Btn label="Split a subscription" kind="secondary" Icon={Repeat} onPress={() => openNew('subscription')} style={{ marginTop: 10 }} />
            </>
          )}
        </>
      )}

      {/* Detail */}
      <FormSheet visible={!!opened} onClose={() => setOpenId(null)} title={opened?.title || ''}>
        {!!opened && (
          <Detail
            split={opened} me={me} gold={gold} busy={busy} error={error}
            nameOf={nameOf} personOf={personOf}
            onSettle={settle} onRemind={remind} onEdit={openEdit} onRound={newRound} onDelete={remove}
          />
        )}
      </FormSheet>

      {/* New or edit */}
      <FormSheet visible={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit split' : form?.kind === 'subscription' ? 'Split a subscription' : 'New split'}>
        {!!form && (
          <View>
            <Field label="What was it for?" value={form.title} onChangeText={t => setForm({ ...form, title: t })} maxLength={60} placeholder={form.kind === 'subscription' ? 'Streaming plan' : 'Pizza night'} />
            {!form.id && (
              <View style={s.chipRow}>
                <Chip label="One off bill" active={form.kind === 'bill'} onPress={() => setForm({ ...form, kind: 'bill' })} />
                <Chip label="Subscription" active={form.kind === 'subscription'} onPress={() => setForm({ ...form, kind: 'subscription' })} />
              </View>
            )}
            {form.kind === 'subscription' && !form.id && (
              <View style={s.chipRow}>
                {CADENCES.map(([k, l]) => <Chip key={k} label={l} active={form.cadence === k} onPress={() => setForm({ ...form, cadence: k })} />)}
              </View>
            )}
            <Field label={form.kind === 'subscription' ? 'Price each time, in euro' : 'Total, in euro'} value={form.total} onChangeText={t => setForm({ ...form, total: t })} keyboardType="decimal-pad" placeholder="48.00" maxLength={9} />

            <Text style={[s.label, { color: colors.textSecondary }]}>Who is in?</Text>
            {candidates.length === 0 ? (
              <Text style={[s.hint, { color: colors.textSecondary }]}>You have no friends to add yet. Friends are people you both follow. Follow someone in Messages, Discover and ask them to follow you back.</Text>
            ) : (
              <View style={s.chipRow}>
                {candidates.map(f => (
                  <Chip key={f.id} label={(form.ids.includes(f.id) ? '✓ ' : '') + f.full_name} active={form.ids.includes(f.id)} onPress={() => toggleId(f.id)} />
                ))}
              </View>
            )}
            <Text style={[s.hint, { color: colors.textSecondary }]}>Friends you both follow. You are always in.</Text>

            {form.ids.length > 1 && (
              <>
                <Text style={[s.label, { color: colors.textSecondary }]}>Who paid?</Text>
                <View style={s.chipRow}>
                  {form.ids.map(id => <Chip key={id} label={id === me ? 'You' : nameOf(id)} active={form.paidBy === id} onPress={() => setForm({ ...form, paidBy: id })} />)}
                </View>

                <Text style={[s.label, { color: colors.textSecondary }]}>How to split it</Text>
                <View style={s.chipRow}>
                  <Chip label="Equal" active={form.mode === 'equal'} onPress={() => setForm({ ...form, mode: 'equal' })} />
                  <Chip label="Custom amounts" active={form.mode === 'custom'} onPress={() => setForm({ ...form, mode: 'custom', custom: Object.fromEntries(form.ids.map(id => [id, form.custom[id] ?? ((shares[id] || 0) / 100).toFixed(2)])) })} />
                </View>

                <View style={[s.shareBox, { borderColor: colors.border }]}>
                  {form.ids.map((id, i) => (
                    <View key={id} style={[s.shareRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                      <Text style={[s.shareName, { color: colors.textPrimary }]} numberOfLines={1}>{id === me ? 'You' : nameOf(id)}</Text>
                      {form.mode === 'custom' ? (
                        <Field value={form.custom[id] ?? ''} onChangeText={t => setForm({ ...form, custom: { ...form.custom, [id]: t } })} keyboardType="decimal-pad" maxLength={9} style={s.shareField} />
                      ) : (
                        <Text style={[s.shareAmt, { color: gold }]}>{money(shares[id])}</Text>
                      )}
                    </View>
                  ))}
                </View>
                {form.mode === 'custom' && !!formCents && (
                  <Text style={[s.hint, { color: left === 0 ? colors.textSecondary : colors.destructive }]}>
                    {left === 0 ? 'All of it is shared out.' : left > 0 ? `${money(left)} still to share out.` : `${money(-left)} too much.`}
                  </Text>
                )}
              </>
            )}

            {!!error && <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>}
            <Btn label={busy ? 'Saving' : form.id ? 'Save changes' : 'Create split'} onPress={save} disabled={busy} style={{ marginTop: 20 }} />
          </View>
        )}
      </FormSheet>
    </ToolScreen>
  )
}

function SplitRow({ split, me, gold, nameOf, onPress }) {
  const { colors } = useTheme()
  const x = summarise(split, me)
  const n = (split.bill_split_members || []).length
  const paidLine = split.paid_by === me ? 'You paid' : `${nameOf(split.paid_by)} paid`
  const cad = split.kind === 'subscription' ? CADENCES.find(c => c[0] === split.cadence)?.[1] : null
  let pill
  if (split.paid_by === me) {
    pill = x.allSettled ? 'Settled' : `${x.others.length - x.open.length} of ${x.others.length} settled`
  } else {
    pill = x.owe ? `You owe ${money(x.owe)}` : 'Settled'
  }
  const settled = pill === 'Settled'
  const owing = !!x.owe
  return (
    <TouchableOpacity
      activeOpacity={0.8} onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`${split.title}, ${money(split.total_cents)}, ${pill}`}
      style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[s.rowIcon, { backgroundColor: colors.tabFill }]}>
        {split.kind === 'subscription' ? <Repeat size={18} color={colors.textPrimary} strokeWidth={1.8} /> : <Receipt size={18} color={colors.textPrimary} strokeWidth={1.8} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>{split.title}</Text>
        <Text style={[s.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>{paidLine} · {n} people{cad ? ` · ${cad}` : ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[s.rowAmt, { color: gold }]}>{money(split.total_cents)}</Text>
        <View style={[s.pill, { backgroundColor: owing ? colors.destructive + '1F' : colors.tabFill }]}>
          {settled && <Check size={12} color={colors.success} strokeWidth={2.4} />}
          <Text style={[s.pillText, { color: owing ? colors.destructive : colors.textPrimary }]}>{pill}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function Detail({ split, me, gold, busy, error, nameOf, personOf, onSettle, onRemind, onEdit, onRound, onDelete }) {
  const { colors } = useTheme()
  const isOwner = split.created_by === me
  const canManage = isOwner || split.paid_by === me
  const cad = split.kind === 'subscription' ? CADENCES.find(c => c[0] === split.cadence)?.[1] : null
  const members = [...(split.bill_split_members || [])].sort((a, b) => (a.user_id === split.paid_by ? -1 : b.user_id === split.paid_by ? 1 : 0))
  const [confirm, setConfirm] = useState(false)
  const anyOpen = members.some(m => m.user_id !== split.paid_by && !m.settled)
  return (
    <View>
      <Text style={[s.detailSub, { color: colors.textSecondary }]}>
        {split.paid_by === me ? 'You paid' : `${nameOf(split.paid_by)} paid`} · {split.split_mode === 'equal' ? 'Equal split' : 'Custom amounts'}{cad ? ` · ${cad}` : ''}
      </Text>
      <Text style={[s.detailAmt, { color: gold }]}>{money(split.total_cents)}</Text>

      <Eyebrow style={{ marginTop: 18, marginBottom: 6 }}>Who owes whom</Eyebrow>
      {members.map((m, i) => {
        const isPayer = m.user_id === split.paid_by
        const who = m.user_id === me ? 'You' : nameOf(m.user_id)
        const line = isPayer ? `${who === 'You' ? 'You paid' : who + ' paid'}` : `${who === 'You' ? 'You owe' : who + ' owes'} ${split.paid_by === me ? 'you' : nameOf(split.paid_by)}`
        const canMark = !isPayer && (canManage || (m.user_id === me && !m.settled))
        return (
          <View key={m.user_id} style={[s.person, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Avatar person={personOf(m.user_id)} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.rowTitle, { color: colors.textPrimary }]} numberOfLines={2}>{line}</Text>
              <Text style={[s.rowSub, { color: colors.textSecondary }]}>{isPayer ? 'Paid the bill' : m.settled ? 'Settled' : 'Not settled'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={[s.rowAmt, { color: gold }]}>{money(m.share_cents)}</Text>
              {canMark && (
                <TouchableOpacity
                  disabled={busy} activeOpacity={0.8}
                  onPress={() => onSettle(split, m.user_id, !m.settled)}
                  accessibilityRole="button"
                  accessibilityLabel={m.settled ? 'Mark not settled' : 'Mark settled'}
                  style={[s.pill, { backgroundColor: colors.tabFill, paddingVertical: 7, paddingHorizontal: 12 }]}
                >
                  {m.settled && <Check size={12} color={colors.success} strokeWidth={2.4} />}
                  <Text style={[s.pillText, { color: colors.textPrimary }]}>{m.settled ? 'Settled' : 'Mark settled'}</Text>
                </TouchableOpacity>
              )}
              {!canMark && !isPayer && m.settled && (
                <View style={s.pill}><Check size={12} color={colors.success} strokeWidth={2.4} /><Text style={[s.pillText, { color: colors.textSecondary }]}>Settled</Text></View>
              )}
            </View>
          </View>
        )
      })}

      {canManage && anyOpen && <Btn label="Remind who is left" Icon={Bell} onPress={() => onRemind(split)} disabled={busy} style={{ marginTop: 18 }} />}
      {isOwner && split.kind === 'subscription' && <Btn label="Start a new round" kind="secondary" Icon={Repeat} onPress={() => onRound(split)} disabled={busy} style={{ marginTop: 10 }} />}
      {isOwner && <Btn label="Edit" kind="secondary" Icon={Pencil} onPress={() => onEdit(split)} disabled={busy} style={{ marginTop: 10 }} />}
      {isOwner && (
        confirm ? (
          <Btn label="Tap again to delete for everyone" Icon={Trash2} onPress={() => onDelete(split)} disabled={busy} color={colors.destructive} textColor="#FFFFFF" style={{ marginTop: 10 }} />
        ) : (
          <Btn label="Delete" kind="quiet" Icon={Trash2} onPress={() => setConfirm(true)} style={{ marginTop: 6 }} />
        )
      )}
      {!!error && <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>}
      <Text style={[s.hint, { color: colors.textSecondary, marginTop: 16 }]}>Tracking only. UBP never moves money.</Text>
    </View>
  )
}

const s = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 16, marginTop: 4 },
  noticeText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  totals: { flexDirection: 'row', gap: 12, marginTop: 16 },
  total: { flex: 1, padding: 16 },
  amount: { fontFamily: fonts.serif, fontSize: 28, marginTop: 8 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 22, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10 },
  rowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15.5, lineHeight: 21 },
  rowSub: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  rowAmt: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 9 },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 20 },
  hint: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 8 },
  error: { fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 19, marginTop: 14 },
  shareBox: { borderWidth: 1, borderRadius: 14, marginTop: 14, paddingHorizontal: 14 },
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52 },
  shareName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15 },
  shareAmt: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  shareField: { width: 110, marginTop: 0, paddingVertical: 4 },
  detailSub: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19 },
  detailAmt: { fontFamily: fonts.serif, fontSize: 34, marginTop: 6 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
})
