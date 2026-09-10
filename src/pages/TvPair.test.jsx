import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import TvPair from './TvPair'
import { apiService } from '../utils/api'
import { canAccessPath } from '../utils/routeAccess'

vi.mock('../utils/api', () => ({ apiService: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  apiService.get.mockResolvedValue({ data: { data: { data: [], last_page: 1 } } })
  apiService.post.mockResolvedValue({ data: { success: true } })
})

it('restricts TV management to its permission', () => {
  expect(canAccessPath({ permissions: [] }, '/tv-pair')).toBe(false)
  expect(canAccessPath({ permissions: [{ code: 'tv-device.manage' }] }, '/tv-pair')).toBe(true)
})

it('submits a normalized pairing code with no class in signage mode', async () => {
  render(<TvPair />)
  fireEvent.change(screen.getByLabelText('Kode pairing'), { target: { value: 'ab7k9q' } })
  fireEvent.change(screen.getByLabelText('Nama TV'), { target: { value: 'TV Lobby' } })
  fireEvent.click(screen.getByRole('button', { name: 'Setujui pairing' }))
  await waitFor(() => expect(apiService.post).toHaveBeenCalledWith('/tv/pairing/approve', {
    user_code: 'AB7K9Q', name: 'TV Lobby', mode: 'signage', class_id: null,
  }))
  expect(await screen.findByRole('status')).toHaveTextContent('TV berhasil dihubungkan.')
})