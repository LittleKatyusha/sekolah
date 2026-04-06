import { useMemo } from 'react'
import usePermission from '../../hooks/usePermission'

/**
 * Conditionally renders children based on user permissions.
 *
 * @param {Object} props
 * @param {string} [props.permission] - Single permission code (e.g., 'siswa.create')
 * @param {string[]} [props.permissions] - Multiple permission codes
 * @param {'any'|'all'} [props.mode='any'] - When using permissions array: 'any' = at least one, 'all' = all required
 * @param {React.ReactNode} [props.fallback=null] - What to render when permission check fails
 * @param {React.ReactNode} props.children - Content to render when permission check passes
 */
const PermissionGuard = ({
  permission,
  permissions,
  mode = 'any',
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  const hasAccess = useMemo(() => {
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
  }, [permission, permissions, mode, hasPermission, hasAnyPermission, hasAllPermissions])

  return hasAccess ? children : fallback
}

export default PermissionGuard
