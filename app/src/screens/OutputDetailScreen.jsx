import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Share } from 'react-native'
import { Share2, AlertCircle, Archive } from 'lucide-react-native'
import ScreenHeader from '../components/ui/ScreenHeader'
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
  const { colors } = useTheme()
  const styles = getStyles(colors)
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
      <ScreenHeader
        variant="navy"
        onBack={safeGoBack}
        backLabel="My Outputs"
        eyebrow={isExpired ? 'EXPIRED' : 'DELIVERED'}
        title={serviceName || 'Your document'}
        subtitle={deliveredAt
          ? `Delivered ${formatDate(deliveredAt)}${!isExpired ? ` · ${storageNote(expiresAt)}` : ''}`
          : undefined}
        style={styles.heroBlock}
        titleStyle={styles.heroTitle}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
            <Card style={styles.textCard}>
              <Text selectable style={styles.bodyText}>{text}</Text>
            </Card>
            <Text style={styles.scopeNote}>
              Plain text only, for now — copy or share it anywhere you need it below.
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

function getStyles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  heroBlock: { backgroundColor: colors.chromeBg, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.chromeFg, marginTop: 6 },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },

  textCard: { padding: 18 },
  bodyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
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
