import { apiService } from '../../../utils/api'

/**
 * Factory function that generates standard CRUD service methods for a BK resource.
 * @param {string} basePath - The API base path (e.g., '/bk/jenis')
 * @returns {Object} Service object with getAll, getById, create, update, and delete methods
 */
const createCrudService = (basePath) => ({
  getAll: async (params = {}) => {
    return await apiService.get(`${basePath}/`, { params })
  },
  getById: async (id) => {
    return await apiService.get(`${basePath}/${id}`)
  },
  create: async (data) => {
    return await apiService.post(basePath, data)
  },
  update: async (id, data) => {
    return await apiService.put(`${basePath}/${id}`, data)
  },
  delete: async (id) => {
    return await apiService.delete(`${basePath}/${id}`)
  },
})

/** Service for managing BK Jenis (counseling types) */
export const bkJenisService = createCrudService('/bk/jenis')

/** Service for managing BK Kategori (counseling categories) */
export const bkKategoriService = createCrudService('/bk/kategori')

/** Service for managing BK Kasus (counseling cases) */
export const bkKasusService = {
  ...createCrudService('/bk/kasus'),
  getBySiswa: async (siswaId) => {
    return await apiService.get(`/bk/kasus/siswa/${siswaId}`)
  },
}

/** Service for managing BK Sesi (counseling sessions) */
export const bkSesiService = createCrudService('/bk/sesi')

/** Service for managing BK Hasil (counseling results/outcomes) */
export const bkHasilService = createCrudService('/bk/hasil')

/** Service for managing BK Tindakan (counseling follow-up actions) */
export const bkTindakanService = createCrudService('/bk/tindakan')

/**
 * Service for managing BK Lampiran (counseling attachments/files)
 * Note: No update method — lampiran only supports list, store, show, and delete
 */
export const bkLampiranService = (() => {
  const { update, ...rest } = createCrudService('/bk/lampiran')
  return rest
})()

/** Service for managing BK Wali (parent/guardian involvement in counseling) */
export const bkWaliService = createCrudService('/bk/wali')

export default {
  bkJenisService,
  bkKategoriService,
  bkKasusService,
  bkSesiService,
  bkHasilService,
  bkTindakanService,
  bkLampiranService,
  bkWaliService,
}