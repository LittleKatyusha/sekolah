import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiService } from '../../../utils/api'
import { anggotaService, organisasiService, jabatanService } from './organisasiService'

beforeEach(() => vi.clearAllMocks())

describe('organisasiService', () => {
  it('calls anggotaService.bulkCreate endpoint with payload', async () => {
    const payload = {
      organisasi_id: 1,
      siswa_ids: [10, 11],
      jabatan_id: 2,
      tanggal_masuk: '2026-07-01',
      status: 1,
      periode: '2026/2027',
    }
    await anggotaService.bulkCreate(payload)
    expect(apiService.post).toHaveBeenCalledWith('/organisasi/anggota/bulk', payload)
  })

  it('calls anggotaService.getByOrganisasi correctly', async () => {
    await anggotaService.getByOrganisasi(3)
    expect(apiService.get).toHaveBeenCalledWith('/organisasi/anggota/organisasi/3')
  })

  it('calls organisasiService and jabatanService endpoints correctly', async () => {
    await organisasiService.getAktif()
    expect(apiService.get).toHaveBeenCalledWith('/organisasi/aktif')

    await jabatanService.getAllList()
    expect(apiService.get).toHaveBeenCalledWith('/organisasi/jabatan/all')
  })
})
