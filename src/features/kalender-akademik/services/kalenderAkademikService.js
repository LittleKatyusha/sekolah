import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/kalender-akademik'
const LIST_URL = '/admin/kalender-akademik/'
const TIPE_URL = '/admin/kalender-tipe'
const TIPE_LIST_URL = '/admin/kalender-tipe/'

export const kalenderAkademikService = {
 getAll: async (params = {}) => {
 return await apiService.get(LIST_URL, { params })
 },

 getAllForCalendar: async (params = {}) => {
   return await apiService.get(LIST_URL, { params: { ...params, per_page: 1000 } })
 },

 getById: async (id) => {
   // Backend has no GET-by-ID endpoint (returns 405), so we fetch the full list and filter client-side
   const response = await apiService.get(LIST_URL, { params: { per_page: 1000 } })
   if (response.error) return { data: null, error: response.error }
   const items = response.data?.data?.data || response.data?.data || []
   const item = Array.isArray(items) ? items.find(i => i.id === parseInt(id)) : null
   if (!item) return { data: null, error: { message: 'Data tidak ditemukan' } }
   return { data: { data: item }, error: null }
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

  getByIdTipe: async (id) => {
    return await apiService.get(`${TIPE_URL}/${id}`)
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