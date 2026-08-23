import { apiService } from '../../../utils/api'

const BASE_URL = '/email'

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? null

export const emailService = {
  /**
   * Kirim email penawaran produk ke sekolah.
   * @param {{ email: string, school_name: string, cta_url?: string }} data
   */
  sendOffer: async (data) => {
    const response = await apiService.post(`${BASE_URL}/offer`, data)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  /**
   * Kirim email custom beserta file lampiran opsional.
   * @param {{ email: string, subject: string, content: string, attachments?: File[] }} data
   */
  sendCustom: async (data) => {
    let payload = data
    let headers = {}

    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('subject', data.subject)
      formData.append('content', data.content)
      data.attachments.forEach((file) => {
        formData.append('attachments[]', file)
      })
      payload = formData
      headers = { 'Content-Type': 'multipart/form-data' }
    }

    const response = await apiService.post(`${BASE_URL}/send`, payload, { headers })
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  /**
   * Ambil daftar email masuk (inbox).
   * @param {{ page?: number, per_page?: number, search?: string }} params
   */
  getInbox: async (params = {}) => {
    const response = await apiService.get(`${BASE_URL}/inbox`, { params })
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  /**
   * Ambil detail email masuk dan tandai sudah dibaca.
   * @param {number|string} id
   */
  showInbox: async (id) => {
    const response = await apiService.get(`${BASE_URL}/inbox/${id}`)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  /**
   * Hapus email masuk.
   * @param {number|string} id
   */
  deleteInbox: async (id) => {
    const response = await apiService.delete(`${BASE_URL}/inbox/${id}`)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },
}


