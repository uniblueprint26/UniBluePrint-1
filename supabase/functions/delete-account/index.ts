// Permanently deletes the calling user's own account and all associated
// personal data, immediately and self-service — required by Apple Guideline
// 5.1.1(v) (an app with account creation must let a user delete their
// account from within the app) and satisfies GDPR Article 17 (right to
// erasure). Called from PrivacyDataScreen.jsx via
// supabase.functions.invoke('delete-account').
//
// Deploy: supabase functions deploy delete-account
//
// Required Edge Function secrets:
//   SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — the first
//   two are auto-injected by Supabase; SERVICE_ROLE_KEY normally is too, but
//   confirm it's present (Project Settings -> Edge Functions -> Secrets) —
//   auth.admin.deleteUser is only callable with it.
//
// Deleting the auth.users row cascades to every personal-data table via
// their existing `user_id ... references auth.users(id) on delete cascade`
// constraints (see supabase/migrations/20260410140346 and every migration
// since) — this function does not need to delete those rows itself.
//
// A gdpr_deletion_log row is written BEFORE deletion, with deliberately no
// foreign key to auth.users(id): gdpr_requests' own user_id FK is also
// on-delete-cascade, so a record written there would be deleted along with
// everything else the moment the user is removed, leaving no trace deletion
// ever happened. See migration 20260922090000_gdpr_self_service.sql.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Verified against the caller's own JWT — identifies who is asking,
    // never who they claim to be deleting.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: logError } = await admin.from('gdpr_deletion_log').insert({
      deleted_user_id: user.id,
      email: user.email,
      method: 'self_service',
    })
    if (logError) {
      // Don't let a logging failure block the actual erasure the user asked
      // for — Article 17 doesn't wait on our own bookkeeping. Surfaced in
      // function logs for Operations to notice separately.
      console.error('delete-account: failed to write gdpr_deletion_log:', logError)
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ deleted: true }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('delete-account error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
