import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { refreshToken as doRefresh } from '../utils/api'
import authService from '../services/authService'

const needsProfileHydration = (user) => {
  if (!user?.role) return false

  const profile = user.profile || {}

  if (user.role === 'guru') {
    return !profile.id && !profile.mst_guru_id
  }

  if (user.role === 'siswa') {
    return !profile.id && !profile.mst_siswa_id
  }

  if (user.role === 'wali') {
    return !profile.nama
  }

  return false
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, refreshToken, user } = useAuthStore()
  const [initializing, setInitializing] = useState(isAuthenticated && !token)

  useEffect(() => {
    if (!isAuthenticated || token) {
      setInitializing(false)
      return
    }

    // Access token is gone (page reload) but we have a refresh token — do a silent refresh.
    if (!refreshToken) {
      useAuthStore.getState().logout()
      setInitializing(false)
      return
    }

    doRefresh()
      .catch(() => { useAuthStore.getState().logout() })
      .finally(() => { setInitializing(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guard against repeated hydration calls: only call me() once per session.
  // Without this, every store update that changes `user` would re-trigger the
  // effect while needsProfileHydration() is still true, creating a render loop.
  const hydrationAttempted = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !token || !needsProfileHydration(user)) return
    if (hydrationAttempted.current) return
    hydrationAttempted.current = true
    authService.me().catch(() => {
      // Ignore hydration failures here; route access is controlled by auth state.
    })
  }, [isAuthenticated, token, user])

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
