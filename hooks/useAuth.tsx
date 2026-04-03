import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

interface User {
  id: number
  email: string
}

interface IAuth {
  user: User | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  loading: boolean
}

const AuthContext = createContext<IAuth>({
  user: null,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
  error: null,
  loading: false,
})

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true

    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()

        if (!active) {
          return
        }

        if (response.ok && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
          if (router.pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch (fetchError) {
        if (active) {
          setUser(null)
          if (router.pathname !== '/login') {
            router.push('/login')
          }
        }
      } finally {
        if (active) {
          setLoading(false)
          setInitialLoading(false)
        }
      }
    }

    setLoading(true)
    loadCurrentUser()

    return () => {
      active = false
    }
  }, [router])

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to sign up')
      }

      setUser(data.user)
      router.push('/')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to sign up'
      setError(message)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to sign in')
      }

      setUser(data.user)
      router.push('/')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to sign in'
      setError(message)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      setUser(null)
      router.push('/login')
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to log out'
      setError(message)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const memoedValue = useMemo(
    () => ({
      user,
      signUp,
      signIn,
      loading,
      logout,
      error,
    }),
    [user, loading, error]
  )

  return (
    <AuthContext.Provider value={memoedValue}>
      {!initialLoading && children}
    </AuthContext.Provider>
  )
}

export default function useAuth() {
  return useContext(AuthContext)
}
