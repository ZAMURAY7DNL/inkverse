'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar, validateImageFile } from '@/lib/storage'
import type { Profile } from '@/types'
import Image from 'next/image'

interface ProfileSettingsProps {
  profile: Profile | null
  userEmail: string
}

export function ProfileSettings({ profile, userEmail }: ProfileSettingsProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    website_url: profile?.website_url || '',
    twitter_handle: profile?.twitter_handle || '',
  })

  const onDropAvatar = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const err = validateImageFile(file, 2)
    if (err) { setError(err); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onDropAvatar,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let avatar_url = profile?.avatar_url

      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile)
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name.trim() || null,
          username: form.username.trim().toLowerCase(),
          bio: form.bio.trim() || null,
          website_url: form.website_url.trim() || null,
          twitter_handle: form.twitter_handle.trim().replace('@', '') || null,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '')

      if (updateError) throw new Error(updateError.message)

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">✓ Perfil actualizado correctamente</div>
      )}

      {/* Avatar */}
      <div className="rounded-lg border border-white/5 bg-dark-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Foto de Perfil</h2>
        <div className="flex items-center gap-5">
          <div {...getRootProps()} className="relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-white/10 hover:border-ink-500/40 transition-colors">
            <input {...getInputProps()} />
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-surface text-gray-500 text-xs text-center">+</div>
            )}
          </div>
          <div>
            <p className="text-sm text-white mb-1">Cambiar foto</p>
            <p className="text-xs text-gray-500">JPG, PNG, WebP · Máx 2MB</p>
            <p className="text-xs text-gray-500">Recomendado: 200×200px</p>
          </div>
        </div>
      </div>

      {/* Info básica */}
      <div className="rounded-lg border border-white/5 bg-dark-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Información Básica</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Nombre de usuario *</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full rounded border border-white/10 bg-dark-surface px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none"
              placeholder="mi_usuario"
              pattern="[a-zA-Z0-9_]+"
              title="Solo letras, números y guiones bajos"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Nombre a mostrar</label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="w-full rounded border border-white/10 bg-dark-surface px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none"
              placeholder="Tu nombre real o apodo"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Biografía</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            maxLength={500}
            className="w-full rounded border border-white/10 bg-dark-surface px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none resize-none"
            placeholder="Cuéntanos algo sobre ti..."
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{form.bio.length}/500</p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Email (no editable)</label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full rounded border border-white/5 bg-dark-surface/50 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Redes sociales */}
      <div className="rounded-lg border border-white/5 bg-dark-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Redes Sociales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Sitio web</label>
            <input
              type="url"
              value={form.website_url}
              onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              className="w-full rounded border border-white/10 bg-dark-surface px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none"
              placeholder="https://tu-sitio.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Twitter / X</label>
            <div className="flex">
              <span className="flex items-center px-3 text-sm text-gray-500 border border-r-0 border-white/10 bg-dark-surface rounded-l">@</span>
              <input
                type="text"
                value={form.twitter_handle}
                onChange={e => setForm(f => ({ ...f, twitter_handle: e.target.value }))}
                className="flex-1 rounded-r border border-white/10 bg-dark-surface px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-ink-500/50 focus:outline-none"
                placeholder="tu_handle"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-ink-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-ink-400 transition-colors panel-border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
