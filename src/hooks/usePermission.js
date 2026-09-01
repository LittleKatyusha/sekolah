import { useCallback, useMemo } from 'react'
import useAuthStore from '../store/useAuthStore'

/**
 * Flatten permissions from top-level user.permissions or nested roles[].permissions.
 */
export const resolvePermissions = (user) => {
  if (Array.isArray(user?.permissions) && user.permissions.length > 0) {
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
 * SUPER_ADMIN always has all permissions.
 * Pure function — no `this` dependency.
 */
export const checkPermission = (user, code) => {
  if (!code) return true
  const role = user?.role?.toUpperCase?.() || user?.role
  if (role === 'SUPER_ADMIN') return true

  const perms = resolvePermissions(user)
  // Login payloads from older auth endpoints omit permissions. Let the backend
  // remain authoritative until `/auth/me` supplies the current permission set.
  if (!Array.isArray(user?.permissions) && !Array.isArray(user?.roles)) return true
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
