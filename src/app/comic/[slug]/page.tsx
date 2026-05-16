export const revalidate = 60


import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getComicBySlug, getChaptersByComicId } from '@/lib/comics'
import { createClient } from '@/lib/supabase/server'
import { ComicActions } from '@/components/comic/ComicActions'
import { FollowButton } from '@/components/comic/FollowButton'
import type { Metadata } from 'next'

interface ComicPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ComicPageProps): Promise<Metadata> {
  const comic = await getComicBySlug(params.slug)
  if (!comic) return { title: 'No encontrado' }
  return {
    title: `${comic.title} - InkVerse`,
    description: comic.description || `Lee ${comic.title} en InkVerse`,
    openGraph: { images: comic.cover_url ? [comic.cover_url] : [] },
  }
}

const TYPE_LABELS: Record<string, string> = {
  manga: 'Manga', comic: 'Comic', webcomic: 'Webcomic',
  manhwa: 'Manhwa', manhua: 'Manhua', webtoon: 'Webtoon', other: 'Otro',
}
const STATUS_COLORS: Record<string, string> = {
  ongoing: 'text-green-400', completed: 'text-blue-400',
  hiatus: 'text-yellow-400', cancelled: 'text-red-400',
}
const STATUS_LABELS: Record<string, string> = {
  ongoing: 'En Curso', completed: 'Completo', hiatus: 'Hiatus', cancelled: 'Cancelado',
}
const DIR_LABELS: Record<string, string> = {
  ltr: 'Occidental', rtl: 'Manga', ttb: 'Vertical',
}

export default async function ComicPage({ params }: ComicPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [comic, chapters] = await Promise.all([
    getComicBySlug(params.slug),
    getComicBySlug(params.slug).then(c => c ? getChaptersByComicId(c.id) : []),
  ])

  if (!comic) notFound()

  // Verificar estado del usuario con esta obra
  let isBookmarked = false
  let isLiked = false
  let isFollowingAuthor = false

  if (user) {
    const [bookmarkData, likeData, followData] = await Promise.all([
      supabase.from('bookmarks').select('user_id').eq('user_id', user.id).eq('comic_id', comic.id).single(),
      supabase.from('comic_likes').select('user_id').eq('user_id', user.id).eq('comic_id', comic.id).single(),
      comic.author_id ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', comic.author_id).single() : Promise.resolve({ data: null }),
    ])
    isBookmarked = !!bookmarkData.data
    isLiked = !!likeData.data
    isFollowingAuthor = !!followData.data
  }

  const firstChapter = chapters[chapters.length - 1]
  const lastChapter = chapters[0]

  return (
    <div className="min-h-screen">
      {/* BANNER */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {comic.banner_url || comic.cover_url ? (
          <Image
            src={comic.banner_url || comic.cover_url!}
            alt={comic.title} fill className="object-cover"
            style={{ filter: 'blur(12px) brightness(0.3)', transform: 'scale(1.1)' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink-900 to-dark-bg halftone-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-6xl px-4 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Cover */}
          <div className="shrink-0">
            <div className="relative w-40 md:w-52 aspect-[3/4] rounded-lg overflow-hidden panel-border shadow-2xl bg-dark-card">
              {comic.cover_url ? (
                <Image src={comic.cover_url} alt={comic.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-ink-900">
                  <span className="font-display text-7xl text-ink-400/40">{comic.title[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-20 md:pt-32 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-semibold bg-ink-500 text-white px-2 py-0.5 rounded-sm">
                {TYPE_LABELS[comic.type]}
              </span>
              <span className={`text-xs font-medium ${STATUS_COLORS[comic.status]}`}>
                ● {STATUS_LABELS[comic.status]}
              </span>
              {comic.is_mature && (
                <span className="text-xs font-semibold bg-manga-500/20 text-manga-400 border border-manga-500/30 px-2 py-0.5 rounded-sm">
                  +18
                </span>
              )}
              <span className="text-xs text-gray-500">{DIR_LABELS[comic.reading_direction]}</span>
            </div>

            <h1 className="comic-title text-4xl md:text-5xl text-white leading-tight mb-2">
              {comic.title}
            </h1>

            {/* Autor + boton seguir */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Link href={`/creator/${comic.author?.username}`} className="flex items-center gap-2 group">
                {comic.author?.avatar_url && (
                  <Image src={comic.author.avatar_url} alt="" width={22} height={22} className="rounded-full" />
                )}
                <span className="text-sm text-gray-400 group-hover:text-ink-300 transition-colors">
                  {comic.author?.display_name || comic.author?.username}
                  {comic.author?.is_verified && <span className="text-ink-400 ml-1">✓</span>}
                </span>
              </Link>
              {comic.author_id && user?.id !== comic.author_id && (
                <FollowButton
                  followingId={comic.author_id}
                  initialFollowing={isFollowingAuthor}
                  
                />
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-5 mb-5 text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span>👁</span>
                <span>{comic.views_count.toLocaleString()} lecturas</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span>♥</span>
                <span>{comic.likes_count.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span>📖</span>
                <span>{comic.bookmarks_count.toLocaleString()}</span>
              </span>
              {comic.rating_count > 0 && (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <span>★</span>
                  <span>{comic.rating_average.toFixed(1)} ({comic.rating_count})</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-gray-400">
                <span>📚</span>
                <span>{comic.views_count.toLocaleString()} visualizaciones</span>
              </span>
            </div>

            {/* Genres */}
            {comic.genres && comic.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {comic.genres.map(genre => (
                  <Link key={genre.id} href={`/browse?genre=${genre.slug}`}
                    className="genre-badge hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: `${genre.color}20`, color: genre.color }}>
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              {firstChapter && (
                <Link href={`/comic/${comic.slug}/chapter/${firstChapter.chapter_number}`}
                  className="rounded bg-ink-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border">
                  Leer desde el inicio
                </Link>
              )}
              {lastChapter && lastChapter.id !== firstChapter?.id && (
                <Link href={`/comic/${comic.slug}/chapter/${lastChapter.chapter_number}`}
                  className="rounded border border-ink-500/40 bg-ink-500/10 px-6 py-2.5 text-sm font-semibold text-ink-300 hover:bg-ink-500/20 transition-colors">
                  Ultimo capitulo →
                </Link>
              )}
              <ComicActions
                comicId={comic.id}
                initialBookmarked={isBookmarked}
                initialLiked={isLiked}
                initialLikesCount={comic.likes_count}
                initialBookmarksCount={comic.bookmarks_count}
              />
            </div>
          </div>
        </div>

        {/* DESCRIPTION + CHAPTERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 pb-16">

          <div className="lg:col-span-2">
            {comic.description && (
              <div className="mb-8">
                <h2 className="comic-title text-2xl text-white mb-3">SINOPSIS</h2>
                <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">{comic.description}</p>
              </div>
            )}

            <div>
              <h2 className="comic-title text-2xl text-white mb-4">CAPITULOS ({chapters.length})</h2>
              {chapters.length === 0 ? (
                <p className="text-gray-500 text-sm">Aun no hay capitulos publicados.</p>
              ) : (
                <div className="space-y-1">
                  {chapters.map(chapter => (
                    <Link key={chapter.id}
                      href={`/comic/${comic.slug}/chapter/${chapter.chapter_number}`}
                      className="flex items-center gap-4 rounded border border-white/5 bg-dark-card px-4 py-3 hover:border-ink-500/30 hover:bg-ink-500/5 transition-all group">
                      <span className="text-sm font-semibold text-white group-hover:text-ink-300 transition-colors min-w-16">
                        Cap. {chapter.chapter_number}
                      </span>
                      <span className="text-sm text-gray-400 flex-1 truncate">{chapter.title || '—'}</span>
                      <span className="text-xs text-gray-600 shrink-0">{chapter.pages_count}p</span>
                      <span className="text-xs text-gray-600 shrink-0">
                        {new Date(chapter.published_at || chapter.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-ink-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-white/5 bg-dark-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Informacion</h3>
              <dl className="space-y-3 text-sm">
                {[
                  { label: 'Tipo', value: TYPE_LABELS[comic.type] },
                  { label: 'Estado', value: STATUS_LABELS[comic.status] },
                  { label: 'Lectura', value: DIR_LABELS[comic.reading_direction] },
                  { label: 'Capitulos', value: comic.chapters_count.toString() },
                  { label: 'Publicado', value: new Date(comic.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-white font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
