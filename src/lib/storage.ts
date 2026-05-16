'use client'

import { createClient } from '@/lib/supabase/client'
import type { UploadPageResult } from '@/types'

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public'

// ============================================================
// SUBIDA DE PÁGINAS DE CÓMICS
// ============================================================

export interface UploadProgress {
  file: File
  pageNumber: number
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: UploadPageResult
}

/**
 * Sube una página de cómic al storage.
 * La ruta en el bucket: {userId}/{comicId}/{chapterId}/page_{pageNumber}.{ext}
 */
export async function uploadComicPage(
  file: File,
  comicId: string,
  chapterId: string,
  pageNumber: number,
  onProgress?: (progress: number) => void
): Promise<UploadPageResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${user.id}/${comicId}/${chapterId}/page_${String(pageNumber).padStart(4, '0')}.${ext}`

  // Supabase no soporta progress nativo, simulamos con XHR
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('', file)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = async () => {
      if (xhr.status === 200 || xhr.status === 201) {
        // Upload vía SDK para simplicidad y RLS
        const { error } = await supabase.storage
          .from('comic-pages')
          .upload(fileName, file, { upsert: true, contentType: file.type })

        if (error) { reject(error); return }
        resolve(`${STORAGE_URL}/comic-pages/${fileName}`)
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))

    // Usamos SDK directamente (más simple y respeta RLS)
    supabase.storage.from('comic-pages')
      .upload(fileName, file, { upsert: true, contentType: file.type })
      .then(({ error }) => {
        if (error) { reject(error); return }
        if (onProgress) onProgress(100)
        resolve(`${STORAGE_URL}/comic-pages/${fileName}`)
      })
      .catch(reject)
  })

  // Obtener dimensiones de la imagen
  const dimensions = await getImageDimensions(file)

  return {
    page_number: pageNumber,
    image_url: imageUrl,
    image_width: dimensions?.width,
    image_height: dimensions?.height,
    file_size_bytes: file.size,
  }
}

/**
 * Sube múltiples páginas en paralelo (con límite de concurrencia)
 */
export async function uploadMultiplePages(
  files: File[],
  comicId: string,
  chapterId: string,
  startPageNumber = 1,
  onProgress?: (updates: UploadProgress[]) => void,
  concurrency = 3
): Promise<UploadPageResult[]> {
  const progresses: UploadProgress[] = files.map((file, i) => ({
    file,
    pageNumber: startPageNumber + i,
    progress: 0,
    status: 'pending',
  }))

  if (onProgress) onProgress([...progresses])

  const results: UploadPageResult[] = []

  // Procesar en lotes de `concurrency`
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (file, batchIndex) => {
        const index = i + batchIndex
        const pageNumber = startPageNumber + index

        progresses[index].status = 'uploading'
        if (onProgress) onProgress([...progresses])

        try {
          const result = await uploadComicPage(
            file, comicId, chapterId, pageNumber,
            (progress) => {
              progresses[index].progress = progress
              if (onProgress) onProgress([...progresses])
            }
          )
          progresses[index].status = 'done'
          progresses[index].progress = 100
          progresses[index].result = result
          if (onProgress) onProgress([...progresses])
          return result
        } catch (error) {
          progresses[index].status = 'error'
          progresses[index].error = error instanceof Error ? error.message : 'Error desconocido'
          if (onProgress) onProgress([...progresses])
          throw error
        }
      })
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Sube una portada de cómic
 */
export async function uploadComicCover(
  file: File,
  comicId: string,
  type: 'cover' | 'banner' = 'cover'
): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${user.id}/${comicId}/${type}.${ext}`

  const { error } = await supabase.storage
    .from('comic-covers')
    .upload(fileName, file, { upsert: true, contentType: file.type })

  if (error) throw error

  return `${STORAGE_URL}/comic-covers/${fileName}`
}

/**
 * Sube un avatar de usuario
 */
export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${user.id}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType: file.type })

  if (error) throw error

  return `${STORAGE_URL}/avatars/${fileName}`
}

// ============================================================
// UTILIDADES
// ============================================================

function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(null); return }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

/**
 * Valida que un archivo es una imagen aceptada
 */
export function validateImageFile(file: File, maxMB = 10): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return `Formato no soportado. Usa: JPG, PNG, WebP o GIF`
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Archivo muy grande. Máximo ${maxMB}MB`
  }
  return null
}

/**
 * Genera un slug URL-safe desde un título
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
