# InkVerse 📚

Plataforma completa para publicar y leer cómics, manga, manhwa, manhua y webcomics.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase · Vercel · Tailwind CSS

---

## 🚀 Setup Rápido (en 10 minutos)

### 1. Clonar y preparar el proyecto

```bash
git clone <tu-repo>
cd inkverse
npm install
cp .env.example .env.local
```

---

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Anota tu **Project URL** y **anon key** (Settings → API)
3. En el **SQL Editor** del dashboard, ejecuta en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage.sql`

4. Edita `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...   # Solo en servidor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 3. Configurar Google OAuth

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. **Credentials → Create OAuth 2.0 Client ID**
3. Tipo: **Web Application**
4. Authorized redirect URIs: `https://xxxxx.supabase.co/auth/v1/callback`
5. Copia **Client ID** y **Client Secret**
6. En Supabase: **Authentication → Providers → Google** → pega las credenciales

---

### 4. Correr en local

```bash
npm run dev
# → http://localhost:3000
```

---

### 5. Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login y deploy
vercel login
vercel
```

**O desde el dashboard de Vercel:**
1. Import GitHub repo
2. Framework: Next.js (auto-detectado)
3. Agregar variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (tu dominio de Vercel)
4. **Deploy**

### 6. Actualizar URL en Supabase y Google

Después del deploy, actualiza:
- **Supabase → Authentication → URL Configuration:**
  - Site URL: `https://tu-app.vercel.app`
  - Redirect URLs: `https://tu-app.vercel.app/api/auth/callback`
- **Google Console → OAuth → Authorized redirect URIs:**
  - Agrega: `https://xxxxx.supabase.co/auth/v1/callback` (ya debería estar)

---

## 📁 Estructura del Proyecto

```
inkverse/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── page.tsx            # 🏠 Homepage (trending, nuevos)
│   │   ├── browse/             # 🔍 Explorar con filtros
│   │   ├── comic/[slug]/       # 📖 Página de serie
│   │   │   └── chapter/[n]/    # 📄 Lector de capítulo
│   │   ├── creator/            # ✦ Panel del Creador
│   │   │   ├── page.tsx        #   Dashboard
│   │   │   ├── comics/new      #   Nueva obra
│   │   │   └── comics/[id]     #   Gestión + subida de páginas
│   │   ├── profile/            # 👤 Perfil y configuración
│   │   └── api/                # 🔌 API Routes
│   │       ├── auth/callback   #   OAuth callback
│   │       ├── comics/         #   CRUD cómics
│   │       └── chapters/[id]/pages/  #   Gestión de páginas
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── comic/              # ComicCard
│   │   ├── creator/            # NewComicForm, ChapterUploadPanel
│   │   ├── reader/             # ComicReader
│   │   └── ui/                 # ProfileSettings, etc.
│   ├── lib/
│   │   ├── supabase/           # server.ts, client.ts, middleware.ts
│   │   ├── comics.ts           # Queries de cómics
│   │   └── storage.ts          # Upload utilities
│   ├── hooks/
│   │   └── useAuth.ts          # Hook de autenticación
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── styles/
│       └── globals.css         # Estilos globales + Tailwind
├── supabase/
│   ├── config.toml             # Config local de Supabase CLI
│   └── migrations/
│       ├── 001_initial_schema.sql   # Schema completo + RLS
│       └── 002_storage.sql          # Buckets + políticas
├── .env.example                # Template de variables de entorno
├── vercel.json                 # Config de Vercel
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🎨 Funcionalidades

### Para Lectores
- 🏠 Homepage con trending y nuevas publicaciones
- 🔍 Explorar con filtros por tipo, estado, género
- 📖 Página de serie con capítulos, info y estadísticas
- 📄 Lector de capítulos con 3 modos:
  - **Pág. a pág.** — para manga, cómics
  - **Scroll vertical** — para webtoons, manhwa
  - Soporte RTL (derecha a izquierda) para manga japonés
- 🔖 Bookmarks / Guardados
- ⭐ Valoraciones y comentarios
- 👤 Perfil con historial de lectura

### Para Creadores
- ✦ Panel creador con dashboard y estadísticas
- 📚 Gestión de obras (cómics/manga/webcomics)
- ⬆️ Subida de páginas con drag & drop
  - Múltiples archivos a la vez
  - Subida paralela con barra de progreso
  - Reordenamiento de páginas
  - Formatos: JPG, PNG, WebP, GIF
- 📄 Gestión de capítulos
- 🌐 Publicación / borrador

---

## 🛠️ Comandos Útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run type-check   # Verificar tipos TypeScript
npm run db:types     # Regenerar tipos desde Supabase
```

---

## 🔐 Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- Los cómics solo son visibles si `is_published = true` (excepto para el autor)
- Storage con políticas por usuario (`userId` como prefijo del path)
- Middleware de Next.js refresca la sesión automáticamente
- Google OAuth manejado por Supabase Auth

---

## 📈 Próximos Pasos Sugeridos

- [ ] Búsqueda con Supabase full-text search
- [ ] Sistema de notificaciones en tiempo real (Supabase Realtime)
- [ ] Soporte para cómics premium / monetización
- [ ] App móvil (React Native + Expo)
- [ ] CDN para imágenes (Cloudflare Images / Cloudinary)
- [ ] Sistema de moderación de contenido
