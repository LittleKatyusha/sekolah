import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KartuPelajarSettingsCard from './KartuPelajarSettingsCard'
import { sekolahService } from '../services/sekolahService'

vi.mock('../services/sekolahService', () => ({
  sekolahService: {
    getKartuPelajarTemplate: vi.fn(),
    updateKartuPelajarTemplate: vi.fn(),
  },
}))

vi.mock('../../../services/fileUploadService', () => ({
  fileUploadService: {
    uploadFile: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

describe('KartuPelajarSettingsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sekolahService.getKartuPelajarTemplate.mockResolvedValue({
      data: {
        data: {
          card_width_mm: 85.6,
          card_height_mm: 54.0,
          bg_depan: '',
          bg_belakang: '',
          layout: {
            sekolah: { show: true, x: 6.0, y: 5.0, font_size: 7.5, color: '#1e3a8a', bold: true },
            foto: { show: true, x: 6.0, y: 13.5, width: 21.0, height: 27.0, border_radius: 2.0 },
            nama: { show: true, x: 30.0, y: 15.0, font_size: 8.5, color: '#0f172a', bold: true },
            nisn: { show: true, x: 30.0, y: 20.5, font_size: 7.0, color: '#334155', label: 'NISN: ' },
            nis: { show: true, x: 30.0, y: 24.5, font_size: 7.0, color: '#334155', label: 'NIS: ' },
            kelas: { show: true, x: 30.0, y: 28.5, font_size: 7.0, color: '#334155', label: 'Kelas: ' },
            qr: { show: true, x: 63.0, y: 28.0, size: 17.0 },
          },
        },
      },
      error: null,
    })
  })

  it('renders template settings and saves coordinate modifications', async () => {
    sekolahService.updateKartuPelajarTemplate.mockResolvedValue({ data: {}, error: null })

    render(<KartuPelajarSettingsCard sekolahId={1} />)

    await waitFor(() => {
      expect(sekolahService.getKartuPelajarTemplate).toHaveBeenCalledWith(1)
      expect(screen.getByText('Template & Form Koordinat Kartu Pelajar (CR-80)')).toBeInTheDocument()
    })

    const saveBtn = screen.getByText('Simpan Pengaturan')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(sekolahService.updateKartuPelajarTemplate).toHaveBeenCalledWith(1, expect.objectContaining({
        card_width_mm: 85.6,
        card_height_mm: 54.0,
      }))
    })
  })
})
