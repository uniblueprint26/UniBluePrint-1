// Sends a "we got your submission" confirmation email via Resend, right
// after a public form (ContactPage's 3 tabs, ForUniversitiesPage,
// ForBusinessesPage, ComingSoonPage) writes its row to Supabase.
//
// Deploy: supabase functions deploy send-form-confirmation --no-verify-jwt
// (--no-verify-jwt because these forms are filled out by anonymous
// visitors with no Supabase session — same trust level as the table
// insert itself, which already allows anon with a rate-limit trigger.
// This function does its own light validation instead of relying on
// Supabase auth.)
//
// Required Edge Function secret:
//   RESEND_API_KEY — from resend.com. Until this is set, the function
//   responds 200 with sent:false rather than erroring, so a missing key
//   never surfaces as a broken submission — the on-page "we got it"
//   success state (SuccessCard) already covers that; this email is a
//   nice-to-have on top of it, not a dependency of it.
//
// Called from the client as a fire-and-forget: the form's own success
// state is set from the table insert succeeding, not from this call, so
// a Resend outage or missing key never blocks or errors the form.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_ADDRESS = Deno.env.get('CONFIRMATION_FROM_ADDRESS') || 'UniBlueprint <hello@uniblueprint.ie>'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TemplateFn = (name: string) => { subject: string; body: string }

// One line per kind on what happens next — matches the copy each page's
// on-screen SuccessCard already promises, so the email doesn't contradict
// the page.
const TEMPLATES: Record<string, TemplateFn> = {
  general: name => ({
    subject: 'We got your message — UniBlueprint',
    body: `Thanks for reaching out${name ? `, ${name}` : ''}. Our team has your message and will get back to you within 2 business days.`,
  }),
  partnership: name => ({
    subject: 'Thanks for your interest in partnering with UniBlueprint',
    body: `Thanks for getting in touch${name ? `, ${name}` : ''} about a partnership. We'll review the details and reply within 2 business days.`,
  }),
  team: name => ({
    subject: 'We got your application — UniBlueprint',
    body: `Thanks for applying to join the team${name ? `, ${name}` : ''}. We review every application personally and will follow up within 2 business days.`,
  }),
  university: name => ({
    subject: 'Thanks for your interest — UniBlueprint for Universities',
    body: `Thanks for reaching out${name ? `, ${name}` : ''} about bringing UniBlueprint to your institution. Our partnerships team will follow up within 2 business days.`,
  }),
  business: name => ({
    subject: 'Thanks for your interest — UniBlueprint for Businesses',
    body: `Thanks for reaching out${name ? `, ${name}` : ''} about the Lifestyle Blueprint. Our partnerships team will follow up within 2 business days.`,
  }),
  early_access: () => ({
    subject: "You're on the list — UniBlueprint",
    body: `You're confirmed for early access. We'll email you the moment UniBlueprint launches — no action needed in the meantime.`,
  }),
}

function renderHtml(subject: string, body: string): string {
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
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1E3A5F;margin:0 0 16px;">${subject}</h1>
            <p style="font-size:15px;line-height:1.6;color:#374151;margin:0;">${body}</p>
          </td></tr>
          <tr><td style="padding:0 32px 32px;">
            <p style="font-size:12px;color:#9CA3AF;margin:0;">UniBlueprint · Ireland</p>
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
    const { kind, to, name } = await req.json()

    const template = TEMPLATES[kind]
    if (!template) {
      return new Response(JSON.stringify({ error: `Unknown kind: ${kind}` }), {
        status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid "to" address' }), {
        status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (!RESEND_API_KEY) {
      // Not configured yet — not an error the caller should surface.
      return new Response(JSON.stringify({ sent: false, reason: 'RESEND_API_KEY not configured' }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { subject, body } = template(typeof name === 'string' ? name.trim() : '')

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html: renderHtml(subject, body),
      }),
    })

    if (!resendRes.ok) {
      const detail = await resendRes.text()
      console.error('Resend send failed:', resendRes.status, detail)
      return new Response(JSON.stringify({ sent: false, error: 'Failed to send confirmation email' }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-form-confirmation error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
