import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'InkVerse — Lee y Publica Cómics, Manga y Webcomics',
    template: '%s | InkVerse',
  },
  description: 'La plataforma de cómics, manga, manhwa, manhua y webcomics en español. Lee gratis y publica tu obra.',
  keywords: ['comics', 'manga', 'webcomics', 'manhwa', 'manhua', 'leer manga', 'publicar comics'],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'InkVerse',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
