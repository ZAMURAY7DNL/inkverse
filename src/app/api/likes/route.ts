import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/likes — dar o quitar like a una obra
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { comic_id } = await request.json()
  if (!comic_id) return NextResponse.json({ error: 'comic_id requerido' }, { status: 400 })

  const { data: existing } = await supabase.from('comic_likes').select('user_id')
    .eq('user_id', user.id).eq('comic_id', comic_id).single()

  if (existing) {
    await supabase.from('comic_likes').delete().eq('user_id', user.id).eq('comic_id', comic_id)
    return NextResponse.json({ liked: false })
  } else {
    await supabase.from('comic_likes').insert({ user_id: user.id, comic_id })
    return NextResponse.json({ liked: true })
  }
}
