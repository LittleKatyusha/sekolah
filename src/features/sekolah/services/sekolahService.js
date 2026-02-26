import { apiService } from '../../../utils/api'

const BASE_URL = '/sekolah'

export const sekolahService = {
  /**
   * Get all sekolah with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
  },

  /**
   * Get sekolah details by ID
   * @param {number|string} id - Sekolah ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Get sekolah details by UUID
   * @param {string} uuid - Sekolah UUID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByUuid: async (uuid) => {
    return await apiService.get(`${BASE_URL}/uuid/${uuid}`)
  },

  /**
   * Create new sekolah
   * @param {Object} data - Sekolah data
   * @param {string} data.nama_sekolah - School name (required)
   * @param {string} [data.npsn] - NPSN
   * @param {string} [data.alamat] - Address
   * @param {string} [data.logo_path] - Logo path
   * @param {boolean} [data.is_active] - Active status
   * @param {string} [data.subscription_plan] - Subscription plan
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing sekolah
   * @param {number|string} id - Sekolah ID
   * @param {Object} data - Updated sekolah data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete sekolah
   * @param {number|string} id - Sekolah ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get settings for a sekolah
   * @param {number|string} sekolahId - Sekolah ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getSettings: async (sekolahId) => {
    return await apiService.get(`${BASE_URL}/${sekolahId}/settings`)
  },

  /**
   * Get a specific setting by ID for a sekolah
   * Endpoint: GET /sekolah/{sekolahId}/settings/{id}
   * @param {number|string} sekolahId - Sekolah ID
   * @param {number|string} settingId - Setting ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getSettingById: async (sekolahId, settingId) => {
    return await apiService.get(`${BASE_URL}/${sekolahId}/settings/${settingId}`)
  },

  /**
   * Create a setting for a sekolah
   * @param {number|string} sekolahId - Sekolah ID
   * @param {Object} data - Setting data { key, value }
   * @returns {Promise<{data: any, error: any}>}
   */
  createSetting: async (sekolahId, data) => {
    return await apiService.post(`${BASE_URL}/${sekolahId}/settings`, data)
  },

  /**
   * Update a setting for a sekolah
   * @param {number|string} sekolahId - Sekolah ID
   * @param {number|string} settingId - Setting ID
   * @param {Object} data - Setting data { value }
   * @returns {Promise<{data: any, error: any}>}
   */
  updateSetting: async (sekolahId, settingId, data) => {
    return await apiService.put(`${BASE_URL}/${sekolahId}/settings/${settingId}`, data)
  },

  /**
   * Delete a setting for a sekolah
   * @param {number|string} sekolahId - Sekolah ID
   * @param {number|string} settingId - Setting ID
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteSetting: async (sekolahId, settingId) => {
    return await apiService.delete(`${BASE_URL}/${sekolahId}/settings/${settingId}`)
  },

  /**
   * Get a setting by key
   * @param {number|string} sekolahId - Sekolah ID
   * @param {string} key - Setting key
   * @returns {Promise<{data: any, error: any}>}
   */
  getSettingByKey: async (sekolahId, key) => {
    return await apiService.get(`${BASE_URL}/${sekolahId}/settings-key/${key}`)
  },
}

export default sekolahService