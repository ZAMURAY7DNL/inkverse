import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Obtener el capÃ­tulo actual
  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('comic_id', comic.id)
    .eq('chapter_number', chapterNum)
    .eq('is_published', true)
    .single()

  if (!chapter) notFound()

  // Obtener capÃ­tulos adyacentes y pÃ¡ginas en paralelo
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

  // Incrementar vistas (fire & forget)
  await supabase.rpc('increment_chapter_views', { chapter_id: chapter.id })

  return (
    // Sin Navbar ni Footer en el reader
    <ComicReader
      comic={comic}
      chapter={chapter as Chapter}
      pages={pages}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
    />
  )
}
