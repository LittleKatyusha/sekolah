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
    testAiConnection: vi.fn(),
    getMidtransSettings: vi.fn(),
    updateMidtransSettings: vi.fn(),
    testMidtransConnection: vi.fn(),
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
  sekolahService.getMidtransSettings.mockResolvedValue({
    data: {
      data: {
        client_key: 'SB-Mid-client-xxx',
        is_production: false,
        is_3ds: true,
        merchant_id: 'M123',
        has_server_key: true,
        is_custom: true,
      },
    },
    error: null,
  })

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
    // Under §4.2 / W07, superadmin relies on explicit permissions payload instead of client-side role string bypass
    await renderPage({
      role: 'superadmin',
      roles: [],
      permissions: [
        { code: 'sekolah.update' },
        { code: 'sekolah.settings.view' },
        { code: 'sekolah.settings.update' },
        { code: 'sekolah.settings.delete' },
      ],
    })

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

  it('allows user to test AI Gateway connection', async () => {
    sekolahService.testAiConnection.mockResolvedValue({
      data: {
        success: true,
        message: 'Koneksi AI Gateway berhasil! Respon diterima dalam 120ms.',
        data: {
          connected: true,
          provider: 'cloudflare',
          model: 'gpt-4o-mini',
          latency_ms: 120,
          sample_response: 'Pong',
        },
      },
      error: null,
    })

    // Under §4.2 / W07, superadmin relies on explicit permissions payload instead of client-side role string bypass
    await renderPage({
      role: 'superadmin',
      roles: [],
      permissions: [
        { code: 'sekolah.update' },
        { code: 'sekolah.settings.view' },
        { code: 'sekolah.settings.update' },
        { code: 'sekolah.settings.delete' },
      ],
    })

    fireEvent.change(screen.getByLabelText('Provider AI'), {
      target: { value: 'cloudflare' },
    })
    fireEvent.change(screen.getByLabelText('Base URL API AI'), {
      target: { value: 'https://gateway.ai.cloudflare.com/v1/test/openai' },
    })
    fireEvent.change(screen.getByLabelText('Model ID AI'), {
      target: { value: 'gpt-4o-mini' },
    })

    const testBtn = screen.getByRole('button', { name: /Test Koneksi AI Gateway/i })
    expect(testBtn).toBeInTheDocument()
    fireEvent.click(testBtn)

    await waitFor(() => {
      expect(sekolahService.testAiConnection).toHaveBeenCalledWith(1, expect.objectContaining({
        provider: 'cloudflare',
        base_url: 'https://gateway.ai.cloudflare.com/v1/test/openai',
        model_id: 'gpt-4o-mini',
      }))
      expect(showSuccess).toHaveBeenCalledWith(
        'Koneksi AI Gateway berhasil! Respon diterima dalam 120ms.',
        'Test Koneksi Berhasil'
      )
      expect(screen.getByText('Koneksi AI Gateway Berhasil')).toBeInTheDocument()
      expect(screen.getByText('Waktu respon: 120 ms')).toBeInTheDocument()
    })
  })

  it('allows school admin to update and test Midtrans settings', async () => {
    sekolahService.updateMidtransSettings.mockResolvedValue({ data: {}, error: null })
    sekolahService.testMidtransConnection.mockResolvedValue({
      data: { message: 'Koneksi ke Midtrans berhasil diverifikasi!', data: { latency_ms: 85 } },
      error: null,
    })

    await renderPage({
      role: 'admin',
      roles: [],
      permissions: [
        { code: 'sekolah.settings.view' },
        { code: 'sekolah.settings.update' },
      ],
    })

    expect(screen.getByText('Pengaturan Midtrans Payment Gateway')).toBeInTheDocument()

    const clientKeyInput = screen.getByLabelText('Client Key Midtrans')
    fireEvent.change(clientKeyInput, { target: { value: 'SB-Mid-client-new123' } })

    const testBtn = screen.getByRole('button', { name: /Test Koneksi Midtrans/i })
    fireEvent.click(testBtn)

    await waitFor(() => {
      expect(sekolahService.testMidtransConnection).toHaveBeenCalledWith(1, expect.objectContaining({
        is_production: false,
      }))
      expect(showSuccess).toHaveBeenCalledWith(
        'Koneksi ke Midtrans berhasil diverifikasi!',
        'Test Koneksi Midtrans Berhasil'
      )
      expect(screen.getByText('Koneksi Midtrans Berhasil')).toBeInTheDocument()
      expect(screen.getByText('Waktu respon: 85 ms')).toBeInTheDocument()
    })

    const saveBtn = screen.getByRole('button', { name: /Simpan Pengaturan Midtrans/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(sekolahService.updateMidtransSettings).toHaveBeenCalledWith(1, expect.objectContaining({
        client_key: 'SB-Mid-client-new123',
        is_production: false,
      }))
      expect(showSuccess).toHaveBeenCalledWith('Konfigurasi Midtrans berhasil disimpan!')
    })
  })
})
