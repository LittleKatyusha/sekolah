import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const clearSessionCaches = () => {
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

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenType: 'bearer',
      expiresIn: null,
      isAuthenticated: false,

      login: (loginData) => {
        set({
          user: loginData.user,
          token: loginData.access_token,
          refreshToken: loginData.refresh_token,
          tokenType: loginData.token_type || 'bearer',
          expiresIn: loginData.expires_in,
          isAuthenticated: true,
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
        })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },

      setToken: (accessToken, refreshToken) => {
        set({
          token: accessToken,
          refreshToken: refreshToken,
        })
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
