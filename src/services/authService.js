import { apiService } from '../utils/api'
import useAuthStore from '../store/useAuthStore'
import { deleteFcmToken } from './fcmService'

const BASE_URL = '/auth'

export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data: any, error: any}>}
   */
  login: async (email, password) => {
    const response = await apiService.post(`${BASE_URL}/login`, {
      email,
      password,
    })

    if (response.data?.success) {
      const { data } = response.data
      // Store user data and tokens in auth store
      useAuthStore.getState().login({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      })
    }

    return response
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.password_confirmation - Password confirmation
   * @param {string} [userData.role] - User role (default: guru)
   * @returns {Promise<{data: any, error: any}>}
   */
  register: async ({ name, email, password, password_confirmation, role = 'guru' }) => {
    return await apiService.post(`${BASE_URL}/register`, {
      name,
      email,
      password,
      password_confirmation,
      role,
    })
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<{data: any, error: any}>}
   */
  refreshToken: async () => {
    const { refreshToken } = useAuthStore.getState()

    if (!refreshToken) {
      return { data: null, error: { message: 'No refresh token available' } }
    }

    const response = await apiService.post(`${BASE_URL}/refresh`, {
      refresh_token: refreshToken,
    })

    if (response.data?.success) {
      const { data } = response.data
      useAuthStore.getState().setToken(data.access_token, data.refresh_token)
    }

    return response
  },

  /**
   * Logout the current user
   * @returns {Promise<{data: any, error: any}>}
   */
  logout: async () => {
    try {
      const response = await apiService.post(`${BASE_URL}/logout`)
      return response
    } catch (error) {
      // Even if API call fails, we should clear local state
      return { data: null, error: null }
    } finally {
      // Best-effort: remove FCM token before clearing auth state.
      try { await deleteFcmToken() } catch { /* ignore */ }
      // Always clear auth state on logout
      useAuthStore.getState().logout()
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<{data: any, error: any}>}
   */
  me: async () => {
    const response = await apiService.get(`${BASE_URL}/me`)

    if (response.data?.success) {
      const { data } = response.data
      useAuthStore.getState().updateUser(data)
    }

    return response
  },
}

export default authService