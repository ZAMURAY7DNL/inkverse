import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi Biblioteca — InkVerse' }

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select(`comic:comics(*, author:profiles!author_id(id, username, display_name, avatar_url, is_verified), genres:comic_genres(genre:genres(*)))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bookmarks = (bookmarksData || []).map((b: any) => ({
    ...b.comic,
    genres: b.comic?.genres?.map((g: any) => g.genre) || []
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
        <h1 className="comic-title text-4xl text-white mb-8">MI BIBLIOTECA</h1>

        {/* Obras guardadas */}
        <section className="mb-12">
          <h2 className="comic-title text-2xl text-white mb-5">
            OBRAS GUARDADAS
            <span className="text-gray-500 text-lg ml-3 font-sans font-normal">({bookmarks.length})</span>
          </h2>
          {bookmarks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-gray-400 mb-2">No tienes obras guardadas aun</p>
              <Link href="/browse" className="text-ink-400 hover:text-ink-300 text-sm transition-colors">
                Explorar obras →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bookmarks.map((comic: any) => (
                <Link key={comic.id} href={`/comic/${comic.slug}`} className="group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-dark-card border border-white/5 group-hover:border-ink-500/30 transition-colors">
                    {comic.cover_url ? (
                      <Image src={comic.cover_url} alt={comic.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink-900">
                        <span className="font-display text-4xl text-ink-400/40">{comic.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-300 mt-2 truncate group-hover:text-white transition-colors">{comic.title}</p>
                  <p className="text-xs text-gray-600 truncate">{comic.author?.display_name || comic.author?.username}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Creadores seguidos */}
        <section>
          <h2 className="comic-title text-2xl text-white mb-5">
            CREADORES SEGUIDOS
            <span className="text-gray-500 text-lg ml-3 font-sans font-normal">({following.length})</span>
          </h2>
          {following.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-gray-400">No sigues a ningun creador aun</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {following.map((profile: any) => (
                <Link key={profile.id} href={`/creator/${profile.username}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-dark-card hover:border-ink-500/30 transition-colors group">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-ink-900 border border-white/10">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={profile.display_name || profile.username} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl text-ink-400">
                        {(profile.display_name || profile.username)[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white font-medium truncate max-w-full group-hover:text-ink-300 transition-colors">
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
