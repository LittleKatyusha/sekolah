import { apiService } from '../../../utils/api'

const BASE_URL = '/siswa'

export const siswaService = {
  /**
   * Get all siswa with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} [params.kelas_id] - Filter by kelas ID
   * @param {string} [params.status] - Filter by status (aktif, lulus, pindah)
   * @param {string} [params.jenis_kelamin] - Filter by gender (L, P)
   * @param {string} [params.search] - Search by nama or nis
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Get siswa details by ID
   * @param {number|string} id - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new siswa
   * @param {Object} data - Siswa data
   * @param {number} data.sys_user_id - System user ID
   * @param {string} data.nis - NIS number
   * @param {string} data.nama - Student name
   * @param {string} data.jenis_kelamin - Gender (L/P)
   * @param {string} data.tanggal_lahir - Date of birth (YYYY-MM-DD)
   * @param {string} data.alamat - Address
   * @param {number} data.mst_kelas_id - Kelas ID
   * @param {string} [data.status] - Status (default: aktif)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing siswa
   * @param {number|string} id - Siswa ID
   * @param {Object} data - Updated siswa data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete siswa
   * @param {number|string} id - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get siswa by kelas
   * @param {number|string} kelasId - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByKelas: async (kelasId) => {
    return await apiService.get(`${BASE_URL}/kelas/${kelasId}`)
  },

  /**
   * Get absensi summary for a siswa
   * @param {number|string} id - Siswa ID
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   * @returns {Promise<{data: any, error: any}>}
   */
  getAbsensiSummary: async (id, params = {}) => {
    return await apiService.get(`${BASE_URL}/${id}/absensi-summary`, { params })
  },

  /**
   * Promote siswa to next class (naik kelas)
   * @param {number|string} id - Siswa ID
   * @param {Object} data - Promotion data
   * @param {number} data.kelas_id - New kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  naikKelas: async (id, data) => {
    return await apiService.post(`${BASE_URL}/${id}/naik-kelas`, data)
  },

  /**
   * Mark siswa as graduated (lulus)
   * @param {number|string} id - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  lulus: async (id) => {
    return await apiService.post(`${BASE_URL}/${id}/lulus`)
  },
}

export default siswaService