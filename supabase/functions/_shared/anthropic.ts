// Shared helper for calling Claude with forced structured (tool-use) output.
// Used by generate-cv, review-cv, and generate-job-search-support so each function's
// prompt file only has to define its own system prompt + JSON schema, not the wiring.

const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MODEL = 'claude-sonnet-5'

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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
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
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => null)
    throw new GenerationError(`Claude API returned ${res.status}`, detail)
  }

  const data = await res.json()
  const toolUse = (data.content || []).find((b: { type: string }) => b.type === 'tool_use')
  if (!toolUse) throw new GenerationError('Claude did not return structured output', data)

  return toolUse.input as Record<string, unknown>
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
  if (err instanceof GenerationError) {
    console.error(err.message, err.detail)
    return jsonResponse({ error: 'AI generation failed. Please try again.', code: 'generation_failed' }, 502)
  }
  console.error(err)
  return jsonResponse({ error: 'Something went wrong.', code: 'internal_error' }, 500)
}
