import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearToken,
  fetchMe,
  login as apiLogin,
  register as apiRegister,
  setToken,
  type Centro,
} from '../api/centros'

interface AuthContextValue {
  centro: Centro | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string) => Promise<void>
  logout: () => void
  refreshCentro: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [centro, setCentro] = useState<Centro | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshCentro = useCallback(async () => {
    try {
      const data = await fetchMe()
      setCentro(data)
    } catch {
      clearToken()
      setCentro(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    refreshCentro().finally(() => setLoading(false))
  }, [refreshCentro])

  const login = useCallback(async (email: string, password: string) => {
    const { token, centro: data } = await apiLogin({ email, password })
    setToken(token)
    setCentro(data)
  }, [])

  const register = useCallback(
    async (email: string, password: string, nombre: string) => {
      const { token, centro: data } = await apiRegister({ email, password, nombre })
      setToken(token)
      setCentro(data)
    },
    [],
  )

  const logout = useCallback(() => {
    clearToken()
    setCentro(null)
  }, [])

  const value = useMemo(
    () => ({ centro, loading, login, register, logout, refreshCentro }),
    [centro, loading, login, register, logout, refreshCentro],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
