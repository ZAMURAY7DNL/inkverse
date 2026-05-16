'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { label: 'Explorar', href: '/browse' },
  { label: 'Manga', href: '/browse?type=manga' },
  { label: 'CÃ³mics', href: '/browse?type=comic' },
  { label: 'Webtoons', href: '/browse?type=webtoon' },
  { label: 'Manhwa', href: '/browse?type=manhwa' },
]

export function Navbar() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/50 bg-dark-bg/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-500 panel-border font-display text-lg text-white">
              IV
            </div>
            <span className="comic-title text-2xl text-white tracking-wide hidden sm:block">
              InkVerse
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-400 hover:border-ink-500/50 transition-colors cursor-pointer w-48">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar...</span>
            <kbd className="ml-auto text-xs opacity-50 font-mono">âŒ˜K</kbd>
          </div>

          {/* Auth Area */}
          {loading ? (
            <div className="h-8 w-8 rounded-full skeleton" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-white/10 hover:border-ink-500/50 transition-colors p-0.5"
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
                  <div className="h-8 w-8 rounded-full bg-ink-500 flex items-center justify-center text-sm font-medium text-white">
                    {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/10 bg-dark-card shadow-xl animate-slide-down">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.display_name || profile?.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link href="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                      Mi Perfil
                    </Link>
                    <Link href="/library" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                      Biblioteca
                    </Link>
                    <Link href="/profile/history" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                      Historial
                    </Link>
                    <div className="my-1 border-t border-white/10" />
                    <Link href="/creator" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-300 hover:text-ink-200 hover:bg-ink-500/10 rounded-md transition-colors font-medium">
                      âœ¦ Panel Creador
                    </Link>
                    <div className="my-1 border-t border-white/10" />
                    <Link href="/profile/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                      ConfiguraciÃ³n
                    </Link>
                    <button
                      onClick={() => { signOut(); setProfileOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-manga-400 hover:text-manga-300 hover:bg-manga-500/10 rounded-md transition-colors"
                    >
                      Cerrar SesiÃ³n
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 rounded border border-ink-500/50 bg-ink-500/10 px-4 py-1.5 text-sm font-medium text-ink-300 hover:bg-ink-500/20 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar con Google
            </button>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white/10 py-3 animate-slide-down">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-2 text-sm text-gray-300 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
