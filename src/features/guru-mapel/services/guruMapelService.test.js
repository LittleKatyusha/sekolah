import { expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({
  apiService: { get: vi.fn() },
}))

import { apiService } from '../../../utils/api'
import { guruMapelService } from './guruMapelService'

it('loads assignments for the authenticated teacher', async () => {
  await guruMapelService.getMine()

  expect(apiService.get).toHaveBeenCalledWith('/guru-mapel/saya')
})