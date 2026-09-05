import { useMemo } from 'react'
import useAuthStore from '../../store/useAuthStore'
import usePermission, { isSuperAdminUser } from '../../hooks/usePermission'

/**
 * Conditionally renders children based on user permissions.
 *
 * @param {Object} props
 * @param {string} [props.permission] - Single permission code (e.g., 'siswa.create')
 * @param {string[]} [props.permissions] - Multiple permission codes
 * @param {'any'|'all'} [props.mode='any'] - When using permissions array: 'any' = at least one, 'all' = all required
 * @param {boolean} [props.denySuperAdmin=false] - Hide mutations that must remain unavailable to superadmin
 * @param {React.ReactNode} [props.fallback=null] - What to render when permission check fails
 * @param {React.ReactNode} props.children - Content to render when permission check passes
 */
const PermissionGuard = ({
  permission,
  permissions,
  mode = 'any',
  denySuperAdmin = false,
  fallback = null,
  children,
}) => {
  const user = useAuthStore((state) => state.user)
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  const hasAccess = useMemo(() => {
    if (denySuperAdmin && isSuperAdminUser(user)) {
      return false
    }

    // Single permission check takes precedence
    if (permission) {
      return hasPermission(permission)
    }

    // Multiple permissions check
    if (Array.isArray(permissions) && permissions.length > 0) {
      return mode === 'all'
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)
    }

    // No permission specified — render children
    return true
  }, [permission, permissions, mode, denySuperAdmin, user, hasPermission, hasAnyPermission, hasAllPermissions])

  return hasAccess ? children : fallback
}

export default PermissionGuard
