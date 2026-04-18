import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/absensi-guru'

export const absensiGuruService = {
  getAll: (params = {}) => apiService.get(BASE_URL, { params }),
  getById: (id) => apiService.get(`${BASE_URL}/${id}`),
  create: (data) => apiService.post(BASE_URL, data),
  update: (id, data) => apiService.put(`${BASE_URL}/${id}`, data),
  deleteById: (id) => apiService.delete(`${BASE_URL}/${id}`),
  getByGuru: (guruId, params = {}) => apiService.get(BASE_URL, { params: { ...params, mst_guru_id: guruId } }),
  getSummary: (guruId, params = {}) => apiService.get(`${BASE_URL}/summary`, { params: { ...params, mst_guru_id: guruId } }),
  getRekapBulanan: (params = {}) => apiService.get(`${BASE_URL}/rekap-bulanan`, { params }),
}