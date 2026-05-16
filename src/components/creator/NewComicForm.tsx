'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { uploadComicCover, validateImageFile, generateSlug } from '@/lib/storage'
import type { ComicType, ComicStatus, ReadingDirection } from '@/types'
import Image from 'next/image'

interface Genre { id: string; name: string; slug: string; color: string }
interface NewComicFormProps { genres: Genre[] }

const TIPO_LABELS: Record<ComicType, { label: string; dir: ReadingDirection; desc: string }> = {
  manga:    { label: 'Manga',    dir: 'rtl', desc: 'Der. a Izq.' },
  manhwa:   { label: 'Manhwa',   dir: 'ttb', desc: 'Vertical' },
  manhua:   { label: 'Manhua',   dir: 'rtl', desc: 'Der. a Izq.' },
  comic:    { label: 'Comic',    dir: 'ltr', desc: 'Izq. a Der.' },
  webcomic: { label: 'Webcomic', dir: 'ltr', desc: 'Izq. a Der.' },
  webtoon:  { label: 'Webtoon',  dir: 'ttb', desc: 'Vertical' },
  other:    { label: 'Otro',     dir: 'ltr', desc: 'Izq. a Der.' },
}

const inputClass = "w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none transition-colors"
const selectClass = "w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none transition-colors appearance-none"

export function NewComicForm({ genres }: NewComicFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'manga' as ComicType,
    status: 'ongoing' as ComicStatus,
    reading_direction: 'rtl' as ReadingDirection,
    is_mature: false,
    genre_ids: [] as string[],
  })

  const onDropCover = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    const err = validateImageFile(file, 5)
    if (err) { setError(err); return }
    setError(null)
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
        : f.genre_ids.length < 5 ? [...f.genre_ids, id] : f.genre_ids
    }))
  }

  const setType = (type: ComicType) => {
    setForm(f => ({ ...f, type, reading_direction: TIPO_LABELS[type].dir }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) { setError('El titulo es requerido'); return }
    if (form.genre_ids.length === 0) { setError('Selecciona al menos un genero'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/comics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg || 'Error al crear el comic')
      }
      const { comic } = await res.json()
      if (coverFile) {
        setUploadingCover(true)
        try {
          const coverUrl = await uploadComicCover(coverFile, comic.id, 'cover')
          await fetch(`/api/comics/${comic.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cover_url: coverUrl }),
          })
        } catch (coverErr) {
          console.error('Error subiendo portada:', coverErr)
        } finally {
          setUploadingCover(false)
        }
      }
      router.push(`/creator/comics/${comic.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  const slugPreview = form.title ? generateSlug(form.title) : ''

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span className={step === 1 ? 'text-violet-400 font-semibold' : ''}>1. Informacion</span>
          <span>-</span>
          <span className={step === 2 ? 'text-violet-400 font-semibold' : ''}>2. Generos y detalles</span>
        </div>
        <h1 className="comic-title text-4xl text-white mb-1">NUEVA OBRA</h1>
        <p className="text-gray-400 text-sm">{step === 1 ? 'Portada, titulo y tipo de obra' : 'Generos, estado y clasificacion'}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Portada</label>
              <div {...getRootProps()} className={`relative aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden bg-zinc-900 ${isDragActive ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-violet-500/40'}`}>
                <input {...getInputProps()} />
                {coverPreview ? (
                  <Image src={coverPreview} alt="Portada" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 gap-2">
                    <span className="text-4xl">🖼</span>
                    <p className="text-xs text-center text-gray-400">{isDragActive ? 'Suelta aqui' : 'Arrastra tu portada'}</p>
                    <p className="text-xs text-center opacity-60">JPG, PNG, WebP - Max 5MB</p>
                    <p className="text-xs text-center opacity-40">Recomendado: 700x1000px</p>
                  </div>
                )}
              </div>
              {coverPreview && (
                <button type="button" onClick={() => { setCoverPreview(null); setCoverFile(null) }} className="mt-2 w-full text-xs text-red-400 hover:text-red-300 transition-colors">
                  Eliminar portada
                </button>
              )}
              <p className="text-xs text-gray-600 mt-2 text-center">Opcional - puedes anadirla despues</p>
            </div>

            <div className="md:col-span-2 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Titulo *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="El nombre de tu obra"
                  className={inputClass}
                  autoFocus
                />
                {slugPreview && <p className="text-xs text-gray-600 mt-1 font-mono">inkverse.app/comic/<span className="text-gray-400">{slugPreview}</span></p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Sinopsis</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe tu obra para que los lectores se enganchen..."
                  rows={4}
                  className={inputClass + ' resize-none'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Tipo de Obra *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(TIPO_LABELS) as ComicType[]).map(type => (
                    <button key={type} type="button" onClick={() => setType(type)}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all ${form.type === type ? 'border-violet-500/60 bg-violet-500/15 text-violet-300' : 'border-white/10 bg-zinc-900 text-gray-500 hover:border-white/20 hover:text-gray-300'}`}>
                      <div className="font-semibold">{TIPO_LABELS[type].label}</div>
                      <div className="text-gray-600 text-[10px] mt-0.5">{TIPO_LABELS[type].desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="button"
                onClick={() => { if (!form.title.trim()) { setError('El titulo es requerido'); return } setError(null); setStep(2) }}
                className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-zinc-900 p-4">
              {coverPreview ? (
                <div className="relative h-14 w-10 rounded overflow-hidden shrink-0">
                  <Image src={coverPreview} alt="Portada" fill className="object-cover" />
                </div>
              ) : (
                <div className="h-14 w-10 rounded bg-zinc-800 border border-white/10 shrink-0 flex items-center justify-center text-lg">📄</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{form.title}</p>
                <p className="text-xs text-gray-500">{TIPO_LABELS[form.type].label} - {TIPO_LABELS[form.type].desc}</p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0">Editar</button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                Generos * <span className="text-gray-600 normal-case font-normal">- selecciona de 1 a 5</span>
              </label>
              <p className="text-xs text-gray-600 mb-3">{form.genre_ids.length}/5 seleccionados</p>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => {
                  const selected = form.genre_ids.includes(genre.id)
                  const maxed = form.genre_ids.length >= 5 && !selected
                  return (
                    <button key={genre.id} type="button" onClick={() => toggleGenre(genre.id)} disabled={maxed}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${selected ? 'opacity-100 scale-105' : maxed ? 'opacity-20 cursor-not-allowed' : 'opacity-50 hover:opacity-90'}`}
                      style={{ backgroundColor: selected ? `${genre.color}30` : 'transparent', color: genre.color, borderColor: selected ? genre.color : `${genre.color}50` }}>
                      {selected && '✓ '}{genre.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Estado</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ComicStatus }))} className={selectClass}>
                  <option value="ongoing">En Curso</option>
                  <option value="completed">Completo</option>
                  <option value="hiatus">Hiatus</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Clasificacion</label>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_mature: !f.is_mature }))}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all ${form.is_mature ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-white/10 bg-zinc-900 text-gray-400 hover:border-white/20'}`}>
                  <span>{form.is_mature ? 'Contenido +18' : 'Apto para todos'}</span>
                  <div className={`relative w-9 h-5 rounded-full transition-colors ${form.is_mature ? 'bg-red-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_mature ? 'translate-x-4' : ''}`} />
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/5 bg-zinc-900 p-4 flex gap-3">
              <span className="text-lg shrink-0">💡</span>
              <p className="text-xs text-gray-500 leading-relaxed">
                La obra se creara como <span className="text-gray-300">borrador</span>. Podras publicarla despues de subir al menos un capitulo.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="rounded-lg border border-white/10 px-5 py-3 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                Atras
              </button>
              <button type="submit" disabled={loading || form.genre_ids.length === 0}
                className="flex-1 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{uploadingCover ? 'Subiendo portada...' : 'Creando obra...'}</>
                ) : 'Crear Obra'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
