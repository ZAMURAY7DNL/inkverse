// ============================================================
// INKVERSE - Tipos TypeScript
// ============================================================
// Estos tipos reflejan el schema de Supabase.
// Para tipos auto-generados: npm run db:types
// ============================================================

export type ComicType = 'manga' | 'comic' | 'webcomic' | 'manhwa' | 'manhua' | 'webtoon' | 'other'
export type ComicStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
export type ReadingDirection = 'ltr' | 'rtl' | 'ttb'
export type NotificationType = 'new_chapter' | 'new_follower' | 'comment_reply' | 'comic_like' | 'system'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website_url: string | null
  twitter_handle: string | null
  is_creator: boolean
  is_verified: boolean
  followers_count: number
  following_count: number
  created_at: string
  updated_at: string
}

export interface Comic {
  id: string
  author_id: string
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  banner_url: string | null
  type: ComicType
  status: ComicStatus
  reading_direction: ReadingDirection
  is_mature: boolean
  is_published: boolean
  views_count: number
  likes_count: number
  bookmarks_count: number
  chapters_count: number
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
  // Joins
  author?: Profile
  genres?: Genre[]
  is_bookmarked?: boolean
  is_liked?: boolean
  user_rating?: number
}

export interface Genre {
  id: string
  name: string
  slug: string
  color: string
}

export interface Chapter {
  id: string
  comic_id: string
  chapter_number: number
  title: string | null
  volume: number | null
  pages_count: number
  views_count: number
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  // Joins
  comic?: Comic
}

export interface ChapterPage {
  id: string
  chapter_id: string
  page_number: number
  image_url: string
  image_width: number | null
  image_height: number | null
  file_size_bytes: number | null
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  comic_id: string | null
  chapter_id: string | null
  parent_id: string | null
  content: string
  likes_count: number
  is_edited: boolean
  created_at: string
  updated_at: string
  // Joins
  author?: Profile
  replies?: Comment[]
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  link_url: string | null
  is_read: boolean
  created_at: string
}

export interface ReadingHistory {
  id: string
  user_id: string
  comic_id: string
  chapter_id: string
  last_page: number
  completed: boolean
  read_at: string
  // Joins
  comic?: Comic
  chapter?: Chapter
}

// ============================================================
// TIPOS DE API / FORMULARIOS
// ============================================================

export interface CreateComicInput {
  title: string
  description?: string
  type: ComicType
  status: ComicStatus
  reading_direction: ReadingDirection
  is_mature: boolean
  genre_ids: string[]
}

export interface CreateChapterInput {
  comic_id: string
  chapter_number: number
  title?: string
  volume?: number
}

export interface UploadPageResult {
  page_number: number
  image_url: string
  image_width?: number
  image_height?: number
  file_size_bytes?: number
}

// ============================================================
// TIPOS PARA LISTAS / PAGINACIÓN
// ============================================================

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ComicFilters {
  type?: ComicType
  status?: ComicStatus
  genre_slug?: string
  search?: string
  sort?: 'views' | 'likes' | 'rating' | 'newest' | 'updated'
  page?: number
  pageSize?: number
}
