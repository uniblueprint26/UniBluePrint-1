import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Client scoped to the caller's own JWT (forwarded from the request), so every
 * query runs under that user's RLS policies — no service-role key needed for
 * these functions, since each table already has "own row" policies.
 */
export function supabaseForRequest(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

export async function requireUser(req: Request) {
  const supabase = supabaseForRequest(req)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  return { supabase, user: data.user }
}
