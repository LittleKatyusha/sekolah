import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import { canAccessPath } from '../../utils/routeAccess'

const RouteAccessGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  return canAccessPath(user, location.pathname)
    ? children
    : <Navigate to="/unauthorized" replace />
}

export default RouteAccessGuard
