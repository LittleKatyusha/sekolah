import axios from 'axios'
import useAuthStore from '../store/useAuthStore'
import useNavigationProgressStore from '../store/useNavigationProgressStore'
import { showToast } from './sweetalert'

const API_PATH = '/api/v1'
const TENANT_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i

const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

export const getTenantFromHostname = (hostname) => {
  const [tenant] = String(hostname || '').toLowerCase().split('.')
  return String(hostname || '').includes('.') && TENANT_LABEL.test(tenant) && tenant !== 'www' ? tenant : null
}

export const resolveApiBaseUrl = ({ dev, hostname, baseUrl, pattern }) => {
  if (dev) return API_PATH

  if (pattern) {
    const tenant = getTenantFromHostname(hostname)
    if (!tenant || !pattern.includes('{subdomain}')) return API_PATH

    try {
      const url = new URL(pattern.replaceAll('{subdomain}', tenant))
      return url.protocol === 'https:' ? trimTrailingSlash(url.toString()) : API_PATH
    } catch {
      return API_PATH
    }
  }

  if (!baseUrl) return API_PATH
  if (baseUrl.startsWith('/')) return trimTrailingSlash(baseUrl)

  try {
    const url = new URL(baseUrl)
    return trimTrailingSlash(url.toString())
  } catch {
    return API_PATH
  }
}

// Derive base URL from a validated tenant subdomain in production, or use proxy in dev.
// Production patterns (set one in .env.production):
//   VITE_API_BASE_URL_PATTERN=https://{subdomain}.api.sekolah.app/api/v1
//   VITE_API_BASE_URL=https://api.sekolah.app/api/v1   ← explicit override
// Dev: all requests go through Vite proxy `/api` → VITE_API_PROXY_TARGET.
export const getBaseURL = () => {
  return resolveApiBaseUrl({
    dev: import.meta.env.DEV,
    hostname: window.location.hostname,
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    pattern: import.meta.env.VITE_API_BASE_URL_PATTERN,
  })
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

  if (response.data?.success && response.data?.data?.access_token) {
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
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh')
    const isLoginRequest = originalRequest?.url?.includes('/auth/login')

    if (error.response?.status === 401 && originalRequest && !isRefreshRequest && !isLoginRequest && !originalRequest._retry) {
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
        endTrackedRequest()
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
          break
        case 422:
          // Validation error - return the errors for form handling
          break
      }
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
      return { data: null, error: error.response ? { ...error.response.data, status: error.response.status } : error.message }
    }
  },

  // POST request
  post: async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response ? { ...error.response.data, status: error.response.status } : error.message }
    }
  },

  // PUT request
  put: async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response ? { ...error.response.data, status: error.response.status } : error.message }
    }
  },

  // PATCH request
  patch: async (url, data, config = {}) => {
    try {
      const response = await api.patch(url, data, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response ? { ...error.response.data, status: error.response.status } : error.message }
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response ? { ...error.response.data, status: error.response.status } : error.message }
    }
  },
}

export default api
