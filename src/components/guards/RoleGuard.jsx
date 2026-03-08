import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'

const RoleGuard = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()
  const allowedRoleSet = useMemo(() => new Set(allowedRoles || []), [allowedRoles])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Support both numeric (1, 2, 3, 4) and string ('admin', 'guru', etc.) roles
  // Role mapping: 1 = admin, 2 = guru, 3 = staff, 4 = wali
  if (allowedRoleSet.size > 0) {
    const hasAccess = allowedRoleSet.has(user?.role)

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}

export default RoleGuard