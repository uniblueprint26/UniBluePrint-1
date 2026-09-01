// Notifies the UniBlueprint team inbox that a new public-form submission
// arrived, separate from send-form-confirmation, which emails the
// submitter. This one always goes to the team, not to whatever the
// visitor typed, so the "to" address is fixed server-side and never
// taken from the request body.
//
// Deploy: supabase functions deploy notify-team-submission --no-verify-jwt
// (same reasoning as send-form-confirmation: anonymous visitors submit
// these forms with no Supabase session.)
//
// Required Edge Function secret:
//   RESEND_API_KEY — shared with send-form-confirmation. Until it's set,
//   responds 200 with sent:false rather than erroring, so a missing key
//   never surfaces as a broken submission.
//
// Called from the client as a fire-and-forget, right after the table
// insert succeeds, same pattern as sendFormConfirmation in
// src/components/ui/Form.jsx.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_ADDRESS = Deno.env.get('CONFIRMATION_FROM_ADDRESS') || 'UniBlueprint <hello@uniblueprint.ie>'
const TEAM_INBOX = 'uniblueprint26@gmail.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// One entry per table this covers. Label is what shows in the subject
// line and email body, kept human-readable rather than the raw table name.
const KINDS: Record<string, { label: string }> = {
  university_enquiry:   { label: 'University enquiry' },
  business_enquiry:     { label: 'Business enquiry' },
  handler_application:  { label: 'Handler application' },
  coach_application:    { label: 'Coach application' },
  ambassador_application: { label: 'Ambassador application' },
}

function renderHtml(kindLabel: string, submitterEmail: string, submitterName: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 24px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#1E3A5F;padding:28px 32px;">
            <span style="font-family:Georgia,serif;font-size:20px;color:#F5F0E8;">UniBlueprint</span>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1E3A5F;margin:0 0 16px;">New ${kindLabel}</h1>
            <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 8px;">
              ${submitterName ? `From: ${submitterName}<br/>` : ''}Email: ${submitterEmail}
            </p>
            <p style="font-size:13px;line-height:1.6;color:#6B7280;margin:16px 0 0;">
              Full details are in the Operations dashboard / Supabase table.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { kind, submitterEmail, submitterName } = await req.json()

    const entry = KINDS[kind]
    if (!entry) {
      return new Response(JSON.stringify({ error: `Unknown kind: ${kind}` }), {
        status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ sent: false, reason: 'RESEND_API_KEY not configured' }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const subject = `New ${entry.label} — UniBlueprint`
    const html = renderHtml(
      entry.label,
      typeof submitterEmail === 'string' ? submitterEmail : 'not provided',
      typeof submitterName === 'string' ? submitterName.trim() : ''
    )

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: TEAM_INBOX,
        subject,
        html,
      }),
    })

    if (!resendRes.ok) {
      const detail = await resendRes.text()
      console.error('Resend send failed:', resendRes.status, detail)
      return new Response(JSON.stringify({ sent: false, error: 'Failed to send team notification' }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-team-submission error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
