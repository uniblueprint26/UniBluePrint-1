// Syncs a pre-launch signup (real account or early-access email) into
// Mailchimp's audience, so every marketing-consenting signup ends up there
// automatically, nothing needs manually exporting/importing later. The
// actual "we've launched!" campaign is sent from Mailchimp directly by
// Desmond when he's ready, this function only keeps the audience current.
//
// Deploy: supabase functions deploy sync-mailchimp-subscriber --no-verify-jwt
// (called from both anonymous early-access signups and freshly-created,
// not-yet-verified accounts, so same anon-trust level as the other public
// form functions.)
//
// Required Edge Function secrets:
//   MAILCHIMP_API_KEY      — from Mailchimp: Account > Extras > API keys.
//   MAILCHIMP_AUDIENCE_ID  — the target audience/list ID.
//   MAILCHIMP_SERVER_PREFIX — the datacenter prefix from the API key itself
//     (the part after the dash, e.g. "us21"). Mailchimp's API is
//     server-specific, so this has to be set correctly for the key above.
// Until all three are set, responds 200 with synced:false rather than
// erroring, never blocks the signup that triggered it.
//
// GDPR: only ever called when the caller has explicitly opted in via the
// marketing-consent checkbox on ComingSoonPage/SignUpPage, never for
// everyone who creates an account. This function does not itself check
// consent, that check happens client-side before it's invoked, exactly
// like sendFormConfirmation/notifyTeam are only invoked after a
// successful insert.

const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
const MAILCHIMP_AUDIENCE_ID = Deno.env.get('MAILCHIMP_AUDIENCE_ID')
const MAILCHIMP_SERVER_PREFIX = Deno.env.get('MAILCHIMP_SERVER_PREFIX')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { email, fullName, source } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid "email"' }), {
        status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      return new Response(JSON.stringify({ synced: false, reason: 'Mailchimp secrets not configured' }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const [firstName, ...rest] = typeof fullName === 'string' && fullName.trim() ? fullName.trim().split(' ') : ['']
    const lastName = rest.join(' ')

    const mcRes = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: { FNAME: firstName || '', LNAME: lastName || '' },
          tags: [source || 'website'],
        }),
      }
    )

    if (mcRes.ok) {
      return new Response(JSON.stringify({ synced: true }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const detail = await mcRes.json().catch(() => null)
    // "Member Exists" (400, title "Member Exists") just means they're
    // already on the list, that's a success from our side, not an error.
    if (detail?.title === 'Member Exists') {
      return new Response(JSON.stringify({ synced: true, alreadySubscribed: true }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    console.error('Mailchimp sync failed:', mcRes.status, detail)
    return new Response(JSON.stringify({ synced: false, error: 'Failed to sync to Mailchimp' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('sync-mailchimp-subscriber error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
