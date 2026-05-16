import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/bookmarks — guardar o quitar obra
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { comic_id } = await request.json()
  if (!comic_id) return NextResponse.json({ error: 'comic_id requerido' }, { status: 400 })

  const { data: existing } = await supabase.from('bookmarks').select('user_id')
    .eq('user_id', user.id).eq('comic_id', comic_id).single()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('comic_id', comic_id)
    await supabase.from('comics').update({ bookmarks_count: supabase.rpc('greatest', { a: 0, b: -1 }) }).eq('id', comic_id)
    return NextResponse.json({ bookmarked: false })
  } else {
    await supabase.from('bookmarks').insert({ user_id: user.id, comic_id })
    return NextResponse.json({ bookmarked: true })
  }
}

// GET /api/bookmarks — obras guardadas del usuario
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ bookmarks: [] })

  const { data } = await supabase.from('bookmarks')
    .select(`comic:comics(*, author:profiles!author_id(id, username, display_name, avatar_url, is_verified), genres:comic_genres(genre:genres(*)))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bookmarks = (data || []).map((b: any) => ({
    ...b.comic,
    genres: b.comic?.genres?.map((g: any) => g.genre) || []
  }))

  return NextResponse.json({ bookmarks })
}
