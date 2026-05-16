'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { uploadMultiplePages, validateImageFile } from '@/lib/storage'
import type { UploadProgress } from '@/lib/storage'
import type { ChapterPage } from '@/types'

interface ChapterUploadPanelProps {
  chapterId: string
  comicId: string
  existingPages: ChapterPage[]
  onSaved?: () => void
}

// Formatos aceptados para cómics
const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
}

export function ChapterUploadPanel({ chapterId, comicId, existingPages, onSaved }: ChapterUploadPanelProps) {
  const [pages, setPages] = useState<{ file: File; preview: string; pageNumber: number }[]>([])
  const [progresses, setProgresses] = useState<UploadProgress[]>([])
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const startPage = existingPages.length + 1

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newErrors: string[] = []
    const validFiles: File[] = []

    acceptedFiles.forEach(file => {
      const err = validateImageFile(file, 10)
      if (err) newErrors.push(`${file.name}: ${err}`)
      else validFiles.push(file)
    })

    if (newErrors.length) setErrors(newErrors)

    // Ordenar por nombre (útil para archivos page_001, page_002...)
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
    onDrop,
    accept: ACCEPTED_FORMATS,
    multiple: true,
  })

  const removePage = (index: number) => {
    setPages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      const updated = prev.filter((_, i) => i !== index)
      // Renumerar
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
        comicId,
        chapterId,
        startPage,
        (updates) => setProgresses([...updates]),
        3 // concurrencia: 3 archivos a la vez
      )

      // Guardar en BD
      const res = await fetch(`/api/chapters/${chapterId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      })

      if (!res.ok) throw new Error('Error al guardar páginas en la base de datos')

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

      {/* Zona de Drop */}
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-ink-500 bg-ink-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-ink-500/40 hover:bg-ink-500/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="text-4xl">{isDragActive ? '📥' : '🖼'}</div>
          <div>
            <p className="text-white font-medium">
              {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra tus páginas aquí'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              o haz clic para seleccionar archivos
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">JPG</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">PNG</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">WebP</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">GIF</span>
            </span>
            <span className="text-gray-600">·</span>
            <span>Máx. 10MB por imagen</span>
          </div>
        </div>
      </div>

      {/* Errores de validación */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">{err}</p>
          ))}
        </div>
      )}

      {/* Grid de páginas pendientes */}
      {pages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">
              {pages.length} página{pages.length !== 1 ? 's' : ''} lista{pages.length !== 1 ? 's' : ''} para subir
            </h3>
            <button
              type="button"
              onClick={() => setPages([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Eliminar todas
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {pages.map((page, index) => {
              const progress = progresses[index]
              return (
                <div key={page.preview} className="relative group">
                  <div className="relative aspect-[3/4] rounded overflow-hidden bg-dark-card border border-white/5">
                    <Image src={page.preview} alt={`Página ${page.pageNumber}`} fill className="object-cover" />

                    {/* Progress overlay */}
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

                    {/* Controls (hover) */}
                    {!uploading && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePage(index, index - 1)}
                          disabled={index === 0}
                          className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30"
                          title="Mover izquierda"
                        >←</button>
                        <button
                          type="button"
                          onClick={() => removePage(index)}
                          className="text-xs bg-red-500/80 text-white px-1.5 py-1 rounded"
                          title="Eliminar"
                        >✕</button>
                        <button
                          type="button"
                          onClick={() => movePage(index, index + 1)}
                          disabled={index === pages.length - 1}
                          className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30"
                          title="Mover derecha"
                        >→</button>
                      </div>
                    )}
                  </div>

                  {/* Page number */}
                  <p className="text-center text-xs text-gray-500 mt-1">
                    Pág. {page.pageNumber}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Upload button + progress */}
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || pages.length === 0}
              className="rounded bg-ink-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Subiendo... {totalProgress}%
                </>
              ) : (
                `Subir ${pages.length} página${pages.length !== 1 ? 's' : ''} →`
              )}
            </button>

            {uploading && (
              <div className="flex-1 bg-dark-card rounded-full h-2">
                <div
                  className="bg-ink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Páginas existentes */}
      {existingPages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">
            Páginas subidas ({existingPages.length})
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {existingPages.map(page => (
              <div key={page.id} className="relative">
                <div className="relative aspect-[3/4] rounded overflow-hidden bg-dark-card border border-green-500/20">
                  <Image src={page.image_url} alt={`Página ${page.page_number}`} fill className="object-cover" />
                  <div className="absolute top-1 right-1 bg-green-500 rounded-sm w-4 h-4 flex items-center justify-center text-xs text-white">✓</div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-1">Pág. {page.page_number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          ✓ Páginas guardadas correctamente
        </div>
      )}
    </div>
  )
}
