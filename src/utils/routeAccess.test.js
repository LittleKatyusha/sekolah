import { describe, expect, it } from 'vitest'
import { canAccessPath, isBackendAvailablePath, permissionForPath } from './routeAccess'

describe('route access', () => {
  it('maps protected routes to seeded view permissions', () => {
    expect(permissionForPath('/admin/users/42/edit')).toBe('users.view')
    expect(permissionForPath('/dashboard')).toBe('dashboard.view')
  })

  it('denies direct routes without permission in fail-closed mode', () => {
    expect(canAccessPath({ permissions: [{ code: 'siswa.view' }] }, '/admin/users')).toBe(false)
    expect(canAccessPath({ permissions: [{ code: 'users.view' }] }, '/admin/users')).toBe(true)
    expect(canAccessPath({ role: 'admin' }, '/admin/users')).toBe(false)
    expect(canAccessPath(null, '/admin/users')).toBe(false)
  })

  it('marks routes without active backend APIs as unavailable', () => {
    expect(isBackendAvailablePath('/dashboard')).toBe(true)
    expect(isBackendAvailablePath('/akademik/ujian/1')).toBe(false)
    expect(isBackendAvailablePath('/akademik/nilai')).toBe(true)
  })
})
