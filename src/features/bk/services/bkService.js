import { apiService } from '../../../utils/api'

/**
 * Service for managing BK Jenis (counseling types)
 */
export const bkJenisService = {
  /**
   * Get all jenis BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/jenis/', { params })
  },

  /**
   * Get jenis BK details by ID
   * @param {number|string} id - Jenis BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/jenis/${id}`)
  },

  /**
   * Create new jenis BK
   * @param {Object} data - Jenis BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/jenis', data)
  },

  /**
   * Update existing jenis BK
   * @param {number|string} id - Jenis BK ID
   * @param {Object} data - Updated jenis BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/jenis/${id}`, data)
  },

  /**
   * Delete jenis BK
   * @param {number|string} id - Jenis BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/jenis/${id}`)
  },
}

/**
 * Service for managing BK Kategori (counseling categories)
 */
export const bkKategoriService = {
  /**
   * Get all kategori BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/kategori/', { params })
  },

  /**
   * Get kategori BK details by ID
   * @param {number|string} id - Kategori BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/kategori/${id}`)
  },

  /**
   * Create new kategori BK
   * @param {Object} data - Kategori BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/kategori', data)
  },

  /**
   * Update existing kategori BK
   * @param {number|string} id - Kategori BK ID
   * @param {Object} data - Updated kategori BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/kategori/${id}`, data)
  },

  /**
   * Delete kategori BK
   * @param {number|string} id - Kategori BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/kategori/${id}`)
  },
}

/**
 * Service for managing BK Kasus (counseling cases)
 */
export const bkKasusService = {
  /**
   * Get all kasus BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/kasus/', { params })
  },

  /**
   * Get kasus BK details by ID
   * @param {number|string} id - Kasus BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/kasus/${id}`)
  },

  /**
   * Create new kasus BK
   * @param {Object} data - Kasus BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/kasus', data)
  },

  /**
   * Update existing kasus BK
   * @param {number|string} id - Kasus BK ID
   * @param {Object} data - Updated kasus BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/kasus/${id}`, data)
  },

  /**
   * Delete kasus BK
   * @param {number|string} id - Kasus BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/kasus/${id}`)
  },

  /**
   * Get all kasus BK by siswa ID
   * @param {number|string} siswaId - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getBySiswa: async (siswaId) => {
    return await apiService.get(`/bk/kasus/siswa/${siswaId}`)
  },
}

/**
 * Service for managing BK Sesi (counseling sessions)
 */
export const bkSesiService = {
  /**
   * Get all sesi BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/sesi/', { params })
  },

  /**
   * Get sesi BK details by ID
   * @param {number|string} id - Sesi BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/sesi/${id}`)
  },

  /**
   * Create new sesi BK
   * @param {Object} data - Sesi BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/sesi', data)
  },

  /**
   * Update existing sesi BK
   * @param {number|string} id - Sesi BK ID
   * @param {Object} data - Updated sesi BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/sesi/${id}`, data)
  },

  /**
   * Delete sesi BK
   * @param {number|string} id - Sesi BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/sesi/${id}`)
  },
}

/**
 * Service for managing BK Hasil (counseling results/outcomes)
 */
export const bkHasilService = {
  /**
   * Get all hasil BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/hasil/', { params })
  },

  /**
   * Get hasil BK details by ID
   * @param {number|string} id - Hasil BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/hasil/${id}`)
  },

  /**
   * Create new hasil BK
   * @param {Object} data - Hasil BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/hasil', data)
  },

  /**
   * Update existing hasil BK
   * @param {number|string} id - Hasil BK ID
   * @param {Object} data - Updated hasil BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/hasil/${id}`, data)
  },

  /**
   * Delete hasil BK
   * @param {number|string} id - Hasil BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/hasil/${id}`)
  },
}

/**
 * Service for managing BK Tindakan (counseling follow-up actions)
 */
export const bkTindakanService = {
  /**
   * Get all tindakan BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/tindakan/', { params })
  },

  /**
   * Get tindakan BK details by ID
   * @param {number|string} id - Tindakan BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/tindakan/${id}`)
  },

  /**
   * Create new tindakan BK
   * @param {Object} data - Tindakan BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/tindakan', data)
  },

  /**
   * Update existing tindakan BK
   * @param {number|string} id - Tindakan BK ID
   * @param {Object} data - Updated tindakan BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/tindakan/${id}`, data)
  },

  /**
   * Delete tindakan BK
   * @param {number|string} id - Tindakan BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/tindakan/${id}`)
  },
}

/**
 * Service for managing BK Lampiran (counseling attachments/files)
 * Note: No update method — lampiran only supports list, store, show, and delete
 */
export const bkLampiranService = {
  /**
   * Get all lampiran BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/lampiran/', { params })
  },

  /**
   * Get lampiran BK details by ID
   * @param {number|string} id - Lampiran BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/lampiran/${id}`)
  },

  /**
   * Create new lampiran BK (supports file upload via FormData)
   * Note: The page component is responsible for creating the FormData object
   * @param {Object|FormData} data - Lampiran BK data (FormData for file uploads)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/lampiran', data)
  },

  /**
   * Delete lampiran BK
   * @param {number|string} id - Lampiran BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/lampiran/${id}`)
  },
}

/**
 * Service for managing BK Wali (parent/guardian involvement in counseling)
 */
export const bkWaliService = {
  /**
   * Get all wali BK with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/bk/wali/', { params })
  },

  /**
   * Get wali BK details by ID
   * @param {number|string} id - Wali BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/bk/wali/${id}`)
  },

  /**
   * Create new wali BK
   * @param {Object} data - Wali BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/bk/wali', data)
  },

  /**
   * Update existing wali BK
   * @param {number|string} id - Wali BK ID
   * @param {Object} data - Updated wali BK data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/bk/wali/${id}`, data)
  },

  /**
   * Delete wali BK
   * @param {number|string} id - Wali BK ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/bk/wali/${id}`)
  },
}

export default {
  bkJenisService,
  bkKategoriService,
  bkKasusService,
  bkSesiService,
  bkHasilService,
  bkTindakanService,
  bkLampiranService,
  bkWaliService,
}