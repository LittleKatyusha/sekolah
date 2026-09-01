import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { refreshToken as doRefresh } from '../utils/api'
import authService from '../services/authService'

const needsProfileHydration = (user) => {
  if (!user?.role) return false

  const profile = user.profile || {}
  const role = user.role?.toUpperCase()

  if (role === 'GURU' || role === 'WALI_KELAS' || role === 'GURU_BK') {
    return !profile.id && !profile.mst_guru_id
  }

  if (role === 'SISWA') {
    return !profile.id && !profile.mst_siswa_id
  }

  if (role === 'WALI_SISWA') {
    return !profile.nama
  }

  return false
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, refreshToken, user, authorizationStatus } = useAuthStore()
  const [initializing, setInitializing] = useState(isAuthenticated && !token)

  useEffect(() => {
    if (!isAuthenticated) {
      setInitializing(false)
      return
    }

    if (token) {
      setInitializing(false)
      // On session restore or existing token, hydrate user permission contract if not yet ready
      if (authorizationStatus !== 'ready') {
        useAuthStore.getState().setAuthorizationStatus('loading')
        authService.me().catch((err) => {
          const status = err?.response?.status || err?.status
          if (status === 401) {
            useAuthStore.getState().logout()
          } else {
            useAuthStore.getState().setAuthorizationStatus('error')
          }
        })
      }
      return
    }

    // Access token is gone (page reload) but we have a refresh token — do a silent refresh.
    if (!refreshToken) {
      useAuthStore.getState().logout()
      setInitializing(false)
      return
    }

    useAuthStore.getState().setAuthorizationStatus('loading')
    doRefresh()
      .then(() => {
        return authService.me()
      })
      .catch((err) => {
        const status = err?.response?.status || err?.status
        if (status === 401) {
          useAuthStore.getState().logout()
        } else {
          useAuthStore.getState().setAuthorizationStatus('error')
        }
      })
      .finally(() => {
        setInitializing(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guard against repeated hydration calls for profiles: only call me() if profile is missing and authorization is already ready
  const hydrationAttempted = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !token || authorizationStatus !== 'ready' || !needsProfileHydration(user)) return
    if (hydrationAttempted.current) return
    hydrationAttempted.current = true
    authService.me().catch(() => {
      // Handled in general hydration
    })
  }, [isAuthenticated, token, authorizationStatus, user])

  if (initializing || (isAuthenticated && authorizationStatus === 'loading')) {
    return (
      <div className="flex items-center justify-center h-screen" data-testid="auth-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (authorizationStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center" data-testid="auth-error">
        <div className="max-w-md bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Gagal Memuat Izin Akses</h2>
          <p className="text-sm text-gray-600 mb-4">Terjadi kesalahan saat memvalidasi otorisasi akun Anda. Silakan coba lagi atau login ulang.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                useAuthStore.getState().setAuthorizationStatus('loading')
                authService.me().catch((err) => {
                  const status = err?.response?.status || err?.status
                  if (status === 401) {
                    useAuthStore.getState().logout()
                  } else {
                    useAuthStore.getState().setAuthorizationStatus('error')
                  }
                })
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (authorizationStatus !== 'ready') {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
