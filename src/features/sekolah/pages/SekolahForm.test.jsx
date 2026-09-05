import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import useAuthStore from '../../../store/useAuthStore'
import SekolahForm from './SekolahForm'
import { sekolahService } from '../services/sekolahService'
import { showSuccess } from '../../../utils/sweetalert'

vi.mock('../services/sekolahService', () => ({
  sekolahService: {
    getAll: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

describe('SekolahForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { role: 'superadmin', roles: [], permissions: [] },
    })
    sekolahService.getAll.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          nama_sekolah: 'SMA Negeri 1 Example',
          npsn: '12345678',
          alamat: 'Alamat Lama',
          logo_path: null,
          is_active: true,
          subscription_plan: 'premium',
        }],
      },
      error: null,
    })
    sekolahService.update.mockResolvedValue({ data: {}, error: null })
  })

  it('allows superadmin to update mst_sekolah', async () => {
    render(
      <MemoryRouter>
        <SekolahForm />
      </MemoryRouter>
    )

    const name = await screen.findByPlaceholderText('Masukkan nama sekolah')
    fireEvent.change(name, { target: { value: 'SMA Negeri 1 Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => {
      expect(sekolahService.update).toHaveBeenCalledWith(1, {
        nama_sekolah: 'SMA Negeri 1 Updated',
        npsn: '12345678',
        alamat: 'Alamat Lama',
        logo_path: null,
        is_active: true,
        subscription_plan: 'premium',
      })
      expect(showSuccess).toHaveBeenCalledWith('Profil sekolah berhasil diperbarui!')
    })
  })
})