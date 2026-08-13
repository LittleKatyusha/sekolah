import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/absensi-guru'
const dateRange = ({ tanggal_mulai, tanggal_akhir, ...params } = {}) => ({
  ...params,
  ...(tanggal_mulai ? { tanggal_awal: tanggal_mulai } : {}),
  ...(tanggal_akhir ? { tanggal_akhir } : {}),
})

export const absensiGuruService = {
  getAll: (params = {}) => apiService.get(BASE_URL, { params: dateRange(params) }),
  getById: (id) => apiService.get(`${BASE_URL}/${id}`),
  create: (data) => apiService.post(BASE_URL, data),
  update: (id, data) => apiService.put(`${BASE_URL}/${id}`, data),
  deleteById: (id) => apiService.delete(`${BASE_URL}/${id}`),
  getByGuru: (guruId, params = {}) => apiService.get(`${BASE_URL}/guru/${guruId}`, { params: dateRange(params) }),
  getSummary: (guruId, params = {}) => apiService.get(`${BASE_URL}/summary`, { params: { ...params, mst_guru_id: guruId } }),
  getRekapBulanan: (params = {}) => apiService.get(`${BASE_URL}/rekap-bulanan`, { params }),
}
