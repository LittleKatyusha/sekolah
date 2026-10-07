import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CetakKartuModal from './CetakKartuModal'
import { siswaService } from '../services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'

vi.mock('../services/siswaService', () => ({
  siswaService: {
    cetakKartuPelajar: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showToast: vi.fn(),
}))

describe('CetakKartuModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    kelasService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 10, nama_kelas: 'X RPL 1' },
          { id: 11, nama_kelas: 'X RPL 2' },
        ],
      },
    })
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-pdf-url')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('renders modal options and triggers PDF download for all students', async () => {
    const fakeBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    siswaService.cetakKartuPelajar.mockResolvedValue({ data: fakeBlob, error: null })
    const onClose = vi.fn()

    render(<CetakKartuModal onClose={onClose} />)

    expect(screen.getByText('Cetak Kartu Pelajar Massal')).toBeInTheDocument()
    expect(screen.getByText('Semua Siswa Aktif')).toBeInTheDocument()
    expect(screen.getByText('Lembar A4 (10 Kartu)')).toBeInTheDocument()

    const submitBtn = screen.getByText('Unduh PDF Kartu')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(siswaService.cetakKartuPelajar).toHaveBeenCalledWith({
        format: 'a4',
        side: 'front',
        status: 'aktif',
      })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('allows selecting class filter and CR-80 PVC format', async () => {
    const fakeBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    siswaService.cetakKartuPelajar.mockResolvedValue({ data: fakeBlob, error: null })
    const onClose = vi.fn()

    render(<CetakKartuModal onClose={onClose} />)

    // Switch to kelas
    const kelasBtn = screen.getByText('Berdasarkan Kelas')
    fireEvent.click(kelasBtn)

    await waitFor(() => {
      expect(screen.getByDisplayValue('X RPL 1')).toBeInTheDocument()
    })

    // Switch to CR-80 PVC
    const cr80Radio = screen.getByLabelText(/Satuan CR-80/)
    fireEvent.click(cr80Radio)

    // Switch to both sides
    const bothRadio = screen.getByLabelText(/Depan & Belakang/)
    fireEvent.click(bothRadio)

    const submitBtn = screen.getByText('Unduh PDF Kartu')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(siswaService.cetakKartuPelajar).toHaveBeenCalledWith({
        format: 'cr80',
        side: 'both',
        status: 'aktif',
        kelas_id: 10,
      })
      expect(onClose).toHaveBeenCalled()
    })
  })
})
