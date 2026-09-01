/**
 * Cache Warmer — pre-populates sessionStorage caches at login time so that
 * reference dropdowns and the sidebar menu are instantly available.
 *
 * Reference cache format mirrors useReferenceOptions.js
 *   key  : 'reference-options-cache:v2:{category}'
 *   value: JSON { data: [{value, label}], cachedAt: <timestamp> }
 *
 * Sidebar menu cache format mirrors Sidebar.jsx
 *   key  : 'sidebar-menu-cache:{userId}'
 *   value: JSON { data: [serialized menu items], cachedAt: <timestamp> }
 */

import { referenceService } from '../services/referenceService'
import { menuService } from '../features/menus/services/menuService'
import { getSidebarMenuCacheKey } from '../components/layout/Sidebar'

// ── Constants ─────────────────────────────────────────────────────────────────

const REFERENCE_CACHE_PREFIX = 'reference-options-cache:v2:'
const SIDEBAR_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * All reference categories used across the application.
 * Sourced from grep across src/ for useReferenceOptions calls.
 */
const REFERENCE_CATEGORIES = [
  'agama',
  'jenis_kelamin',
  'jenis_ujian',
  'kategori_semester',
  'metode_bk',
  'metode_pembayaran',
  'pendidikan_terakhir',
  'peran_wali_bk',
  'status_absensi',
  'status_bayar',
  'status_bk',
  'status_organisasi',
  'status_siswa',
  'tingkat_kesulitan',
  'tipe_soal',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const safeWrite = (key, value) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sessionStorage may be full or unavailable — silently skip
  }
}

const isCacheValid = (key, ttlMs) => {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    if (!parsed || Array.isArray(parsed) || !parsed.cachedAt) return false
    return Date.now() - parsed.cachedAt < ttlMs
  } catch {
    return false
  }
}

// ── Reference cache ───────────────────────────────────────────────────────────

const REFERENCE_TTL_MS = 10 * 60 * 1000 // 10 minutes

const mapReferenceOptions = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    value: item?.kode !== undefined && item?.kode !== null ? String(item.kode) : '',
    label: item?.nama ?? '',
  }))

const extractItems = (response) => {
  if (response?.error) return null
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data)) return response.data
  return null
}

/**
 * Warms a single reference category. Skips if cache is still fresh.
 * @param {string} category
 */
const warmCategory = async (category) => {
  const key = `${REFERENCE_CACHE_PREFIX}${category}`
  if (isCacheValid(key, REFERENCE_TTL_MS)) return

  const response = await referenceService.getReferencesByCategory(category)
  const items = extractItems(response)
  if (items === null) return

  const options = mapReferenceOptions(items)
  safeWrite(key, { data: options, cachedAt: Date.now() })
}

/**
 * Pre-warms all reference option caches concurrently.
 * Failures are silently ignored so one bad category won't block the rest.
 */
export const warmReferenceCache = async () => {
  await Promise.allSettled(REFERENCE_CATEGORIES.map(warmCategory))
}

// ── Sidebar menu cache ────────────────────────────────────────────────────────

const toFrontendRoute = (url) => {
  if (!url || url === '#') return null
  return url.replace(/^\/api\/v[0-9]+/, '') || '/'
}

const flattenForCache = (item) => ({
  ...item,
  _frontendRoute: toFrontendRoute(item.url ?? item.to),
})

const serializeMenuItem = (item) => ({
  id: item.id,
  name: item.nama_menu ?? item.name,
  to: item._frontendRoute ?? item.to ?? null,
  iconName: typeof item.icon === 'string' ? item.icon : item.iconName ?? null,
  children: Array.isArray(item.sub_menus)
    ? item.sub_menus.filter((s) => s.is_active).map((s) => serializeMenuItem(flattenForCache(s)))
    : Array.isArray(item.children)
    ? item.children.map((c) => serializeMenuItem(flattenForCache(c)))
    : [],
})

/**
 * Pre-warms the sidebar menu cache for the given user. Skips if fresh.
 * @param {object} user - The authenticated user object
 */
export const warmSidebarMenuCache = async (user) => {
  if (!user?.id) return

  const key = getSidebarMenuCacheKey(user)
  if (isCacheValid(key, SIDEBAR_TTL_MS)) return

  const { data, error } = await menuService.getTree()
  if (error || !Array.isArray(data?.data)) return

  const serialized = data.data
    .filter((item) => item.is_active)
    .map((item) => serializeMenuItem(flattenForCache(item)))

  safeWrite(key, { data: serialized, cachedAt: Date.now() })
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Runs all cache warming tasks in the background after login.
 * Fire-and-forget: all errors are caught internally.
 *
 * @param {{ id: string|number, role: string }} user - The authenticated user object
 */
export const runCacheWarming = (user) => {
  if (typeof window === 'undefined') return

  // Use idle callback when available so warming doesn't compete with render
  const schedule = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200))

  // Roles allowed to access /admin/references/* endpoints
  const ADMIN_REFERENCE_ROLES = new Set([
    'SUPER_ADMIN', 'ADMIN_SEKOLAH', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA_SEKOLAH',
    'STAFF_KEUANGAN', 'STAFF_PERPUSTAKAAN', 'ADMIN_PPDB',
  ])
  const canAccessAdminRoutes = ADMIN_REFERENCE_ROLES.has(user?.role?.toUpperCase())

  schedule(async () => {
    const tasks = [warmSidebarMenuCache(user)]

    // /admin/references/* is restricted — skip for non-admin roles
    // to avoid 403 Forbidden errors on login
    if (canAccessAdminRoutes) {
      tasks.push(warmReferenceCache())
    }

    await Promise.allSettled(tasks)
  })
}
