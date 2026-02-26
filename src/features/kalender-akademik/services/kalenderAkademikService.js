import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/kalender-akademik'
const LIST_URL = '/admin/kalender-akademik/'
const TIPE_URL = '/admin/kalender-tipe'
const TIPE_LIST_URL = '/admin/kalender-tipe/'

export const kalenderAkademikService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
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

  // Kalender Akademik Tipe endpoints
  getAllTipe: async (params = {}) => {
    return await apiService.get(TIPE_LIST_URL, { params })
  },

  createTipe: async (data) => {
    return await apiService.post(TIPE_URL, data)
  },

  updateTipe: async (id, data) => {
    return await apiService.put(`${TIPE_URL}/${id}`, data)
  },

  deleteTipe: async (id) => {
    return await apiService.delete(`${TIPE_URL}/${id}`)
  },
}

export default kalenderAkademikService