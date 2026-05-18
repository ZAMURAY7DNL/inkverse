'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Explorar', href: '/browse' },
  { label: 'Manga', href: '/browse?type=manga' },
  { label: 'Comics', href: '/browse?type=comic' },
  { label: 'Webtoons', href: '/browse?type=webtoon' },
  { label: 'Mi Lista', href: '/library' },
]

export function Navbar() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header data-clicka-node className="sticky top-0 z-[99999] border-b border-white/10 bg-black/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-500 font-semibold text-white">CC</div>
            <span className="text-xl font-semibold tracking-wide text-ink-400">ClickcaComics</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="hidden w-44 items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-400 sm:flex">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar...</span>
          </div>

          {loading ? (
            <div className="skeleton h-8 w-8 rounded-full" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-white/20 p-0.5 transition-colors hover:border-white/35"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Avatar'}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-500 text-sm font-semibold text-white">
                    {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="animate-slide-down absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/15 bg-dark-card shadow-xl">
                  <div className="border-b border-white/10 p-3">
                    <p className="truncate text-sm font-medium text-white">{profile?.display_name || profile?.username}</p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link href="/profile" onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white">
                      Mi Perfil
                    </Link>
                    <Link href="/library" onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white">
                      Biblioteca
                    </Link>
                    <Link href="/creator" onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-500/15 hover:text-white">
                      Panel Creador
                    </Link>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={() => {
                        signOut()
                        setProfileOpen(false)
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Cerrar Sesion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="rounded bg-ink-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink-400"
            >
              Iniciar Sesion
            </button>
          )}

          <button className="p-2 text-gray-400 hover:text-white md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="animate-slide-down border-t border-white/10 py-3 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-2 text-sm text-gray-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

