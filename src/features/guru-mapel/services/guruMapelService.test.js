import { expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiService } from '../../../utils/api'
import { guruMapelService } from './guruMapelService'

it('loads assignments for the authenticated teacher', async () => {
  await guruMapelService.getMine()

  expect(apiService.get).toHaveBeenCalledWith('/guru-mapel/saya')
})

it('submits batch assignments for a teacher', async () => {
  const payload = { mst_guru_id: 5, mapel_ids: [1, 2, 3], mode: 'sync' }
  apiService.post.mockResolvedValue({ data: { success: true } })

  await guruMapelService.batchStore(payload)

  expect(apiService.post).toHaveBeenCalledWith('/guru-mapel/batch', payload)
})
