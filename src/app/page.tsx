import Link from 'next/link'
import { getTrendingComics, getNewComics } from '@/lib/comics'
import { ComicCard } from '@/components/comic/ComicCard'
import type { Comic } from '@/types'

const COMIC_TYPES = [
  { type: 'manga', label: 'Manga', desc: 'Historias japonesas' },
  { type: 'manhwa', label: 'Manhwa', desc: 'Series coreanas' },
  { type: 'comic', label: 'Comics', desc: 'Estilo occidental' },
  { type: 'webtoon', label: 'Webtoon', desc: 'Lectura vertical' },
  { type: 'manhua', label: 'Manhua', desc: 'Series chinas' },
  { type: 'webcomic', label: 'Webcomic', desc: 'Publicacion digital' },
]

export default async function HomePage() {
  const [trending, newest] = await Promise.all([getTrendingComics(12), getNewComics(12)])

  return (
    <div className="min-h-screen bg-dark-bg">
      <section className="relative overflow-hidden border-b border-white/10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute -right-20 top-[-120px] h-[420px] w-[420px] rounded-full bg-ink-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex rounded bg-ink-500 px-2.5 py-1 text-xs font-semibold text-white">ESTRENO</span>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight text-white md:text-7xl">
              ClickcaComics
            </h1>
            <p className="mt-4 max-w-xl text-base text-gray-300 md:text-lg">
              Lee y publica manga, comics y webtoons en una plataforma con estilo cinematografico y herramientas para creadores.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/browse" className="rounded bg-ink-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-400">
                Explorar
              </Link>
              <Link href="/creator" className="rounded border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
                Ir al Portal Creador
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 rounded-xl border border-white/10 bg-dark-card p-4">
          <form action="/browse" className="flex flex-col gap-3 sm:flex-row">
            <input
              name="search"
              type="text"
              placeholder="Busca titulos, autores o generos"
              className="w-full rounded-lg border border-white/15 bg-dark-surface px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-ink-500"
            />
            <button className="rounded-lg bg-ink-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-400">
              Buscar obras
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {COMIC_TYPES.map(({ type, label, desc }) => (
            <Link
              key={type}
              href={`/browse?type=${type}`}
              className="rounded-lg border border-white/10 bg-dark-card p-3 transition-colors hover:border-ink-500/40 hover:bg-dark-surface"
            >
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="mt-1 text-xs text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Tendencias</h2>
            <p className="text-sm text-gray-500">Lo mas visto esta semana</p>
          </div>
          <Link href="/browse?sort=views" className="text-sm text-ink-300 transition-colors hover:text-ink-200">
            Ver todo
          </Link>
        </div>
        <ComicGrid comics={trending} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Nuevas Publicaciones</h2>
            <p className="text-sm text-gray-500">Recien agregados al catalogo</p>
          </div>
          <Link href="/browse?sort=newest" className="text-sm text-ink-300 transition-colors hover:text-ink-200">
            Ver todo
          </Link>
        </div>
        <ComicGrid comics={newest} />
      </section>
    </div>
  )
}

function ComicGrid({ comics }: { comics: Comic[] }) {
  if (comics.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-dark-card py-12 text-center text-gray-500">
        No hay obras disponibles aun.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {comics.map((comic) => (
        <ComicCard key={comic.id} comic={comic} />
      ))}
    </div>
  )
}
