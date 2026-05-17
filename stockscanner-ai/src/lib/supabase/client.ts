import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

/** Lazy singleton — only instantiated when first called, not at module load time */
export function getSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !url.startsWith("http")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing or invalid. Must be a full URL like https://xxxx.supabase.co"
    )
  }
  if (!key) {
    throw new Error("Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing")
  }

  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

/** Convenience proxy — same API as before for existing callers */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
