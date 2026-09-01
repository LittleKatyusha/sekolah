import { describe, expect, it } from 'vitest'
import { checkPermission, resolvePermissions } from './usePermission'

describe('usePermission / checkPermission', () => {
  it('denies access when permissions are missing or empty', () => {
    expect(checkPermission(null, 'siswa.view')).toBe(false)
    expect(checkPermission({}, 'siswa.view')).toBe(false)
    expect(checkPermission({ role: 'admin' }, 'siswa.view')).toBe(false)
    expect(checkPermission({ permissions: [] }, 'siswa.view')).toBe(false)
    expect(checkPermission({ roles: [{ permissions: [] }] }, 'siswa.view')).toBe(false)
  })

  it('allows access without code argument', () => {
    expect(checkPermission(null, null)).toBe(true)
    expect(checkPermission({}, '')).toBe(true)
  })

  it('allows superadmin bypass', () => {
    expect(checkPermission({ role: 'SUPER_ADMIN' }, 'any.permission')).toBe(true)
    expect(checkPermission({ role: 'super_admin' }, 'any.permission')).toBe(true)
  })

  it('resolves flat permissions correctly', () => {
    const user = {
      permissions: [
        { id: 1, code: 'siswa.view' },
        'guru.view',
      ],
    }
    expect(checkPermission(user, 'siswa.view')).toBe(true)
    expect(checkPermission(user, 'guru.view')).toBe(true)
    expect(checkPermission(user, 'siswa.create')).toBe(false)
  })

  it('resolves nested roles permissions correctly', () => {
    const user = {
      roles: [
        {
          id: 1,
          code: 'guru',
          permissions: [
            { id: 10, code: 'materi.view' },
            { id: 11, code: 'materi.update' },
          ],
        },
      ],
    }
    expect(checkPermission(user, 'materi.view')).toBe(true)
    // Alias edit -> update
    expect(checkPermission(user, 'materi.edit')).toBe(true)
    expect(checkPermission(user, 'materi.delete')).toBe(false)
  })

  it('resolvePermissions handles null/undefined user safely', () => {
    expect(resolvePermissions(null)).toEqual([])
    expect(resolvePermissions(undefined)).toEqual([])
    expect(resolvePermissions({})).toEqual([])
  })
})