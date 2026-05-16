'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Comic, Chapter, ChapterPage } from '@/types'

interface ComicReaderProps {
  comic: Comic
  chapter: Chapter
  pages: ChapterPage[]
  prevChapter?: Chapter | null
  nextChapter?: Chapter | null
}

export function ComicReader({ comic, chapter, pages, prevChapter, nextChapter }: ComicReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [showUI, setShowUI] = useState(true)
  const [readerMode, setReaderMode] = useState<'page' | 'scroll'>('page')
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()

  const isRTL = comic.reading_direction === 'rtl'
  const isVertical = comic.reading_direction === 'ttb'
  const totalPages = pages.length

  // Contar vista una sola vez por capítulo
  const viewedRef = useRef<string | null>(null)
  useEffect(() => {
    if (viewedRef.current === chapter.id) return
    viewedRef.current = chapter.id
    fetch(`/api/chapters/${chapter.id}/view`, { method: 'POST' })
  }, [chapter.id])

  // Auto-detectar modo según tipo
  useEffect(() => {
    setReaderMode(isVertical ? 'scroll' : 'page')
  }, [isVertical])

  const showUITemporarily = useCallback(() => {
    setShowUI(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowUI(false), 3000)
  }, [])

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1)
  }, [currentPage, totalPages])

  const goPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage(p => p - 1)
  }, [currentPage])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') isRTL ? goPrev() : goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') isRTL ? goNext() : goPrev()
      if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRTL, goNext, goPrev])

  const handlePageClick = (e: React.MouseEvent) => {
    showUITemporarily()
    if (readerMode === 'scroll') return
    const { clientX, currentTarget } = e
    const { left, width } = currentTarget.getBoundingClientRect()
    const ratio = (clientX - left) / width
    if (isRTL) {
      ratio < 0.3 ? goNext() : ratio > 0.7 ? goPrev() : null
    } else {
      ratio < 0.3 ? goPrev() : ratio > 0.7 ? goNext() : null
    }
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-gray-400">
        <p>Este capítulo no tiene páginas aún.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-black"
      onMouseMove={showUITemporarily}
      onClick={handlePageClick}
      style={{ cursor: readerMode === 'scroll' ? 'auto' : 'pointer' }}
    >
      {/* TOP BAR */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
        <div className="flex items-center gap-4 bg-gradient-to-b from-black/90 to-transparent px-4 py-3">
          <Link href={`/comic/${comic.slug}`}
            className="text-white/60 hover:text-white transition-colors text-sm">
            ← {comic.title}
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-white text-sm">
            Cap. {chapter.chapter_number}{chapter.title && `: ${chapter.title}`}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setReaderMode(m => m === 'page' ? 'scroll' : 'page') }}
              className="text-xs text-white/50 hover:text-white border border-white/10 rounded px-2 py-1 transition-colors"
            >
              {readerMode === 'page' ? '📄 Pág. a Pág.' : '📜 Scroll'}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {readerMode === 'scroll' ? (
        <div className="flex flex-col items-center pt-12 pb-20">
          {pages.map((page) => (
            <Image
              key={page.id}
              src={page.image_url}
              alt={`Página ${page.page_number}`}
              width={page.image_width || 800}
              height={page.image_height || 1200}
              className="reader-page max-w-3xl w-full"
              priority={page.page_number <= 2}
            />
          ))}
        </div>
      ) : (
        <div
          className={`flex items-center justify-center min-h-screen ${isRTL ? 'reader-container rtl' : ''}`}
          style={{ paddingTop: '56px', paddingBottom: '56px' }}
        >
          {pages[currentPage] && (
            <Image
              src={pages[currentPage].image_url}
              alt={`Página ${currentPage + 1}`}
              width={pages[currentPage].image_width || 800}
              height={pages[currentPage].image_height || 1200}
              className="reader-page"
              style={{ maxHeight: 'calc(100vh - 112px)', objectFit: 'contain' }}
              priority
            />
          )}
        </div>
      )}

      {/* BOTTOM BAR */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-200 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
        <div className="bg-gradient-to-t from-black/90 to-transparent px-4 py-4">
          {readerMode === 'page' && (
            <>
              <div className="w-full bg-white/10 rounded-full h-1 mb-3">
                <div
                  className="bg-ink-500 h-1 rounded-full transition-all"
                  style={{ width: totalPages > 0 ? `${((currentPage + 1) / totalPages) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {prevChapter ? (
                    <Link href={`/comic/${comic.slug}/chapter/${prevChapter.chapter_number}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-white/50 hover:text-white transition-colors">
                      ← Cap. {prevChapter.chapter_number}
                    </Link>
                  ) : <span />}
                </div>
                <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                  <button onClick={isRTL ? goNext : goPrev} disabled={currentPage === (isRTL ? totalPages - 1 : 0)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-black/50 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-20">
                    ←
                  </button>
                  <span className="text-sm text-white/60 min-w-16 text-center">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button onClick={isRTL ? goPrev : goNext} disabled={currentPage === (isRTL ? 0 : totalPages - 1)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-black/50 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-20">
                    →
                  </button>
                </div>
                <div>
                  {nextChapter ? (
                    <Link href={`/comic/${comic.slug}/chapter/${nextChapter.chapter_number}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-white/50 hover:text-white transition-colors">
                      Cap. {nextChapter.chapter_number} →
                    </Link>
                  ) : <span />}
                </div>
              </div>
            </>
          )}
          {readerMode === 'scroll' && (
            <div className="flex justify-between">
              {prevChapter ? (
                <Link href={`/comic/${comic.slug}/chapter/${prevChapter.chapter_number}`}
                  className="text-sm text-white/50 hover:text-white transition-colors">
                  ← Capítulo {prevChapter.chapter_number}
                </Link>
              ) : <span />}
              {nextChapter ? (
                <Link href={`/comic/${comic.slug}/chapter/${nextChapter.chapter_number}`}
                  className="text-sm text-white/50 hover:text-white transition-colors">
                  Capítulo {nextChapter.chapter_number} →
                </Link>
              ) : <span />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
