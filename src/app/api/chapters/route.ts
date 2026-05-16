import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateChapterInput } from '@/types'

// POST /api/chapters — Crear nuevo capítulo
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body: CreateChapterInput = await request.json()
  const { comic_id, chapter_number, title, volume } = body

  if (!comic_id) return NextResponse.json({ error: 'comic_id es requerido' }, { status: 400 })
  if (!chapter_number || chapter_number < 0) return NextResponse.json({ error: 'Número de capítulo inválido' }, { status: 400 })

  // Verificar que el cómic pertenece al usuario
  const { data: comic } = await supabase
    .from('comics')
    .select('id')
    .eq('id', comic_id)
    .eq('author_id', user.id)
    .single()

  if (!comic) return NextResponse.json({ error: 'Cómic no encontrado o no autorizado' }, { status: 403 })

  // Verificar que no existe ya ese número de capítulo
  const { data: existing } = await supabase
    .from('chapters')
    .select('id')
    .eq('comic_id', comic_id)
    .eq('chapter_number', chapter_number)
    .single()

  if (existing) return NextResponse.json({ error: `El capítulo ${chapter_number} ya existe` }, { status: 409 })

  const { data: chapter, error } = await supabase
    .from('chapters')
    .insert({
      comic_id,
      chapter_number,
      title: title?.trim() || null,
      volume: volume || null,
      is_published: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapter }, { status: 201 })
}
