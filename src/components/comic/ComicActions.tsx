'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ComicActionsProps {
  comicId: string
  initialBookmarked: boolean
  initialLiked: boolean
  initialLikesCount: number
  initialBookmarksCount: number
}

export function ComicActions({
  comicId,
  initialBookmarked,
  initialLiked,
  initialLikesCount,
  initialBookmarksCount,
}: ComicActionsProps) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [bookmarksCount, setBookmarksCount] = useState(initialBookmarksCount)
  const [loadingBookmark, setLoadingBookmark] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)

  const handleBookmark = async () => {
    setLoadingBookmark(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comic_id: comicId }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (res.ok) {
        const data = await res.json()
        setBookmarked(data.bookmarked)
        setBookmarksCount(prev => data.bookmarked ? prev + 1 : prev - 1)
      }
    } finally {
      setLoadingBookmark(false)
    }
  }

  const handleLike = async () => {
    setLoadingLike(true)
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comic_id: comicId }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1)
      }
    } finally {
      setLoadingLike(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={loadingLike}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
          liked
            ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
            : 'border-white/10 bg-dark-card text-gray-400 hover:text-red-400 hover:border-red-500/30'
        }`}
      >
        <span>{liked ? '♥' : '♡'}</span>
        <span>{likesCount.toLocaleString()}</span>
      </button>

      <button
        onClick={handleBookmark}
        disabled={loadingBookmark}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
          bookmarked
            ? 'border-ink-500/40 bg-ink-500/10 text-ink-300 hover:bg-ink-500/20'
            : 'border-white/10 bg-dark-card text-gray-400 hover:text-ink-300 hover:border-ink-500/30'
        }`}
      >
        <span>{bookmarked ? '📖' : '📄'}</span>
        <span>{bookmarked ? 'Guardado' : 'Guardar'}</span>
      </button>
    </div>
  )
}
