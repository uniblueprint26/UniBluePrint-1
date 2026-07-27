import { supabase } from './supabase'

/**
 * Calls a Supabase Edge Function and surfaces the REAL error message the
 * function returned.
 *
 * Why this exists: supabase-js throws `FunctionsHttpError` the moment it sees a
 * non-2xx status, *before* it parses the response body (see
 * @supabase/functions-js FunctionsClient — `if (!response.ok) throw new
 * FunctionsHttpError(response)` sits above the body-parsing branch). So `data`
 * is always null on an error response and `error.message` is the fixed string
 * "Edge Function returned a non-2xx status code".
 *
 * The body is still reachable on `error.context`, which is the raw Response.
 * Without reading it, every hand-written 422 and the 501 that explains a
 * missing ANTHROPIC_API_KEY is invisible to the user.
 *
 * Throws an Error carrying the backend's own message, with `.code` attached
 * where the backend supplied one (e.g. 'missing_api_key').
 */
export async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    const parsed = await extractErrorBody(error)
    if (parsed?.error) {
      const err = new Error(parsed.error)
      if (parsed.code) err.code = parsed.code
      throw err
    }
    // Extraction itself failed — fall back to something a user can act on
    // rather than the raw library string.
    throw new Error(
      'We could not reach the generator just now. Please check your connection and try again.',
    )
  }

  // Belt and braces: a 200 response that still carries an error payload.
  if (data?.error) {
    const err = new Error(data.error)
    if (data.code) err.code = data.code
    throw err
  }

  return data
}

async function extractErrorBody(error) {
  const res = error?.context
  if (!res || typeof res.json !== 'function') return null
  try {
    // `context` is a Response; it can only be consumed once, and we are the
    // only consumer since supabase-js threw before touching the body.
    return await res.json()
  } catch {
    return null
  }
}
