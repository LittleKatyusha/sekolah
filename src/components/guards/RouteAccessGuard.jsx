import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import BackendUnavailable from '../BackendUnavailable'
import { canAccessPath, isBackendAvailablePath } from '../../utils/routeAccess'

const RouteAccessGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!isBackendAvailablePath(location.pathname)) return <BackendUnavailable />

  return canAccessPath(user, location.pathname) ? children : <Navigate to="/unauthorized" replace />
}

export default RouteAccessGuard
