import { apiService } from '../../../utils/api'

const BASE_URL = '/absensi-siswa'

export const absensiSiswaService = {
  /**
   * Get all absensi siswa with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.tanggal_mulai] - Start date filter (YYYY-MM-DD)
   * @param {string} [params.tanggal_akhir] - End date filter (YYYY-MM-DD)
   * @param {string} [params.status_absensi] - Filter by status
   * @returns {Promise<{data: any, error: any}>}
   */
  getAbsensiSiswa: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Get absensi by siswa
   * @param {number|string} siswaId - Siswa ID
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAbsensiBySiswa: async (siswaId, params = {}) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`, { params })
  },

  /**
   * Get absensi summary by siswa
   * @param {number|string} siswaId - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getSummaryBySiswa: async (siswaId) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}/summary`)
  },

  /**
   * Get absensi siswa by ID
   * @param {number|string} id - Absensi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getAbsensiSiswaById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new absensi siswa
   * @param {Object} data - Absensi data
   * @param {number} data.siswa_id - Siswa ID
   * @param {string} data.tanggal - Date (YYYY-MM-DD)
   * @param {string} data.status_absensi - Status (hadir/tidak_hadir/izin/sakit)
   * @param {string} [data.keterangan] - Notes
   * @returns {Promise<{data: any, error: any}>}
   */
  createAbsensiSiswa: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing absensi siswa
   * @param {number|string} id - Absensi ID
   * @param {Object} data - Updated absensi data
   * @returns {Promise<{data: any, error: any}>}
   */
  updateAbsensiSiswa: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete absensi siswa
   * @param {number|string} id - Absensi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteAbsensiSiswa: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get absensi siswa by date range
   * @param {Object} data - Date range data
   * @param {string} data.tanggal_mulai - Start date (YYYY-MM-DD)
   * @param {string} data.tanggal_akhir - End date (YYYY-MM-DD)
   * @returns {Promise<{data: any, error: any}>}
   */
  getByDateRange: async (data) => {
    return await apiService.post(`${BASE_URL}/date-range`, data)
  },

  getRekapBulanan: (params = {}) => apiService.get(`${BASE_URL}/rekap-bulanan`, { params }),
}

export default absensiSiswaService