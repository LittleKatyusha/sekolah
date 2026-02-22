import axios from 'axios'
import useAuthStore from '../store/useAuthStore'

// Create axios instance with default config
const baseURL = import.meta.env.DEV
  ? '/api/v1'
  : (import.meta.env.VITE_API_BASE_URL || '/api/v1')

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple token refresh attempts
let isRefreshing = false
let failedQueue = []

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
const refreshToken = async () => {
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
    return response
  },
  async (error) => {
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
        window.location.href = '/login'
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
          console.error('Access forbidden:', data.message || data)
          break
        case 404:
          console.error('Resource not found:', data.message || data)
          break
        case 422:
          // Validation error - return the errors for form handling
          console.error('Validation error:', data.errors || data.message)
          break
        case 500:
          console.error('Server error:', data.message || data)
          break
        default:
          console.error('API Error:', data.message || data)
      }
    } else if (error.request) {
      // Network error
      console.error('Network error: Unable to connect to server')
    } else {
      console.error('Error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Sanitize input to prevent XSS
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
