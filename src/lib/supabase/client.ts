'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { CookieMethodsBrowser } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          if (typeof document === 'undefined') return []
          return document.cookie.split(';').map(c => {
            const [name, ...rest] = c.trim().split('=')
            return { name, value: rest.join('=') }
          })
        },
        setAll(cookies: { name: string; value: string; options?: any }[]) {
          if (typeof document === 'undefined') return
          cookies.forEach(({ name, value }) => {
            document.cookie = `${name}=${value}`
          })
        },
      },
    }
  )
}