import { useCallback, useMemo } from 'react'
import useAuthStore from '../store/useAuthStore'

/**
 * Check if a user object has a specific permission.
 * Admin role always has all permissions.
 * Pure function — no `this` dependency.
 */
const checkPermission = (user, code) => {
  if (!code) return true
  // SUPER_ADMIN always has full access
  if (user?.role?.toUpperCase() === 'SUPER_ADMIN') return true
  const perms = user?.permissions
  if (!Array.isArray(perms)) return false
  return perms.some((p) =>
    typeof p === 'string' ? p === code : p?.code === code
  )
}

/**
 * Custom hook for checking user permissions.
 *
 * @returns {{ hasPermission, hasAnyPermission, hasAllPermissions, permissions }}
 */
const usePermission = () => {
  const user = useAuthStore((state) => state.user)

  const permissions = useMemo(() => user?.permissions || [], [user?.permissions])

  const hasPermission = useCallback(
    (code) => checkPermission(user, code),
    [user]
  )

  const hasAnyPermission = useCallback(
    (codes) => {
      if (!Array.isArray(codes) || codes.length === 0) return true
      return codes.some((code) => checkPermission(user, code))
    },
    [user]
  )

  const hasAllPermissions = useCallback(
    (codes) => {
      if (!Array.isArray(codes) || codes.length === 0) return true
      return codes.every((code) => checkPermission(user, code))
    },
    [user]
  )

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions }
}

export default usePermission
