import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import useAuthStore from '../../../store/useAuthStore'
import SekolahDetail from './SekolahDetail'
import { sekolahService } from '../services/sekolahService'
import { showDeleteConfirm, showSuccess } from '../../../utils/sweetalert'

vi.mock('../services/sekolahService', () => ({
  sekolahService: {
    getAll: vi.fn(),
    getSettings: vi.fn(),
    updateSetting: vi.fn(),
    updateAiSettings: vi.fn(),
    deleteSetting: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showDeleteConfirm: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

const setting = { id: 9, key: 'radius_absensi_meter', value: '150' }

const renderPage = async (user) => {
  useAuthStore.setState({ user })
  sekolahService.getAll.mockResolvedValue({ data: { data: [{ id: 1, nama_sekolah: 'SMP Test' }] }, error: null })
  sekolahService.getSettings.mockResolvedValue({ data: { data: [setting] }, error: null })

  render(
    <MemoryRouter>
      <SekolahDetail />
    </MemoryRouter>
  )

  await screen.findByText('radius_absensi_meter')
}

describe('SekolahDetail settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null })
  })

  it('updates a setting inline for an authorized school admin', async () => {
    sekolahService.updateSetting.mockResolvedValue({ data: {}, error: null })
    await renderPage({
      role: 'admin',
      roles: [],
      permissions: [{ code: 'sekolah.settings.update' }],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Edit setting radius_absensi_meter' }))
    const input = screen.getByRole('textbox', { name: 'Nilai setting radius_absensi_meter' })
    fireEvent.change(input, { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan setting radius_absensi_meter' }))

    await waitFor(() => {
      expect(sekolahService.updateSetting).toHaveBeenCalledWith(1, 9, { value: '200' })
      expect(showSuccess).toHaveBeenCalledWith('Setting "radius_absensi_meter" berhasil diperbarui!')
    })
  })

  it('allows superadmin to edit individual settings and AI configuration', async () => {
    sekolahService.updateSetting.mockResolvedValue({ data: {}, error: null })
    sekolahService.updateAiSettings.mockResolvedValue({ data: {}, error: null })
    sekolahService.deleteSetting.mockResolvedValue({ data: {}, error: null })
    showDeleteConfirm.mockResolvedValue({ isConfirmed: true })
    await renderPage({ role: 'superadmin', roles: [], permissions: [] })

    expect(screen.getByRole('button', { name: 'Edit Profil' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit setting radius_absensi_meter' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nilai setting radius_absensi_meter' }), {
      target: { value: '250' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan setting radius_absensi_meter' }))

    await waitFor(() => {
      expect(sekolahService.updateSetting).toHaveBeenCalledWith(1, 9, { value: '250' })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Hapus setting radius_absensi_meter' }))
    await waitFor(() => {
      expect(sekolahService.deleteSetting).toHaveBeenCalledWith(1, 9)
    })

    expect(screen.getByText('Simpan Pengaturan AI')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Model ID AI' }), {
      target: { value: 'gpt-4.1-mini' },
    })
    fireEvent.change(screen.getByLabelText('API Key AI'), {
      target: { value: 'test-api-key' },
    })
    fireEvent.click(screen.getByText('Simpan Pengaturan AI'))

    await waitFor(() => {
      expect(sekolahService.updateAiSettings).toHaveBeenCalledWith(1, {
        provider: 'openai',
        base_url: 'https://api.openai.com/v1',
        model_id: 'gpt-4.1-mini',
        api_key: 'test-api-key',
      })
    })
  })
})
