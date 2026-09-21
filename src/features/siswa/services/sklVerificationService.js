import api, { apiService } from '../../../utils/api'

export const sklVerificationService = {
  /**
   * Verifikasi keabsahan dokumen SKL secara publik.
   * @param {string} token
   * @returns {Promise<{data: any, error: any}>}
   */
  verify: async (token) => {
    return await apiService.get(`/public/skl/verify/${encodeURIComponent(token)}`)
  },
}

export default sklVerificationService
