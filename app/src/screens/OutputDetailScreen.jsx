import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Share } from 'react-native'
import { Share2, AlertCircle, Archive, MailOpen, CalendarCheck, Lock } from 'lucide-react-native'
import AppHeader from '../components/ui/AppHeader'
import { envelopePaper } from '../components/foundation/envelopePaper'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ProUpgradeGate from '../components/ui/ProUpgradeGate'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { formatGeneratedDocument } from '../lib/formatGeneratedDocument'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { useProAccess } from '../hooks/useProAccess'

// Delivered-document viewer, opened from a delivered row in MyOutputsScreen.
// Deliberately plain-text + share only — real PDF/rich-document formatting
// is a bigger feature with its own design decision (layout, branding, a
// template per service) and is explicitly NOT attempted here. This just
// gets the student to the words a Campus Handler actually wrote/approved,
// in a form they can read, copy, or hand off anywhere else (email, Google
// Docs, print) via the native share sheet.
//
// Which column holds that text differs by service: every generate-*
// function except generate-job-search-support writes to a `generated`
// jsonb column; Job Search Support (a live advisory session, not a
// generated document) writes to `student_strategy` instead — see
// supabase/functions/generate-job-search-support/index.ts.
const CONTENT_COLUMN = {
  cv_documents: 'generated',
  cover_letters: 'generated',
  application_forms: 'generated',
  interview_prep_packs: 'generated',
  linkedin_documents: 'generated',
  personal_statements: 'generated',
  portfolio_plans: 'generated',
  job_search_sessions: 'student_strategy',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Output-wallet storage subtitle for a delivered, not-yet-expired document
// (see 20261015130000_output_wallet_retention.sql) — mirrors MyOutputsScreen's
// own storageNote() so the two screens never disagree about what a null
// expires_at vs. a future one means. A nice-to-have next to "Delivered
// {date}" in the header, not shown once wallet_scrubbed_at is set (that
// gets the full expired explanation below instead).
function storageNote(expiresAt) {
  if (!expiresAt) return 'Stored permanently'
  return `Storage until ${formatDate(expiresAt)}`
}

export default function OutputDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors, isDark)
  const paper = envelopePaper(isDark)
  const { documentTable, documentId, serviceName, deliveredAt, expiresAt, walletScrubbedAt } = route.params || {}
  const contentColumn = CONTENT_COLUMN[documentTable]
  const safeGoBack = useSafeGoBack(navigation, 'MyOutputs')
  const { canAccess: isPro, loading: proLoading } = useProAccess()
  // wallet_scrubbed_at is only set once expire_wallet_outputs() has actually
  // cleared this document's content — passed straight from MyOutputsScreen's
  // own query, so this never has to guess from an empty generated column.
  const isExpired = !!walletScrubbedAt

  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'empty' | 'error' | 'unsupported' | 'expired'
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    if (!documentTable || !documentId || !contentColumn) {
      setStatus('unsupported')
      return
    }
    if (isExpired) {
      // Content is already gone — don't even make the round trip, just go
      // straight to the explanation instead of a flash of "loading" then
      // "Nothing to show yet" as if we don't know why.
      setStatus('expired')
      return
    }
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from(documentTable)
        .select(contentColumn)
        .eq('id', documentId)
        .single()
      if (error || !data) {
        console.error('[OutputDetail] could not load document', documentTable, error)
        setStatus('error')
        return
      }
      const formatted = formatGeneratedDocument(data[contentColumn])
      if (!formatted) { setStatus('empty'); return }
      setText(formatted)
      setStatus('ok')
    } catch (e) {
      console.error('[OutputDetail] unexpected error loading document', e)
      setStatus('error')
    }
  }, [documentTable, documentId, contentColumn, isExpired])

  useEffect(() => { load() }, [load])

  async function onShare() {
    try {
      await Share.share({
        title: serviceName || 'Your document',
        message: text,
      })
    } catch (e) {
      console.error('[OutputDetail] share failed', e)
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.envHead}>
          <View style={[styles.envMark, { backgroundColor: paper.body, borderColor: paper.edge }]}>
            <MailOpen size={26} color={colors.textPrimary} strokeWidth={1.6} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.envKicker}>{isExpired ? 'EXPIRED' : 'DELIVERED'}</Text>
            <Text style={styles.envTitle}>{serviceName || 'Your document'}</Text>
          </View>
        </View>
        {!!deliveredAt && (
          <View style={styles.chips}>
            <View style={[styles.infoChip, { backgroundColor: colors.tabFill }]}>
              <CalendarCheck size={14} color={colors.textSecondary} />
              <Text style={styles.infoChipText}>{`Delivered ${formatDate(deliveredAt)}`}</Text>
            </View>
            {!isExpired && (
              <View style={[styles.infoChip, { backgroundColor: colors.tabFill }]}>
                <Lock size={14} color={colors.textSecondary} />
                <Text style={styles.infoChipText}>{storageNote(expiresAt)}</Text>
              </View>
            )}
          </View>
        )}

        {status === 'loading' && (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
        )}

        {status === 'error' && (
          <Card style={styles.messageCard}>
            <AlertCircle size={32} color={colors.destructive} />
            <Text style={styles.messageTitle}>Couldn’t load this document</Text>
            <Text style={styles.messageSub}>Check your connection and try again.</Text>
            <Button label="Try again" onPress={load} variant="secondary" style={{ marginTop: 12 }} />
          </Card>
        )}

        {status === 'unsupported' && (
          <Card style={styles.messageCard}>
            <AlertCircle size={32} color={colors.muted} />
            <Text style={styles.messageTitle}>Can’t open this document type</Text>
            <Text style={styles.messageSub}>Check My Outputs or your notifications for an update.</Text>
          </Card>
        )}

        {status === 'expired' && (
          proLoading ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
          ) : isPro ? (
            // Pro but still expired: the scrub already ran before this user
            // upgraded, and 20261015130000_output_wallet_retention.sql's
            // "permanent" guarantee only protects content that still
            // existed at upgrade time — it isn't an undo. Different message
            // from the free-tier case below: there's nothing left to
            // upgrade towards here, just an honest explanation.
            <Card style={styles.messageCard}>
              <Archive size={32} color={colors.muted} />
              <Text style={styles.messageTitle}>This document's content is gone</Text>
              <Text style={styles.messageSub}>
                Its free-tier wallet storage window ended and the content was cleared before you upgraded to Pro, so it can't be restored. Pro keeps everything delivered from here on.
              </Text>
            </Card>
          ) : (
            <ProUpgradeGate
              title="Wallet storage has expired"
              message="This output's free-tier wallet storage window has ended and its content has been cleared. Upgrade to Pro for permanent storage."
              ctaLabel="Upgrade to Pro"
            />
          )
        )}

        {status === 'empty' && (
          <Card style={styles.messageCard}>
            <AlertCircle size={32} color={colors.muted} />
            <Text style={styles.messageTitle}>Nothing to show yet</Text>
            <Text style={styles.messageSub}>This one's marked delivered, but we couldn’t find the generated content. Check your notifications, or contact your Campus Handler.</Text>
          </Card>
        )}

        {status === 'ok' && (
          <>
            <View style={styles.page}>
              <Text selectable style={styles.bodyText}>{text}</Text>
            </View>
            <Text style={styles.scopeNote}>
              Plain text, ready to copy or share anywhere you need it.
            </Text>
          </>
        )}
      </ScrollView>

      {status === 'ok' && (
        <View style={styles.footer}>
          <Button label="Share" onPress={onShare} variant="primary" icon={Share2} style={styles.shareBtn} />
        </View>
      )}
    </View>
  )
}

function getStyles(colors, isDark) {
  const paper = envelopePaper(isDark)
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  envHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  envMark: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  envKicker: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  envTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 33, color: colors.textPrimary, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 6 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  infoChipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },
  page: { marginTop: 14, padding: 22, borderRadius: 18, backgroundColor: paper.letter, borderWidth: 1, borderColor: paper.edge },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },

  textCard: { padding: 18 },
  bodyText: { fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, lineHeight: 24 },
  scopeNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 14 },

  messageCard: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  messageTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
  messageSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },

  footer: {
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
  shareBtn: { width: '100%' },
  })
}
