import { apiService } from '../../../utils/api'

const BASE_URL = '/absensi-guru'

export const absensiGuruService = {
  /**
   * Get all absensi guru with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.tanggal_mulai] - Start date filter (YYYY-MM-DD)
   * @param {string} [params.tanggal_akhir] - End date filter (YYYY-MM-DD)
   * @param {string} [params.status_absensi] - Filter by status
   * @returns {Promise<{data: any, error: any}>}
   */
  getAbsensiGuru: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Get absensi guru by ID
   * @param {number|string} id - Absensi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getAbsensiGuruById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new absensi guru
   * @param {Object} data - Absensi data
   * @param {number} data.guru_id - Guru ID
   * @param {string} data.tanggal - Date (YYYY-MM-DD)
   * @param {string} data.status_absensi - Status (hadir/tidak_hadir/izin/sakit)
   * @param {string} [data.keterangan] - Notes
   * @param {string} [data.jam_masuk] - Entry time (HH:mm)
   * @param {string} [data.jam_keluar] - Exit time (HH:mm)
   * @returns {Promise<{data: any, error: any}>}
   */
  createAbsensiGuru: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing absensi guru
   * @param {number|string} id - Absensi ID
   * @param {Object} data - Updated absensi data
   * @returns {Promise<{data: any, error: any}>}
   */
  updateAbsensiGuru: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete absensi guru
   * @param {number|string} id - Absensi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteAbsensiGuru: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get absensi by guru ID
   * @param {number|string} guruId - Guru ID
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getByGuru: async (guruId, params = {}) => {
    return await apiService.get(`${BASE_URL}/guru/${guruId}`, { params })
  },

  /**
   * Get absensi summary by guru ID
   * @param {number|string} guruId - Guru ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getSummaryByGuru: async (guruId) => {
    return await apiService.get(`${BASE_URL}/guru/${guruId}/summary`)
  },
}

export default absensiGuruService