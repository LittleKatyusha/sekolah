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

export const importSoal = async (fileOrFormData, defaultMapelId = null) => {
  let formData
  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData
  } else {
    formData = new FormData()
    formData.append('file', fileOrFormData)
    if (defaultMapelId) {
      formData.append('mst_mapel_id', defaultMapelId)
    }
  }

  return apiService.post('/akademik/soals/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const batchAssignUjian = async (payloadOrUjianId, soalIds = []) => {
  const payload = Array.isArray(soalIds) && soalIds.length > 0
    ? { trx_ujian_id: payloadOrUjianId, soal_ids: soalIds }
    : payloadOrUjianId

  return apiService.post('/akademik/soals/batch-assign-ujian', payload)
}

export const soalService = {
  listSoals,
  storeSoal,
  showSoal,
  updateSoal,
  deleteSoal,
  generateSoalAi,
  importSoal,
  batchAssignUjian,
}

export default soalService
