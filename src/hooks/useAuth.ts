'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  isCreator: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null, profile: null, loading: true, isCreator: false
  })

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as Profile | null
  }, [supabase])

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const profile = await fetchProfile(user.id)
        setState({ user, profile, loading: false, isCreator: profile?.is_creator ?? false })
      } else {
        setState({ user: null, profile: null, loading: false, isCreator: false })
      }
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: session.user, profile, loading: false, isCreator: profile?.is_creator ?? false })
        } else {
          setState({ user: null, profile: null, loading: false, isCreator: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  return {
    ...state,
    signInWithGoogle,
    signOut,
  }
}
