import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMyComics } from '@/lib/comics'

export const metadata = { title: 'Panel Creador' }

export default async function CreatorDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const comics = await getMyComics()

  // Estadísticas totales
  const totalViews = comics.reduce((sum, c) => sum + c.views_count, 0)
  const totalLikes = comics.reduce((sum, c) => sum + c.likes_count, 0)
  const totalChapters = comics.reduce((sum, c) => sum + c.chapters_count, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="comic-title text-4xl text-white mb-1">DASHBOARD</h1>
        <p className="text-gray-400 text-sm">Bienvenido de vuelta, creador</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Obras', value: comics.length, icon: '📚', color: 'ink' },
          { label: 'Capítulos', value: totalChapters, icon: '📄', color: 'manga' },
          { label: 'Lecturas', value: totalViews.toLocaleString(), icon: '👁', color: 'ink' },
          { label: 'Me Gusta', value: totalLikes.toLocaleString(), icon: '♥', color: 'manga' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border border-white/5 bg-dark-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/creator/comics/new"
          className="flex items-center gap-4 rounded-lg border border-ink-500/30 bg-ink-500/5 p-5 hover:bg-ink-500/10 transition-colors group">
          <div className="h-12 w-12 rounded-lg bg-ink-500 flex items-center justify-center text-2xl panel-border">✦</div>
          <div>
            <p className="font-semibold text-white group-hover:text-ink-300 transition-colors">Nueva Obra</p>
            <p className="text-sm text-gray-500">Crea un cómic, manga o webcomic</p>
          </div>
        </Link>

        <Link href="/creator/comics"
          className="flex items-center gap-4 rounded-lg border border-white/5 bg-dark-card p-5 hover:border-white/10 transition-colors group">
          <div className="h-12 w-12 rounded-lg bg-dark-surface flex items-center justify-center text-2xl border border-white/10">📚</div>
          <div>
            <p className="font-semibold text-white">Mis Obras</p>
            <p className="text-sm text-gray-500">{comics.length} obras publicadas</p>
          </div>
        </Link>
      </div>

      {/* Recent comics */}
      {comics.length > 0 && (
        <div>
          <h2 className="comic-title text-2xl text-white mb-4">MIS OBRAS RECIENTES</h2>
          <div className="space-y-2">
            {comics.slice(0, 5).map(comic => (
              <div key={comic.id} className="flex items-center gap-4 rounded-lg border border-white/5 bg-dark-card p-4">
                <div className="relative h-14 w-10 rounded overflow-hidden bg-dark-surface shrink-0">
                  {comic.cover_url && (
                    <img src={comic.cover_url} alt={comic.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{comic.title}</p>
                  <p className="text-xs text-gray-500">
                    {comic.chapters_count} capítulos · {comic.views_count.toLocaleString()} lecturas
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${comic.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {comic.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                  <Link href={`/creator/comics/${comic.id}`}
                    className="text-xs text-ink-400 hover:text-ink-300 transition-colors">
                    Editar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comics.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
          <div className="text-4xl mb-3">✦</div>
          <p className="text-white font-medium mb-1">Aún no tienes obras</p>
          <p className="text-gray-500 text-sm mb-4">Crea tu primera obra y empieza a publicar</p>
          <Link href="/creator/comics/new"
            className="inline-flex rounded border border-ink-500/40 bg-ink-500/10 px-4 py-2 text-sm text-ink-300 hover:bg-ink-500/20 transition-colors">
            Crear Primera Obra
          </Link>
        </div>
      )}
    </div>
  )
}
