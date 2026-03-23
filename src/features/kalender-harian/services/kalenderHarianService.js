import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/kalender-harian'
const LIST_URL = '/admin/kalender-harian/'

const formatDateParam = (date) => {
 const year = date.getFullYear()
 const month = String(date.getMonth() + 1).padStart(2, '0')
 const day = String(date.getDate()).padStart(2, '0')

 return `${year}-${month}-${day}`
}

export const kalenderHarianService = {
 getAll: async (params = {}) => {
 return await apiService.get(LIST_URL, { params })
 },

 getByMonth: async (year, month) => {
    const rangeStart = new Date(year, month - 1, 1)
    const rangeEnd = new Date(year, month, 0)
    const daysInMonth = rangeEnd.getDate()

  return await apiService.get(LIST_URL, {
     params: {
        tanggal_mulai: formatDateParam(rangeStart),
        tanggal_selesai: formatDateParam(rangeEnd),
        per_page: daysInMonth,
        sort_by: 'tanggal',
        sort_dir: 'asc',
        search: ''
     }
  })
 },

 generate: async (data) => {
 return await apiService.post(`${BASE_URL}/generate`, data)
 },

 update: async (id, data) => {
 return await apiService.put(`${BASE_URL}/${id}`, data)
 },
}

export default kalenderHarianService