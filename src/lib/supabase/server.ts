// ============================================================
// INKVERSE - Clientes Supabase
// ============================================================
// Uso:
//   Server Components / Route Handlers → createClient() de server.ts
//   Client Components → createClient() de client.ts
//   Middleware → createClient() de middleware.ts
// ============================================================

// src/lib/supabase/server.ts
// Para Server Components y Route Handlers de Next.js

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // En Server Components no se puede set cookies directamente
            // El middleware se encargará de refrescar la sesión
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Idem
          }
        },
      },
    }
  )
}
