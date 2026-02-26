import apiService from '../../../utils/api'

/**
 * Service for statistik/analytics endpoints
 */
const statistikService = {
  /**
   * Get overview statistics (KPI cards + sparkline)
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getOverview: (params = {}) => {
    return apiService.get('/statistik/overview', { params })
  },

  /**
   * Get academic statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getAkademik: (params = {}) => {
    return apiService.get('/statistik/akademik', { params })
  },

  /**
   * Get attendance statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getKehadiran: (params = {}) => {
    return apiService.get('/statistik/kehadiran', { params })
  },

  /**
   * Get financial statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getKeuangan: (params = {}) => {
    return apiService.get('/statistik/keuangan', { params })
  },

  /**
   * Get BK (counseling) statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getBk: (params = {}) => {
    return apiService.get('/statistik/bk', { params })
  },

  /**
   * Get PPDB (enrollment) statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getPpdb: (params = {}) => {
    return apiService.get('/statistik/ppdb', { params })
  },

  /**
   * Get library statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getPerpustakaan: (params = {}) => {
    return apiService.get('/statistik/perpustakaan', { params })
  },

  /**
   * Get exam statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getUjian: (params = {}) => {
    return apiService.get('/statistik/ujian', { params })
  },

  /**
   * Get extracurricular statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getEkstrakurikuler: (params = {}) => {
    return apiService.get('/statistik/ekstrakurikuler', { params })
  },

  /**
   * Get organization statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getOrganisasi: (params = {}) => {
    return apiService.get('/statistik/organisasi', { params })
  },

  /**
   * Get teacher statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getGuru: (params = {}) => {
    return apiService.get('/statistik/guru', { params })
  },

  /**
   * Get SPK (decision support) statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  getSpk: (params = {}) => {
    return apiService.get('/statistik/spk', { params })
  },
}

export { statistikService }
export default statistikService