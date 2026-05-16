'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  followingId: string
  initialFollowing: boolean
}

export function FollowButton({ followingId, initialFollowing }: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleFollow = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: followingId }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-sm font-medium transition-all ${
        following
          ? 'border-ink-500/40 bg-ink-500/10 text-ink-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
          : 'border-ink-500 bg-ink-500 text-white hover:bg-ink-400'
      }`}
    >
      {loading ? '...' : following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
