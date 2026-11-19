import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { Flag, UserX, Check, ChevronRight, X } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { REPORT_REASONS, submitReport, blockUser } from '../../lib/reporting'

// One report and block sheet for the whole app. Any screen can open it:
//
//   const { openReport } = useReport()
//   openReport({
//     contentType: 'feed_post',     // what it is, a short snake_case word
//     contentId: post.id,
//     reportedUserId: post.user_id, // who made it, if known. Shows Block user.
//     userName: post.author_name,   // for the Block user words
//     noun: 'post',                 // "Report this post"
//   })
//
// Steps: pick a reason, confirm, done. Block user is offered where a person is
// shown. Works the same on iOS, Android and web (no Alert, which cannot hold
// five buttons on Android).

const ReportContext = createContext({ openReport: () => {}, openBlock: () => {} })

export function useReport() {
  return useContext(ReportContext)
}

export default function ReportProvider({ children }) {
  const { user } = useAuth()
  const [target, setTarget] = useState(null)
  const [mode, setMode] = useState('report') // 'report' | 'block'

  const openReport = useCallback(t => {
    if (!t || t.contentId == null || !t.contentType) return
    setMode('report')
    setTarget(t)
  }, [])

  // For places that only need Block user (a profile header, a message request).
  const openBlock = useCallback(t => {
    if (!t || !t.reportedUserId) return
    setMode('block')
    setTarget(t)
  }, [])

  const value = useMemo(() => ({ openReport, openBlock }), [openReport, openBlock])

  return (
    <ReportContext.Provider value={value}>
      {children}
      <ReportSheet target={target} mode={mode} userId={user?.id} onClose={() => setTarget(null)} />
    </ReportContext.Provider>
  )
}

function ReportSheet({ target, mode, userId, onClose }) {
  const { colors } = useTheme()
  const s = getStyles(colors)
  const [step, setStep] = useState('start') // start | confirm | sending | done | failed | blockConfirm | blocking | blocked
  const [reason, setReason] = useState(null)
  const [blockedNow, setBlockedNow] = useState(false)

  const visible = !!target
  const noun = target?.noun || 'post'
  const who = target?.userName || 'this person'
  const canBlock = !!target?.reportedUserId && target.reportedUserId !== userId

  // Reset whenever a new target opens.
  const [lastTarget, setLastTarget] = useState(null)
  if (target !== lastTarget) {
    setLastTarget(target)
    if (target) {
      setStep(mode === 'block' ? 'blockConfirm' : 'start')
      setReason(null)
      setBlockedNow(false)
    }
  }

  async function sendReport() {
    setStep('sending')
    const res = await submitReport({
      reporterId: userId,
      contentType: target.contentType,
      contentId: target.contentId,
      reportedUserId: target.reportedUserId,
      reason,
    })
    setStep(res.ok ? 'done' : 'failed')
  }

  async function doBlock() {
    setStep('blocking')
    const res = await blockUser(userId, target.reportedUserId)
    if (res.ok) {
      setBlockedNow(true)
      setStep('blocked')
    } else {
      setStep('failed')
    }
  }

  function Row({ label, icon, onPress, danger, last }) {
    return (
      <TouchableOpacity
        style={[s.row, !last && s.rowDivider]}
        activeOpacity={0.75}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {icon}
        <Text style={[s.rowText, danger && { color: colors.destructive }]}>{label}</Text>
        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
      </TouchableOpacity>
    )
  }

  let body = null
  if (step === 'start') {
    body = (
      <>
        <Text style={s.title}>{`Report this ${noun}`}</Text>
        <Text style={s.sub}>What best describes the issue?</Text>
        <View style={s.group}>
          {REPORT_REASONS.map((r, i) => (
            <Row
              key={r}
              label={r}
              last={i === REPORT_REASONS.length - 1}
              onPress={() => { setReason(r); setStep('confirm') }}
            />
          ))}
        </View>
        {canBlock && (
          <View style={[s.group, { marginTop: 12 }]}>
            <Row
              label={`Block ${who}`}
              danger
              last
              icon={<UserX size={18} color={colors.destructive} strokeWidth={1.8} />}
              onPress={() => setStep('blockConfirm')}
            />
          </View>
        )}
        <TouchableOpacity style={s.ghostBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={s.ghostText}>Cancel</Text>
        </TouchableOpacity>
      </>
    )
  } else if (step === 'confirm') {
    body = (
      <>
        <View style={s.iconCircle}><Flag size={20} color={colors.textPrimary} strokeWidth={1.8} /></View>
        <Text style={s.title}>Send this report?</Text>
        <Text style={s.sub}>{`Reason: ${reason}. The UniBlueprint team will take a look. We will not tell ${canBlock ? who : 'them'} who reported it.`}</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={sendReport} accessibilityRole="button" accessibilityLabel="Send report">
          <Text style={s.primaryText}>Send report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={() => setStep('start')} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={s.ghostText}>Back</Text>
        </TouchableOpacity>
      </>
    )
  } else if (step === 'sending' || step === 'blocking') {
    body = (
      <View style={s.center}>
        <ActivityIndicator color={colors.textPrimary} />
      </View>
    )
  } else if (step === 'done') {
    body = (
      <>
        <View style={[s.iconCircle, { backgroundColor: colors.successBg }]}><Check size={20} color={colors.success} strokeWidth={2.2} /></View>
        <Text style={s.title}>Thanks, report sent</Text>
        <Text style={s.sub}>The UniBlueprint team will take a look. You can also block this person so you do not see them again.</Text>
        {canBlock && !blockedNow && (
          <TouchableOpacity style={s.dangerBtn} onPress={() => setStep('blockConfirm')} accessibilityRole="button" accessibilityLabel={`Block ${who}`}>
            <UserX size={17} color={colors.destructive} strokeWidth={1.8} />
            <Text style={s.dangerText}>{`Block ${who}`}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.primaryBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
          <Text style={s.primaryText}>Done</Text>
        </TouchableOpacity>
      </>
    )
  } else if (step === 'blockConfirm') {
    body = (
      <>
        <View style={s.iconCircle}><UserX size={20} color={colors.destructive} strokeWidth={1.8} /></View>
        <Text style={s.title}>{`Block ${who}?`}</Text>
        <Text style={s.sub}>You will not see their posts, comments or messages, and they cannot message you.</Text>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.destructive }]} onPress={doBlock} accessibilityRole="button" accessibilityLabel="Block">
          <Text style={[s.primaryText, { color: '#FFFFFF' }]}>Block</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={s.ghostText}>Cancel</Text>
        </TouchableOpacity>
      </>
    )
  } else if (step === 'blocked') {
    body = (
      <>
        <View style={[s.iconCircle, { backgroundColor: colors.successBg }]}><Check size={20} color={colors.success} strokeWidth={2.2} /></View>
        <Text style={s.title}>{`${who === 'this person' ? 'Person' : who} blocked`}</Text>
        <Text style={s.sub}>You will not see them again.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
          <Text style={s.primaryText}>Done</Text>
        </TouchableOpacity>
      </>
    )
  } else if (step === 'failed') {
    body = (
      <>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.sub}>Please check your connection and try again.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={s.primaryText}>Close</Text>
        </TouchableOpacity>
      </>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={s.sheet} onPress={e => e.stopPropagation?.()}>
          <View style={s.handle} />
          <TouchableOpacity style={s.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={s.content} bounces={false} showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay || 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.card + 6, borderTopRightRadius: radius.card + 6,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
      maxHeight: '85%', width: '100%', maxWidth: 520, alignSelf: 'center',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
    closeBtn: {
      position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', zIndex: 2,
    },
    content: { paddingTop: 6, paddingBottom: 4 },
    center: { paddingVertical: 48, alignItems: 'center' },
    iconCircle: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tabFill,
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14,
    },
    title: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, textAlign: 'center' },
    sub: {
      fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 21, marginTop: 8, marginBottom: 18,
    },
    group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.background, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16, minHeight: 52 },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.textPrimary },
    primaryBtn: {
      backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 14,
      alignItems: 'center', marginTop: 4,
    },
    primaryText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
    dangerBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: radius.button, paddingVertical: 14, marginBottom: 10,
      borderWidth: 1, borderColor: colors.destructive,
    },
    dangerText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.destructive },
    ghostBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
    ghostText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.textSecondary },
  })
}
