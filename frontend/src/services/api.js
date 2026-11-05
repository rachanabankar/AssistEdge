import axios from 'axios'
import { API_BASE_URL, AUTH_TOKEN_KEY, AUTH_AGENT_KEY } from '../config/constants'

const MULTIPART_CONFIG = {
  headers: { 'Content-Type': 'multipart/form-data' },
}

const AUTH_BYPASS_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Central axios instance - all backend REST calls go through this.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the JWT (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Basic error logging in one place instead of every call site.
// Also handles global 401s: clear stored auth and bounce to /login,
// since an expired/invalid JWT means every protected call will 401.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error?.response?.data || error.message)

    const requestUrl = error?.config?.url || ''
    const isAuthAttempt = AUTH_BYPASS_ENDPOINTS.some((endpoint) =>
      requestUrl.includes(endpoint)
    )

    if (error?.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_AGENT_KEY)
      // Full reload (not client-side navigate) so AuthContext/api client
      // state resets cleanly - simplest correct option from outside React.
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// Maps to routers/auth.py
export const authApi = {
  login: (payload) => apiClient.post('/auth/login', payload),
  signup: (payload) => apiClient.post('/auth/signup', payload),
  googleLogin: (idToken) => apiClient.post('/auth/google', { id_token: idToken }),
  forgotPassword: (identifier) => apiClient.post('/auth/forgot-password', { identifier }),
  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, new_password: newPassword }),
}

// Maps to routers/session.py
export const sessionApi = {
  create: (payload) => apiClient.post('/session/', payload),
  getById: (sessionId) => apiClient.get(`/session/${sessionId}`),
  uploadDocs: (sessionId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/session/${sessionId}/upload-docs`, formData, MULTIPART_CONFIG)
  },
  query: (sessionId, query, k = 3) =>
    apiClient.post(`/session/${sessionId}/query`, { query, k }),
}

// Maps to routers/simulate.py
export const simulateApi = {
  sendTurn: (payload) => apiClient.post('/simulate/message', payload),
}

// Maps to routers/manual.py
export const manualApi = {
  sendTurn: (payload) => apiClient.post('/manual/message', payload),
  endSession: (payload) => apiClient.post('/manual/end-session', payload),
}

// Maps to routers/session.py (list, detail, and messages endpoints)
export const replayApi = {
  listSessions: () => apiClient.get('/session/'),
  getSessionDetail: (sessionId) => apiClient.get(`/session/${sessionId}`),
  getSessionMessages: (sessionId) => apiClient.get(`/session/${sessionId}/messages`),
}

// Maps to the report endpoints on routers/session.py
export const reportApi = {
  getReport: (sessionId) => apiClient.get(`/session/${sessionId}/report`),
  generateReport: (sessionId) => apiClient.post(`/session/${sessionId}/report`),
  downloadReportPdf: (sessionId) =>
    apiClient.get(`/session/${sessionId}/report/pdf`, { responseType: 'blob' }),
}

// Maps to routers/profile.py
export const profileApi = {
  get: () => apiClient.get('/profile'),
  update: (payload) => apiClient.patch('/profile', payload),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/profile/avatar', formData, MULTIPART_CONFIG)
  },
  changePassword: (currentPassword, newPassword) =>
    apiClient.patch('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
}

// Maps to routers/support.py
export const supportApi = {
  createTicket: ({ issueType, subject, priority, screenshot }) => {
    const formData = new FormData()
    formData.append('issue_type', issueType)
    formData.append('subject', subject)
    formData.append('priority', priority)
    if (screenshot) {
      formData.append('screenshot', screenshot)
    }
    return apiClient.post('/support/tickets', formData, MULTIPART_CONFIG)
  },
}

// Maps to routers/notifications.py
export const notificationApi = {
  listRecent: (limit = 4) => apiClient.get('/notifications/', { params: { limit } }),
  listAll: () => apiClient.get('/notifications/all'),
  unreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (notificationId) => apiClient.post(`/notifications/${notificationId}/read`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read'),
  getPreferences: () => apiClient.get('/notifications/preferences'),
  updatePreferences: (payload) => apiClient.patch('/notifications/preferences', payload),
}

// Maps to routers/analytics.py
export const analyticsApi = {
  getOverview: (startDate, endDate) =>
    apiClient.get('/analytics/overview', {
      params: { start_date: startDate, end_date: endDate },
    }),
}
