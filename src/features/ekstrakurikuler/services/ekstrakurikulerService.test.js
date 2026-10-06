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
import { eksSiswaService, ekstrakurikulerService } from './ekstrakurikulerService'

beforeEach(() => vi.clearAllMocks())

describe('ekstrakurikulerService', () => {
  it('calls bulkCreate endpoint with payload', async () => {
    const payload = {
      ekstrakurikuler_id: 1,
      siswa_ids: [10, 11],
      tanggal_daftar: '2026-10-06',
      status: 'aktif',
    }
    await eksSiswaService.bulkCreate(payload)
    expect(apiService.post).toHaveBeenCalledWith('/ekstrakurikuler/pendaftaran/bulk', payload)
  })

  it('fetches participants by ekstrakurikuler', async () => {
    await eksSiswaService.getByEkstrakurikuler(5)
    expect(apiService.get).toHaveBeenCalledWith('/ekstrakurikuler/pendaftaran/ekstrakurikuler/5')
  })
})
