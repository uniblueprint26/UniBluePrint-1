// Sends a real push notification for a row just written to public.notifications,
// via Expo's push API (https://exp.host/--/api/v2/push/send). This is the push
// half of the "additive, not a rebuild" plan already laid out in
// supabase/migrations/20260915090000_notification_center.sql's header: that
// migration made public.create_notification() the one creation choke point and
// said a push layer could hook in either there or via a plain `after insert on
// public.notifications` trigger calling this function through pg_net. We took
// the trigger route (see supabase/migrations/20261012110000_push_notifications.sql)
// so every existing writer — welcome, coach_booking, the four Foundation
// Blueprint moments, chat_message, board_reply — gets push for free, with zero
// changes to any of them.
//
// Deploy: supabase functions deploy send-push-notification
// (verify_jwt stays on — the trigger calls this with the project's anon key as
// the bearer token, same public key already shipped in the mobile app bundle,
// so a valid Supabase JWT is always present. Nothing secret crosses that call.)
//
// Required Edge Function secrets: none beyond the three Supabase always
// injects (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY) —
// the service role key is what lets this read push_tokens and notifications
// across users, which RLS would otherwise block.
//
// Called with { notification_id: uuid } (the row the trigger just inserted),
// not a title/body directly — that way this function is the only place that
// has to know how to turn a notification row into a push payload, and every
// future notification category gets push without a second call site to update.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
// Expo's API accepts up to 100 messages per request.
const EXPO_BATCH_SIZE = 100

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  let notificationId: string | undefined
  try {
    const body = await req.json()
    notificationId = body?.notification_id
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!notificationId || typeof notificationId !== 'string') {
    return jsonResponse({ error: 'notification_id is required' }, 422)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: notif, error: notifErr } = await admin
    .from('notifications')
    .select('id, user_id, category, title, message, related_entity_type, related_entity_id')
    .eq('id', notificationId)
    .maybeSingle()

  if (notifErr) return jsonResponse({ error: notifErr.message }, 500)
  if (!notif) return jsonResponse({ sent: false, reason: 'notification not found' }, 200)

  const { data: tokenRows, error: tokenErr } = await admin
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', notif.user_id)

  if (tokenErr) return jsonResponse({ error: tokenErr.message }, 500)
  if (!tokenRows || tokenRows.length === 0) {
    return jsonResponse({ sent: false, reason: 'no registered push tokens for this user' }, 200)
  }

  const messages = tokenRows.map(row => ({
    to: row.token,
    title: notif.title,
    body: notif.message || undefined,
    // Mirrors what NotificationsScreen.handlePress already does with these
    // two columns (see goToRelatedEntity in NotificationsScreen.jsx) — the
    // client resolves the deep link itself on tap, this just carries the
    // same generic entity kind + id through to the notification payload.
    data: {
      notification_id: notif.id,
      category: notif.category,
      related_entity_type: notif.related_entity_type,
      related_entity_id: notif.related_entity_id,
    },
    sound: 'default',
    // Android: without a channelId the OS falls back to a default channel
    // with no custom behaviour, which is fine here — no custom channel is
    // configured client-side (see expo-notifications plugin config in
    // app.json), so this just keeps delivery working rather than silently
    // dropping on devices that require one.
    channelId: row.platform === 'android' ? 'default' : undefined,
  }))

  const staleTokens: string[] = []
  let acceptedCount = 0
  const errors: unknown[] = []

  for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      })
      const json = await res.json().catch(() => null)
      const receipts = json?.data
      if (Array.isArray(receipts)) {
        receipts.forEach((receipt: { status?: string; details?: { error?: string } }, i: number) => {
          if (receipt?.status === 'ok') {
            acceptedCount++
          } else {
            errors.push(receipt)
            // DeviceNotRegistered means Expo itself rejected the token —
            // the app was uninstalled, or the token was revoked. Clean it
            // up here rather than leaving it to error on every future send.
            if (receipt?.details?.error === 'DeviceNotRegistered') {
              staleTokens.push(batch[i].to)
            }
          }
        })
      } else {
        errors.push({ status: res.status, body: json })
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  if (staleTokens.length > 0) {
    await admin.from('push_tokens').delete().in('token', staleTokens)
  }

  return jsonResponse({
    sent: acceptedCount > 0,
    accepted: acceptedCount,
    total_tokens: tokenRows.length,
    removed_stale_tokens: staleTokens.length,
    errors: errors.length > 0 ? errors : undefined,
  })
})
