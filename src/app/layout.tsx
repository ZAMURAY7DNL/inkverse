import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ClickcaComics - Lee y publica comics, manga y webtoons',
    template: '%s | ClickcaComics',
  },
  description: 'Plataforma para leer y publicar comics, manga, manhwa, manhua y webtoons en espanol.',
  keywords: ['comics', 'manga', 'webcomics', 'manhwa', 'manhua', 'leer manga', 'publicar comics'],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'ClickcaComics',
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
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
