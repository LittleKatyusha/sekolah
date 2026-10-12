import { apiService } from '../../../utils/api'

const EKSKUL_BASE = '/ekstrakurikuler'
const EKSKUL_LIST = '/ekstrakurikuler/'
const PENDAFTARAN_BASE = '/ekstrakurikuler/pendaftaran'
const PENDAFTARAN_LIST = '/ekstrakurikuler/pendaftaran/'
const KEGIATAN_BASE = '/ekstrakurikuler/kegiatan'
const KEGIATAN_LIST = '/ekstrakurikuler/kegiatan/'

/**
 * Service for managing master Ekstrakurikuler
 */
export const ekstrakurikulerService = {
  getAll: (params = {}) =>
    apiService.get(EKSKUL_LIST, { params }),

  getById: (id) =>
    apiService.get(`${EKSKUL_BASE}/${id}`),

  create: (data) =>
    apiService.post(EKSKUL_BASE, data),

  update: (id, data) =>
    apiService.put(`${EKSKUL_BASE}/${id}`, data),

  delete: (id) =>
    apiService.delete(`${EKSKUL_BASE}/${id}`),

  getAktif: () =>
    apiService.get(`${EKSKUL_BASE}/aktif`),

  getByPembina: (pembinaGuruId) =>
    apiService.get(`${EKSKUL_BASE}/pembina/${pembinaGuruId}`),

  getStatistik: (id) =>
    apiService.get(`${EKSKUL_BASE}/${id}/statistik`),
}

/**
 * Service for managing Ekstrakurikuler Siswa (student enrollment)
 */
export const eksSiswaService = {
  getAll: (params = {}) =>
    apiService.get(PENDAFTARAN_LIST, { params }),

  getById: (id) =>
    apiService.get(`${PENDAFTARAN_BASE}/${id}`),

  create: (data) =>
    apiService.post(PENDAFTARAN_BASE, data),

  bulkCreate: (data) =>
    apiService.post(`${PENDAFTARAN_BASE}/bulk`, data),


  updateStatus: (id, status) =>
    apiService.put(`${PENDAFTARAN_BASE}/${id}/status`, { status }),

  keluar: (id) =>
    apiService.post(`${PENDAFTARAN_BASE}/${id}/keluar`),

  delete: (id) =>
    apiService.delete(`${PENDAFTARAN_BASE}/${id}`),

  getByEkstrakurikuler: (ekstrakurikulerId) =>
    apiService.get(`${PENDAFTARAN_BASE}/ekstrakurikuler/${ekstrakurikulerId}`),

  getBySiswa: (siswaId) =>
    apiService.get(`${PENDAFTARAN_BASE}/siswa/${siswaId}`),

  getRiwayatBySiswa: (siswaId) =>
    apiService.get(`${PENDAFTARAN_BASE}/siswa/${siswaId}/riwayat`),

  checkStatus: (data) =>
    apiService.post(`${PENDAFTARAN_BASE}/check-status`, data),
}

/**
 * Service for managing Ekstrakurikuler Kegiatan (activities / sessions / schedule)
 */
export const eksKegiatanService = {
  getAll: (params = {}) =>
    apiService.get(KEGIATAN_LIST, { params }),

  getById: (id) =>
    apiService.get(`${KEGIATAN_BASE}/${id}`),

  create: (data) =>
    apiService.post(KEGIATAN_BASE, data),

  update: (id, data) =>
    apiService.put(`${KEGIATAN_BASE}/${id}`, data),

  delete: (id) =>
    apiService.delete(`${KEGIATAN_BASE}/${id}`),

  getByEkstrakurikuler: (ekstrakurikulerId) =>
    apiService.get(`${KEGIATAN_BASE}/ekstrakurikuler/${ekstrakurikulerId}`),

  getBySiswa: (siswaId) =>
    apiService.get(`${KEGIATAN_BASE}/siswa/${siswaId}`),

  getJadwalAnak: (params = {}) =>
    apiService.get(`${KEGIATAN_BASE}/jadwal-anak`, { params }),
}

export default {
  ekstrakurikulerService,
  eksSiswaService,
  eksKegiatanService,
}
