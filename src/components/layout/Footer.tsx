import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink-500 text-sm font-semibold text-white">CC</div>
              <span className="text-lg font-semibold text-ink-400">ClickcaComics</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Plataforma para leer y publicar manga, comics, manhwa y webtoon en espanol.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Explorar</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/browse?type=manga" className="transition-colors hover:text-white">Manga</Link></li>
              <li><Link href="/browse?type=comic" className="transition-colors hover:text-white">Comics</Link></li>
              <li><Link href="/browse?type=manhwa" className="transition-colors hover:text-white">Manhwa</Link></li>
              <li><Link href="/browse?type=webtoon" className="transition-colors hover:text-white">Webtoons</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Creadores</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/creator" className="transition-colors hover:text-white">Panel Creador</Link></li>
              <li><Link href="/creator/comics/new" className="transition-colors hover:text-white">Nueva Obra</Link></li>
              <li><Link href="/creator/comics" className="transition-colors hover:text-white">Mis Obras</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Cuenta</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/login" className="transition-colors hover:text-white">Iniciar Sesion</Link></li>
              <li><Link href="/profile" className="transition-colors hover:text-white">Perfil</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-white">Biblioteca</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} ClickcaComics.
          </p>
          <p className="text-xs text-gray-600">
            Next.js + Supabase + Vercel
          </p>
        </div>
      </div>
    </footer>
  )
}
