import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/ujian'
const LIST_URL = '/akademik/ujian/'

export const ujianService = {
  /**
   * Get all ujian with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by nama
   * @param {number} [params.mst_mapel_id] - Filter by mapel ID
   * @param {number} [params.mst_kelas_id] - Filter by kelas ID
   * @param {number} [params.jenis] - Filter by jenis ujian (1-5)
   * @param {string} [params.semester] - Filter by semester (ganjil/genap)
   * @param {string} [params.tahun_ajaran] - Filter by tahun ajaran
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get ujian details by ID
   * @param {number|string} id - Ujian ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new ujian
   * @param {Object} data - Ujian data
   * @param {number} data.mst_mapel_id - Mapel ID (required)
   * @param {number} data.mst_kelas_id - Kelas ID (required)
   * @param {number} data.jenis - Jenis ujian 1-5 (required)
    * @param {string} data.nama - Nama ujian (required)
    * @param {string} data.tanggal - Tanggal ujian YYYY-MM-DD (required)
    * @param {number} data.semester_id - ID mst_semester (required)
    * @param {string} [data.keterangan] - Keterangan (optional)
    * @returns {Promise<{data: any, error: any}>}
    */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing ujian
   * @param {number|string} id - Ujian ID
   * @param {Object} data - Updated ujian data
   * @param {number} data.mst_mapel_id - Mapel ID (required)
   * @param {number} data.mst_kelas_id - Kelas ID (required)
   * @param {number} data.jenis - Jenis ujian 1-5 (required)
   * @param {string} data.nama - Nama ujian (required)
   * @param {string} data.tanggal - Tanggal ujian YYYY-MM-DD (required)
   * @param {number} data.semester_id - ID mst_semester (required)
   * @param {string} [data.keterangan] - Keterangan (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete ujian
   * @param {number|string} id - Ujian ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get nilai (scores) by ujian ID
   * @param {number|string} id - Ujian ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getNilaiByUjian: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}/nilai`)
  },

  /**
   * Get ujian by kelas ID
   * @param {number|string} kelasId - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByKelas: async (kelasId) => {
    return await apiService.get(`${BASE_URL}/kelas/${kelasId}`)
  },
}

export default ujianService