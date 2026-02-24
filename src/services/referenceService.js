import { apiService } from '../utils/api'

const BASE_URL = '/admin/references'

export const referenceService = {
  /**
   * Fetches references for a specific category.
   * @param {string} category - The category name (e.g., 'jenis_kelamin', 'pendidikan', 'pekerjaan').
   * @returns {Promise<{data: any, error: any}>}
   */
  getReferencesByCategory: async (category) => {
    return await apiService.get(`${BASE_URL}/category/${category}`)
  },
}

export default referenceService