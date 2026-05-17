import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileSettings } from '@/components/ui/ProfileSettings'

export const metadata = { title: 'Mi Perfil - ClickcaComics' }

export default async function ProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const [{ count: bookmarksCount }, { count: commentsCount }] = await Promise.all([
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="comic-title mb-8 text-4xl text-white">MI PERFIL</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="rounded-lg border border-white/5 bg-dark-card p-5">
            <div className="mb-4 flex flex-col items-center text-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="mb-3 h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-ink-500 text-2xl font-display text-white">
                  {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <p className="font-semibold text-white">{profile?.display_name || profile?.username}</p>
              <p className="text-xs text-gray-500">@{profile?.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: 'Guardados', value: bookmarksCount || 0 },
                { label: 'Comentarios', value: commentsCount || 0 },
                { label: 'Seguidores', value: profile?.followers_count || 0 },
                { label: 'Siguiendo', value: profile?.following_count || 0 },
              ].map((stat) => (
                <div key={stat.label} className="rounded bg-dark-surface p-2">
                  <p className="text-lg font-semibold text-white">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/5 bg-dark-card p-4">
            <p className="mb-2 text-xs text-gray-500">Miembro desde</p>
            <p className="text-sm text-white">
              {new Date(profile?.created_at || '').toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ProfileSettings profile={profile} userEmail={user.email || ''} />
        </div>
      </div>
    </div>
  )
}
