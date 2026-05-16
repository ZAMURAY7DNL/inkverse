import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { chapter_id } = await request.json()
  if (!chapter_id) return NextResponse.json({ error: 'chapter_id requerido' }, { status: 400 })

  const supabase = createClient()

  const viewer_hash = Math.random().toString(36).slice(2) + Date.now().toString(36)

  await supabase.rpc('increment_chapter_views', {
    chapter_id,
    viewer_hash
  })

  return NextResponse.json({ ok: true })
}
