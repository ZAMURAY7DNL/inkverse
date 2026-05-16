import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { getComicBySlug, getChapterPages } from '@/lib/comics'
import { ComicReader } from '@/components/reader/ComicReader'
import type { Chapter } from '@/types'

interface ReaderPageProps {
  params: { slug: string; chapterNumber: string }
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const supabase = createClient()
  const chapterNum = parseFloat(params.chapterNumber)

  const comic = await getComicBySlug(params.slug)
  if (!comic) notFound()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('comic_id', comic.id)
    .eq('chapter_number', chapterNum)
    .eq('is_published', true)
    .single()

  if (!chapter) notFound()

  const [pages, { data: adjacentChapters }] = await Promise.all([
    getChapterPages(chapter.id),
    supabase
      .from('chapters')
      .select('id, chapter_number, title')
      .eq('comic_id', comic.id)
      .eq('is_published', true)
      .in('chapter_number', [chapterNum - 1, chapterNum + 0.5, chapterNum + 1])
      .order('chapter_number'),
  ])

  const prevChapter = (adjacentChapters || []).find(c => c.chapter_number < chapterNum) as Chapter | null
  const nextChapter = (adjacentChapters || []).find(c => c.chapter_number > chapterNum) as Chapter | null

  // Generar hash del viewer para evitar doble conteo
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const ua = headersList.get('user-agent') || 'unknown'
  const rawHash = `${ip}-${ua}-${chapter.id}`
  
  // Hash simple sin crypto
  let hash = 0
  for (let i = 0; i < rawHash.length; i++) {
    hash = ((hash << 5) - hash) + rawHash.charCodeAt(i)
    hash |= 0
  }
  const viewerHash = Math.abs(hash).toString(36)

  // Incrementar vistas con proteccion anti-doble conteo (fire & forget)
  supabase.rpc('increment_chapter_views', { 
    chapter_id: chapter.id,
    viewer_hash: viewerHash
  }).then(() => {}).catch(() => {})

  return (
    <ComicReader
      comic={comic}
      chapter={chapter as Chapter}
      pages={pages}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
    />
  )
}
