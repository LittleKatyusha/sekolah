import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/rapor'
const LIST_URL = '/akademik/rapor/'

export const raporService = {
  /**
   * Get all rapor with pagination and filtering
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
   * Get rapor details by ID
   * @param {number|string} id - Rapor ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new rapor
   * @param {Object} data - Rapor data
   * @param {number} data.mst_siswa_id - Siswa ID (required)
   * @param {number} data.semester - Semester (1=Ganjil, 2=Genap) (required)
   * @param {number} data.tahun_ajaran_id - Tahun Ajaran ID (required)
   * @param {string} [data.catatan_wali] - Catatan wali kelas
   * @param {number} [data.sakit] - Jumlah hari sakit
   * @param {number} [data.izin] - Jumlah hari izin
   * @param {number} [data.tanpa_keterangan] - Jumlah hari tanpa keterangan
   * @param {Array} [data.details] - Detail nilai per mapel
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing rapor
   * @param {number|string} id - Rapor ID
   * @param {Object} data - Updated rapor data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete rapor
   * @param {number|string} id - Rapor ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get rapor by siswa ID
   * @param {number|string} siswaId - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getBySiswa: async (siswaId) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`)
  },

  /**
   * Get rapor detail (with nilai per mapel)
   * @param {number|string} id - Rapor ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getDetail: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}/detail`)
  },

  /**
   * Generate rapor dari nilai for a single siswa
   * POST /akademik/rapor/generate-dari-nilai
   * @param {Object} data - { siswa_id, semester }
   * @returns {Promise<{data: any, error: any}>}
   */
  generateDariNilai: async (data) => {
    return await apiService.post(`${BASE_URL}/generate-dari-nilai`, data)
  },

  /**
   * Generate rapor dari nilai for an entire kelas
   * POST /akademik/rapor/generate-kelas
   * @param {Object} data - { kelas_id, semester }
   * @returns {Promise<{data: any, error: any}>}
   */
  generateKelas: async (data) => {
    return await apiService.post(`${BASE_URL}/generate-kelas`, data)
  },

  /**
   * Generate narasi rapor otomatis menggunakan AI (OpenAI)
   * POST /akademik/rapor/{id}/generate-narasi
   * @param {number|string} id - Rapor ID
   * @param {Object} [options]
   * @param {string|null} [options.catatan_guru] - Catatan tambahan dari guru
   * @param {boolean} [options.pakai_cache] - Kembalikan narasi cache jika ada
   * @returns {Promise<{data: any, error: any}>}
   */
  generateNarasi: async (id, options = {}) => {
    return await apiService.post(`${BASE_URL}/${id}/generate-narasi`, options)
  },
}

export default raporService
