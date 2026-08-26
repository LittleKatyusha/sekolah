import { apiService } from '../../../utils/api'

/**
 * Service for managing Buku (Books)
 */
export const bukuService = {
  /**
   * Get all buku with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/perpustakaan/buku/', { params })
  },

  /**
   * Get available buku (books that can be borrowed)
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAvailable: async (params = {}) => {
    return await apiService.get('/perpustakaan/buku/available', { params })
  },

  /**
   * Get buku details by ID
   * @param {number|string} id - Buku ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/perpustakaan/buku/${id}`)
  },

  /**
   * Create new buku
   * @param {Object} data - Buku data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/perpustakaan/buku', data)
  },

  /**
   * Update existing buku
   * @param {number|string} id - Buku ID
   * @param {Object} data - Updated buku data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/perpustakaan/buku/${id}`, data)
  },

  /**
   * Delete buku
   * @param {number|string} id - Buku ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/perpustakaan/buku/${id}`)
  },

  importExcel: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await apiService.post('/perpustakaan/buku/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Get all peminjaman for a specific buku
   * @param {number|string} id - Buku ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getPeminjaman: async (id) => {
    return await apiService.get(`/perpustakaan/buku/${id}/peminjaman`)
  },
}

/**
 * Service for managing Peminjaman (Borrowings)
 */
export const peminjamanService = {
  /**
   * Get all peminjaman with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get('/perpustakaan/peminjaman/', { params })
  },

  /**
   * Get peminjaman details by ID
   * @param {number|string} id - Peminjaman ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`/perpustakaan/peminjaman/${id}`)
  },

  /**
   * Create new peminjaman
   * @param {Object} data - Peminjaman data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post('/perpustakaan/peminjaman', data)
  },

  /**
   * Update existing peminjaman
   * @param {number|string} id - Peminjaman ID
   * @param {Object} data - Updated peminjaman data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`/perpustakaan/peminjaman/${id}`, data)
  },

  /**
   * Delete peminjaman
   * @param {number|string} id - Peminjaman ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`/perpustakaan/peminjaman/${id}`)
  },

  /**
   * Process pengembalian (return) for a peminjaman
   * @param {number|string} id - Peminjaman ID
   * @returns {Promise<{data: any, error: any}>}
   */
  pengembalian: async (id) => {
    return await apiService.post(`/perpustakaan/peminjaman/${id}/pengembalian`)
  },

  /**
   * Get overdue peminjaman
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getOverdue: async (params = {}) => {
    return await apiService.get('/perpustakaan/peminjaman/overdue', { params })
  },

  /**
   * Get peminjaman by siswa ID
   * @param {number|string} siswaId - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getBySiswa: async (siswaId) => {
    return await apiService.get(`/perpustakaan/peminjaman/siswa/${siswaId}`)
  },
}

export default {
  bukuService,
  peminjamanService,
}