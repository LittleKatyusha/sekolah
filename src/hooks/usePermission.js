import { useMemo } from 'react'
import useAuthStore from '../store/useAuthStore'

/**
 * Hook for checking user permissions based on backend role-permission system.
 *
 * Permission codes follow the pattern: `resource.action`
 * e.g. `guru.view`, `guru.create`, `guru.update`, `guru.delete`
 *
 * Resources that use a single "manage" permission (instead of separate create/update/delete)
 * are automatically handled: checking `resource.create` will also pass if the user has
 * `resource.manage`.
 *
 * @returns {{ can: (permission: string) => boolean, permissions: Set<string> }}
 */
const usePermission = () => {
  const { user } = useAuthStore()

  const permissions = useMemo(() => {
    if (!user?.roles || !Array.isArray(user.roles)) return new Set()
    const perms = new Set()
    user.roles.forEach((role) => {
      if (Array.isArray(role.permissions)) {
        role.permissions.forEach((perm) => perms.add(perm.code))
      }
    })
    return perms
  }, [user])

  /**
   * Check if the current user has a given permission.
   *
   * Falls back to `resource.manage` when checking `resource.create`,
   * `resource.update`, or `resource.delete` — covering backends that use a
   * single manage permission instead of granular CRUD permissions.
   *
   * @param {string} permission - Permission code, e.g. `'guru.update'`
   * @returns {boolean}
   */
  const can = (permission) => {
    if (!permission) return false
    if (permissions.has(permission)) return true

    // Fallback: check the "manage" variant for create/update/delete actions
    const parts = permission.split('.')
    if (parts.length >= 2) {
      const action = parts[parts.length - 1]
      if (['create', 'update', 'delete'].includes(action)) {
        const resource = parts.slice(0, -1).join('.')
        return permissions.has(`${resource}.manage`)
      }
    }

    return false
  }

  return { can, permissions }
}

export default usePermission
