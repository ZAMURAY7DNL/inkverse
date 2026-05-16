'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { uploadMultiplePages, validateImageFile } from '@/lib/storage'
import type { UploadProgress } from '@/lib/storage'
import type { ChapterPage, Chapter } from '@/types'

interface ChapterUploadPanelProps {
  chapter: Chapter
  comicId: string
  userId: string
  existingPages: ChapterPage[]
  onSaved?: () => void
  onChapterUpdated?: (updated: Chapter) => void
  onChapterDeleted?: (chapterId: string) => void
}

const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
}

export function ChapterUploadPanel({ chapter, comicId, userId, existingPages, onSaved, onChapterUpdated, onChapterDeleted }: ChapterUploadPanelProps) {
  const [pages, setPages] = useState<{ file: File; preview: string; pageNumber: number }[]>([])
  const [progresses, setProgresses] = useState<UploadProgress[]>([])
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [deletingChapter, setDeletingChapter] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [existingPagesList, setExistingPagesList] = useState<ChapterPage[]>(existingPages)
  const [deletingPage, setDeletingPage] = useState<number | null>(null)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(chapter.title || '')
  const [savingTitle, setSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const startPage = existingPagesList.length + 1

  const handleSaveTitle = async () => {
    if (savingTitle) return
    setSavingTitle(true)
    try {
      const res = await fetch(`/api/chapters/${chapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleValue.trim() || null }),
      })
      if (res.ok) {
        const { chapter: updated } = await res.json()
        onChapterUpdated?.(updated)
        setEditingTitle(false)
      }
    } finally {
      setSavingTitle(false)
    }
  }

  const handleDeleteChapter = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeletingChapter(true)
    try {
      const res = await fetch(`/api/chapters/${chapter.id}`, { method: 'DELETE' })
      if (res.ok) onChapterDeleted?.(chapter.id)
    } finally {
      setDeletingChapter(false)
      setConfirmDelete(false)
    }
  }

  const handleDeleteExistingPage = async (pageNumber: number) => {
    setDeletingPage(pageNumber)
    try {
      const res = await fetch(`/api/chapters/${chapter.id}/pages?page=${pageNumber}`, { method: 'DELETE' })
      if (res.ok) {
        const updated = existingPagesList
          .filter(p => p.page_number !== pageNumber)
          .map((p, i) => ({ ...p, page_number: i + 1 }))
        setExistingPagesList(updated)
        await fetch(`/api/chapters/${chapter.id}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated.map(p => ({
            page_number: p.page_number,
            image_url: p.image_url,
            image_width: p.image_width,
            image_height: p.image_height,
            file_size_bytes: p.file_size_bytes,
          }))),
        })
      }
    } finally {
      setDeletingPage(null)
    }
  }

  const moveExistingPage = async (from: number, to: number) => {
    if (to < 0 || to >= existingPagesList.length) return
    const arr = [...existingPagesList]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    const renumbered = arr.map((p, i) => ({ ...p, page_number: i + 1 }))
    setExistingPagesList(renumbered)
    await fetch(`/api/chapters/${chapter.id}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renumbered.map(p => ({
        page_number: p.page_number,
        image_url: p.image_url,
        image_width: p.image_width,
        image_height: p.image_height,
        file_size_bytes: p.file_size_bytes,
      }))),
    })
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newErrors: string[] = []
    const validFiles: File[] = []
    acceptedFiles.forEach(file => {
      const err = validateImageFile(file, 10)
      if (err) newErrors.push(`${file.name}: ${err}`)
      else validFiles.push(file)
    })
    if (newErrors.length) setErrors(newErrors)
    validFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const newPages = validFiles.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      pageNumber: startPage + pages.length + i,
    }))
    setPages(prev => [...prev, ...newPages])
    setSaved(false)
  }, [pages.length, startPage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_FORMATS, multiple: true,
  })

  const removePage = (index: number) => {
    setPages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((p, i) => ({ ...p, pageNumber: startPage + i }))
    })
  }

  const movePage = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return
    setPages(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr.map((p, i) => ({ ...p, pageNumber: startPage + i }))
    })
  }

  const handleUpload = async () => {
    if (pages.length === 0) return
    setUploading(true)
    setErrors([])
    try {
      const results = await uploadMultiplePages(
        pages.map(p => p.file),
        userId, comicId, chapter.id, startPage,
        (updates) => setProgresses([...updates]), 3
      )
      const res = await fetch(`/api/chapters/${chapter.id}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      })
      if (!res.ok) throw new Error('Error al guardar paginas en la base de datos')
      setSaved(true)
      setPages([])
      setProgresses([])
      onSaved?.()
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Error inesperado durante la subida'])
    } finally {
      setUploading(false)
    }
  }

  const totalProgress = progresses.length > 0
    ? Math.round(progresses.reduce((sum, p) => sum + p.progress, 0) / progresses.length)
    : 0

  return (
    <div className="space-y-6">

      {/* Metadatos */}
      <div className="rounded-xl border border-white/8 bg-dark-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Informacion del capitulo</p>
          <button
            onClick={handleDeleteChapter}
            disabled={deletingChapter}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              confirmDelete
                ? 'border-red-500/60 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/30'
            }`}
          >
            {deletingChapter ? 'Eliminando...' : confirmDelete ? 'Confirmar eliminar' : 'Eliminar capitulo'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Numero</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-dark-surface px-3 py-2">
              <span className="text-sm font-mono text-white">Cap. {chapter.chapter_number}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Titulo <span className="text-gray-600">(opcional)</span></label>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  autoFocus
                  type="text"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(chapter.title || '') }
                  }}
                  placeholder="Ej: El comienzo"
                  className="flex-1 rounded-lg border border-ink-500/50 bg-dark-surface px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-ink-400"
                />
                <button onClick={handleSaveTitle} disabled={savingTitle}
                  className="rounded-lg bg-ink-500 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-400 transition-colors disabled:opacity-50">
                  {savingTitle ? '...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditingTitle(false); setTitleValue(chapter.title || '') }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors">
                  x
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingTitle(true); setTimeout(() => titleInputRef.current?.focus(), 50) }}
                className="w-full flex items-center gap-2 rounded-lg border border-white/8 bg-dark-surface px-3 py-2 text-left hover:border-white/20 transition-colors group">
                <span className={`text-sm flex-1 ${titleValue ? 'text-white' : 'text-gray-600'}`}>
                  {titleValue || 'Anadir titulo...'}
                </span>
                <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">editar</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
            chapter.is_published
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {chapter.is_published ? 'Publicado' : 'Borrador'}
          </span>
          <span className="text-xs text-gray-600">{existingPagesList.length} paginas subidas</span>
        </div>
      </div>

      {/* Paginas existentes con controles */}
      {existingPagesList.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">
            Paginas subidas ({existingPagesList.length})
            <span className="text-xs text-gray-500 ml-2 font-normal">— puedes reordenar o eliminar</span>
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {existingPagesList.map((page, index) => (
              <div key={page.id} className="relative group">
                <div className="relative aspect-[3/4] rounded overflow-hidden bg-dark-card border border-white/10">
                  <Image src={page.image_url} alt={`Pagina ${page.page_number}`} fill className="object-cover" />
                  {deletingPage === page.page_number && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onClick={() => moveExistingPage(index, index - 1)} disabled={index === 0}
                      className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30">←</button>
                    <button type="button" onClick={() => handleDeleteExistingPage(page.page_number)}
                      className="text-xs bg-red-500/80 text-white px-1.5 py-1 rounded">x</button>
                    <button type="button" onClick={() => moveExistingPage(index, index + 1)} disabled={index === existingPagesList.length - 1}
                      className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30">→</button>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-1">Pag. {page.page_number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona de Drop */}
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive ? 'border-ink-500 bg-ink-500/10 scale-[1.01]' : 'border-white/10 hover:border-ink-500/40 hover:bg-ink-500/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="text-4xl">{isDragActive ? '🔥' : '🖼'}</div>
          <div>
            <p className="text-white font-medium">{isDragActive ? 'Suelta las imagenes aqui' : 'Arrastra tus paginas aqui'}</p>
            <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar archivos</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
            {['JPG', 'PNG', 'WebP', 'GIF'].map(fmt => (
              <span key={fmt} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 font-mono">{fmt}</span>
            ))}
            <span>Max. 10MB por imagen</span>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-1">
          {errors.map((err, i) => <p key={i} className="text-sm text-red-400">{err}</p>)}
        </div>
      )}

      {/* Paginas pendientes */}
      {pages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">{pages.length} pagina{pages.length !== 1 ? 's' : ''} lista{pages.length !== 1 ? 's' : ''} para subir</h3>
            <button type="button" onClick={() => setPages([])} className="text-xs text-red-400 hover:text-red-300 transition-colors">Eliminar todas</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {pages.map((page, index) => {
              const progress = progresses[index]
              return (
                <div key={page.preview} className="relative group">
                  <div className="relative aspect-[3/4] rounded overflow-hidden bg-dark-card border border-white/5">
                    <Image src={page.preview} alt={`Pagina ${page.pageNumber}`} fill className="object-cover" />
                    {progress && progress.status !== 'pending' && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        {progress.status === 'done' && <span className="text-green-400 text-xl">✓</span>}
                        {progress.status === 'error' && <span className="text-red-400 text-xl">✗</span>}
                        {progress.status === 'uploading' && (
                          <>
                            <div className="w-8 h-8 rounded-full border-2 border-ink-400 border-t-transparent animate-spin" />
                            <span className="text-xs text-white mt-1">{progress.progress}%</span>
                          </>
                        )}
                      </div>
                    )}
                    {!uploading && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button type="button" onClick={() => movePage(index, index - 1)} disabled={index === 0}
                          className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30">←</button>
                        <button type="button" onClick={() => removePage(index)}
                          className="text-xs bg-red-500/80 text-white px-1.5 py-1 rounded">x</button>
                        <button type="button" onClick={() => movePage(index, index + 1)} disabled={index === pages.length - 1}
                          className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30">→</button>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-1">Pag. {page.pageNumber}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={handleUpload} disabled={uploading || pages.length === 0}
              className="rounded-lg bg-ink-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo... {totalProgress}%</>
              ) : `Subir ${pages.length} pagina${pages.length !== 1 ? 's' : ''}`}
            </button>
            {uploading && (
              <div className="flex-1 bg-dark-card rounded-full h-2">
                <div className="bg-ink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${totalProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          Paginas guardadas correctamente
        </div>
      )}
    </div>
  )
}
