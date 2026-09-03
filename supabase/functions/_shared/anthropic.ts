// Shared helper for calling Claude with forced structured (tool-use) output.
// Used by generate-cv, review-cv, and generate-job-search-support so each function's
// prompt file only has to define its own system prompt + JSON schema, not the wiring.

const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MODEL = 'claude-sonnet-5'

/** Ceiling on a single Claude call. Below Supabase's platform wall-clock limit
 *  on purpose, so a hung call surfaces as our own clear error rather than an
 *  opaque platform timeout the frontend can't explain. */
const REQUEST_TIMEOUT_MS = 60_000
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 500

export class MissingApiKeyError extends Error {
  constructor() {
    super('AI generation is not configured yet — add an ANTHROPIC_API_KEY secret in the Supabase dashboard (Project Settings → Edge Functions → Secrets) to enable this.')
    this.name = 'MissingApiKeyError'
  }
}

export class GenerationError extends Error {
  constructor(message: string, public detail?: unknown) {
    super(message)
    this.name = 'GenerationError'
  }
}

/** Output hit the token ceiling mid-structure. Distinct from GenerationError
 *  because the failure is recoverable by the user (shorter input) and the
 *  message needs to say so. */
export class TruncatedOutputError extends Error {
  constructor() {
    super('The response was cut off before it was complete, which usually means the input was very long. Please shorten your input and try again.')
    this.name = 'TruncatedOutputError'
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** 429 and transient 5xx are worth retrying; 4xx (bad request, auth) are not. */
function isRetryable(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 529
}

/**
 * Calls Claude, forcing it to respond via a single named tool so the result is
 * always valid JSON matching `inputSchema` — never free-form prose to parse.
 */
export async function callClaudeForStructuredOutput(opts: {
  system: string
  userContent: string
  toolName: string
  toolDescription: string
  inputSchema: Record<string, unknown>
  maxTokens?: number
}): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new MissingApiKeyError()

  const model = Deno.env.get('CLAUDE_MODEL') || DEFAULT_MODEL

  const requestBody = JSON.stringify({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: 'user', content: opts.userContent }],
    tools: [{
      name: opts.toolName,
      description: opts.toolDescription,
      input_schema: opts.inputSchema,
    }],
    tool_choice: { type: 'tool', name: opts.toolName },
  })

  let lastStatus = 0
  let lastDetail: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 500ms, then 1000ms.
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: requestBody,
        signal: controller.signal,
      })
    } catch (err) {
      // AbortError (our timeout) and network errors are both worth one retry.
      lastDetail = err instanceof Error ? err.message : String(err)
      lastStatus = 0
      if (attempt < MAX_RETRIES) continue
      throw new GenerationError('Claude API request timed out or could not be reached', lastDetail)
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      lastStatus = res.status
      lastDetail = await res.text().catch(() => null)
      if (isRetryable(res.status) && attempt < MAX_RETRIES) continue
      throw new GenerationError(`Claude API returned ${res.status}`, lastDetail)
    }

    const data = await res.json()

    // Truncation check must come before reading tool_use.input: when generation
    // stops at the token ceiling the tool_use payload can be structurally
    // incomplete, and passing it downstream would silently produce a partial
    // document that looks finished.
    if (data.stop_reason === 'max_tokens') {
      throw new TruncatedOutputError()
    }

    const toolUse = (data.content || []).find((b: { type: string }) => b.type === 'tool_use')
    if (!toolUse) throw new GenerationError('Claude did not return structured output', data)

    return toolUse.input as Record<string, unknown>
  }

  throw new GenerationError(`Claude API failed after ${MAX_RETRIES + 1} attempts`, { lastStatus, lastDetail })
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(err: unknown) {
  if (err instanceof MissingApiKeyError) {
    return jsonResponse({ error: err.message, code: 'missing_api_key' }, 501)
  }
  if (err instanceof TruncatedOutputError) {
    return jsonResponse({ error: err.message, code: 'output_truncated' }, 422)
  }
  if (err instanceof GenerationError) {
    console.error(err.message, err.detail)
    return jsonResponse({ error: 'AI generation failed. Please try again.', code: 'generation_failed' }, 502)
  }
  console.error(err)
  return jsonResponse({ error: 'Something went wrong.', code: 'internal_error' }, 500)
}
