import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('increment_chapter_views', { chapter_id: params.chapterId })
    if (error) console.error('RPC error:', error)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('View error:', e)
    return NextResponse.json({ ok: false })
  }
}