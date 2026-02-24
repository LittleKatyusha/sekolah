import { apiService } from '../../../utils/api'

const BASE_URL = '/wali'

export const waliService = {
  /**
   * Fetches a list of walis.
   * @param {Object} params - Query parameters for filtering and pagination.
   * @returns {Promise<{data: any, error: any}>}
   */
  getWalis: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Fetches a single wali by ID.
   * @param {number|string} id - The ID of the wali.
   * @returns {Promise<{data: any, error: any}>}
   */
  getWaliById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Creates a new wali.
   * @param {Object} data - The data for the new wali.
   * @returns {Promise<{data: any, error: any}>}
   */
  createWali: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Updates an existing wali.
   * @param {number|string} id - The ID of the wali to update.
   * @param {Object} data - The updated data for the wali.
   * @returns {Promise<{data: any, error: any}>}
   */
  updateWali: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Deletes a wali.
   * @param {number|string} id - The ID of the wali to delete.
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteWali: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },
}

export default waliService