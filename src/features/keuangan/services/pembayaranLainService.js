import { apiService } from '../../../utils/api'

const BASE_URL = '/keuangan/pembayaran-lain'
const LIST_URL = '/keuangan/pembayaran-lain/'

export const pembayaranLainService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  bayar: async (id, data = {}) => {
    return await apiService.post(`${BASE_URL}/${id}/bayar`, data)
  },

  getBySiswa: async (siswaId) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`)
  },
}

export default pembayaranLainService
