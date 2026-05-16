import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getMyComics } from '@/lib/comics'

export const metadata = { title: 'Mis Obras' }

export default async function MyComicsPage() {
  const comics = await getMyComics()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="comic-title text-4xl text-white mb-1">MIS OBRAS</h1>
          <p className="text-gray-400 text-sm">{comics.length} obra{comics.length !== 1 ? 's' : ''} creada{comics.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/creator/comics/new"
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
          + Nueva Obra
        </Link>
      </div>

      {comics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-16 text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-white font-semibold mb-2">Aun no tienes obras</p>
          <p className="text-gray-500 text-sm mb-6">Crea tu primera obra y empieza a publicar capitulos</p>
          <Link href="/creator/comics/new"
            className="inline-flex rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
            Crear Primera Obra
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comics.map(comic => (
            <Link key={comic.id} href={`/creator/comics/${comic.id}`}
              className="group rounded-xl border border-white/5 bg-zinc-900 hover:border-white/10 transition-all overflow-hidden">
              <div className="relative aspect-[3/2] bg-zinc-800 overflow-hidden">
                {comic.cover_url ? (
                  <Image src={comic.cover_url} alt={comic.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-700">📄</div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${comic.is_published ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                    {comic.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white truncate mb-1">{comic.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{comic.type}</span>
                  <span>·</span>
                  <span>{comic.chapters_count} capitulos</span>
                  <span>·</span>
                  <span>{comic.views_count.toLocaleString()} vistas</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
