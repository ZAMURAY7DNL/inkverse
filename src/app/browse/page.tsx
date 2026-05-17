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
  { value: 'newest', label: 'Mas nuevos' },
  { value: 'updated', label: 'Recien actualizados' },
  { value: 'views', label: 'Mas leidos' },
  { value: 'likes', label: 'Mas gustados' },
  { value: 'rating', label: 'Mejor valorados' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todo' },
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'comic', label: 'Comics' },
  { value: 'webcomic', label: 'Webcomic' },
  { value: 'webtoon', label: 'Webtoon' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Cualquier estado' },
  { value: 'ongoing', label: 'En curso' },
  { value: 'completed', label: 'Completo' },
  { value: 'hiatus', label: 'Hiatus' },
]

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = createClient()
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))

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
    }),
  ])

  const buildUrl = (params: Record<string, string>) => {
    const current = { ...searchParams }
    const merged: Record<string, string | undefined> = { ...current, ...params }
    const qp: Record<string, string> = {}
    for (const [k, v] of Object.entries(merged)) {
      if (v) qp[k] = v
    }
    const qs = new URLSearchParams(qp).toString()
    return `/browse${qs ? `?${qs}` : ''}`
  }

  const activeTags = [
    searchParams.search ? { key: 'search', label: `Busqueda: ${searchParams.search}` } : null,
    searchParams.type ? { key: 'type', label: `Tipo: ${TYPE_OPTIONS.find((t) => t.value === searchParams.type)?.label || searchParams.type}` } : null,
    searchParams.status ? { key: 'status', label: `Estado: ${STATUS_OPTIONS.find((s) => s.value === searchParams.status)?.label || searchParams.status}` } : null,
    searchParams.genre ? { key: 'genre', label: `Genero: ${genres?.find((g) => g.slug === searchParams.genre)?.name || searchParams.genre}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-4xl font-bold text-white">Explorar obras</h1>
        <p className="text-sm text-gray-500">{result.count.toLocaleString()} resultados en ClickcaComics</p>
      </div>

      <section className="mb-6 rounded-xl border border-white/10 bg-dark-card p-4 md:p-5">
        <form action="/browse" className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ''}
              placeholder="Buscar por titulo o autor"
              className="w-full rounded-lg border border-white/15 bg-dark-surface px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-ink-500"
            />
            <span className="pointer-events-none absolute right-3 top-2.5 text-gray-500">⌕</span>
          </div>
          <input type="hidden" name="type" value={searchParams.type || ''} />
          <input type="hidden" name="status" value={searchParams.status || ''} />
          <input type="hidden" name="genre" value={searchParams.genre || ''} />
          <input type="hidden" name="sort" value={searchParams.sort || 'newest'} />
          <button className="rounded-lg bg-ink-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-400">
            Buscar
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={buildUrl({ type: opt.value, page: '1' })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                (searchParams.type || '') === opt.value
                  ? 'border-ink-500 bg-ink-500/20 text-ink-200'
                  : 'border-white/15 text-gray-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={buildUrl({ status: opt.value, page: '1' })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                (searchParams.status || '') === opt.value
                  ? 'border-ink-500 bg-ink-500/20 text-ink-200'
                  : 'border-white/15 text-gray-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Generos</p>
          <div className="flex flex-wrap gap-1.5">
            {(genres || []).map((genre) => (
              <a
                key={genre.id}
                href={buildUrl({ genre: searchParams.genre === genre.slug ? '' : genre.slug, page: '1' })}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  searchParams.genre === genre.slug
                    ? 'border-ink-500 bg-ink-500/20 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                }`}
              >
                {genre.name}
              </a>
            ))}
          </div>
        </div>

        {activeTags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeTags.map((tag) => (
              <span key={tag.key} className="rounded border border-white/15 bg-dark-surface px-2.5 py-1 text-xs text-gray-300">
                {tag.label}
              </span>
            ))}
            <a href="/browse" className="rounded border border-white/15 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:border-white/30 hover:text-white">
              Limpiar filtros
            </a>
          </div>
        )}
      </section>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          Mostrando {result.data.length} de {result.count.toLocaleString()} obras
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Orden:</span>
          {SORT_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={buildUrl({ sort: opt.value, page: '1' })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                (searchParams.sort || 'newest') === opt.value
                  ? 'border-ink-500 bg-ink-500/20 text-ink-200'
                  : 'border-white/15 text-gray-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      {result.data.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-dark-card py-20 text-center text-gray-500">
          No se encontraron obras con esos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {result.data.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={buildUrl({ page: String(page - 1) })}
              className="rounded border border-white/15 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Anterior
            </a>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Pagina {page} de {result.totalPages}
          </span>
          {page < result.totalPages && (
            <a
              href={buildUrl({ page: String(page + 1) })}
              className="rounded border border-white/15 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Siguiente
            </a>
          )}
        </div>
      )}
    </div>
  )
}
