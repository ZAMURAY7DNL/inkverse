import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/utils'
import type { CreateComicInput } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body: CreateComicInput = await request.json()
  const { title, description, type, status, reading_direction, is_mature, genre_ids } = body

  if (!title?.trim()) return NextResponse.json({ error: 'El titulo es requerido' }, { status: 400 })

  let slug = generateSlug(title)
  const { data: existing } = await supabase.from('comics').select('slug').eq('slug', slug).single()
  if (existing) slug = `${slug}-${Date.now()}`

  const { data: comic, error } = await supabase
    .from('comics')
    .insert({ author_id: user.id, title: title.trim(), slug, description, type, status, reading_direction, is_mature, is_published: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (genre_ids?.length > 0) {
    await supabase.from('comic_genres').insert(genre_ids.map(genre_id => ({ comic_id: comic.id, genre_id })))
  }

  await supabase.from('profiles').update({ is_creator: true }).eq('id', user.id)

  return NextResponse.json({ comic }, { status: 201 })
}
