// Central place for environment-driven configuration.
// Values come from Vite env vars (see .env.example).
// Falls back to sane local-dev defaults if not set.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws'

// Interaction modes - kept as constants so components/backend payloads
// use the same string values everywhere instead of hardcoding strings.
export const INTERACTION_MODES = {
  SIMULATOR: 'simulator',
  MANUAL: 'manual',
  REPLAY: 'replay',
}

// localStorage key for the JWT issued by POST /auth/login and /auth/signup.
export const AUTH_TOKEN_KEY = 'assistedge_token'

// localStorage key for the agent object returned alongside the JWT.
export const AUTH_AGENT_KEY = 'assistedge_agent'