# ============================================================
# InkVerse - Script de instalación de mejoras de capítulos
# Ejecutar desde: X:\Aprende IA\inkverse\inkverse
# Comando: .\install-chapters.ps1
# ============================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   InkVerse - Mejoras Panel de Capítulos  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Crear directorios necesarios ──
Write-Host "► Creando directorios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "src\app\api\chapters" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\chapters\[chapterId]" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\api\chapters\[chapterId]\pages" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components\creator" | Out-Null
New-Item -ItemType Directory -Force -Path "src\app\creator\comics\[comicId]" | Out-Null
Write-Host "  ✓ Directorios listos" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 1: src/app/api/chapters/route.ts
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/app/api/chapters/route.ts..." -ForegroundColor Yellow

$content = @'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateChapterInput } from '@/types'

// POST /api/chapters — Crear nuevo capítulo
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body: CreateChapterInput = await request.json()
  const { comic_id, chapter_number, title, volume } = body

  if (!comic_id) return NextResponse.json({ error: 'comic_id es requerido' }, { status: 400 })
  if (!chapter_number || chapter_number < 0) return NextResponse.json({ error: 'Número de capítulo inválido' }, { status: 400 })

  const { data: comic } = await supabase
    .from('comics')
    .select('id')
    .eq('id', comic_id)
    .eq('author_id', user.id)
    .single()

  if (!comic) return NextResponse.json({ error: 'Cómic no encontrado o no autorizado' }, { status: 403 })

  const { data: existing } = await supabase
    .from('chapters')
    .select('id')
    .eq('comic_id', comic_id)
    .eq('chapter_number', chapter_number)
    .single()

  if (existing) return NextResponse.json({ error: `El capítulo ${chapter_number} ya existe` }, { status: 409 })

  const { data: chapter, error } = await supabase
    .from('chapters')
    .insert({
      comic_id,
      chapter_number,
      title: title?.trim() || null,
      volume: volume || null,
      is_published: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapter }, { status: 201 })
}
'@

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "src\app\api\chapters\route.ts"),
  $content,
  [System.Text.Encoding]::UTF8
)
Write-Host "  ✓ Creado" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 2: src/app/api/chapters/[chapterId]/route.ts
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/app/api/chapters/[chapterId]/route.ts..." -ForegroundColor Yellow

$content = @'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/chapters/[chapterId] — actualizar metadatos del capítulo
export async function PATCH(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { chapterId } = params
  const body = await request.json()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, comic:comics(author_id)')
    .eq('id', chapterId)
    .single()

  if (!chapter || (chapter.comic as any)?.author_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const allowed = ['title', 'volume', 'chapter_number', 'is_published', 'published_at']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chapter: data })
}
'@

$path = Join-Path (Get-Location) "src\app\api\chapters\[chapterId]\route.ts"
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "  ✓ Creado" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 3: src/app/api/chapters/[chapterId]/pages/route.ts
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/app/api/chapters/[chapterId]/pages/route.ts..." -ForegroundColor Yellow

$content = @'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UploadPageResult } from '@/types'

// GET /api/chapters/[chapterId]/pages
export async function GET(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: pages, error } = await supabase
    .from('chapter_pages')
    .select('*')
    .eq('chapter_id', params.chapterId)
    .order('page_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pages: pages || [] })
}

// POST /api/chapters/[chapterId]/pages
export async function POST(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { chapterId } = params

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, comic:comics(author_id)')
    .eq('id', chapterId)
    .single()

  if (!chapter || (chapter.comic as any)?.author_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const pages: UploadPageResult[] = await request.json()

  const { data: inserted, error } = await supabase
    .from('chapter_pages')
    .upsert(
      pages.map(p => ({
        chapter_id: chapterId,
        page_number: p.page_number,
        image_url: p.image_url,
        image_width: p.image_width,
        image_height: p.image_height,
        file_size_bytes: p.file_size_bytes,
      })),
      { onConflict: 'chapter_id,page_number' }
    )
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('chapters')
    .update({ pages_count: pages.length })
    .eq('id', chapterId)

  return NextResponse.json({ pages: inserted })
}

// DELETE /api/chapters/[chapterId]/pages
export async function DELETE(
  request: Request,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pageNumber = searchParams.get('page')
  if (!pageNumber) return NextResponse.json({ error: 'Número de página requerido' }, { status: 400 })

  const { error } = await supabase
    .from('chapter_pages')
    .delete()
    .eq('chapter_id', params.chapterId)
    .eq('page_number', parseInt(pageNumber))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
'@

$path = Join-Path (Get-Location) "src\app\api\chapters\[chapterId]\pages\route.ts"
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "  ✓ Creado" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 4: src/components/creator/NewChapterModal.tsx
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/components/creator/NewChapterModal.tsx..." -ForegroundColor Yellow

$content = @'
'use client'

import { useState } from 'react'
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

  const handleOpen = () => {
    setChapterNumber(String(nextNumber))
    setTitle('')
    setError('')
    setOpen(true)
  }

  const handleCreate = async () => {
    const num = parseFloat(chapterNumber)
    if (isNaN(num) || num < 0) { setError('Número de capítulo inválido'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comic_id: comicId, chapter_number: num, title: title.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al crear capítulo'); return }
      onCreated(data.chapter)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-ink-400 hover:text-ink-300 transition-colors flex items-center gap-1"
      >
        <span className="text-base leading-none">+</span> Nuevo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-dark-surface shadow-2xl">

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h2 className="font-semibold text-white">Nuevo Capítulo</h2>
                <p className="text-xs text-gray-500 mt-0.5">Agrega la información básica del capítulo</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Número de capítulo <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min="0" step="0.5"
                  value={chapterNumber}
                  onChange={e => setChapterNumber(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full rounded-lg border border-white/10 bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-ink-500/60 focus:ring-1 focus:ring-ink-500/20 transition-colors"
                  placeholder="1"
                />
                <p className="text-xs text-gray-600 mt-1">Puedes usar decimales para especiales (ej: 2.5)</p>
              </div>

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

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={loading || !chapterNumber}
                className="rounded-lg bg-ink-500 px-5 py-2 text-sm font-semibold text-white hover:bg-ink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</>
                  : 'Crear capítulo →'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
'@

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "src\components\creator\NewChapterModal.tsx"),
  $content,
  [System.Text.Encoding]::UTF8
)
Write-Host "  ✓ Creado" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 5: src/components/creator/ChapterUploadPanel.tsx
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/components/creator/ChapterUploadPanel.tsx..." -ForegroundColor Yellow

$content = @'
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
  existingPages: ChapterPage[]
  onSaved?: () => void
  onChapterUpdated?: (updated: Chapter) => void
}

const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
}

export function ChapterUploadPanel({ chapter, comicId, existingPages, onSaved, onChapterUpdated }: ChapterUploadPanelProps) {
  const [pages, setPages] = useState<{ file: File; preview: string; pageNumber: number }[]>([])
  const [progresses, setProgresses] = useState<UploadProgress[]>([])
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(chapter.title || '')
  const [savingTitle, setSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const startPage = existingPages.length + 1

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ACCEPTED_FORMATS, multiple: true })

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
        comicId,
        chapter.id,
        startPage,
        (updates) => setProgresses([...updates]),
        3
      )
      const res = await fetch(`/api/chapters/${chapter.id}/pages`, {
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

      {/* Metadatos del capítulo */}
      <div className="rounded-xl border border-white/8 bg-dark-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Información del capítulo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Número</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-dark-surface px-3 py-2">
              <span className="text-sm font-mono text-white">Cap. {chapter.chapter_number}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Título <span className="text-gray-600">(opcional)</span></label>
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
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingTitle(true); setTimeout(() => titleInputRef.current?.focus(), 50) }}
                className="w-full flex items-center gap-2 rounded-lg border border-white/8 bg-dark-surface px-3 py-2 text-left hover:border-white/20 transition-colors group"
              >
                <span className={`text-sm flex-1 ${titleValue ? 'text-white' : 'text-gray-600'}`}>
                  {titleValue || 'Añadir título...'}
                </span>
                <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">✎ editar</span>
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
          <span className="text-xs text-gray-600">
            {existingPages.length} página{existingPages.length !== 1 ? 's' : ''} subida{existingPages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

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
            <p className="text-white font-medium">{isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra tus páginas aquí'}</p>
            <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar archivos</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
            {['JPG', 'PNG', 'WebP', 'GIF'].map(fmt => (
              <span key={fmt} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 font-mono">{fmt}</span>
            ))}
            <span className="text-gray-600">·</span>
            <span>Máx. 10MB por imagen</span>
          </div>
        </div>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-1">
          {errors.map((err, i) => <p key={i} className="text-sm text-red-400">{err}</p>)}
        </div>
      )}

      {/* Grid páginas pendientes */}
      {pages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">
              {pages.length} página{pages.length !== 1 ? 's' : ''} lista{pages.length !== 1 ? 's' : ''} para subir
            </h3>
            <button type="button" onClick={() => setPages([])} className="text-xs text-red-400 hover:text-red-300 transition-colors">
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
                    {progress && progress.status !== 'pending' && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        {progress.status === 'done' && <span className="text-green-400 text-xl">✓</span>}
                        {progress.status === 'error' && <span className="text-red-400 text-xl">✗</span>}
                        {progress.status === 'uploading' && (
                          <><div className="w-8 h-8 rounded-full border-2 border-ink-400 border-t-transparent animate-spin" /><span className="text-xs text-white mt-1">{progress.progress}%</span></>
                        )}
                      </div>
                    )}
                    {!uploading && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button type="button" onClick={() => movePage(index, index - 1)} disabled={index === 0}
                          className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30">←</button>
                        <button type="button" onClick={() => removePage(index)}
                          className="text-xs bg-red-500/80 text-white px-1.5 py-1 rounded">✕</button>
                        <button type="button" onClick={() => movePage(index, index + 1)} disabled={index === pages.length - 1}
                          className="text-xs bg-black/50 text-white px-1.5 py-1 rounded disabled:opacity-30">→</button>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-1">Pág. {page.pageNumber}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={handleUpload} disabled={uploading || pages.length === 0}
              className="rounded-lg bg-ink-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {uploading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo... {totalProgress}%</>
                : `Subir ${pages.length} página${pages.length !== 1 ? 's' : ''} →`
              }
            </button>
            {uploading && (
              <div className="flex-1 bg-dark-card rounded-full h-2">
                <div className="bg-ink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${totalProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Páginas existentes */}
      {existingPages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Páginas subidas ({existingPages.length})</h3>
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
'@

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "src\components\creator\ChapterUploadPanel.tsx"),
  $content,
  [System.Text.Encoding]::UTF8
)
Write-Host "  ✓ Actualizado" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 6: src/components/creator/ComicManageClient.tsx
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/components/creator/ComicManageClient.tsx..." -ForegroundColor Yellow

$content = @'
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
}

export function ComicManageClient({ comic, initialChapters, initialSelectedChapterId, initialPages }: ComicManageClientProps) {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(initialSelectedChapterId)
  const [pages, setPages] = useState<ChapterPage[]>(initialPages)
  const [loadingPages, setLoadingPages] = useState(false)
  const [publishing, setPublishing] = useState(false)

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
      setChapters(prev => prev.map(c => c.id === selectedChapterId ? { ...c, is_published: true } : c))
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
            <span className="text-gray-500">{chapters.length} capítulo{chapters.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/comic/${comic.slug}`} target="_blank"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            Vista previa →
          </Link>
          {!comic.is_published && chapters.length > 0 && (
            <button onClick={handlePublishComic}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition-colors">
              Publicar Obra
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista capítulos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Capítulos</h2>
            <NewChapterModal comicId={comic.id} nextNumber={nextNumber} onCreated={handleChapterCreated} />
          </div>

          {chapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-gray-500">Sin capítulos aún</p>
              <p className="text-xs text-gray-600 mt-1">Crea el primero con el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {chapters.map(chapter => (
                <button key={chapter.id} onClick={() => handleSelectChapter(chapter)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    selectedChapterId === chapter.id
                      ? 'border-ink-500/50 bg-ink-500/10'
                      : 'border-white/5 bg-dark-card hover:border-white/10'
                  }`}>
                  <span className={`text-xs font-semibold min-w-10 shrink-0 ${selectedChapterId === chapter.id ? 'text-ink-300' : 'text-gray-400'}`}>
                    Cap. {chapter.chapter_number}
                  </span>
                  <span className={`text-xs flex-1 truncate ${selectedChapterId === chapter.id ? 'text-ink-200' : 'text-gray-400'}`}>
                    {chapter.title || <span className="text-gray-600 italic">Sin título</span>}
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

        {/* Panel edición */}
        <div className="lg:col-span-2">
          {selectedChapter ? (
            <div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="comic-title text-2xl text-white">
                    CAPÍTULO {selectedChapter.chapter_number}
                    {selectedChapter.title && <span className="text-gray-400 text-xl"> — {selectedChapter.title}</span>}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {loadingPages ? 'Cargando...' : `${pages.length} página${pages.length !== 1 ? 's' : ''} subida${pages.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {!selectedChapter.is_published && pages.length > 0 && (
                  <button onClick={handlePublishChapter} disabled={publishing}
                    className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 shrink-0">
                    {publishing ? 'Publicando...' : 'Publicar Capítulo'}
                  </button>
                )}
              </div>

              {loadingPages ? (
                <div className="rounded-xl border border-white/5 bg-dark-card p-12 text-center">
                  <div className="w-8 h-8 border-2 border-ink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Cargando páginas...</p>
                </div>
              ) : (
                <ChapterUploadPanel
                  chapter={selectedChapter}
                  comicId={comic.id}
                  existingPages={pages}
                  onSaved={handlePagesSaved}
                  onChapterUpdated={handleChapterUpdated}
                />
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-16 text-center">
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
'@

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "src\components\creator\ComicManageClient.tsx"),
  $content,
  [System.Text.Encoding]::UTF8
)
Write-Host "  ✓ Creado" -ForegroundColor Green

# ════════════════════════════════════════════════
# ARCHIVO 7: src/app/creator/comics/[comicId]/page.tsx
# ════════════════════════════════════════════════
Write-Host ""
Write-Host "► Escribiendo src/app/creator/comics/[comicId]/page.tsx..." -ForegroundColor Yellow

$content = @'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyChapters, getChapterPages } from '@/lib/comics'
import { ComicManageClient } from '@/components/creator/ComicManageClient'

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
  const selectedChapterId = searchParams.chapter || null
  const selectedChapter = selectedChapterId ? chapters.find(c => c.id === selectedChapterId) : null
  const pages = selectedChapter ? await getChapterPages(selectedChapter.id) : []

  return (
    <ComicManageClient
      comic={comic}
      initialChapters={chapters}
      initialSelectedChapterId={selectedChapterId}
      initialPages={pages}
    />
  )
}
'@

$path = Join-Path (Get-Location) "src\app\creator\comics\[comicId]\page.tsx"
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "  ✓ Actualizado" -ForegroundColor Green

# ── Resumen final ──
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✓ Instalación completa          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos modificados:" -ForegroundColor White
Write-Host "  + src/app/api/chapters/route.ts" -ForegroundColor Cyan
Write-Host "  + src/app/api/chapters/[chapterId]/route.ts" -ForegroundColor Cyan
Write-Host "  ~ src/app/api/chapters/[chapterId]/pages/route.ts" -ForegroundColor Cyan
Write-Host "  + src/components/creator/NewChapterModal.tsx" -ForegroundColor Cyan
Write-Host "  ~ src/components/creator/ChapterUploadPanel.tsx" -ForegroundColor Cyan
Write-Host "  + src/components/creator/ComicManageClient.tsx" -ForegroundColor Cyan
Write-Host "  ~ src/app/creator/comics/[comicId]/page.tsx" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximo paso:" -ForegroundColor White
Write-Host "  git add . && git commit -m 'feat: chapter name + improved editor panel'" -ForegroundColor Gray
Write-Host ""
