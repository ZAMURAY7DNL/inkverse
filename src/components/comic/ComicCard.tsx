import Link from 'next/link'
import Image from 'next/image'
import type { Comic } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  manga: 'Manga',
  comic: 'Comics',
  webcomic: 'Webcomic',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
  webtoon: 'Webtoon',
  other: 'Otro',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ongoing: { label: 'En curso', color: 'text-green-400' },
  completed: { label: 'Completo', color: 'text-blue-400' },
  hiatus: { label: 'Hiatus', color: 'text-yellow-400' },
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
      <Link
        href={`/comic/${comic.slug}`}
        className="group flex gap-3 rounded-lg border border-white/10 bg-dark-card p-3 transition-colors hover:border-ink-500/30"
      >
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded bg-dark-surface">
          {comic.cover_url ? (
            <Image src={comic.cover_url} alt={comic.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900 text-2xl font-semibold text-ink-300/50">
              {comic.title[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start gap-2">
            <span className="shrink-0 rounded bg-ink-500/15 px-1.5 py-0.5 text-xs text-ink-300">{TYPE_LABELS[comic.type]}</span>
            <span className={`ml-auto shrink-0 text-xs ${status.color}`}>{status.label}</span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-ink-300">
            {comic.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">por {comic.author?.display_name || comic.author?.username}</p>
          {comic.description && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-400">{comic.description}</p>}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{comic.views_count.toLocaleString()} lecturas</span>
            <span>{comic.likes_count.toLocaleString()} likes</span>
            <span>{comic.chapters_count} caps</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/comic/${comic.slug}`} className="comic-card group block overflow-hidden rounded-lg">
      <div className="relative aspect-[3/4] bg-dark-card">
        {comic.cover_url ? (
          <Image
            src={comic.cover_url}
            alt={comic.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="halftone-bg absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-900 to-dark-card">
            <span className="text-6xl font-bold text-ink-300/30">{comic.title[0]}</span>
          </div>
        )}

        <div className="comic-card-overlay" />

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <span className="rounded-sm bg-ink-500 px-1.5 py-0.5 text-xs font-semibold text-white">{TYPE_LABELS[comic.type]}</span>
          {comic.is_mature && <span className="rounded-sm bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">+18</span>}
        </div>

        {comic.rating_count > 0 && (
          <div className="absolute right-2 top-2 rounded-sm bg-black/65 px-1.5 py-0.5 text-xs text-yellow-400">
            {comic.rating_average.toFixed(1)}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white">{comic.title}</h3>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-300">
            <span className={status.color}>{status.label}</span>
            <span>{comic.views_count > 999 ? `${(comic.views_count / 1000).toFixed(1)}k` : comic.views_count} lecturas</span>
          </div>
        </div>
      </div>

      {comic.genres && comic.genres.length > 0 && variant !== 'minimal' && (
        <div className="flex flex-wrap gap-1 bg-dark-card p-2">
          {comic.genres.slice(0, 3).map((g) => (
            <span key={g.id} className="genre-badge" style={{ backgroundColor: `${g.color}20`, color: g.color }}>
              {g.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
