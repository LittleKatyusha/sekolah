import { apiService } from '../../../utils/api'

export const raporVerificationService = {
  /**
   * Verifikasi keabsahan dokumen E-Rapor secara publik.
   * @param {string} token
   * @returns {Promise<{data: any, error: any}>}
   */
  verify: async (token) => {
    return await apiService.get(`/public/rapor/verify/${encodeURIComponent(token)}`)
  },
}

export default raporVerificationService
