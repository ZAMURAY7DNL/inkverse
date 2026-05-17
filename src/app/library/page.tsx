import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi Biblioteca - ClickcaComics' }

export default async function LibraryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select(
      `comic:comics(*, author:profiles!author_id(id, username, display_name, avatar_url, is_verified), genres:comic_genres(genre:genres(*)))`
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bookmarks = (bookmarksData || []).map((b: any) => ({
    ...b.comic,
    genres: b.comic?.genres?.map((g: any) => g.genre) || [],
  }))

  const { data: followsData } = await supabase
    .from('follows')
    .select(`profile:profiles!following_id(id, username, display_name, avatar_url, is_verified, followers_count)`)
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })

  const following = (followsData || []).map((f: any) => f.profile)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="comic-title mb-8 text-4xl text-white">MI BIBLIOTECA</h1>

        <section className="mb-12">
          <h2 className="comic-title mb-5 text-2xl text-white">
            OBRAS GUARDADAS
            <span className="ml-3 text-lg font-normal text-gray-500">({bookmarks.length})</span>
          </h2>
          {bookmarks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="mb-2 text-gray-400">No tienes obras guardadas aun</p>
              <Link href="/browse" className="text-sm text-ink-400 transition-colors hover:text-ink-300">
                Explorar obras
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {bookmarks.map((comic: any) => (
                <Link key={comic.id} href={`/comic/${comic.slug}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/5 bg-dark-card transition-colors group-hover:border-ink-500/30">
                    {comic.cover_url ? (
                      <Image
                        src={comic.cover_url}
                        alt={comic.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink-900">
                        <span className="font-display text-4xl text-ink-400/40">{comic.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 truncate text-xs text-gray-300 transition-colors group-hover:text-white">{comic.title}</p>
                  <p className="truncate text-xs text-gray-600">{comic.author?.display_name || comic.author?.username}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="comic-title mb-5 text-2xl text-white">
            CREADORES SEGUIDOS
            <span className="ml-3 text-lg font-normal text-gray-500">({following.length})</span>
          </h2>
          {following.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-gray-400">No sigues a ningun creador aun</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {following.map((profile: any) => (
                <Link
                  key={profile.id}
                  href={`/creator/${profile.username}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-dark-card p-4 transition-colors hover:border-ink-500/30"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-ink-900">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={profile.display_name || profile.username} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl text-ink-400">
                        {(profile.display_name || profile.username)[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="max-w-full truncate text-sm font-medium text-white transition-colors group-hover:text-ink-300">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="text-xs text-gray-500">{profile.followers_count} seguidores</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
