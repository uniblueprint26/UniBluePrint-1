/**
 * PostAdModal — shared "Post an Ad" flow, unchanged mechanics (image upload,
 * board selection, submit for review). Used from both AdBoardScreen (the
 * live Ad Board list) and WeeklyBlueprintScreen (the magazine's Ad Board
 * page "Advertise With Us" CTA), so it lives here rather than duplicated.
 */
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet,
} from 'react-native'
import { X, Globe, Building2, ShoppingBag } from 'lucide-react-native'
import ImageUploader from '../ui/ImageUploader'
import BoardListingCheckoutModal from '../boards/BoardListingCheckoutModal'
import { supabase } from '../../lib/supabase'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useProAccess } from '../../hooks/useProAccess'
import { AD_BOARD_PRICE_CENTS, formatEuro, ordinal } from '../../constants/boardListingPricing'
import { confirmAsync } from '../../utils/confirmAlert'

function __gs_BOARDS(colors) {
  return [
  { key: 'cross-ireland', label: 'Cross-Ireland',  Icon: Globe,       color: colors.navy },
  { key: 'campus',        label: 'Campus Connect',  Icon: Building2,   color: '#B45309'   },
  { key: 'course',        label: 'Course Connect',  Icon: Globe,       color: '#0369A1'   },
  { key: 'marketplace',   label: 'Marketplace',     Icon: ShoppingBag, color: '#6D28D9'   },
  ]
}

export default function PostAdModal({ visible, onClose }) {
  const { colors } = useTheme()
  const m = __gs_m(colors)
  const BOARDS = __gs_BOARDS(colors)
  const { user }                        = useAuth()
  const { isPro }                       = useProAccess()
  const checkoutRef                     = useRef(null)
  const [title,       setTitle]         = useState('')
  const [description, setDescription]   = useState('')
  const [link,        setLink]          = useState('')
  const [boards,      setBoards]        = useState([])
  const [submitting,  setSubmitting]    = useState(false)
  const [imageUrl,    setImageUrl]      = useState(null)
  const [adImagePath, setAdImagePath]   = useState(null)

  useEffect(() => {
    if (visible && user?.id) {
      setAdImagePath(`${user.id}/${Date.now()}.jpg`)
      setImageUrl(null)
    }
  }, [visible, user?.id])

  function toggleBoard(key) {
    setBoards(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  // Ad Board pricing (docs/business/subscription-pricing-model.md §1.6):
  // 1 free ad per calendar month for everyone, then €4.99 (free tier) /
  // €1.99 (Pro) per ad. The monthly count is only ever a client-side
  // disclosure here — create-board-listing-checkout-session recomputes it
  // server-side and is the actual gate (see that function's own comment),
  // so a stale/manipulated count here can at most show the wrong price in
  // this confirm dialog, never let anyone post for free.
  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
      const nth = (count || 0) + 1

      if (nth > 1) {
        const amountCents = isPro ? AD_BOARD_PRICE_CENTS.pro : AD_BOARD_PRICE_CENTS.free
        const ok = await confirmAsync(
          'Payment required',
          `This is your ${ordinal(nth)} ad this month — ${formatEuro(amountCents)}. Your first ad each calendar month is free; this one isn't.`,
        )
        if (!ok) { setSubmitting(false); return }
      }

      const payload = {
        title:       title.trim(),
        description: description.trim(),
        target_url:  link.trim() || null,
        boards,
        image_url:   imageUrl || null,
      }
      await checkoutRef.current.start({ listingKind: 'ad_board', payload })

      setTitle(''); setDescription(''); setLink(''); setBoards([])
      setImageUrl(null)
      onClose()
      Alert.alert('Ad submitted', 'Your ad is in for review. It goes live once approved.')
    } catch (err) {
      if (err?.message !== 'Payment cancelled.') {
        Alert.alert('Something went wrong', err?.message || 'Your ad was not submitted. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && boards.length > 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={m.container}>
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.headerTitle}>Post an Ad</Text>
              <Text style={m.headerSub}>Reach young people across Ireland</Text>
            </View>
            <TouchableOpacity
              style={m.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={15} color={colors.chromeBg} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={m.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={m.label}>Ad Title</Text>
            <TextInput style={m.input} placeholder="e.g. Photography Sessions, €90 per shoot" placeholderTextColor={colors.light} value={title} onChangeText={setTitle} maxLength={80} />

            <Text style={[m.label, { marginTop: 20 }]}>Description</Text>
            <TextInput style={[m.input, m.textArea]} placeholder="Describe your service, pricing, location, and how to get in touch..." placeholderTextColor={colors.light} value={description} onChangeText={setDescription} multiline maxLength={300} textAlignVertical="top" />
            <Text style={m.charCount}>{description.length}/300</Text>

            <Text style={[m.label, { marginTop: 20 }]}>Link (optional)</Text>
            <TextInput style={m.input} placeholder="https://" placeholderTextColor={colors.light} value={link} onChangeText={setLink} keyboardType="url" autoCapitalize="none" autoCorrect={false} />

            <Text style={[m.label, { marginTop: 20 }]}>Image (optional)</Text>
            <Text style={m.boardHint}>Add a photo to make your ad stand out. JPG, PNG, or WebP, under 5 MB.</Text>
            {adImagePath && (
              <ImageUploader bucket="ad-images" storagePath={adImagePath} currentUrl={null} onUpload={url => setImageUrl(url)} label="" size={80} />
            )}

            <Text style={[m.label, { marginTop: 24 }]}>Post to</Text>
            <Text style={m.boardHint}>Select one or more boards. Your ad will appear wherever you choose. Marketplace is for goods and services you're offering or looking for.</Text>
            <View style={m.boardOptions}>
              {BOARDS.map(b => {
                const active = boards.includes(b.key)
                return (
                  <TouchableOpacity
                    key={b.key}
                    style={[m.boardOption, active && { borderColor: b.color }]}
                    onPress={() => toggleBoard(b.key)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={b.label}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[m.boardIconBox, { backgroundColor: active ? b.color : 'rgba(30,58,95,0.06)' }]}>
                      <b.Icon size={15} color={active ? colors.cream : colors.muted} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.boardLabel, active && { color: colors.textPrimary }]}>{b.label}</Text>
                      <Text style={m.boardSub}>
                        {b.key === 'cross-ireland' ? 'Visible to all users across Ireland'
                          : b.key === 'campus' ? 'Visible on the Campus Connect board'
                          : b.key === 'course' ? 'Visible on the Course Connect board'
                          : 'Visible on the Marketplace page of the Weekly Blueprint'}
                      </Text>
                    </View>
                    <View style={[m.checkCircle, active && { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}>
                      {active && <View style={m.checkInner} />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity style={[m.submitBtn, (!canSubmit || submitting) && m.submitBtnDisabled]} onPress={handleSubmit} disabled={!canSubmit || submitting} activeOpacity={0.8}>
              <Text style={m.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Ad for Review'}</Text>
            </TouchableOpacity>
            <Text style={m.submitNote}>Ads are reviewed by the UniBlueprint team before going live. We'll be in touch within 24 hours.</Text>
            <Text style={m.submitNote}>
              Your first ad each calendar month is free. After that it's {formatEuro(AD_BOARD_PRICE_CENTS.free)} per ad
              ({formatEuro(AD_BOARD_PRICE_CENTS.pro)} for Pro).
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <BoardListingCheckoutModal ref={checkoutRef} />
    </Modal>
  )
}

function __gs_m(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.chromeBg, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.chromeFg },
  headerSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.55)', marginTop: 4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.chromeFg, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  scroll: { padding: 20, paddingBottom: 60 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderRadius: radius.button, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)', paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary },
  textArea: { height: 110, paddingTop: 12 },
  charCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'right', marginTop: 5 },
  boardHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 12 },
  boardOptions: { gap: 10 },
  boardOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.1)', padding: 14 },
  boardIconBox: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  boardLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted, marginBottom: 2 },
  boardSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, lineHeight: 17 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentFg },
  submitBtn: { marginTop: 28, backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  submitNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  })
}
