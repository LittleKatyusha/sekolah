import { apiService } from '../../../utils/api'

const BASE_URL = '/whatsapp'

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? null

export const wahaService = {
  getSessionStatus: async () => {
    const response = await apiService.get(`${BASE_URL}/session`)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  startSession: async () => {
    const response = await apiService.post(`${BASE_URL}/session/start`, {})
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  stopSession: async () => {
    const response = await apiService.post(`${BASE_URL}/session/stop`, {})
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  getQrCode: async () => {
    const response = await apiService.get(`${BASE_URL}/qr`)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  sendMessage: async (data) => {
    const response = await apiService.post(`${BASE_URL}/send`, data)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  notifySpp: async (data) => {
    const response = await apiService.post(`${BASE_URL}/notify/spp`, data)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  notifyPpdb: async (data) => {
    const response = await apiService.post(`${BASE_URL}/notify/ppdb`, data)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },

  notifyEws: async (data) => {
    const response = await apiService.post(`${BASE_URL}/notify/ews`, data)
    return {
      ...response,
      payload: unwrapResponse(response),
    }
  },
}

export default wahaService