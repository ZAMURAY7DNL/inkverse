import Link from 'next/link'
import { getTrendingComics, getNewComics } from '@/lib/comics'
import { ComicCard } from '@/components/comic/ComicCard'
import type { Comic } from '@/types'

const COMIC_TYPES = [
  { type: 'manga', label: 'Manga', emoji: '🇯🇵', desc: 'Estilo japonés' },
  { type: 'manhwa', label: 'Manhwa', emoji: '🇰🇷', desc: 'Estilo coreano' },
  { type: 'comic', label: 'Cómic', emoji: '💥', desc: 'Estilo occidental' },
  { type: 'webtoon', label: 'Webtoon', emoji: '📱', desc: 'Vertical scroll' },
  { type: 'manhua', label: 'Manhua', emoji: '🇨🇳', desc: 'Estilo chino' },
  { type: 'webcomic', label: 'Webcomic', emoji: '🌐', desc: 'Web original' },
]

export default async function HomePage() {
  // Fetch en paralelo
  const [trending, newest] = await Promise.all([
    getTrendingComics(12),
    getNewComics(12),
  ])

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-dark-surface border-b border-white/5">
        <div className="absolute inset-0 halftone-bg opacity-40" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-ink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-manga-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink-500/30 bg-ink-500/10 px-3 py-1 text-xs text-ink-300 mb-6">
              ✦ La plataforma de cómics en español
            </div>
            <h1 className="comic-title text-5xl md:text-7xl text-white leading-none mb-4">
              LEE Y PUBLICA <br />
              <span className="text-ink-400">TU HISTORIA</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Miles de cómics, manga, manhwa y webcomics. Gratis, en español,
              creados por la comunidad.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/browse" className="rounded bg-ink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border">
                Explorar Cómics
              </Link>
              <Link href="/creator" className="rounded border border-ink-500/40 bg-ink-500/10 px-6 py-3 text-sm font-semibold text-ink-300 hover:bg-ink-500/20 transition-colors">
                Publicar mi Obra →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIPOS ── */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {COMIC_TYPES.map(({ type, label, emoji, desc }) => (
            <Link key={type} href={`/browse?type=${type}`}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-white/5 bg-dark-card p-3 text-center hover:border-ink-500/30 hover:bg-ink-500/5 transition-all group">
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-white group-hover:text-ink-300 transition-colors">{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="comic-title text-3xl text-white">🔥 TRENDING</h2>
            <p className="text-sm text-gray-500">Los más leídos esta semana</p>
          </div>
          <Link href="/browse?sort=views" className="text-sm text-ink-400 hover:text-ink-300 transition-colors">
            Ver todos →
          </Link>
        </div>
        <ComicGrid comics={trending} />
      </section>

      {/* ── NUEVOS ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="comic-title text-3xl text-white">✨ NUEVAS PUBLICACIONES</h2>
            <p className="text-sm text-gray-500">Recién llegados a la plataforma</p>
          </div>
          <Link href="/browse?sort=newest" className="text-sm text-ink-400 hover:text-ink-300 transition-colors">
            Ver todos →
          </Link>
        </div>
        <ComicGrid comics={newest} />
      </section>

      {/* ── CTA CREADOR ── */}
      <section className="border-t border-white/5 bg-dark-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="max-w-xl mx-auto">
            <div className="text-4xl mb-4">✦</div>
            <h2 className="comic-title text-4xl text-white mb-3">¿TIENES UNA HISTORIA?</h2>
            <p className="text-gray-400 mb-8">
              Publica tu cómic, manga o webcomic gratis. Panel creador con subida de imágenes,
              gestión de capítulos y estadísticas.
            </p>
            <Link href="/creator" className="inline-flex items-center gap-2 rounded bg-manga-500 px-8 py-3 text-sm font-semibold text-white hover:bg-manga-400 transition-colors panel-border">
              Crear mi Obra
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function ComicGrid({ comics }: { comics: Comic[] }) {
  if (comics.length === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-dark-card py-12 text-center text-gray-500">
        No hay cómics disponibles aún. ¡Sé el primero en publicar!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {comics.map(comic => (
        <ComicCard key={comic.id} comic={comic} />
      ))}
    </div>
  )
}
