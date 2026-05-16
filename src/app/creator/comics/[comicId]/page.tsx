import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyChapters, getChapterPages } from '@/lib/comics'
import Image from 'next/image'
import { ComicManageClient } from '@/components/creator/ComicManageClient'
import type { Chapter } from '@/types'

interface ComicManagePageProps {
  params: { comicId: string }
  searchParams: { chapter?: string }
}

export default async function ComicManagePage({ params, searchParams }: ComicManagePageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: comic } = await supabase
    .from('comics')
    .select(`*, genres:comic_genres(genre:genres(*))`)
    .eq('id', params.comicId)
    .eq('author_id', user.id)
    .single()

  if (!comic) notFound()

  const chapters = await getMyChapters(comic.id)
  const selectedChapterId = searchParams.chapter
  const selectedChapter = selectedChapterId ? chapters.find(c => c.id === selectedChapterId) : null
  const pages = selectedChapter ? await getChapterPages(selectedChapter.id) : []

  return (
    <ComicManageClient
      comic={comic}
      initialChapters={chapters}
      initialSelectedChapterId={selectedChapterId || null}
      initialPages={pages}
      userId={user.id}
    />
  )
}
