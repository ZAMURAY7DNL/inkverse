-- ============================================================
-- INKVERSE - Configuración de Storage
-- ============================================================
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- ============================================================

-- Bucket para páginas de cómics (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comic-pages',
  'comic-pages',
  true,
  10485760, -- 10MB máximo por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de usuario (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para portadas de cómics (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comic-covers',
  'comic-covers',
  true,
  5242880, -- 5MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POLÍTICAS DE STORAGE
-- ============================================================

-- comic-pages: Lectura pública, escritura solo propietario
CREATE POLICY "Comic pages son públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'comic-pages');

CREATE POLICY "Creadores suben páginas" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comic-pages' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Creadores eliminan sus páginas" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'comic-pages' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- comic-covers: Lectura pública, escritura solo propietario
CREATE POLICY "Portadas son públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'comic-covers');

CREATE POLICY "Creadores suben portadas" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comic-covers' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- avatars: Lectura pública, cada usuario su propio avatar
CREATE POLICY "Avatares son públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Usuario sube su avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuario actualiza su avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );
