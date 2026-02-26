import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/presensi'

export const presensiService = {
  /**
   * Get all presensi with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.per_page] - Items per page
   * @param {string} [params.search] - Search keyword
   * @param {string} [params.tanggal_awal] - Start date filter (YYYY-MM-DD)
   * @param {string} [params.tanggal_akhir] - End date filter (YYYY-MM-DD)
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresensi: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Get presensi by ID
   * @param {number|string} id - Presensi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresensiById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new presensi
   * @param {Object} data - Presensi data
   * @param {number} data.mst_guru_mapel_id - Guru Mapel ID
   * @param {number} data.mst_siswa_id - Siswa ID
   * @param {string} data.tanggal - Date (YYYY-MM-DD)
   * @param {string} [data.jam_masuk] - Check-in time (HH:mm)
   * @param {number} data.status - Status code
   * @param {string} [data.keterangan] - Notes
   * @returns {Promise<{data: any, error: any}>}
   */
  createPresensi: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing presensi
   * @param {number|string} id - Presensi ID
   * @param {Object} data - Updated presensi data
   * @returns {Promise<{data: any, error: any}>}
   */
  updatePresensi: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete presensi
   * @param {number|string} id - Presensi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  deletePresensi: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get presensi by siswa
   * @param {number|string} siswaId - Siswa ID
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresensiBySiswa: async (siswaId, params = {}) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`, { params })
  },

  /**
   * Get presensi by guru mapel
   * @param {number|string} guruMapelId - Guru Mapel ID
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresensiByGuruMapel: async (guruMapelId, params = {}) => {
    return await apiService.get(`${BASE_URL}/guru-mapel/${guruMapelId}`, { params })
  },

  /**
   * Get presensi by date
   * @param {Object} params - Query parameters
   * @param {string} params.tanggal - Date (YYYY-MM-DD)
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresensiByDate: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/date`, { params })
  },

  /**
   * Get presensi summary by siswa
   * @param {number|string} siswaId - Siswa ID
   * @param {Object} params - Query parameters
   * @param {string} [params.tanggal_awal] - Start date (YYYY-MM-DD)
   * @param {string} [params.tanggal_akhir] - End date (YYYY-MM-DD)
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresensiSummary: async (siswaId, params = {}) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}/summary`, { params })
  },

  /**
   * Bulk create presensi
   * @param {Object} data - Bulk presensi data
   * @returns {Promise<{data: any, error: any}>}
   */
  bulkCreatePresensi: async (data) => {
    return await apiService.post(`${BASE_URL}/bulk`, data)
  },
}

export default presensiService