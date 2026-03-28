import axios from 'axios'
import { apiService } from '../../../utils/api'

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

export default {
  gelombangService,
  pendaftarService,
  dokumenService,
}

/**
 * Public PPDB service — no authentication required.
 * Uses raw axios (not apiService) to avoid attaching Bearer token.
 */
const PUBLIC_BASE = '/api/v1/ppdb/public'

export const ppdbPublicService = {
  getActiveGelombang: async (sekolahId) => {
    try {
      const response = await axios.get(`${PUBLIC_BASE}/gelombang/${sekolahId}/active`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  daftar: async (formData) => {
    try {
      const response = await axios.post(`${PUBLIC_BASE}/daftar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  cekStatus: async (noPendaftaran) => {
    try {
      const response = await axios.get(`${PUBLIC_BASE}/status/${encodeURIComponent(noPendaftaran)}`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },
}