'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChapterUploadPanel } from '@/components/creator/ChapterUploadPanel'
import { NewChapterModal } from '@/components/creator/NewChapterModal'
import type { Comic, Chapter, ChapterPage } from '@/types'

interface ComicManageClientProps {
  comic: Comic
  initialChapters: Chapter[]
  initialSelectedChapterId: string | null
  initialPages: ChapterPage[]
  userId: string
}

export function ComicManageClient({
  comic,
  initialChapters,
  initialSelectedChapterId,
  initialPages,
  userId,
}: ComicManageClientProps) {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(initialSelectedChapterId)
  const [pages, setPages] = useState<ChapterPage[]>(initialPages)
  const [loadingPages, setLoadingPages] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deletingComic, setDeletingComic] = useState(false)
  const [confirmDeleteComic, setConfirmDeleteComic] = useState(false)

  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || null
  const nextNumber = chapters.length > 0 ? Math.floor(chapters[0].chapter_number) + 1 : 1

  const handleSelectChapter = async (chapter: Chapter) => {
    if (chapter.id === selectedChapterId) return
    setSelectedChapterId(chapter.id)
    setLoadingPages(true)
    try {
      const res = await fetch(`/api/chapters/${chapter.id}/pages`)
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
      }
    } finally {
      setLoadingPages(false)
    }
  }

  const handleChapterCreated = (newChapter: Chapter) => {
    setChapters(prev => [newChapter, ...prev])
    handleSelectChapter(newChapter)
  }

  const handleChapterUpdated = (updated: Chapter) => {
    setChapters(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const handleChapterDeleted = (chapterId: string) => {
    setChapters(prev => prev.filter(c => c.id !== chapterId))
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(null)
      setPages([])
    }
  }

  const handlePagesSaved = async () => {
    if (!selectedChapterId) return
    setLoadingPages(true)
    try {
      const res = await fetch(`/api/chapters/${selectedChapterId}/pages`)
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
        setChapters(prev => prev.map(c =>
          c.id === selectedChapterId ? { ...c, pages_count: data.pages?.length || 0 } : c
        ))
      }
    } finally {
      setLoadingPages(false)
    }
  }

  const handlePublishChapter = async () => {
    if (!selectedChapterId) return
    setPublishing(true)
    try {
      await fetch(`/api/chapters/${selectedChapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true, published_at: new Date().toISOString() }),
      })
      setChapters(prev => prev.map(c =>
        c.id === selectedChapterId ? { ...c, is_published: true } : c
      ))
    } finally {
      setPublishing(false)
    }
  }

  const handlePublishComic = async () => {
    await fetch(`/api/comics/${comic.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: true }),
    })
    router.refresh()
  }

  const handleDeleteComic = async () => {
    if (!confirmDeleteComic) { setConfirmDeleteComic(true); return }
    setDeletingComic(true)
    try {
      const res = await fetch(`/api/comics/${comic.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/creator/comics')
    } finally {
      setDeletingComic(false)
      setConfirmDeleteComic(false)
    }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="relative h-20 w-14 rounded overflow-hidden bg-dark-surface shrink-0 panel-border">
          {comic.cover_url && <Image src={comic.cover_url} alt={comic.title} fill className="object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="comic-title text-3xl text-white mb-1 truncate">{comic.title}</h1>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className={`inline-flex items-center gap-1.5 ${comic.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {comic.is_published ? 'Publicado' : 'Borrador'}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">{chapters.length} capitulo{chapters.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <Link
            href={`/comic/${comic.slug}`}
            target="_blank"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Vista previa
          </Link>
          {!comic.is_published && chapters.length > 0 && (
            <button
              onClick={handlePublishComic}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition-colors"
            >
              Publicar Obra
            </button>
          )}
          <button
            onClick={handleDeleteComic}
            disabled={deletingComic}
            className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${
              confirmDeleteComic
                ? 'border-red-500/60 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/30'
            }`}
          >
            {deletingComic ? 'Eliminando...' : confirmDeleteComic ? 'Confirmar eliminar obra' : 'Eliminar obra'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de capitulos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Capitulos</h2>
            <NewChapterModal
              comicId={comic.id}
              nextNumber={nextNumber}
              onCreated={handleChapterCreated}
            />
          </div>

          {chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-gray-500">Sin capitulos aun</p>
              <p className="text-xs text-gray-600 mt-1">Crea el primero con el boton de arriba</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {chapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => handleSelectChapter(chapter)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    selectedChapterId === chapter.id
                      ? 'border-ink-500/50 bg-ink-500/10'
                      : 'border-white/5 bg-dark-card hover:border-white/10'
                  }`}
                >
                  <span className={`text-xs font-semibold min-w-10 shrink-0 ${selectedChapterId === chapter.id ? 'text-ink-300' : 'text-gray-400'}`}>
                    Cap. {chapter.chapter_number}
                  </span>
                  <span className={`text-xs flex-1 truncate ${selectedChapterId === chapter.id ? 'text-ink-200' : 'text-gray-400'}`}>
                    {chapter.title || <span className="text-gray-600 italic">Sin titulo</span>}
                  </span>
                  <span className={`text-xs shrink-0 ${chapter.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                    {chapter.is_published ? '●' : '○'}
                  </span>
                  <span className="text-xs text-gray-600 shrink-0">{chapter.pages_count}p</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de edicion */}
        <div className="lg:col-span-2">
          {selectedChapter ? (
            <div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="comic-title text-2xl text-white">
                    CAPITULO {selectedChapter.chapter_number}
                    {selectedChapter.title && (
                      <span className="text-gray-400 text-xl"> — {selectedChapter.title}</span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {loadingPages ? 'Cargando...' : `${pages.length} pagina${pages.length !== 1 ? 's' : ''} subida${pages.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {!selectedChapter.is_published && pages.length > 0 && (
                  <button
                    onClick={handlePublishChapter}
                    disabled={publishing}
                    className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {publishing ? 'Publicando...' : 'Publicar Capitulo'}
                  </button>
                )}
              </div>

              {loadingPages ? (
                <div className="rounded-xl border border-white/5 bg-dark-card p-12 text-center">
                  <div className="w-8 h-8 border-2 border-ink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Cargando paginas...</p>
                </div>
              ) : (
                <ChapterUploadPanel
                  chapter={selectedChapter}
                  comicId={comic.id}
                  userId={userId}
                  existingPages={pages}
                  onSaved={handlePagesSaved}
                  onChapterUpdated={handleChapterUpdated}
                  onChapterDeleted={handleChapterDeleted}
                />
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-16 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-white font-medium mb-1">Selecciona un capitulo</p>
              <p className="text-gray-500 text-sm">o crea uno nuevo para empezar a subir paginas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
