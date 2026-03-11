import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { refreshToken as doRefresh } from '../utils/api'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, refreshToken } = useAuthStore()
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
