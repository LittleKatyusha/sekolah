import { apiService } from '../../../utils/api'

const createCrudService = (basePath, extras = {}) => ({
  getAll: async (params = {}) => {
    return await apiService.get(`${basePath}/`, { params })
  },
  getById: async (id) => {
    return await apiService.get(`${basePath}/${id}`)
  },
  create: async (data) => {
    return await apiService.post(basePath, data)
  },
  update: async (id, data) => {
    return await apiService.put(`${basePath}/${id}`, data)
  },
  delete: async (id) => {
    return await apiService.delete(`${basePath}/${id}`)
  },
  ...extras,
})

const createReadOnlyService = (basePath, extras = {}) => ({
  getAll: async (params = {}) => {
    return await apiService.get(`${basePath}/`, { params })
  },
  getById: async (id) => {
    return await apiService.get(`${basePath}/${id}`)
  },
  ...extras,
})

export const tesMinatBakatService = {
  tes: createCrudService('/akademik/tes-minat-bakat', {
    getByKelas: async (kelasId) => {
      return await apiService.get(`/akademik/tes-minat-bakat/kelas/${kelasId}`)
    },
  }),
  aspek: createCrudService('/akademik/tes-minat-bakat-aspek'),
  pertanyaan: createCrudService('/akademik/tes-minat-bakat-pertanyaan', {
    getByTes: async (tesId) => {
      return await apiService.get(`/akademik/tes-minat-bakat-pertanyaan/tes/${tesId}`)
    },
  }),
  peserta: createCrudService('/akademik/tes-minat-bakat-peserta', {
    getByTes: async (tesId) => {
      return await apiService.get(`/akademik/tes-minat-bakat-peserta/tes/${tesId}`)
    },
    getBySiswa: async (siswaId) => {
      return await apiService.get(`/akademik/tes-minat-bakat-peserta/siswa/${siswaId}`)
    },
    start: async (id) => {
      return await apiService.post(`/akademik/tes-minat-bakat-peserta/${id}/mulai`)
    },
    complete: async (id) => {
      return await apiService.post(`/akademik/tes-minat-bakat-peserta/${id}/selesaikan`)
    },
  }),
  jawaban: createCrudService('/akademik/tes-minat-bakat-jawaban'),
  hasil: createReadOnlyService('/akademik/tes-minat-bakat-hasil', {
    getByPeserta: async (pesertaId) => {
      return await apiService.get(`/akademik/tes-minat-bakat-hasil/peserta/${pesertaId}`)
    },
  }),
}

export default tesMinatBakatService