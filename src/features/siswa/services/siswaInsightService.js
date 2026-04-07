import { apiService } from '../../../utils/api'

const BASE = '/siswa'

/**
 * siswaInsightService
 *
 * Wrapper untuk endpoint intelligence per siswa:
 *   GET  /api/v1/siswa/{id}/insight
 *   GET  /api/v1/siswa/{id}/risk-profile
 *   GET  /api/v1/siswa/{id}/academic-progress
 *   POST /api/v1/siswa/{id}/insight/invalidate
 *   GET  /api/v1/kelas/{id}/risk-summary
 */
export const siswaInsightService = {
  /**
   * Dashboard 360° lengkap per siswa.
   * @param {number|string} id
   * @param {boolean} [refresh=false] - paksa refresh cache
   */
  getInsight: async (id, refresh = false) => {
    const params = refresh ? { refresh: 1 } : {}
    return await apiService.get(`${BASE}/${id}/insight`, { params })
  },

  /**
   * Profil risiko holistik (5 dimensi).
   * @param {number|string} id
   * @param {boolean} [refresh=false]
   */
  getRiskProfile: async (id, refresh = false) => {
    const params = refresh ? { refresh: 1 } : {}
    return await apiService.get(`${BASE}/${id}/risk-profile`, { params })
  },

  /**
   * Progres akademik: tren nilai, anomali, proyeksi, ranking.
   * @param {number|string} id
   * @param {boolean} [refresh=false]
   */
  getAcademicProgress: async (id, refresh = false) => {
    const params = refresh ? { refresh: 1 } : {}
    return await apiService.get(`${BASE}/${id}/academic-progress`, { params })
  },

  /**
   * Invalidate cache insight siswa.
   * @param {number|string} id
   */
  invalidateCache: async (id) => {
    return await apiService.post(`${BASE}/${id}/insight/invalidate`)
  },

  /**
   * Distribusi risiko seluruh siswa di satu kelas.
   * @param {number|string} kelasId
   */
  getKelasRiskSummary: async (kelasId) => {
    return await apiService.get(`/kelas/${kelasId}/risk-summary`)
  },
}

export default siswaInsightService
