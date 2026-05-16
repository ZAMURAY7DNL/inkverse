import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/follows — seguir o dejar de seguir un usuario
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { following_id } = await request.json()
  if (!following_id) return NextResponse.json({ error: 'following_id requerido' }, { status: 400 })
  if (following_id === user.id) return NextResponse.json({ error: 'No puedes seguirte a ti mismo' }, { status: 400 })

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', following_id)
    .single()

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', user.id).eq('following_id', following_id)
    return NextResponse.json({ following: false })
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id })
    return NextResponse.json({ following: true })
  }
}

// GET /api/follows?following_id=xxx — verificar si sigues a alguien
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ following: false })

  const { searchParams } = new URL(request.url)
  const following_id = searchParams.get('following_id')
  if (!following_id) return NextResponse.json({ error: 'following_id requerido' }, { status: 400 })

  const { data } = await supabase.from('follows').select('follower_id')
    .eq('follower_id', user.id).eq('following_id', following_id).single()

  return NextResponse.json({ following: !!data })
}
