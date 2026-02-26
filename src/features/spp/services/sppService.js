import { apiService } from '../../../utils/api'

const TARIF_BASE = '/keuangan/tarif-spp'
const TARIF_LIST = '/keuangan/tarif-spp/'
const PEMBAYARAN_BASE = '/keuangan/pembayaran-spp'
const PEMBAYARAN_LIST = '/keuangan/pembayaran-spp/'

/**
 * Service for managing Tarif SPP (Fee Rates)
 */
export const tarifSppService = {
  getAll: async (params = {}) => {
    return await apiService.get(TARIF_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${TARIF_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(TARIF_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${TARIF_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${TARIF_BASE}/${id}`)
  },

  getByKelas: async (kelasId, params = {}) => {
    return await apiService.get(`${TARIF_BASE}/kelas/${kelasId}`, { params })
  },
}

/**
 * Service for managing Pembayaran SPP (Payments)
 */
export const pembayaranSppService = {
  getAll: async (params = {}) => {
    return await apiService.get(PEMBAYARAN_LIST, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${PEMBAYARAN_BASE}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(PEMBAYARAN_BASE, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${PEMBAYARAN_BASE}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${PEMBAYARAN_BASE}/${id}`)
  },

  bayar: async (data) => {
    return await apiService.post(`${PEMBAYARAN_BASE}/bayar`, data)
  },

  getBySiswa: async (siswaId) => {
    return await apiService.get(`${PEMBAYARAN_BASE}/siswa/${siswaId}`)
  },

  getStatusSiswa: async (siswaId, params = {}) => {
    return await apiService.get(`${PEMBAYARAN_BASE}/siswa/${siswaId}/status`, { params })
  },
}

export default {
  tarifSppService,
  pembayaranSppService,
}