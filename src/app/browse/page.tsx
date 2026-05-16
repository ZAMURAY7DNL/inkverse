import { getComics } from '@/lib/comics'
import { ComicCard } from '@/components/comic/ComicCard'
import { createClient } from '@/lib/supabase/server'
import type { ComicType, ComicStatus } from '@/types'

interface BrowsePageProps {
  searchParams: {
    type?: string
    status?: string
    genre?: string
    sort?: string
    search?: string
    page?: string
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más Nuevos' },
  { value: 'updated', label: 'Actualizados' },
  { value: 'views', label: 'Más Leídos' },
  { value: 'likes', label: 'Más Gustados' },
  { value: 'rating', label: 'Mejor Valorados' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'comic', label: 'Cómic' },
  { value: 'webcomic', label: 'Webcomic' },
  { value: 'webtoon', label: 'Webtoon' },
]

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')

  // Fetch géneros y cómics en paralelo
  const [{ data: genres }, result] = await Promise.all([
    supabase.from('genres').select('*').order('name'),
    getComics({
      type: searchParams.type as ComicType | undefined,
      status: searchParams.status as ComicStatus | undefined,
      genre_slug: searchParams.genre,
      search: searchParams.search,
      sort: (searchParams.sort as any) || 'newest',
      page,
      pageSize: 24,
    })
  ])

  const buildUrl = (params: Record<string, string>) => {
    const current = { ...searchParams }
    const merged: Record<string, string | undefined> = { ...current, ...params }
    // Limpiar valores vacíos y armar query string
    const qp: Record<string, string> = {}
    for (const [k, v] of Object.entries(merged)) {
      if (v) qp[k] = v
    }
    const qs = new URLSearchParams(qp).toString()
    return `/browse${qs ? '?' + qs : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="comic-title text-4xl text-white mb-1">EXPLORAR</h1>
        <p className="text-gray-500 text-sm">{result.count.toLocaleString()} obras disponibles</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── SIDEBAR FILTROS ── */}
        <aside className="lg:w-56 shrink-0">
          <div className="sticky top-20 space-y-5">

            {/* Tipo */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Tipo</h3>
              <div className="space-y-0.5">
                {TYPE_OPTIONS.map(opt => (
                  <a key={opt.value}
                    href={buildUrl({ type: opt.value, page: '1' })}
                    className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                      (searchParams.type || '') === opt.value
                        ? 'bg-ink-500/20 text-ink-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    {opt.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Estado */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Estado</h3>
              <div className="space-y-0.5">
                {[
                  { value: '', label: 'Todos' },
                  { value: 'ongoing', label: 'En Curso' },
                  { value: 'completed', label: 'Completo' },
                  { value: 'hiatus', label: 'Hiatus' },
                ].map(opt => (
                  <a key={opt.value}
                    href={buildUrl({ status: opt.value, page: '1' })}
                    className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                      (searchParams.status || '') === opt.value
                        ? 'bg-ink-500/20 text-ink-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    {opt.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Géneros */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Géneros</h3>
              <div className="flex flex-wrap gap-1.5">
                {(genres || []).map(genre => (
                  <a key={genre.id}
                    href={buildUrl({ genre: searchParams.genre === genre.slug ? '' : genre.slug, page: '1' })}
                    className={`genre-badge cursor-pointer transition-opacity hover:opacity-100 ${
                      searchParams.genre === genre.slug ? 'opacity-100 ring-1' : 'opacity-60'
                    }`}
                    style={{ backgroundColor: `${genre.color}20`, color: genre.color, outlineColor: genre.color }}>
                    {genre.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── GRID PRINCIPAL ── */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {SORT_OPTIONS.map(opt => (
              <a key={opt.value}
                href={buildUrl({ sort: opt.value, page: '1' })}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  (searchParams.sort || 'newest') === opt.value
                    ? 'border-ink-500 bg-ink-500/20 text-ink-300'
                    : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}>
                {opt.label}
              </a>
            ))}
          </div>

          {/* Grid */}
          {result.data.length === 0 ? (
            <div className="rounded-lg border border-white/5 bg-dark-card py-20 text-center text-gray-500">
              No se encontraron cómics con estos filtros.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {result.data.map(comic => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          )}

          {/* Paginación */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <a href={buildUrl({ page: String(page - 1) })}
                  className="px-4 py-2 rounded border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                  ← Anterior
                </a>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                Página {page} de {result.totalPages}
              </span>
              {page < result.totalPages && (
                <a href={buildUrl({ page: String(page + 1) })}
                  className="px-4 py-2 rounded border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                  Siguiente →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
