import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Proteger rutas del creator panel
    '/creator/:path*',
    // Proteger perfil de usuario
    '/profile/:path*',
    // Excluir archivos estáticos y API routes de autenticación
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
