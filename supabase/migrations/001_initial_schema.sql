-- ============================================================
-- INKVERSE - Schema de Base de Datos
-- ============================================================
-- Ejecutar en: Supabase SQL Editor o con `supabase db push`
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda full-text

-- ============================================================
-- PERFILES DE USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  is_creator BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERIES / CÓMICS
-- ============================================================
CREATE TYPE comic_status AS ENUM ('ongoing', 'completed', 'hiatus', 'cancelled');
CREATE TYPE comic_type AS ENUM ('manga', 'comic', 'webcomic', 'manhwa', 'manhua', 'webtoon', 'other');
CREATE TYPE reading_direction AS ENUM ('ltr', 'rtl', 'ttb'); -- left-to-right, right-to-left, top-to-bottom

CREATE TABLE IF NOT EXISTS comics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  banner_url TEXT,
  type comic_type DEFAULT 'comic',
  status comic_status DEFAULT 'ongoing',
  reading_direction reading_direction DEFAULT 'ltr',
  is_mature BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  chapters_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GÉNEROS / TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS genres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#7c4dff'
);

CREATE TABLE IF NOT EXISTS comic_genres (
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, genre_id)
);

-- ============================================================
-- CAPÍTULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE NOT NULL,
  chapter_number DECIMAL(10,1) NOT NULL,
  title TEXT,
  volume INTEGER,
  pages_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comic_id, chapter_number)
);

-- ============================================================
-- PÁGINAS DE CAPÍTULO
-- ============================================================
CREATE TABLE IF NOT EXISTS chapter_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, page_number)
);

-- ============================================================
-- INTERACCIONES DE USUARIO
-- ============================================================

-- Favoritos / Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comic_id)
);

-- Likes en cómics
CREATE TABLE IF NOT EXISTS comic_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comic_id)
);

-- Historial de lectura
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  last_page INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Valoraciones / Ratings
CREATE TABLE IF NOT EXISTS ratings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comic_id)
);

-- Comentarios
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Para replies
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seguidores
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'new_chapter', 'new_follower', 'comment_reply', 'comic_like', 'system'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_comics_author ON comics(author_id);
CREATE INDEX IF NOT EXISTS idx_comics_slug ON comics(slug);
CREATE INDEX IF NOT EXISTS idx_comics_type ON comics(type);
CREATE INDEX IF NOT EXISTS idx_comics_published ON comics(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comics_views ON comics(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_comic ON chapters(comic_id, chapter_number DESC);
CREATE INDEX IF NOT EXISTS idx_pages_chapter ON chapter_pages(chapter_id, page_number);
CREATE INDEX IF NOT EXISTS idx_history_user ON reading_history(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_comic ON comments(comic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Full-text search en títulos
CREATE INDEX IF NOT EXISTS idx_comics_title_search ON comics USING GIN(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comic_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas: Perfiles
CREATE POLICY "Perfiles visibles para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuario actualiza su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas: Cómics publicados visibles para todos
CREATE POLICY "Cómics publicados visibles" ON comics FOR SELECT USING (is_published = true OR auth.uid() = author_id);
CREATE POLICY "Creador gestiona sus cómics" ON comics FOR ALL USING (auth.uid() = author_id);

-- Políticas: Capítulos
CREATE POLICY "Capítulos publicados visibles" ON chapters FOR SELECT USING (
  is_published = true OR 
  EXISTS (SELECT 1 FROM comics WHERE id = comic_id AND author_id = auth.uid())
);
CREATE POLICY "Creador gestiona capítulos" ON chapters FOR ALL USING (
  EXISTS (SELECT 1 FROM comics WHERE id = comic_id AND author_id = auth.uid())
);

-- Políticas: Páginas
CREATE POLICY "Páginas visibles si capítulo publicado" ON chapter_pages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chapters c
    JOIN comics comic ON comic.id = c.comic_id
    WHERE c.id = chapter_id AND (c.is_published = true OR comic.author_id = auth.uid())
  )
);
CREATE POLICY "Creador gestiona páginas" ON chapter_pages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chapters c
    JOIN comics ON comics.id = c.comic_id
    WHERE c.id = chapter_id AND comics.author_id = auth.uid()
  )
);

-- Políticas: Interacciones (requieren autenticación)
CREATE POLICY "Usuario gestiona sus bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuario gestiona sus likes" ON comic_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuario gestiona su historial" ON reading_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Usuario gestiona sus valoraciones" ON ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Comentarios visibles" ON comments FOR SELECT USING (true);
CREATE POLICY "Usuario gestiona sus comentarios" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario edita sus comentarios" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Follows visibles" ON follows FOR SELECT USING (true);
CREATE POLICY "Usuario gestiona sus follows" ON follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Usuario ve sus notificaciones" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuario marca notificaciones" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: Auto-crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      SPLIT_PART(NEW.email, '@', 1) || '_' || FLOOR(RANDOM() * 9999)::TEXT
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCIÓN: Actualizar contadores automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_comic_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'comic_likes' THEN
    UPDATE comics SET likes_count = (SELECT COUNT(*) FROM comic_likes WHERE comic_id = COALESCE(NEW.comic_id, OLD.comic_id))
    WHERE id = COALESCE(NEW.comic_id, OLD.comic_id);
  ELSIF TG_TABLE_NAME = 'bookmarks' THEN
    UPDATE comics SET bookmarks_count = (SELECT COUNT(*) FROM bookmarks WHERE comic_id = COALESCE(NEW.comic_id, OLD.comic_id))
    WHERE id = COALESCE(NEW.comic_id, OLD.comic_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change AFTER INSERT OR DELETE ON comic_likes FOR EACH ROW EXECUTE FUNCTION update_comic_counts();
CREATE TRIGGER on_bookmark_change AFTER INSERT OR DELETE ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_comic_counts();

-- ============================================================
-- GÉNEROS INICIALES
-- ============================================================
INSERT INTO genres (name, slug, color) VALUES
  ('Acción', 'accion', '#ef4444'),
  ('Aventura', 'aventura', '#f97316'),
  ('Comedia', 'comedia', '#eab308'),
  ('Drama', 'drama', '#6366f1'),
  ('Fantasía', 'fantasia', '#8b5cf6'),
  ('Horror', 'horror', '#1f2937'),
  ('Misterio', 'misterio', '#0891b2'),
  ('Romance', 'romance', '#ec4899'),
  ('Sci-Fi', 'sci-fi', '#06b6d4'),
  ('Slice of Life', 'slice-of-life', '#22c55e'),
  ('Sobrenatural', 'sobrenatural', '#7c3aed'),
  ('Deportes', 'deportes', '#16a34a'),
  ('Histórico', 'historico', '#92400e'),
  ('Psicológico', 'psicologico', '#9f1239'),
  ('Ecchi', 'ecchi', '#db2777'),
  ('Mecha', 'mecha', '#475569'),
  ('Isekai', 'isekai', '#4f46e5'),
  ('Shounen', 'shounen', '#2563eb'),
  ('Shoujo', 'shoujo', '#db2777'),
  ('Seinen', 'seinen', '#1e40af')
ON CONFLICT (slug) DO NOTHING;
