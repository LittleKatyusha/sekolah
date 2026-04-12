import axios from 'axios'
import useAuthStore from '../store/useAuthStore'
import useNavigationProgressStore from '../store/useNavigationProgressStore'
import { showToast } from './sweetalert'

// Derive base URL from subdomain at runtime (production) or use proxy (dev).
// Production patterns (set one in .env.production):
//   VITE_API_BASE_URL_PATTERN=https://{subdomain}.api.sekolah.app/api/v1
//   VITE_API_BASE_URL=https://api.sekolah.app/api/v1   ← explicit override
// Dev: all requests go through Vite proxy `/api` → VITE_API_PROXY_TARGET.
const getBaseURL = () => {
  if (import.meta.env.DEV) return '/api/v1'

  const pattern = import.meta.env.VITE_API_BASE_URL_PATTERN
  if (pattern) {
    const subdomain = window.location.hostname.split('.')[0]
    return pattern.replace('{subdomain}', subdomain).replace(/\/$/, '')
  }

  return (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
}

const baseURL = getBaseURL()

const api = axios.create({
  baseURL,
  withCredentials: false, // We use token-based auth, so no cookies
  timeout: 30000, // 30 seconds timeout for all requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Flag to prevent multiple token refresh attempts
let isRefreshing = false
let failedQueue = []
let authExpiredHandler = null

const beginTrackedRequest = () => {
  useNavigationProgressStore.getState().beginRequest()
}

const endTrackedRequest = () => {
  useNavigationProgressStore.getState().endRequest()
}

// Process queue of failed requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Token refresh function
export const setAuthExpiredHandler = (handler) => {
  authExpiredHandler = typeof handler === 'function' ? handler : null
}

const notifyAuthExpired = () => {
  authExpiredHandler?.()
}
export const refreshToken = async () => {
  const { refreshToken: refreshTokenValue } = useAuthStore.getState()
  
  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }

  const response = await api.post('/auth/refresh', {
    refresh_token: refreshTokenValue,
  })

  if (response.data.success) {
    const { access_token, refresh_token, expires_in } = response.data.data
    useAuthStore.getState().setToken(access_token, refresh_token)
    return access_token
  }

  throw new Error('Token refresh failed')
}

// Request interceptor - Add auth token and CSRF token
api.interceptors.request.use(
  (config) => {
    const { isVisible, pendingNavigation } = useNavigationProgressStore.getState()
    config.__navigationProgressTracked = isVisible || pendingNavigation

    if (config.__navigationProgressTracked) {
      beginTrackedRequest()
    }

    const { token } = useAuthStore.getState()
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token if available (for production)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally with token refresh
api.interceptors.response.use(
  (response) => {
    if (response.config?.__navigationProgressTracked) {
      endTrackedRequest()
    }
    return response
  },
  async (error) => {
    if (error.config?.__navigationProgressTracked) {
      endTrackedRequest()
    }

    const originalRequest = error.config

    // Handle 401 - Unauthorized (try to refresh token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshToken()
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Token refresh failed - logout user
        useAuthStore.getState().logout()
        notifyAuthExpired()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle other error status codes
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 403:
          showToast(data.message || 'Anda tidak memiliki izin untuk melakukan aksi ini.', 'error')
          if (import.meta.env.DEV) console.error('Access forbidden:', data.message || data)
          break
        case 404:
          if (import.meta.env.DEV) console.error('Resource not found:', data.message || data)
          break
        case 422:
          // Validation error - return the errors for form handling
          if (import.meta.env.DEV) console.error('Validation error:', data.errors || data.message)
          break
        case 500:
          if (import.meta.env.DEV) console.error('Server error:', data.message || data)
          break
        default:
          if (import.meta.env.DEV) console.error('API Error:', data.message || data)
      }
    } else if (error.request) {
      // Network error
      if (import.meta.env.DEV) console.error('Network error: Unable to connect to server')
    } else {
      if (import.meta.env.DEV) console.error('Error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Sanitize input to prevent XSS when rendering user-supplied data back into the DOM.
// Note: This is a defense-in-depth measure for display contexts.
// Server-side validation and output encoding remain the primary XSS defenses.
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  return input
}

// API methods with error handling
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  // POST request
  post: async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  // PUT request
  put: async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  // PATCH request
  patch: async (url, data, config = {}) => {
    try {
      const response = await api.patch(url, data, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },
}

export default api
