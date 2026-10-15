/**
 * PostFormModal — the shared, schema-driven post form used by every Campus
 * Connect board. Field shape comes from `constants/campusBoards.js`; this
 * component only knows how to render each field `type` and how to insert
 * the result into `board.table` (or `tableOverride`, used by the Clubs and
 * Societies "request a new society" flow, which shares this form but
 * targets a different subset of fields / a different status value).
 */
import { useState, useRef } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { X, Plus, Star, Check } from 'lucide-react-native'
import ImageUploader from '../ui/ImageUploader'
import FileUploader from '../ui/FileUploader'
import BoardListingCheckoutModal from '../boards/BoardListingCheckoutModal'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useProAccess } from '../../hooks/useProAccess'
import { MARKETPLACE_SKILL_PRICE_CENTS, formatEuro } from '../../constants/boardListingPricing'
import { confirmAsync } from '../../utils/confirmAlert'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Default `paymentGate` per target table, used whenever a caller doesn't
// pass one explicitly (see the `paymentGate` prop doc below). Keyed by
// table name rather than wired through BoardDetailScreen/marketplaceBoards.js
// so every existing call site keeps working unchanged — this is the one
// board whose postings are sometimes paid (pricing doc §1.7). 'buysell'
// (marketplace_listings) and every Campus/Course Connect board are
// deliberately absent, so they fall through to the normal free-insert path.
const DEFAULT_PAYMENT_GATES = {
  marketplace_skills: {
    listingKind: 'marketplace_skill',
    priceCents: MARKETPLACE_SKILL_PRICE_CENTS,
    shouldCharge: v => v.listing_type === 'Offering a skill',
    confirmMessage: (amountCents, isPro) =>
      `Offering a skill costs ${formatEuro(amountCents)}${isPro ? ' (Pro rate)' : ''} to list. ("Looking for a skill" posts stay free.)`,
  },
}

function StarPicker({ value, onChange }) {
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} accessibilityRole="button" accessibilityLabel={`${n} star${n !== 1 ? 's' : ''}`}>
          <Star size={24} color={colors.gold} fill={n <= value ? colors.gold : 'transparent'} strokeWidth={1.6} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

function TagsInput({ value, onChange, placeholder }) {
  const { colors } = useTheme()
  const f = getStyles(colors)
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v) return
    if (!value.includes(v)) onChange([...value, v])
    setDraft('')
  }
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={[f.input, { flex: 1 }]}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.light}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <TouchableOpacity style={f.tagAddBtn} onPress={add} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Add skill">
          <Plus size={16} color={colors.accentFg} />
        </TouchableOpacity>
      </View>
      {value.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {value.map(tag => (
            <TouchableOpacity key={tag} style={f.tagChip} onPress={() => onChange(value.filter(t => t !== tag))} activeOpacity={0.7}>
              <Text style={f.tagChipText}>{tag}</Text>
              <X size={11} color={colors.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

function SelectPicker({ options, value, onChange }) {
  const { colors } = useTheme()
  const f = getStyles(colors)
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <TouchableOpacity
            key={opt}
            style={[f.chip, active && f.chipActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[f.chipText, active && f.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// Same chip look as SelectPicker, but toggles membership in an array rather
// than replacing a single value — used by Carpool's "Days" field (a
// text[] column) and any future multi-choice field.
function MultiSelectPicker({ options, value, onChange }) {
  const { colors } = useTheme()
  const f = getStyles(colors)
  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = value.includes(opt)
        return (
          <TouchableOpacity
            key={opt}
            style={[f.chip, active && f.chipActive]}
            onPress={() => toggle(opt)}
            activeOpacity={0.8}
          >
            <Text style={[f.chipText, active && f.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function TogglePicker({ value, onChange, onLabel, offLabel }) {
  const { colors } = useTheme()
  const f = getStyles(colors)
  return (
    <TouchableOpacity style={f.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={[f.toggleTrack, value && f.toggleTrackOn]}>
        <View style={[f.toggleThumb, value && f.toggleThumbOn]} />
      </View>
      <Text style={f.toggleLabel}>{value ? (onLabel || 'On') : (offLabel || 'Off')}</Text>
    </TouchableOpacity>
  )
}

export default function PostFormModal({
  visible, onClose, board, fields, tableOverride, titleOverride,
  extraValues, onPosted, userIdField = 'user_id', includePosterName = true,
  // paymentGate — optional override for boards with a real per-listing
  // charge (currently just the Skills Marketplace's "Offering a skill"
  // case, pricing doc §1.7; see boardListingPricing.js and
  // BoardListingCheckoutModal.jsx for the shared shape Ad Board's
  // PostAdModal also uses). Shape:
  //   { listingKind: 'marketplace_skill', priceCents: { free, pro },
  //     shouldCharge: (values) => boolean, confirmMessage?: (amountCents, isPro) => string }
  // shouldCharge is checked against the live form `values` at submit time
  // (e.g. only when listing_type === 'Offering a skill') — everything else
  // this board posts stays on the normal direct-insert path below. The
  // amount shown here is disclosure only; create-board-listing-checkout-
  // session recomputes it server-side and is the actual charge. When not
  // passed, DEFAULT_PAYMENT_GATES[table] applies instead (see above), so
  // every existing PostFormModal call site (BoardDetailScreen included)
  // gets the real gate with no change on its end.
  paymentGate,
}) {
  const { colors } = useTheme()
  const f = getStyles(colors)
  const { user } = useAuth()
  const { isPro } = useProAccess()
  const checkoutRef = useRef(null)
  const activeFields = fields || board?.fields || []
  const table = tableOverride || board?.table
  const effectivePaymentGate = paymentGate || DEFAULT_PAYMENT_GATES[table] || null

  const initial = {}
  activeFields.forEach(field => {
    if (field.type === 'toggle') initial[field.key] = false
    else if (field.type === 'tags' || field.type === 'multiselect') initial[field.key] = []
    else if (field.type === 'stars') initial[field.key] = 0
    else if (field.default != null) initial[field.key] = field.default
    else initial[field.key] = ''
  })

  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  function set(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  function reset() {
    setValues(initial)
    setErrorMsg(null)
  }

  function close() {
    reset()
    onClose()
  }

  async function submit() {
    for (const field of activeFields) {
      if (field.showIf && !field.showIf(values)) continue
      if (!field.required) continue
      const v = values[field.key]
      const empty = field.type === 'tags' || field.type === 'multiselect' ? v.length === 0
        : field.type === 'stars' ? !v
        : field.type === 'toggle' ? false
        : v == null || String(v).trim() === ''
      if (empty) {
        setErrorMsg(`${field.label.replace(' (optional)', '')} is required.`)
        return
      }
      if (field.type === 'date' && v && !DATE_RE.test(v)) {
        setErrorMsg('Dates should be in YYYY-MM-DD format.')
        return
      }
    }

    // Payment gate check happens before the spinner shows — same "confirm,
    // then pay" order PostAdModal.jsx uses for Ad Board ads. If the user
    // cancels here, nothing has been touched yet (no setSaving, no payload
    // built), so just bail out.
    const charge = effectivePaymentGate && effectivePaymentGate.shouldCharge(values) ? effectivePaymentGate : null
    if (charge) {
      const amountCents = isPro ? charge.priceCents.pro : charge.priceCents.free
      const ok = await confirmAsync(
        'Payment required',
        charge.confirmMessage
          ? charge.confirmMessage(amountCents, isPro)
          : `This listing costs ${formatEuro(amountCents)}${isPro ? ' (Pro rate)' : ''}.`,
      )
      if (!ok) return
    }

    setSaving(true)
    setErrorMsg(null)

    const payload = { ...(userIdField ? { [userIdField]: user.id } : {}), ...extraValues }
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A student'
    activeFields.forEach(field => {
      if (field.showIf && !field.showIf(values)) {
        payload[field.key] = null
        return
      }
      let v = values[field.key]
      if (field.type === 'number') v = v === '' ? null : Number(v)
      if (field.type === 'decimal') v = v === '' ? null : Number(v)
      if (field.type === 'date') v = v || null
      if (field.type === 'text' || field.type === 'textarea') v = typeof v === 'string' ? v.trim() : v
      payload[field.key] = v
      if (field.type === 'file') {
        if (field.mimeKey) payload[field.mimeKey] = values[field.mimeKey] || null
        if (field.nameKey) payload[field.nameKey] = values[field.nameKey] || null
      }
    })
    // Anonymous posts never get poster_name written to the row at all — the
    // DB-level fix (see migration 20260926090000) also nulls user_id/
    // poster_name when the row is read back by anyone but the poster, but
    // we don't rely on that alone: if this post is anonymous, we simply
    // never store the display name in the first place.
    const isAnonymousPost = payload.anonymous === true
    if (includePosterName && !isAnonymousPost && !('poster_name' in (extraValues || {}))) {
      payload.poster_name = displayName
    }

    try {
      if (charge) {
        // The paid path never inserts directly — create-board-listing-
        // checkout-session / stripe-webhook does that once Stripe confirms
        // the charge (or immediately, server-side, for Ad Board's free
        // monthly ad; not applicable here since marketplace listings are
        // never free — see boardListingPricing.js). `payload` already has
        // every form field the edge function expects; it ignores
        // user_id/poster_name and sets those itself from the authenticated
        // caller, so sending them here too is harmless.
        const row = await checkoutRef.current.start({ listingKind: charge.listingKind, payload })
        onPosted(row)
        reset()
      } else {
        const { data, error } = await supabase.from(table).insert(payload).select().single()
        if (error) throw error
        onPosted(data)
        reset()
      }
    } catch (err) {
      if (err?.message !== 'Payment cancelled.') {
        setErrorMsg(err?.message && charge ? err.message : 'Could not post. Please check your entries and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!activeFields.length) return null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={f.backdrop}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={f.sheet}>
          <View style={f.headerRow}>
            <Text style={f.title}>{titleOverride || board?.postCta || 'New post'}</Text>
            <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {activeFields.map(field => {
              if (field.showIf && !field.showIf(values)) return null
              return (
                <View key={field.key} style={{ marginTop: 14 }}>
                  <Text style={f.label}>{field.label}</Text>
                  {field.type === 'text' && (
                    <TextInput
                      style={f.input}
                      value={values[field.key]}
                      onChangeText={v => set(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.light}
                    />
                  )}
                  {field.type === 'date' && (
                    <TextInput
                      style={f.input}
                      value={values[field.key]}
                      onChangeText={v => set(field.key, v)}
                      placeholder={field.placeholder || 'YYYY-MM-DD'}
                      placeholderTextColor={colors.light}
                      keyboardType={Platform.OS === 'web' ? 'default' : 'numbers-and-punctuation'}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <TextInput
                      style={[f.input, { minHeight: 84 }]}
                      value={values[field.key]}
                      onChangeText={v => set(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.light}
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                  {(field.type === 'number' || field.type === 'decimal') && (
                    <TextInput
                      style={f.input}
                      value={String(values[field.key] ?? '')}
                      onChangeText={v => set(field.key, v.replace(field.type === 'number' ? /[^0-9]/g : /[^0-9.]/g, ''))}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.light}
                      keyboardType={field.type === 'number' ? 'number-pad' : 'decimal-pad'}
                    />
                  )}
                  {field.type === 'select' && (
                    <SelectPicker options={field.options} value={values[field.key]} onChange={v => set(field.key, v)} />
                  )}
                  {field.type === 'multiselect' && (
                    <MultiSelectPicker options={field.options} value={values[field.key]} onChange={v => set(field.key, v)} />
                  )}
                  {field.type === 'toggle' && (
                    <TogglePicker value={values[field.key]} onChange={v => set(field.key, v)} onLabel={field.onLabel} offLabel={field.offLabel} />
                  )}
                  {field.type === 'tags' && (
                    <TagsInput value={values[field.key]} onChange={v => set(field.key, v)} placeholder={field.placeholder} />
                  )}
                  {field.type === 'stars' && (
                    <StarPicker value={values[field.key]} onChange={v => set(field.key, v)} />
                  )}
                  {field.type === 'photo' && (
                    <ImageUploader
                      bucket="campus-board-photos"
                      storagePath={`${user?.id}/${Date.now()}.jpg`}
                      onUpload={url => set(field.key, url)}
                      label=""
                      size={72}
                    />
                  )}
                  {field.type === 'file' && (
                    <FileUploader
                      bucket={field.bucket || 'course-connect-files'}
                      storagePath={`${user?.id}/${Date.now()}`}
                      onUpload={(url, meta) => {
                        set(field.key, url)
                        if (field.mimeKey) set(field.mimeKey, meta.mimeType || null)
                        if (field.nameKey) set(field.nameKey, meta.name || null)
                      }}
                      label=""
                    />
                  )}
                </View>
              )
            })}

            {!!errorMsg && <Text style={f.error}>{errorMsg}</Text>}

            <TouchableOpacity style={[f.submitBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.accentFg} /> : <Check size={15} color={colors.accentFg} strokeWidth={2.4} />}
              <Text style={f.submitBtnText}>{saving ? 'Posting…' : 'Post'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {!!effectivePaymentGate && <BoardListingCheckoutModal ref={checkoutRef} />}
    </Modal>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary, flex: 1, marginRight: 12 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
  },
  chip: {
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.3, borderColor: 'rgba(30,58,95,0.15)', backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textPrimary },
  chipTextActive: { color: colors.accentFg },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: 'rgba(30,58,95,0.15)', padding: 2, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.accentBg },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },
  tagAddBtn: { width: 46, borderRadius: radius.card, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.badge,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  tagChipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textPrimary },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 14, marginTop: 20,
  },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.accentFg },
  })
}
