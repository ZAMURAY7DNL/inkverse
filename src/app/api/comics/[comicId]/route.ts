import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { comicId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { comicId } = params
  const body = await request.json()

  const allowed = ['cover_url', 'banner_url', 'title', 'description', 'status', 'is_mature', 'reading_direction', 'is_published']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('comics')
    .update(updates)
    .eq('id', comicId)
    .eq('author_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ comic: data })
}

// DELETE /api/comics/[comicId] - Eliminar obra
export async function DELETE(
  request: Request,
  { params }: { params: { comicId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: comic } = await supabase
    .from('comics')
    .select('id')
    .eq('id', params.comicId)
    .eq('author_id', user.id)
    .single()

  if (!comic) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { error } = await supabase
    .from('comics')
    .delete()
    .eq('id', params.comicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
