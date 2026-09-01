import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const clearSessionCaches = () => {
  if (typeof window === 'undefined') return

  const cachePrefixes = ['sidebar-menu-cache:', 'reference-options-cache:']

  try {
    Object.keys(window.sessionStorage).forEach((key) => {
      if (cachePrefixes.some((prefix) => key.startsWith(prefix))) {
        window.sessionStorage.removeItem(key)
      }
    })
  } catch {
    // Ignore sessionStorage cleanup failures during logout.
  }
}

const isPayloadReady = (user) => {
  return Boolean(user && Array.isArray(user.permissions) && Array.isArray(user.roles))
}

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenType: 'bearer',
      expiresIn: null,
      isAuthenticated: false,
      authorizationStatus: 'unknown', // 'unknown' | 'loading' | 'ready' | 'error'

      login: (loginData) => {
        clearSessionCaches()
        const user = loginData.user
        const ready = isPayloadReady(user)
        set({
          user: user,
          token: loginData.access_token,
          refreshToken: loginData.refresh_token,
          tokenType: loginData.token_type || 'bearer',
          expiresIn: loginData.expires_in,
          isAuthenticated: true,
          authorizationStatus: ready ? 'ready' : 'loading',
        })
      },

      logout: () => {
        clearSessionCaches()
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenType: 'bearer',
          expiresIn: null,
          isAuthenticated: false,
          authorizationStatus: 'unknown',
        })
      },

      updateUser: (userData) => {
        set((state) => {
          const nextUser = { ...state.user, ...userData }
          const ready = isPayloadReady(nextUser)
          // Invalidate cached menus if permissions, roles, or school tenant context mutated
          if (
            userData.permissions !== undefined ||
            userData.roles !== undefined ||
            userData.role !== undefined ||
            userData.mst_sekolah_id !== undefined
          ) {
            clearSessionCaches()
          }
          return {
            user: nextUser,
            authorizationStatus: ready ? 'ready' : state.authorizationStatus,
          }
        })
      },

      setToken: (accessToken, refreshToken) => {
        set({
          token: accessToken,
          refreshToken: refreshToken,
        })
      },

      setAuthorizationStatus: (status) => {
        set({ authorizationStatus: status })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        // Access token is NOT persisted (in-memory only) to reduce XSS exposure.
        // Refresh token is persisted to enable silent re-authentication after page reload.
        // For maximum security, migrate refresh token to an httpOnly cookie on the backend.
        refreshToken: state.refreshToken,
        tokenType: state.tokenType,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
