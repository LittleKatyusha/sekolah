import { apiService } from '../../../utils/api'

export const listSoals = async (params = {}) => {
  return apiService.get('/akademik/soals', { params })
}

export const storeSoal = async (soalData) => {
  return apiService.post('/akademik/soals', soalData)
}

export const showSoal = async (id) => {
  return apiService.get(`/akademik/soals/${id}`)
}

export const updateSoal = async (id, updateData) => {
  return apiService.put(`/akademik/soals/${id}`, updateData)
}

export const deleteSoal = async (id) => {
  return apiService.delete(`/akademik/soals/${id}`)
}

export const generateSoalAi = async (params) => {
  return apiService.post('/akademik/soals/generate', params)
}