import Link from 'next/link'
import Image from 'next/image'
import type { Comic } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  manga: 'Manga', comic: 'Cómic', webcomic: 'Webcomic',
  manhwa: 'Manhwa', manhua: 'Manhua', webtoon: 'Webtoon', other: 'Otro'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ongoing:   { label: 'En Curso', color: 'text-green-400' },
  completed: { label: 'Completo', color: 'text-blue-400' },
  hiatus:    { label: 'Hiatus', color: 'text-yellow-400' },
  cancelled: { label: 'Cancelado', color: 'text-red-400' },
}

interface ComicCardProps {
  comic: Comic
  variant?: 'default' | 'wide' | 'minimal'
}

export function ComicCard({ comic, variant = 'default' }: ComicCardProps) {
  const status = STATUS_LABELS[comic.status]

  if (variant === 'wide') {
    return (
      <Link href={`/comic/${comic.slug}`} className="group flex gap-3 rounded-lg border border-white/5 bg-dark-card p-3 hover:border-ink-500/30 transition-all">
        <div className="relative shrink-0 w-20 h-28 rounded overflow-hidden bg-dark-surface">
          {comic.cover_url
            ? <Image src={comic.cover_url} alt={comic.title} fill className="object-cover" />
            : <div className="absolute inset-0 bg-ink-900 flex items-center justify-center text-ink-400 text-2xl font-display">{comic.title[0]}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xs text-ink-400 bg-ink-500/10 rounded px-1.5 py-0.5 shrink-0">{TYPE_LABELS[comic.type]}</span>
            <span className={`text-xs ${status.color} ml-auto shrink-0`}>{status.label}</span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-ink-300 transition-colors">
            {comic.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">por {comic.author?.display_name || comic.author?.username}</p>
          {comic.description && (
            <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{comic.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>👁 {comic.views_count.toLocaleString()}</span>
            <span>♥ {comic.likes_count.toLocaleString()}</span>
            <span>📖 {comic.chapters_count} caps.</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/comic/${comic.slug}`} className="comic-card group block rounded-lg overflow-hidden">
      {/* Cover */}
      <div className="relative aspect-[3/4] bg-dark-card">
        {comic.cover_url
          ? <Image src={comic.cover_url} alt={comic.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
          : (
            <div className="absolute inset-0 bg-gradient-to-br from-ink-900 to-dark-card flex items-center justify-center halftone-bg">
              <span className="font-display text-6xl text-ink-400/40">{comic.title[0]}</span>
            </div>
          )
        }

        {/* Overlay */}
        <div className="comic-card-overlay" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="text-xs font-semibold bg-ink-500 text-white px-1.5 py-0.5 rounded-sm">
            {TYPE_LABELS[comic.type]}
          </span>
          {comic.is_mature && (
            <span className="text-xs font-semibold bg-manga-500 text-white px-1.5 py-0.5 rounded-sm">+18</span>
          )}
        </div>

        {/* Rating */}
        {comic.rating_count > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-sm px-1.5 py-0.5 text-xs text-yellow-400">
            ★ {comic.rating_average.toFixed(1)}
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="comic-title text-lg leading-tight text-white line-clamp-2">
            {comic.title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-300">
            <span className={status.color}>{status.label}</span>
            <span>👁 {comic.views_count > 999 ? `${(comic.views_count / 1000).toFixed(1)}k` : comic.views_count}</span>
          </div>
        </div>
      </div>

      {/* Genres */}
      {comic.genres && comic.genres.length > 0 && variant !== 'minimal' && (
        <div className="flex gap-1 p-2 flex-wrap bg-dark-card">
          {comic.genres.slice(0, 3).map(g => (
            <span key={g.id} className="genre-badge" style={{ backgroundColor: `${g.color}20`, color: g.color }}>
              {g.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
