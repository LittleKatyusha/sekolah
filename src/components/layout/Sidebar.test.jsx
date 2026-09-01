import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSidebarMenuCache,
  getSidebarMenuCacheKey,
  readSidebarMenuCache,
  writeSidebarMenuCache,
} from './Sidebar'
import { getPermissionFingerprint } from '../../hooks/usePermission'

describe('Sidebar Menu Cache & Invalidation (WP-3)', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('calculates deterministic permission fingerprint regardless of permission order', () => {
    const user1 = {
      role: 'admin',
      permissions: [{ code: 'users.view' }, { code: 'guru.view' }, { code: 'siswa.view' }],
    }
    const user2 = {
      role: 'admin',
      permissions: [{ code: 'siswa.view' }, { code: 'users.view' }, { code: 'guru.view' }],
    }

    const fp1 = getPermissionFingerprint(user1)
    const fp2 = getPermissionFingerprint(user2)

    expect(fp1).toBe(fp2)
    expect(fp1).toBe('ADMIN:guru.view,siswa.view,users.view')
  })

  it('changes fingerprint when permission is added or removed', () => {
    const userBase = {
      role: 'admin',
      permissions: ['guru.view'],
    }
    const userUpdated = {
      role: 'admin',
      permissions: ['guru.view', 'users.view'],
    }

    const fp1 = getPermissionFingerprint(userBase)
    const fp2 = getPermissionFingerprint(userUpdated)

    expect(fp1).not.toBe(fp2)
  })

  it('generates distinct cache keys for different tenant and user IDs', () => {
    const userTenant1 = { id: 10, mst_sekolah_id: 1, role: 'guru', permissions: ['materi.view'] }
    const userTenant2 = { id: 10, mst_sekolah_id: 2, role: 'guru', permissions: ['materi.view'] }
    const user2Tenant1 = { id: 20, mst_sekolah_id: 1, role: 'guru', permissions: ['materi.view'] }

    const key1 = getSidebarMenuCacheKey(userTenant1)
    const key2 = getSidebarMenuCacheKey(userTenant2)
    const key3 = getSidebarMenuCacheKey(user2Tenant1)

    expect(key1).not.toBe(key2)
    expect(key1).not.toBe(key3)
    expect(key1).toContain(':1:10:')
    expect(key2).toContain(':2:10:')
    expect(key3).toContain(':1:20:')
  })

  it('writes and reads back valid menu items from cache', () => {
    const user = { id: 5, mst_sekolah_id: 1, role: 'guru', permissions: ['materi.view'] }
    const menus = [
      {
        id: 1,
        name: 'Dashboard',
        to: '/dashboard',
        iconName: 'bi-grid-1x2',
        children: [],
      },
    ]

    writeSidebarMenuCache(user, menus)
    const read = readSidebarMenuCache(user)

    expect(read).toHaveLength(1)
    expect(read[0].id).toBe(1)
    expect(read[0].name).toBe('Dashboard')
    expect(read[0].to).toBe('/dashboard')
    expect(read[0].icon).toBeDefined()
  })

  it('does not return stale or expired cache', () => {
    const user = { id: 5, mst_sekolah_id: 1, role: 'guru', permissions: ['materi.view'] }
    const key = getSidebarMenuCacheKey(user)

    // Write expired entry (expired 31 minutes ago)
    const expiredEntry = {
      data: [{ id: 1, name: 'Old Menu', to: '/old', iconName: 'bi-gear', children: [] }],
      cachedAt: Date.now() - 31 * 60 * 1000,
    }
    window.sessionStorage.setItem(key, JSON.stringify(expiredEntry))

    expect(readSidebarMenuCache(user)).toBeNull()
  })

  it('clears all sidebar menu caches completely', () => {
    const user1 = { id: 1, mst_sekolah_id: 1, role: 'admin', permissions: [] }
    const user2 = { id: 2, mst_sekolah_id: 2, role: 'siswa', permissions: [] }

    writeSidebarMenuCache(user1, [{ id: 1, name: 'Menu 1', to: '/1', iconName: 'bi-gear' }])
    writeSidebarMenuCache(user2, [{ id: 2, name: 'Menu 2', to: '/2', iconName: 'bi-gear' }])

    expect(readSidebarMenuCache(user1)).not.toBeNull()
    expect(readSidebarMenuCache(user2)).not.toBeNull()

    clearSidebarMenuCache()

    expect(readSidebarMenuCache(user1)).toBeNull()
    expect(readSidebarMenuCache(user2)).toBeNull()
  })
})
