import axios from 'axios'
import { apiService, getBaseURL } from '../../../utils/api'

const GELOMBANG_BASE = '/ppdb/gelombang'
const GELOMBANG_LIST = '/ppdb/gelombang/'
const PENDAFTAR_BASE = '/ppdb/pendaftaran'
const PENDAFTAR_LIST = '/ppdb/pendaftaran/'
const DOKUMEN_BASE = '/ppdb/dokumen'
const DOKUMEN_LIST = '/ppdb/dokumen/'

/**
 * Service for managing PPDB Gelombang (Admission Waves)
 */
export const gelombangService = {
  getAll: async (params = {}) => {
    return await apiService.get(GELOMBANG_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${GELOMBANG_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(GELOMBANG_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${GELOMBANG_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${GELOMBANG_BASE}/${id}`)
  },

  getActive: async (sekolahId) => {
    return await apiService.get(`${GELOMBANG_BASE}/sekolah/${sekolahId}/active`)
  },

  activate: async (id) => {
    return await apiService.post(`${GELOMBANG_BASE}/${id}/activate`)
  },

  deactivate: async (id) => {
    return await apiService.post(`${GELOMBANG_BASE}/${id}/deactivate`)
  },
}

/**
 * Service for managing PPDB Pendaftar (Applicants)
 */
export const pendaftarService = {
  getAll: async (params = {}) => {
    return await apiService.get(PENDAFTAR_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${PENDAFTAR_BASE}/${id}`)
  },

  getByNo: async (noPendaftaran) => {
    return await apiService.get(`${PENDAFTAR_BASE}/no/${noPendaftaran}`)
  },

  create: async (data) => {
    return await apiService.post(PENDAFTAR_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${PENDAFTAR_BASE}/${id}`, data)
  },

  updateStatus: async (id, status) => {
    return await apiService.put(`${PENDAFTAR_BASE}/${id}/status`, { status })
  },

  delete: async (id) => {
    return await apiService.delete(`${PENDAFTAR_BASE}/${id}`)
  },

  verify: async (id) => {
    return await apiService.post(`${PENDAFTAR_BASE}/${id}/verify`)
  },

  accept: async (id) => {
    return await apiService.post(`${PENDAFTAR_BASE}/${id}/accept`)
  },

  reject: async (id) => {
    return await apiService.post(`${PENDAFTAR_BASE}/${id}/reject`)
  },

  batchSeleksi: async (ids, status) => {
    return await apiService.post(`${PENDAFTAR_BASE}/batch-seleksi`, { ids, status })
  },

  /**
   * Update nilai rapor for a pendaftar via the new endpoint.
   * @param {number|string} id - pendaftar ID
   * @param {Object} nilaiRapor - map of kode_mapel → nilai, e.g. { mtk: 95, ipa: 88 }
   */
  updateNilaiRapor: async (id, nilaiRapor) => {
    return await apiService.put(`${PENDAFTAR_BASE}/${id}/nilai-rapor`, { nilai_rapor: nilaiRapor })
  },

  getStatistics: async (sekolahId, params = {}) => {
    return await apiService.get(`${PENDAFTAR_BASE}/sekolah/${sekolahId}/statistics`, { params })
  },
}

/**
 * Service for managing PPDB Dokumen (Documents)
 */
export const dokumenService = {
  getAll: async (params = {}) => {
    return await apiService.get(DOKUMEN_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${DOKUMEN_BASE}/${id}`)
  },

  getByPendaftaran: async (pendaftaranId) => {
    return await apiService.get(`${DOKUMEN_BASE}/pendaftaran/${pendaftaranId}`)
  },

  create: async (data) => {
    return await apiService.post(DOKUMEN_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${DOKUMEN_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${DOKUMEN_BASE}/${id}`)
  },

  verify: async (id, catatan = null) => {
    return await apiService.post(`${DOKUMEN_BASE}/${id}/verify`, { catatan })
  },

  reject: async (id, catatan) => {
    return await apiService.post(`${DOKUMEN_BASE}/${id}/reject`, { catatan })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Selection — Kriteria Seleksi
// ─────────────────────────────────────────────────────────────────────────────
const KRITERIA_BASE = '/ppdb/kriteria-seleksi'

export const kriteriaSeleksiService = {
  getByGelombang: async (gelombangId) =>
    apiService.get(`${KRITERIA_BASE}/gelombang/${gelombangId}`),

  getById: async (id) =>
    apiService.get(`${KRITERIA_BASE}/${id}`),

  create: async (data) =>
    apiService.post(KRITERIA_BASE, data),

  update: async (id, data) =>
    apiService.put(`${KRITERIA_BASE}/${id}`, data),

  delete: async (id) =>
    apiService.delete(`${KRITERIA_BASE}/${id}`),

  seedDefault: async (gelombangId) =>
    apiService.post(`${KRITERIA_BASE}/gelombang/${gelombangId}/seed-default`),
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Selection — Kuota Jurusan
// ─────────────────────────────────────────────────────────────────────────────
const KUOTA_BASE = '/ppdb/kuota-jurusan'

export const kuotaJurusanService = {
  getByGelombang: async (gelombangId) =>
    apiService.get(`${KUOTA_BASE}/gelombang/${gelombangId}`),

  getSummary: async (gelombangId) =>
    apiService.get(`${KUOTA_BASE}/gelombang/${gelombangId}/summary`),

  getById: async (id) =>
    apiService.get(`${KUOTA_BASE}/${id}`),

  create: async (data) =>
    apiService.post(KUOTA_BASE, data),

  update: async (id, data) =>
    apiService.put(`${KUOTA_BASE}/${id}`, data),

  delete: async (id) =>
    apiService.delete(`${KUOTA_BASE}/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Selection — Engine Seleksi
// ─────────────────────────────────────────────────────────────────────────────
const SELEKSI_BASE = '/ppdb/seleksi'

export const seleksiService = {
  getHasilByGelombang: async (gelombangId, params = {}) =>
    apiService.get(`${SELEKSI_BASE}/gelombang/${gelombangId}/hasil`, { params }),

  getHasilById: async (id) =>
    apiService.get(`${SELEKSI_BASE}/hasil/${id}`),

  jalankan: async (gelombangId, options = {}) =>
    apiService.post(`${SELEKSI_BASE}/gelombang/${gelombangId}/jalankan`, options),

  simulasi: async (gelombangId, options = {}) =>
    apiService.post(`${SELEKSI_BASE}/gelombang/${gelombangId}/simulasi`, options),

  finalisasi: async (gelombangId) =>
    apiService.post(`${SELEKSI_BASE}/gelombang/${gelombangId}/finalisasi`),

  reset: async (gelombangId) =>
    apiService.delete(`${SELEKSI_BASE}/gelombang/${gelombangId}/reset`),

  fraudScan: async (gelombangId) =>
    apiService.post(`${SELEKSI_BASE}/gelombang/${gelombangId}/fraud-scan`),
}

// ─────────────────────────────────────────────────────────────────────────────
// PPDB Nilai Rapor
// ─────────────────────────────────────────────────────────────────────────────
const NILAI_RAPOR_BASE = '/ppdb/nilai-rapor'

export const nilaiRaporService = {
  getByPendaftaran: async (pendaftaranId) =>
    apiService.get(`${NILAI_RAPOR_BASE}/pendaftaran/${pendaftaranId}`),

  getById: async (id) =>
    apiService.get(`${NILAI_RAPOR_BASE}/${id}`),

  create: async (data) =>
    apiService.post(NILAI_RAPOR_BASE, data),

  update: async (id, data) =>
    apiService.put(`${NILAI_RAPOR_BASE}/${id}`, data),

  delete: async (id) =>
    apiService.delete(`${NILAI_RAPOR_BASE}/${id}`),

  /**
   * Bulk store nilai rapor for a pendaftar.
   * @param {number} pendaftaranId
   * @param {Array<{kode_mapel: string, nilai: number}>} items
   */
  bulkStore: async (pendaftaranId, items) =>
    apiService.post(`${NILAI_RAPOR_BASE}/pendaftaran/${pendaftaranId}/bulk`, { nilai_rapor: items }),
}

export default {
  gelombangService,
  pendaftarService,
  dokumenService,
  kriteriaSeleksiService,
  kuotaJurusanService,
  seleksiService,
  nilaiRaporService,
}

/**
 * Public PPDB service — no authentication required.
 * Uses raw axios (not apiService) to avoid attaching Bearer token.
 */
const publicApi = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: { Accept: 'application/json' },
})
const PUBLIC_BASE = '/ppdb/public'

export const ppdbPublicService = {
  getSekolahList: async () => {
    try {
      const response = await publicApi.get(`${PUBLIC_BASE}/sekolah`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  getActiveGelombang: async (sekolahId) => {
    try {
      const response = await publicApi.get(`${PUBLIC_BASE}/gelombang/${sekolahId}/active`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  daftar: async (formData) => {
    try {
      const response = await publicApi.post(`${PUBLIC_BASE}/daftar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  cekStatus: async (noPendaftaran) => {
    try {
      const response = await publicApi.get(`${PUBLIC_BASE}/status/${encodeURIComponent(noPendaftaran)}`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },
}
