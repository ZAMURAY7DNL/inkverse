import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileSettings } from '@/components/ui/ProfileSettings'

export const metadata = { title: 'Mi Perfil — InkVerse' }

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Estadísticas del usuario
  const [{ count: bookmarksCount }, { count: commentsCount }] = await Promise.all([
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="comic-title text-4xl text-white mb-8">MI PERFIL</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats sidebar */}
        <div className="space-y-3">
          <div className="rounded-lg border border-white/5 bg-dark-card p-5">
            <div className="flex flex-col items-center text-center mb-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-ink-500 flex items-center justify-center text-2xl font-display text-white mb-3">
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
              ].map(stat => (
                <div key={stat.label} className="bg-dark-surface rounded p-2">
                  <p className="text-lg font-semibold text-white">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/5 bg-dark-card p-4">
            <p className="text-xs text-gray-500 mb-2">Miembro desde</p>
            <p className="text-sm text-white">
              {new Date(profile?.created_at || '').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Settings form */}
        <div className="lg:col-span-2">
          <ProfileSettings profile={profile} userEmail={user.email || ''} />
        </div>
      </div>
    </div>
  )
}
