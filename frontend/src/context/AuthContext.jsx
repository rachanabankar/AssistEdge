import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { authApi, profileApi } from '../services/api'
import { AUTH_TOKEN_KEY, AUTH_AGENT_KEY } from '../config/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [agent, setAgent] = useState(null)
  // True while we're reading localStorage on first mount, so consumers
  // (e.g. ProtectedRoute) don't redirect to /login before we've checked.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedAgent = localStorage.getItem(AUTH_AGENT_KEY)

    if (storedToken && storedAgent) {
      try {
        setToken(storedToken)
        setAgent(JSON.parse(storedAgent))
      } catch {
        // Corrupt/unparseable agent JSON - treat as logged out.
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_AGENT_KEY)
      }
    }

    setLoading(false)
  }, [])

  const persistAuth = useCallback(({ access_token, agent: agentData }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, access_token)
    localStorage.setItem(AUTH_AGENT_KEY, JSON.stringify(agentData))
    setToken(access_token)
    setAgent(agentData)
  }, [])

  // Updates agent in state + localStorage without touching the token -
  // used after a successful PATCH /profile so My Profile reflects the
  // save immediately, without requiring a re-login.
  const updateAgent = useCallback((updatedAgent) => {
    localStorage.setItem(AUTH_AGENT_KEY, JSON.stringify(updatedAgent))
    setAgent(updatedAgent)
  }, [])

  // Non-fatal profile fetch. The token is already saved by this point,
  // so a profile failure must not surface as a false "sign-in failed" error.
  // The agent returned by the auth endpoint stays in place as a fallback.
  const loadFullProfile = useCallback(async () => {
    try {
      const fullProfile = await profileApi.get()
      updateAgent(fullProfile.data)
    } catch (err) {
      console.warn('Could not load full profile; using basic agent info.', err)
    }
  }, [updateAgent])

  const login = useCallback(async ({ username, password }) => {
    const { data } = await authApi.login({ username, password })
    persistAuth(data)
    await loadFullProfile()
    return data
  }, [persistAuth, loadFullProfile])

  const signup = useCallback(async ({ username, password }) => {
    const { data } = await authApi.signup({ username, password })
    persistAuth(data)
    await loadFullProfile()
    return data
  }, [persistAuth, loadFullProfile])

  // idToken is the credential JWT handed back by Google Identity Services
  // on the frontend (see Login.jsx) — verified server-side in routers/auth.py.
  const googleLogin = useCallback(async (idToken) => {
    const { data } = await authApi.googleLogin(idToken)
    persistAuth(data)
    await loadFullProfile()
    return data
  }, [persistAuth, loadFullProfile])

  const updateToken = useCallback((newToken) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_AGENT_KEY)
    setToken(null)
    setAgent(null)
  }, [])

  const value = useMemo(() => ({
    token,
    agent,
    isAuthenticated: !!token,
    loading,
    login,
    signup,
    googleLogin,
    logout,
    updateAgent,
    updateToken,
  }), [token, agent, loading, login, signup, googleLogin, logout, updateAgent, updateToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
