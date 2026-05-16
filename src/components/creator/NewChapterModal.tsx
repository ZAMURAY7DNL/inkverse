'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Chapter } from '@/types'

interface NewChapterModalProps {
  comicId: string
  nextNumber: number
  onCreated: (chapter: Chapter) => void
}

export function NewChapterModal({ comicId, nextNumber, onCreated }: NewChapterModalProps) {
  const [open, setOpen] = useState(false)
  const [chapterNumber, setChapterNumber] = useState(String(nextNumber))
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    const num = parseFloat(chapterNumber)
    if (isNaN(num) || num < 0) {
      setError('Número de capítulo inválido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comic_id: comicId,
          chapter_number: num,
          title: title.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear capítulo')
        return
      }
      onCreated(data.chapter)
      setOpen(false)
      setTitle('')
      setChapterNumber(String(num + 1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setChapterNumber(String(nextNumber)) }}
        className="text-xs text-ink-400 hover:text-ink-300 transition-colors flex items-center gap-1"
      >
        <span className="text-base leading-none">+</span> Nuevo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-dark-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h2 className="font-semibold text-white">Nuevo Capítulo</h2>
                <p className="text-xs text-gray-500 mt-0.5">Agrega la información básica del capítulo</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Número */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Número de capítulo <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={chapterNumber}
                  onChange={e => setChapterNumber(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full rounded-lg border border-white/10 bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-ink-500/60 focus:ring-1 focus:ring-ink-500/20 transition-colors"
                  placeholder="1"
                />
                <p className="text-xs text-gray-600 mt-1">Puedes usar decimales para capítulos especiales (ej: 2.5)</p>
              </div>

              {/* Título */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Título <span className="text-gray-600">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full rounded-lg border border-white/10 bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-ink-500/60 focus:ring-1 focus:ring-ink-500/20 transition-colors"
                  placeholder="Ej: El despertar, Prólogo, Especial de verano..."
                />
              </div>

              {/* Preview */}
              {(chapterNumber || title) && (
                <div className="rounded-lg border border-white/5 bg-dark-card px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Vista previa</p>
                  <p className="text-sm text-white font-medium">
                    Cap. {chapterNumber || '?'}
                    {title.trim() && <span className="text-gray-400"> — {title.trim()}</span>}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !chapterNumber}
                className="rounded-lg bg-ink-500 px-5 py-2 text-sm font-semibold text-white hover:bg-ink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</>
                ) : (
                  'Crear capítulo →'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
