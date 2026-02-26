import { apiService } from '../../../utils/api'

const BASE_URL = '/jadwal-pelajaran'
const LIST_URL = '/jadwal-pelajaran/'

export const jadwalPelajaranService = {
  /**
   * Get all jadwal pelajaran with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search keyword
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get jadwal pelajaran details by ID
   * @param {number|string} id - Jadwal Pelajaran ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new jadwal pelajaran
   * @param {Object} data - Jadwal pelajaran data
   * @param {number} data.mst_kelas_id - Kelas ID (required)
   * @param {number} data.mst_guru_mapel_id - Guru Mapel ID (required)
   * @param {string} data.hari - Day of week: MON,TUE,WED,THU,FRI,SAT,SUN (required)
   * @param {string} data.jam_mulai - Start time HH:mm (required)
   * @param {string} data.jam_selesai - End time HH:mm (required)
   * @param {string} [data.ruangan] - Room name (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing jadwal pelajaran
   * @param {number|string} id - Jadwal Pelajaran ID
   * @param {Object} data - Updated jadwal pelajaran data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete jadwal pelajaran
   * @param {number|string} id - Jadwal Pelajaran ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get jadwal pelajaran by kelas ID
   * @param {number|string} kelasId - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByKelas: async (kelasId) => {
    return await apiService.get(`${BASE_URL}/kelas/${kelasId}`)
  },

  /**
   * Get jadwal pelajaran by kelas ID and hari
   * @param {number|string} kelasId - Kelas ID
   * @param {string} hari - Day of week (MON,TUE,WED,THU,FRI,SAT,SUN)
   * @returns {Promise<{data: any, error: any}>}
   */
  getByKelasAndHari: async (kelasId, hari) => {
    return await apiService.get(`${BASE_URL}/kelas/${kelasId}/hari`, { params: { hari } })
  },
}

export default jadwalPelajaranService