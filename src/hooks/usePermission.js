import { useCallback, useMemo } from 'react'
import useAuthStore from '../store/useAuthStore'

/**
 * Check if a user is superadmin (either role string, role object, or in roles array)
 */
export const isSuperAdminUser = (user) => {
  if (!user) return false
  const roleStr = typeof user.role === 'string' ? user.role : user.role?.code || user.role?.name
  if (roleStr && ['superadmin', 'super_admin', 'super_administrator'].includes(roleStr.toLowerCase())) {
    return true
  }
  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      const code = typeof r === 'string' ? r : r?.code || r?.name
      return code && ['superadmin', 'super_admin', 'super_administrator'].includes(String(code).toLowerCase())
    })
  }
  return false
}

/**
 * Flatten permissions from top-level user.permissions or nested roles[].permissions.
 */
export const resolvePermissions = (user) => {
  if (Array.isArray(user?.permissions)) {
    return user.permissions
  }

  if (Array.isArray(user?.roles)) {
    return user.roles.flatMap((role) =>
      Array.isArray(role?.permissions) ? role.permissions : []
    )
  }

  return []
}
/**
 * Flatten and extract sorted permission codes from user object.
 */
export const getSortedPermissionCodes = (user) => {
  if (!user) return []
  const perms = resolvePermissions(user)
  const codes = perms
    .map((p) => (typeof p === 'string' ? p : p?.code))
    .filter(Boolean)
  return Array.from(new Set(codes)).sort()
}

/**
 * Generate a deterministic permission fingerprint string.
 * Used for cache keys and invalidation when permissions change.
 */
export const getPermissionFingerprint = (user) => {
  if (!user) return 'anon'
  const role = user?.role?.toUpperCase?.() || user?.role || ''
  const codes = getSortedPermissionCodes(user)
  return `${role}:${codes.join(',')}`
}


/**
 * Backend seeds *.update while many UI guards still check *.edit.
 */
const permissionAliases = (code) => {
  if (!code || typeof code !== 'string') return [code]
  const legacyPrefixes = {
    'kalender-harian': 'kalender-harian.manage',
    'kalender-akademik': 'kalender-akademik.manage',
    'kalender-tipe': 'kalender-tipe.manage',
    'hari-operasional': 'hari-operasional.manage',
    semester: 'semester.manage',
    references: 'sys-reference.manage',
    organisasi: 'organisasi.manage',
    anggota: 'organisasi.anggota.manage',
    ekskul: 'ekstrakurikuler.manage',
    'ekskul-siswa': 'ekstrakurikuler.pendaftaran.manage',
  }
  const [prefix] = code.split('.')
  if (legacyPrefixes[prefix]) return [code, legacyPrefixes[prefix]]
  if (code.startsWith('role-permissions.')) return [code, code.replace('role-permissions.', 'role_permissions.')]
  if (code.endsWith('.edit')) return [code, `${code.slice(0, -5)}.update`]
  if (code.endsWith('.update')) return [code, `${code.slice(0, -7)}.edit`]
  return [code]
}

/**
 * Check if a user object has a specific permission.
 * Denies access if permission unknown or user does not possess required permission.
 * Pure function — no `this` dependency.
 */
export const checkPermission = (user, code) => {
  if (!user) return false
  if (isSuperAdminUser(user)) return true
  if (!code) return true
  const perms = resolvePermissions(user)
  if (perms.length === 0) return false

  const candidates = permissionAliases(code)
  return perms.some((p) => {
    const permCode = typeof p === 'string' ? p : p?.code
    return candidates.includes(permCode)
  })
}

/**
 * Custom hook for checking user permissions.
 *
 * @returns {{ hasPermission, hasAnyPermission, hasAllPermissions, permissions }}
 */
const usePermission = () => {
  const user = useAuthStore((state) => state.user)

  const permissions = useMemo(() => resolvePermissions(user), [user])

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
