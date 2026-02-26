import { apiService } from '../../../utils/api'

const ORG_BASE = '/organisasi'
const ORG_LIST = '/organisasi/'
const JABATAN_BASE = '/organisasi/jabatan'
const JABATAN_LIST = '/organisasi/jabatan/'
const ANGGOTA_BASE = '/organisasi/anggota'
const ANGGOTA_LIST = '/organisasi/anggota/'

/**
 * Service for managing master Organisasi
 */
export const organisasiService = {
  getAll: async (params = {}) => {
    return await apiService.get(ORG_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${ORG_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(ORG_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${ORG_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${ORG_BASE}/${id}`)
  },

  getAktif: async () => {
    return await apiService.get(`${ORG_BASE}/aktif`)
  },

  getByPembina: async (pembinaGuruId) => {
    return await apiService.get(`${ORG_BASE}/pembina/${pembinaGuruId}`)
  },

  getStatistik: async (id) => {
    return await apiService.get(`${ORG_BASE}/${id}/statistik`)
  },
}

/**
 * Service for managing Organisasi Jabatan (positions)
 */
export const jabatanService = {
  getAll: async (params = {}) => {
    return await apiService.get(JABATAN_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${JABATAN_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(JABATAN_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${JABATAN_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${JABATAN_BASE}/${id}`)
  },

  getAllList: async () => {
    return await apiService.get(`${JABATAN_BASE}/all`)
  },
}

/**
 * Service for managing Organisasi Anggota (members)
 */
export const anggotaService = {
  getAll: async (params = {}) => {
    return await apiService.get(ANGGOTA_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${ANGGOTA_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(ANGGOTA_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${ANGGOTA_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${ANGGOTA_BASE}/${id}`)
  },

  getByOrganisasi: async (organisasiId) => {
    return await apiService.get(`${ANGGOTA_BASE}/organisasi/${organisasiId}`)
  },

  getBySiswa: async (siswaId) => {
    return await apiService.get(`${ANGGOTA_BASE}/siswa/${siswaId}`)
  },

  getAktif: async () => {
    return await apiService.get(`${ANGGOTA_BASE}/aktif`)
  },
}

export default {
  organisasiService,
  jabatanService,
  anggotaService,
}