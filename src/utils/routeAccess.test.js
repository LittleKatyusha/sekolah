import { describe, expect, it } from 'vitest'
import { canAccessPath, permissionForPath } from './routeAccess'

describe('route access', () => {
  it('maps protected routes to seeded view permissions', () => {
    expect(permissionForPath('/admin/users/42/edit')).toBe('users.view')
    expect(permissionForPath('/dashboard')).toBe('dashboard.view')
  })

  it('denies direct routes without permission while preserving legacy auth payloads', () => {
    expect(canAccessPath({ permissions: [{ code: 'siswa.view' }] }, '/admin/users')).toBe(false)
    expect(canAccessPath({ permissions: [{ code: 'users.view' }] }, '/admin/users')).toBe(true)
    expect(canAccessPath({ role: 'admin' }, '/admin/users')).toBe(true)
  })
})
