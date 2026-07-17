import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/tugas'
const LIST_URL = '/akademik/tugas/'

export const tugasService = {
  /**
   * Get all tugas with pagination and filtering
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
   * Get tugas details by ID
   * @param {number|string} id - Tugas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new tugas
   * @param {Object} data - Tugas data
   * @param {number} data.mst_guru_mapel_id - Guru Mapel ID (required)
   * @param {number} data.mst_kelas_id - Kelas ID (required)
   * @param {string} data.judul - Title (required)
   * @param {string} [data.deskripsi] - Description (optional)
   * @param {string} data.tenggat_waktu - Deadline datetime (required)
   * @param {string} [data.file_path] - File path (optional)
   * @param {number} [data.status] - Status: 1=aktif, 0=nonaktif (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing tugas
   * @param {number|string} id - Tugas ID
   * @param {Object} data - Updated tugas data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete tugas
   * @param {number|string} id - Tugas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get tugas by kelas ID
   * @param {number|string} kelasId - Kelas ID
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.mst_guru_mapel_id] - Filter by guru mapel ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByKelas: async (kelasId, params = {}) => {
    return await apiService.get(`${BASE_URL}/kelas/${kelasId}`, { params })
  },

  /**
   * Get tugas by guru mapel ID
   * @param {number|string} guruMapelId - Guru Mapel ID
   * @param {Object} [params] - Optional query parameters
   * @param {string} [params.status] - Filter by status
   * @param {string} [params.search] - Search keyword
   * @returns {Promise<{data: any, error: any}>}
   */
  getByGuruMapel: async (guruMapelId, params = {}) => {
    return await apiService.get(`${BASE_URL}/guru-mapel/${guruMapelId}`, { params })
  },
}

// TugasSiswa (Student Submissions) service
const TUGAS_SISWA_BASE_URL = '/akademik/tugas-siswa'
const TUGAS_SISWA_LIST_URL = '/akademik/tugas-siswa/'

export const tugasSiswaService = {
  normalizePayload: (data = {}) => ({
    ...data,
    tugas_id: data.tugas_id ?? data.mst_tugas_id ?? null,
    siswa_id: data.siswa_id ?? data.mst_siswa_id ?? null,
    mst_tugas_id: data.mst_tugas_id ?? data.tugas_id ?? null,
    mst_siswa_id: data.mst_siswa_id ?? data.siswa_id ?? null,
    jawaban_teks: data.jawaban_teks ?? data.jawaban ?? null,
    file_siswa: data.file_siswa ?? data.file_path ?? null,
    waktu_kumpul: data.waktu_kumpul ?? data.waktu_kumpl ?? null,
    status_kumpul: data.status_kumpul ?? data.status_kumpl ?? null,
    catatan_guru: data.catatan_guru ?? data.catatan ?? null,
  }),

  /**
   * Get all tugas siswa with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search keyword
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(TUGAS_SISWA_LIST_URL, { params })
  },

  /**
   * Get tugas siswa details by ID
   * @param {number|string} id - TugasSiswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${TUGAS_SISWA_BASE_URL}/${id}`)
  },

  /**
   * Create new tugas siswa (submit assignment)
   * @param {Object} data - TugasSiswa data
   * @param {number} data.mst_tugas_id - Tugas ID (required)
   * @param {number} data.mst_siswa_id - Siswa ID (required)
   * @param {string} [data.jawaban_teks] - Answer text (optional)
   * @param {string} [data.file_siswa] - Submitted file path (optional)
   * @param {string} [data.waktu_kumpul] - Submission date (optional)
   * @param {string|number} [data.status_kumpul] - Collection status (optional)
   * @param {number} [data.nilai] - Grade/score (optional)
   * @param {string} [data.catatan_guru] - Teacher notes (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(TUGAS_SISWA_BASE_URL, tugasSiswaService.normalizePayload(data))
  },

  /**
   * Update existing tugas siswa
   * @param {number|string} id - TugasSiswa ID
   * @param {Object} data - Updated tugas siswa data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${TUGAS_SISWA_BASE_URL}/${id}`, tugasSiswaService.normalizePayload(data))
  },

  /**
   * Delete tugas siswa
   * @param {number|string} id - TugasSiswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${TUGAS_SISWA_BASE_URL}/${id}`)
  },

  /**
   * Get submissions by tugas ID
   * @param {number|string} tugasId - Tugas ID
   * @param {Object} [params] - Optional query parameters
  * @param {string} [params.status_kumpul] - Filter by collection status
   * @returns {Promise<{data: any, error: any}>}
   */
  getByTugas: async (tugasId, params = {}) => {
    return await apiService.get(`${TUGAS_SISWA_BASE_URL}/tugas/${tugasId}`, { params })
  },

  /**
   * Get submissions by siswa ID
   * @param {number|string} siswaId - Siswa ID
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.mst_tugas_id] - Filter by tugas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getBySiswa: async (siswaId, params = {}) => {
    return await apiService.get(`${TUGAS_SISWA_BASE_URL}/siswa/${siswaId}`, { params })
  },

  /**
   * Grade a submission
   * @param {number|string} id - TugasSiswa ID
   * @param {Object} data - Grading data (NilaiTugasSiswaRequest)
   * @param {number} data.nilai - Grade/score
   * @param {string} [data.catatan] - Teacher notes
   * @returns {Promise<{data: any, error: any}>}
   */
  nilai: async (id, data) => {
    return await apiService.post(`${TUGAS_SISWA_BASE_URL}/${id}/nilai`, {
      ...data,
      catatan_guru: data.catatan_guru ?? data.catatan ?? null,
    })
  },

  /**
   * Submit assignment for a student
   * @param {number|string} siswaId - Siswa ID
   * @param {number|string} tugasId - Tugas ID
   * @param {Object} [data] - Submission data
   * @returns {Promise<{data: any, error: any}>}
   */
  kumpulkan: async (siswaId, tugasId, data = {}) => {
    return await apiService.post(
      `${TUGAS_SISWA_BASE_URL}/siswa/${siswaId}/tugas/${tugasId}/kumpulkan`,
      tugasSiswaService.normalizePayload(data)
    )
  },
}

export default tugasService