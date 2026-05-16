import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const NAV_ITEMS = [
    { href: '/creator', label: 'Dashboard', icon: '?', exact: true },
    { href: '/creator/comics', label: 'Mis Obras', icon: '??' },
    { href: '/creator/comics/new', label: 'Nueva Obra', icon: '?' },
    { href: '/creator/analytics', label: 'Estadisticas', icon: '??' },
    { href: '/creator/settings', label: 'Perfil Creador', icon: '?' },
  ]

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <aside className="w-56 shrink-0 border-r border-white/5 bg-dark-surface">
        <div className="sticky top-16">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-sm bg-manga-500 flex items-center justify-center text-xs font-bold text-white panel-border">C</div>
              <span className="text-sm font-semibold text-white">Panel Creador</span>
            </div>
          </div>
          <nav className="p-2">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors my-0.5">
                <span className="w-4 text-center text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-white/5 space-y-2">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors block">
              Volver al sitio
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-xs text-red-500 hover:text-red-300 transition-colors">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
