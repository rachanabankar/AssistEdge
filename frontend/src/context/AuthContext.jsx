import axios from 'axios'
import { createContext, useContext, useState, useEffect } from 'react'
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


const login = async ({ username, password }) => {
  const { data } = await authApi.login({ username, password })
  persistAuth(data)
  const fullProfile = await profileApi.get()
  updateAgent(fullProfile.data)
  return data
}

const signup = async ({ username, password }) => {
  const { data } = await authApi.signup({ username, password })
  persistAuth(data)
  const fullProfile = await profileApi.get()
  updateAgent(fullProfile.data)
  return data
}

// idToken is the credential JWT handed back by Google Identity Services
// on the frontend (see Login.jsx) — verified server-side in routers/auth.py.
const googleLogin = async (idToken) => {
  const { data } = await authApi.googleLogin(idToken)
  persistAuth(data)
  const fullProfile = await profileApi.get()
  updateAgent(fullProfile.data)
  return data
}

  const persistAuth = ({ access_token, agent }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, access_token)
    localStorage.setItem(AUTH_AGENT_KEY, JSON.stringify(agent))
    setToken(access_token)
    setAgent(agent)
  }

  // Updates agent in state + localStorage without touching the token -
  // used after a successful PATCH /profile so My Profile reflects the
  // save immediately, without requiring a re-login.
  const updateAgent = (updatedAgent) => {
    localStorage.setItem(AUTH_AGENT_KEY, JSON.stringify(updatedAgent))
    setAgent(updatedAgent)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_AGENT_KEY)
    setToken(null)
    setAgent(null)
  }

  const value = {
    token,
    agent,
    isAuthenticated: !!token,
    loading,
    login,
    signup,
    googleLogin,
    logout,
    updateAgent,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}