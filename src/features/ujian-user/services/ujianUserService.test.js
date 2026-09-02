import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({ apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

import { apiService } from '../../../utils/api'
import { ujianUserService } from './ujianUserService'

beforeEach(() => vi.clearAllMocks())

describe('ujianUserService exam engine contracts', () => {
  it('gets only session-assigned questions', async () => {
    await ujianUserService.getSoal(9)
    expect(apiService.get).toHaveBeenCalledWith('/akademik/ujian-user/9/soal')
  })

  it('creates then updates a saved answer', async () => {
    const create = { trx_ujian_user_id: 9, mst_soal_id: 12, mst_soal_opsi_id: 44, ragu_ragu: false }
    await ujianUserService.simpanJawaban(create)
    await ujianUserService.updateJawaban(77, { mst_soal_opsi_id: 45, ragu_ragu: false })
    expect(apiService.post).toHaveBeenCalledWith('/akademik/ujian-jawaban', create)
    expect(apiService.put).toHaveBeenCalledWith('/akademik/ujian-jawaban/77', { mst_soal_opsi_id: 45, ragu_ragu: false })
  })

  it('finishes without client-supplied answer batches', async () => {
    await ujianUserService.selesaikanUjian(9)
    expect(apiService.post).toHaveBeenCalledWith('/akademik/ujian-user/9/selesaikan')
  })

  it('calls reportViolation endpoint with correct payload', async () => {
    const mockResponse = { data: { success: true, data: { violation_count: 1, auto_submitted: false } } }
    apiService.post.mockResolvedValueOnce(mockResponse)

    const result = await ujianUserService.reportViolation(10, 'TAB_SWITCH')

    expect(apiService.post).toHaveBeenCalledWith('/akademik/ujian-user/10/pelanggaran', {
      type: 'TAB_SWITCH',
    })
    expect(result).toEqual(mockResponse)
  })
})
