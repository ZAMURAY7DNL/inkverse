import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Maneja el callback de OAuth (Google) desde Supabase
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error: redirigir con mensaje
  return NextResponse.redirect(`${origin}/auth/error?message=auth-callback-failed`)
}
