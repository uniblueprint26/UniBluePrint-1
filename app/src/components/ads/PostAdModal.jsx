/**
 * PostAdModal — shared "Post an Ad" flow, unchanged mechanics (image upload,
 * board selection, submit for review). Used from both AdBoardScreen (the
 * live Ad Board list) and WeeklyBlueprintScreen (the magazine's Ad Board
 * page "Advertise With Us" CTA), so it lives here rather than duplicated.
 */
import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet,
} from 'react-native'
import { X, Globe, Building2, ShoppingBag } from 'lucide-react-native'
import ImageUploader from '../ui/ImageUploader'
import { supabase } from '../../lib/supabase'
import { colors, fonts, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'

const BOARDS = [
  { key: 'cross-ireland', label: 'Cross-Ireland',  Icon: Globe,       color: colors.navy },
  { key: 'campus',        label: 'Campus Connect',  Icon: Building2,   color: '#B45309'   },
  { key: 'course',        label: 'Course Connect',  Icon: Globe,       color: '#0369A1'   },
  { key: 'marketplace',   label: 'Marketplace',     Icon: ShoppingBag, color: '#6D28D9'   },
]

export default function PostAdModal({ visible, onClose }) {
  const { user }                        = useAuth()
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

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('ads').insert({
        user_id:     user?.id,
        title:       title.trim(),
        description: description.trim(),
        target_url:  link.trim() || null,
        boards,
        status:      'pending_review',
        active:      false,
        image_url:   imageUrl || null,
      })
      if (error) throw error
      setTitle(''); setDescription(''); setLink(''); setBoards([])
      setImageUrl(null)
      onClose()
      Alert.alert('Ad submitted', 'Your ad is in for review. It goes live once approved.')
    } catch {
      Alert.alert('Something went wrong', 'Your ad was not submitted. Please try again.')
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
              <X size={15} color={colors.navy} strokeWidth={2.5} />
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
                      <Text style={[m.boardLabel, active && { color: colors.navy }]}>{b.label}</Text>
                      <Text style={m.boardSub}>
                        {b.key === 'cross-ireland' ? 'Visible to all users across Ireland'
                          : b.key === 'campus' ? 'Visible on the Campus Connect board'
                          : b.key === 'course' ? 'Visible on the Course Connect board'
                          : 'Visible on the Marketplace page of the Weekly Blueprint'}
                      </Text>
                    </View>
                    <View style={[m.checkCircle, active && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  headerSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.55)', marginTop: 4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  scroll: { padding: 20, paddingBottom: 60 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  input: { backgroundColor: colors.white, borderRadius: radius.button, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)', paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },
  textArea: { height: 110, paddingTop: 12 },
  charCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, textAlign: 'right', marginTop: 5 },
  boardHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 12 },
  boardOptions: { gap: 10 },
  boardOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.1)', padding: 14 },
  boardIconBox: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  boardLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted, marginBottom: 2 },
  boardSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, lineHeight: 17 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cream },
  submitBtn: { marginTop: 28, backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  submitNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.light, textAlign: 'center', marginTop: 14, lineHeight: 18 },
})
