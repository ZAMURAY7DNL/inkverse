import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UploadPageResult } from '@/types'

// POST /api/chapters/[chapterId]/pages - Registrar páginas subidas
export async function POST(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { chapterId } = params

  // Verificar que el capítulo pertenece al usuario
  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, comic:comics(author_id)')
    .eq('id', chapterId)
    .single()

  if (!chapter || (chapter.comic as any)?.author_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const pages: UploadPageResult[] = await request.json()

  // Insertar páginas en la base de datos
  const { data: inserted, error } = await supabase
    .from('chapter_pages')
    .upsert(
      pages.map(p => ({
        chapter_id: chapterId,
        page_number: p.page_number,
        image_url: p.image_url,
        image_width: p.image_width,
        image_height: p.image_height,
        file_size_bytes: p.file_size_bytes,
      })),
      { onConflict: 'chapter_id,page_number' }
    )
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Actualizar el contador de páginas del capítulo
  await supabase
    .from('chapters')
    .update({ pages_count: pages.length })
    .eq('id', chapterId)

  return NextResponse.json({ pages: inserted })
}

// DELETE /api/chapters/[chapterId]/pages - Eliminar página
export async function DELETE(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pageNumber = searchParams.get('page')
  if (!pageNumber) return NextResponse.json({ error: 'Número de página requerido' }, { status: 400 })

  const { error } = await supabase
    .from('chapter_pages')
    .delete()
    .eq('chapter_id', params.chapterId)
    .eq('page_number', parseInt(pageNumber))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
