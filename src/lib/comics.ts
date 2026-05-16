import { createClient } from '@/lib/supabase/server'
import type { Comic, ComicFilters, PaginatedResult, Chapter, ChapterPage } from '@/types'

// ============================================================
// LISTADOS DE CÓMICS
// ============================================================

export async function getComics(filters: ComicFilters = {}): Promise<PaginatedResult<Comic>> {
  const supabase = createClient()
  const {
    type, status, genre_slug, search,
    sort = 'newest', page = 1, pageSize = 20
  } = filters

  let query = supabase
    .from('comics')
    .select(`
      *,
      author:profiles!author_id(id, username, display_name, avatar_url, is_verified),
      genres:comic_genres(genre:genres(*))
    `, { count: 'exact' })
    .eq('is_published', true)

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (search) query = query.textSearch('title', search)
  if (genre_slug) {
    query = query.contains('genres', [{ genre: { slug: genre_slug } }])
  }

  switch (sort) {
    case 'views':   query = query.order('views_count', { ascending: false }); break
    case 'likes':   query = query.order('likes_count', { ascending: false }); break
    case 'rating':  query = query.order('rating_average', { ascending: false }); break
    case 'updated': query = query.order('updated_at', { ascending: false }); break
    default:        query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching comics:', error)
    return { data: [], count: 0, page, pageSize, totalPages: 0 }
  }

  // Normalizar géneros (Supabase devuelve anidado)
  const normalized = (data || []).map(c => ({
    ...c,
    genres: c.genres?.map((g: any) => g.genre) || []
  })) as Comic[]

  return {
    data: normalized,
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

export async function getTrendingComics(limit = 10): Promise<Comic[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('comics')
    .select(`*, author:profiles!author_id(id, username, display_name, avatar_url, is_verified)`)
    .eq('is_published', true)
    .order('views_count', { ascending: false })
    .limit(limit)

  return (data || []) as Comic[]
}

export async function getNewComics(limit = 12): Promise<Comic[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('comics')
    .select(`*, author:profiles!author_id(id, username, display_name, avatar_url, is_verified)`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data || []) as Comic[]
}

export async function getComicBySlug(slug: string): Promise<Comic | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('comics')
    .select(`
      *,
      author:profiles!author_id(*),
      genres:comic_genres(genre:genres(*))
    `)
    .eq('slug', slug)
    .single()

  if (!data) return null

  return {
    ...data,
    genres: data.genres?.map((g: any) => g.genre) || []
  } as Comic
}

// ============================================================
// CAPÍTULOS
// ============================================================

export async function getChaptersByComicId(comicId: string): Promise<Chapter[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('chapters')
    .select('*')
    .eq('comic_id', comicId)
    .eq('is_published', true)
    .order('chapter_number', { ascending: false })

  return (data || []) as Chapter[]
}

export async function getChapterPages(chapterId: string): Promise<ChapterPage[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('chapter_pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true })

  return (data || []) as ChapterPage[]
}

// ============================================================
// CÓMICS DEL CREADOR (autenticado)
// ============================================================

export async function getMyComics(): Promise<Comic[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('comics')
    .select(`*, genres:comic_genres(genre:genres(*))`)
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  return (data || []).map(c => ({
    ...c,
    genres: c.genres?.map((g: any) => g.genre) || []
  })) as Comic[]
}

export async function getMyChapters(comicId: string): Promise<Chapter[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('chapters')
    .select('*')
    .eq('comic_id', comicId)
    .order('chapter_number', { ascending: false })

  return (data || []) as Chapter[]
}
