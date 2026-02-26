import { apiService } from '../../../utils/api'

const EKSKUL_BASE = '/ekstrakurikuler'
const EKSKUL_LIST = '/ekstrakurikuler/'
const PENDAFTARAN_BASE = '/ekstrakurikuler/pendaftaran'
const PENDAFTARAN_LIST = '/ekstrakurikuler/pendaftaran/'

/**
 * Service for managing master Ekstrakurikuler
 */
export const ekstrakurikulerService = {
  getAll: async (params = {}) => {
    return await apiService.get(EKSKUL_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${EKSKUL_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(EKSKUL_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${EKSKUL_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${EKSKUL_BASE}/${id}`)
  },

  getAktif: async () => {
    return await apiService.get(`${EKSKUL_BASE}/aktif`)
  },

  getByPembina: async (pembinaGuruId) => {
    return await apiService.get(`${EKSKUL_BASE}/pembina/${pembinaGuruId}`)
  },

  getStatistik: async (id) => {
    return await apiService.get(`${EKSKUL_BASE}/${id}/statistik`)
  },
}

/**
 * Service for managing Ekstrakurikuler Siswa (student enrollment)
 */
export const eksSiswaService = {
  getAll: async (params = {}) => {
    return await apiService.get(PENDAFTARAN_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${PENDAFTARAN_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(PENDAFTARAN_BASE, data)
  },

  updateStatus: async (id, status) => {
    return await apiService.put(`${PENDAFTARAN_BASE}/${id}/status`, { status })
  },

  keluar: async (id) => {
    return await apiService.post(`${PENDAFTARAN_BASE}/${id}/keluar`)
  },

  delete: async (id) => {
    return await apiService.delete(`${PENDAFTARAN_BASE}/${id}`)
  },

  getByEkstrakurikuler: async (ekstrakurikulerId) => {
    return await apiService.get(`${PENDAFTARAN_BASE}/ekstrakurikuler/${ekstrakurikulerId}`)
  },

  getBySiswa: async (siswaId) => {
    return await apiService.get(`${PENDAFTARAN_BASE}/siswa/${siswaId}`)
  },

  getRiwayatBySiswa: async (siswaId) => {
    return await apiService.get(`${PENDAFTARAN_BASE}/siswa/${siswaId}/riwayat`)
  },

  checkStatus: async (data) => {
    return await apiService.post(`${PENDAFTARAN_BASE}/check-status`, data)
  },
}

export default {
  ekstrakurikulerService,
  eksSiswaService,
}