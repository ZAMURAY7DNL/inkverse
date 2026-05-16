'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { uploadComicCover, validateImageFile, generateSlug } from '@/lib/storage'
import type { ComicType, ComicStatus, ReadingDirection } from '@/types'
import Image from 'next/image'

const GENRES_CACHE_KEY = 'inkverse_genres'

interface Genre { id: string; name: string; slug: string; color: string }

interface NewComicFormProps {
  genres: Genre[]
}

export function NewComicForm({ genres }: NewComicFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'manga' as ComicType,
    status: 'ongoing' as ComicStatus,
    reading_direction: 'rtl' as ReadingDirection,
    is_mature: false,
    genre_ids: [] as string[],
  })

  // Dropzone para portada
  const onDropCover = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    const err = validateImageFile(file, 5)
    if (err) { setError(err); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const toggleGenre = (id: string) => {
    setForm(f => ({
      ...f,
      genre_ids: f.genre_ids.includes(id)
        ? f.genre_ids.filter(g => g !== id)
        : [...f.genre_ids, id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) { setError('El título es requerido'); return }
    if (form.genre_ids.length === 0) { setError('Selecciona al menos un género'); return }

    setLoading(true)

    try {
      // 1. Crear el cómic
      const res = await fetch('/api/comics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg || 'Error al crear el cómic')
      }

      const { comic } = await res.json()

      // 2. Subir portada si hay
      if (coverFile) {
        const coverUrl = await uploadComicCover(coverFile, comic.id, 'cover')
        await fetch(`/api/comics/${comic.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_url: coverUrl }),
        })
      }

      router.push(`/creator/comics/${comic.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="mb-8">
        <h1 className="comic-title text-4xl text-white mb-1">NUEVA OBRA</h1>
        <p className="text-gray-400 text-sm">Completa la información básica de tu cómic</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Columna izquierda: Portada */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
            Portada
          </label>
          <div
            {...getRootProps()}
            className={`relative aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              isDragActive ? 'dropzone-active' : 'border-white/10 hover:border-ink-500/40'
            } bg-dark-card overflow-hidden`}
          >
            <input {...getInputProps()} />
            {coverPreview ? (
              <Image src={coverPreview} alt="Portada" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4">
                <span className="text-3xl mb-2">🖼</span>
                <p className="text-xs text-center">Arrastra tu portada aquí o haz clic</p>
                <p className="text-xs text-center mt-1 opacity-60">JPG, PNG, WebP · Máx 5MB</p>
                <p className="text-xs text-center mt-1 opacity-60">Recomendado: 700×1000px</p>
              </div>
            )}
          </div>
          {coverPreview && (
            <button type="button" onClick={() => { setCoverPreview(null); setCoverFile(null) }}
              className="mt-2 w-full text-xs text-red-400 hover:text-red-300 transition-colors">
              Eliminar portada
            </button>
          )}
        </div>

        {/* Columna derecha: Datos */}
        <div className="md:col-span-2 space-y-5">

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="El nombre de tu obra"
              className="w-full rounded border border-white/10 bg-dark-card px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none transition-colors"
              required
            />
            {form.title && (
              <p className="text-xs text-gray-600 mt-1">
                URL: /comic/{generateSlug(form.title)}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Synopsis o descripción de tu obra..."
              rows={4}
              className="w-full rounded border border-white/10 bg-dark-card px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Tipo + Dirección */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Tipo *
              </label>
              <select
                value={form.type}
                onChange={e => {
                  const type = e.target.value as ComicType
                  setForm(f => ({
                    ...f,
                    type,
                    reading_direction: type === 'manga' || type === 'manhua' ? 'rtl'
                      : type === 'webtoon' || type === 'manhwa' ? 'ttb' : 'ltr'
                  }))
                }}
                className="w-full rounded border border-white/10 bg-dark-card px-3 py-2.5 text-sm text-white focus:border-ink-500/50 focus:outline-none transition-colors"
              >
                <option value="manga">Manga</option>
                <option value="manhwa">Manhwa</option>
                <option value="manhua">Manhua</option>
                <option value="comic">Cómic</option>
                <option value="webcomic">Webcomic</option>
                <option value="webtoon">Webtoon</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Dirección de Lectura
              </label>
              <select
                value={form.reading_direction}
                onChange={e => setForm(f => ({ ...f, reading_direction: e.target.value as ReadingDirection }))}
                className="w-full rounded border border-white/10 bg-dark-card px-3 py-2.5 text-sm text-white focus:border-ink-500/50 focus:outline-none transition-colors"
              >
                <option value="ltr">← Occidental (Izq. a Der.)</option>
                <option value="rtl">→ Manga (Der. a Izq.)</option>
                <option value="ttb">↓ Vertical (Webtoon)</option>
              </select>
            </div>
          </div>

          {/* Estado + Mature */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Estado
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ComicStatus }))}
                className="w-full rounded border border-white/10 bg-dark-card px-3 py-2.5 text-sm text-white focus:border-ink-500/50 focus:outline-none transition-colors"
              >
                <option value="ongoing">En Curso</option>
                <option value="completed">Completo</option>
                <option value="hiatus">Hiatus</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Clasificación
              </label>
              <label className="flex items-center gap-3 h-10 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_mature: !f.is_mature }))}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_mature ? 'bg-manga-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_mature ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-gray-400">Contenido +18</span>
              </label>
            </div>
          </div>

          {/* Géneros */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Géneros * <span className="text-gray-600 normal-case font-normal">(selecciona de 1 a 5)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => form.genre_ids.length < 5 || form.genre_ids.includes(genre.id) ? toggleGenre(genre.id) : null}
                  className={`genre-badge cursor-pointer transition-all ${
                    form.genre_ids.includes(genre.id)
                      ? 'opacity-100 ring-1 scale-105'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{
                    backgroundColor: `${genre.color}20`,
                    color: genre.color,
                    outline: form.genre_ids.includes(genre.id) ? `1px solid ${genre.color}` : undefined
                  }}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-ink-500 px-8 py-3 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Obra →'}
        </button>
        <p className="text-xs text-gray-600">
          La obra se creará como borrador. Podrás publicarla después de subir al menos un capítulo.
        </p>
      </div>
    </form>
  )
}
