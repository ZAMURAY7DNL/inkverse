import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  await supabase.rpc('increment_chapter_views', { chapter_id: params.chapterId })
  return NextResponse.json({ ok: true })
}