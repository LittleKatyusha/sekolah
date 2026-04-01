import { apiService } from '../../../utils/api'

const BASE_URL = '/pembayaran-spp'

export const pembayaranSppService = {
  /**
   * Fetches a list of pembayaran SPP with AG Grid support.
   * @param {Object} params - Query parameters for filtering and pagination.
   * @returns {Promise<{data: any, error: any}>}
   */
  getPembayaranSppList: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Fetches a single pembayaran SPP by ID.
   * @param {number|string} id - The ID of the pembayaran SPP.
   * @returns {Promise<{data: any, error: any}>}
   */
  getPembayaranSppById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Creates a new pembayaran SPP record.
   * @param {Object} data - The data for the new pembayaran SPP.
   * @returns {Promise<{data: any, error: any}>}
   */
  createPembayaranSpp: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Updates an existing pembayaran SPP record.
   * @param {number|string} id - The ID of the pembayaran SPP to update.
   * @param {Object} data - The updated data for the pembayaran SPP.
   * @returns {Promise<{data: any, error: any}>}
   */
  updatePembayaranSpp: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Deletes a pembayaran SPP record.
   * @param {number|string} id - The ID of the pembayaran SPP to delete.
   * @returns {Promise<{data: any, error: any}>}
   */
  deletePembayaranSpp: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Fetches pembayaran SPP records by student ID.
   * @param {number|string} siswaId - The ID of the student.
   * @returns {Promise<{data: any, error: any}>}
   */
  getPembayaranBySiswa: async (siswaId) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`)
  },

  /**
   * Fetches payment status for a student.
   * @param {number|string} siswaId - The ID of the student.
   * @param {string} [tahunAjaran] - Optional academic year filter (e.g., '2025/2026').
   * @returns {Promise<{data: any, error: any}>}
   */
  getStatusPembayaran: async (siswaId, tahunAjaran = null) => {
    const params = tahunAjaran ? { tahun_ajaran: tahunAjaran } : {}
    return await apiService.get(`${BASE_URL}/status/${siswaId}`, { params })
  },

  /**
   * Processes a single SPP payment.
   * @param {Object} data - The payment data.
   * @returns {Promise<{data: any, error: any}>}
   */
  bayarSpp: async (data) => {
    return await apiService.post(`${BASE_URL}/bayar`, data)
  },

  /**
   * Calculates late payment fees (denda).
   * @param {Object} params - Parameters for calculating late fees.
   * @param {number|string} params.tarifSppId - The tariff ID.
   * @param {number} params.bulan - The month (1-12).
   * @param {number} params.tahun - The year.
   * @param {string} [params.tanggalBayar] - Optional payment date.
   * @returns {Promise<{data: any, error: any}>}
   */
  hitungDenda: async ({ tarifSppId, bulan, tahun, tanggalBayar = null }) => {
    const params = {
      tarif_spp_id: tarifSppId,
      bulan,
      tahun,
    }
    if (tanggalBayar) {
      params.tanggal_bayar = tanggalBayar
    }
    return await apiService.get(`${BASE_URL}/hitung-denda`, { params })
  },

  /**
   * Fetches arrears (tunggakan) for a student.
   * @param {number|string} siswaId - The ID of the student.
   * @param {Object} params - Query parameters.
   * @param {number|string} params.tarifSppId - The tariff ID.
   * @param {number} params.tahun - The year.
   * @returns {Promise<{data: any, error: any}>}
   */
  getTunggakan: async (siswaId, { tarifSppId, tahun }) => {
    const params = {
      tarif_spp_id: tarifSppId,
      tahun,
    }
    return await apiService.get(`${BASE_URL}/tunggakan/${siswaId}`, { params })
  },

  /**
   * Processes payment for multiple months at once.
   * @param {Object} data - The payment data for multiple months.
   * @returns {Promise<{data: any, error: any}>}
   */
  bayarMultiple: async (data) => {
    return await apiService.post(`${BASE_URL}/bayar-multiple`, data)
  },
}

export default pembayaranSppService
