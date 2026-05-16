import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/chapters/[chapterId] — actualizar metadatos del capítulo
export async function PATCH(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { chapterId } = params
  const body = await request.json()

  // Verificar propiedad
  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, comic:comics(author_id)')
    .eq('id', chapterId)
    .single()

  if (!chapter || (chapter.comic as any)?.author_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const allowed = ['title', 'volume', 'chapter_number', 'is_published', 'published_at']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapter: data })
}
