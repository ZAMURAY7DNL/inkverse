import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyChapters } from '@/lib/comics'
import { ChapterUploadPanel } from '@/components/creator/ChapterUploadPanel'
import { getChapterPages } from '@/lib/comics'
import Link from 'next/link'
import Image from 'next/image'
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
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="relative h-20 w-14 rounded overflow-hidden bg-dark-surface shrink-0 panel-border">
          {comic.cover_url && <Image src={comic.cover_url} alt={comic.title} fill className="object-cover" />}
        </div>
        <div>
          <h1 className="comic-title text-3xl text-white mb-1">{comic.title}</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className={`${comic.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
              {comic.is_published ? '● Publicado' : '● Borrador'}
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{chapters.length} capítulos</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2 shrink-0">
          <Link href={`/comic/${comic.slug}`} target="_blank"
            className="rounded border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            Vista previa →
          </Link>
          {!comic.is_published && chapters.length > 0 && (
            <PublishButton comicId={comic.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapters list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Capítulos</h2>
            <NewChapterButton comicId={comic.id} nextNumber={chapters.length > 0 ? Math.floor(chapters[0].chapter_number) + 1 : 1} />
          </div>

          {chapters.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
              Sin capítulos aún
            </div>
          ) : (
            <div className="space-y-1.5">
              {chapters.map(chapter => (
                <Link
                  key={chapter.id}
                  href={`/creator/comics/${comic.id}?chapter=${chapter.id}`}
                  className={`flex items-center gap-3 rounded border px-3 py-2.5 transition-all ${
                    selectedChapterId === chapter.id
                      ? 'border-ink-500/50 bg-ink-500/10 text-ink-300'
                      : 'border-white/5 bg-dark-card hover:border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-semibold min-w-10">Cap. {chapter.chapter_number}</span>
                  <span className="text-xs flex-1 truncate">{chapter.title || '—'}</span>
                  <span className={`text-xs shrink-0 ${chapter.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                    {chapter.is_published ? '●' : '○'}
                  </span>
                  <span className="text-xs text-gray-600 shrink-0">{chapter.pages_count}p</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upload panel */}
        <div className="lg:col-span-2">
          {selectedChapter ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="comic-title text-2xl text-white">
                    CAPÍTULO {selectedChapter.chapter_number}
                    {selectedChapter.title && ` — ${selectedChapter.title}`}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {pages.length} página{pages.length !== 1 ? 's' : ''} subida{pages.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {!selectedChapter.is_published && (
                  <PublishChapterButton chapterId={selectedChapter.id} hasPages={pages.length > 0} />
                )}
              </div>
              <ChapterUploadPanel
                chapterId={selectedChapter.id}
                comicId={comic.id}
                existingPages={pages}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-white font-medium mb-1">Selecciona un capítulo</p>
              <p className="text-gray-500 text-sm">o crea uno nuevo para empezar a subir páginas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SERVER ACTION WRAPPERS (client buttons) ──
function PublishButton({ comicId }: { comicId: string }) {
  return (
    <form action={async () => {
      'use server'
      const supabase = (await import('@/lib/supabase/server')).createClient()
      await supabase.from('comics').update({ is_published: true }).eq('id', comicId)
    }}>
      <button type="submit" className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition-colors">
        Publicar Obra
      </button>
    </form>
  )
}

function PublishChapterButton({ chapterId, hasPages }: { chapterId: string; hasPages: boolean }) {
  if (!hasPages) return null
  return (
    <form action={async () => {
      'use server'
      const supabase = (await import('@/lib/supabase/server')).createClient()
      await supabase.from('chapters')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq('id', chapterId)
    }}>
      <button type="submit" className="rounded border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors">
        Publicar Capítulo
      </button>
    </form>
  )
}

function NewChapterButton({ comicId, nextNumber }: { comicId: string; nextNumber: number }) {
  return (
    <form action={async () => {
      'use server'
      const supabase = (await import('@/lib/supabase/server')).createClient()
      const { data } = await supabase.from('chapters')
        .insert({ comic_id: comicId, chapter_number: nextNumber, is_published: false })
        .select()
        .single()

      if (data) {
        const { redirect } = await import('next/navigation')
        redirect(`/creator/comics/${comicId}?chapter=${data.id}`)
      }
    }}>
      <button type="submit" className="text-xs text-ink-400 hover:text-ink-300 transition-colors">
        + Nuevo
      </button>
    </form>
  )
}
