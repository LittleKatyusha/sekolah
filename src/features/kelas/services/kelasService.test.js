import { expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({
  apiService: { put: vi.fn() },
}))

import { apiService } from '../../../utils/api'
import { kelasService } from './kelasService'

it('updates kelas through the backend PUT route', async () => {
  await kelasService.update(7, { nama_kelas: 'X-A' })

  expect(apiService.put).toHaveBeenCalledWith('/kelas/7', expect.any(FormData), expect.any(Object))
})
