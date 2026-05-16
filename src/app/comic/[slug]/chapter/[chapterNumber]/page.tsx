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

  // Generar hash único por visita usando IP + UA + timestamp parcial
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || headersList.get('cf-connecting-ip')
    || ''
  const ua = headersList.get('user-agent') || ''

  let viewerHash: string
  if (ip) {
    // Si tenemos IP, hash estable por 1 hora
    const raw = `${ip}-${ua}-${chapter.id}`
    let h = 0
    for (let i = 0; i < raw.length; i++) {
      h = ((h << 5) - h) + raw.charCodeAt(i)
      h |= 0
    }
    viewerHash = Math.abs(h).toString(36)
  } else {
    // Sin IP: hash aleatorio — cada visita cuenta (sin proteccion)
    viewerHash = Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  void supabase.rpc('increment_chapter_views', {
    chapter_id: chapter.id,
    viewer_hash: viewerHash
  })

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
