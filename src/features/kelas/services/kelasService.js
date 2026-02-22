import { apiService } from '../../../utils/api'

const BASE_URL = '/kelas'
const LIST_URL = '/kelas/'

export const kelasService = {
  /**
   * Get all kelas
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by nama_kelas
   * @param {number} [params.tingkat] - Filter by tingkat (10, 11, 12)
   * @param {string} [params.tahun_ajaran] - Filter by tahun ajaran
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get kelas details by ID
   * @param {number|string} id - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new kelas
   * @param {Object} data - Kelas data
   * @param {string} data.nama_kelas - Kelas name (e.g., "X IPA 1")
   * @param {number} data.tingkat - Tingkat (10, 11, or 12)
   * @param {string} data.tahun_ajaran - Tahun ajaran (e.g., "2024/2025")
   * @param {number} [data.kapasitas] - Kapasitas max students
   * @param {number} [data.wali_guru_id] - Wali guru user ID
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    // Convert data to FormData for multipart/form-data
    const formData = new FormData()
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key])
      }
    })
    
    return await apiService.post(BASE_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Update existing kelas
   * @param {number|string} id - Kelas ID
   * @param {Object} data - Updated kelas data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key])
      }
    })
    
    return await apiService.post(`${BASE_URL}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Delete kelas
   * @param {number|string} id - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get siswa by kelas ID
   * Endpoint: /kelas/{id}/siswa
   * @param {number|string} id - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getSiswaByKelasId: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}/siswa`)
  },

  /**
   * Backward-compatible alias for get siswa by kelas
   * @param {number|string} id - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getSiswa: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}/siswa`)
  },
}

export default kelasService