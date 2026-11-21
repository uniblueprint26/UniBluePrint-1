import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native'
import { Star } from 'lucide-react-native'
import Button from '../ui/Button'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useFoundationEnabled } from '../../hooks/useAppFlags'

// Shows once a Foundation submission is delivered and hasn't been rated yet.
// One rating per submission (handler_ratings has a unique constraint on
// submission_id). Renders nothing when there's nothing to rate.
export default function HandlerRatingPrompt({ userId }) {
  const { colors } = useTheme()
  // Foundation requests are closed on iOS and Android until the remote flag is on.
  const { enabled: foundationOpen } = useFoundationEnabled()
  const [pending, setPending] = useState([])
  const [stars, setStars]     = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!userId || !foundationOpen) return
    let cancelled = false
    ;(async () => {
      const [subsRes, ratingsRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('id, handler_id, services(name)')
          .eq('user_id', userId)
          .eq('stage', 'delivered')
          .not('handler_id', 'is', null),
        supabase.from('handler_ratings').select('submission_id').eq('user_id', userId),
      ])
      if (cancelled || subsRes.error || ratingsRes.error) return
      const ratedIds = new Set((ratingsRes.data || []).map(r => r.submission_id))
      setPending((subsRes.data || []).filter(s => !ratedIds.has(s.id)))
    })()
    return () => { cancelled = true }
  }, [userId, foundationOpen])

  if (!foundationOpen || pending.length === 0) return null
  const current = pending[0]

  async function submit() {
    if (!stars) return
    setSaving(true)
    const { error } = await supabase.from('handler_ratings').insert({
      submission_id: current.id,
      user_id: userId,
      handler_id: current.handler_id,
      rating: stars,
      comment: comment.trim() || null,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Could not save your rating', 'Please try again.')
      return
    }
    setPending(prev => prev.slice(1))
    setStars(0)
    setComment('')
  }

  return (
    <View style={[rp.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[rp.eyebrow, { color: colors.textSecondary }]}>YOUR REQUEST WAS DELIVERED</Text>
      <Text style={[rp.title, { color: colors.textPrimary }]}>
        How did your {current.services?.name || 'Foundation Blueprint request'} go?
      </Text>
      <View style={rp.starRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => setStars(n)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star${n === 1 ? '' : 's'}`}
            accessibilityState={{ selected: n <= stars }}
          >
            <Star size={28} color={colors.textPrimary} fill={n <= stars ? colors.textPrimary : 'transparent'} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[rp.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
        placeholder="Optional: tell us more"
        placeholderTextColor={colors.textTertiary}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />
      <Button label={saving ? 'Saving' : 'Submit rating'} onPress={submit} variant="primary" loading={saving} disabled={!stars} />
    </View>
  )
}

const rp = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, marginHorizontal: 16, marginTop: 16, padding: 18 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 18, marginBottom: 14, lineHeight: 24 },
  starRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  input: { borderRadius: radius.button, borderWidth: 1, padding: 12, minHeight: 56, fontFamily: fonts.sans, fontSize: 14, marginBottom: 12 },
})
