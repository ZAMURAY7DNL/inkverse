import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-dark-surface mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink-500 panel-border font-display text-base text-white">IV</div>
              <span className="comic-title text-xl text-white">InkVerse</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              La plataforma para leer y publicar cómics, manga, manhwa y más en español.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Explorar</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/browse?type=manga" className="hover:text-white transition-colors">Manga</Link></li>
              <li><Link href="/browse?type=comic" className="hover:text-white transition-colors">Cómics</Link></li>
              <li><Link href="/browse?type=manhwa" className="hover:text-white transition-colors">Manhwa</Link></li>
              <li><Link href="/browse?type=webtoon" className="hover:text-white transition-colors">Webtoons</Link></li>
              <li><Link href="/browse?sort=newest" className="hover:text-white transition-colors">Nuevos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Creadores</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/creator" className="hover:text-white transition-colors">Panel Creador</Link></li>
              <li><Link href="/creator/guidelines" className="hover:text-white transition-colors">Guías de Publicación</Link></li>
              <li><Link href="/creator/formats" className="hover:text-white transition-colors">Formatos Aceptados</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/legal/terms" className="hover:text-white transition-colors">Términos de Uso</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
              <li><Link href="/legal/dmca" className="hover:text-white transition-colors">DMCA</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} InkVerse. Hecho con ♥ para la comunidad hispana de cómics.
          </p>
          <p className="text-xs text-gray-600">
            Construido con Next.js, Supabase y Vercel
          </p>
        </div>
      </div>
    </footer>
  )
}
