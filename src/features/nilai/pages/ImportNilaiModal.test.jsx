import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportNilaiModal from './ImportNilaiModal'
import { nilaiService } from '../services/nilaiService'
import * as templateUtils from '../utils/templateUtils'

vi.mock('../services/nilaiService', () => ({
  nilaiService: {
    importExcel: vi.fn(),
  },
}))

vi.mock('../utils/templateUtils', () => ({
  downloadNilaiTemplate: vi.fn(),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('ImportNilaiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header, target info, and action buttons', () => {
    render(
      <ImportNilaiModal
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ujianId={10}
        kelasId={2}
        ujianName="UTS Matematika"
        className="X MIPA 1"
      />
    )
    expect(screen.getByText('Import Nilai Excel')).toBeDefined()
    expect(screen.getByText('UTS Matematika')).toBeDefined()
    expect(screen.getByText('X MIPA 1')).toBeDefined()
    expect(screen.getByText('Unduh Template')).toBeDefined()
    expect(screen.getByText('Pilih file Excel atau seret ke sini')).toBeDefined()
  })

  it('calls downloadNilaiTemplate when Unduh Template button is clicked', () => {
    const dummySiswa = [{ id: 1, nis: '1001', nama: 'Budi' }]
    render(
      <ImportNilaiModal
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ujianId={10}
        kelasId={2}
        ujianName="UTS Matematika"
        className="X MIPA 1"
        siswaList={dummySiswa}
      />
    )

    const downloadBtn = screen.getByRole('button', { name: /unduh template/i })
    fireEvent.click(downloadBtn)

    expect(templateUtils.downloadNilaiTemplate).toHaveBeenCalledWith(
      dummySiswa,
      'UTS Matematika',
      'X MIPA 1'
    )
  })

  it('submits valid excel file and displays import summary', async () => {
    const onSuccess = vi.fn()
    nilaiService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 25,
        failed: 0,
        skipped: 0,
        errors: [],
      },
      error: null,
    })

    render(
      <ImportNilaiModal
        onClose={vi.fn()}
        onSuccess={onSuccess}
        ujianId={10}
        kelasId={2}
        ujianName="UTS Matematika"
        className="X MIPA 1"
      />
    )

    const file = new File(['dummy-content'], 'nilai.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const submitBtn = screen.getByRole('button', { name: /import sekarang/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(nilaiService.importExcel).toHaveBeenCalledWith({
        file,
        trx_ujian_id: 10,
        mst_kelas_id: 2,
      })
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText('Berhasil')).toBeDefined()
      expect(screen.getByText('25')).toBeDefined()
      expect(screen.getByText('Tutup')).toBeDefined()
    })
  })

  it('displays error rows when partial rows fail', async () => {
    nilaiService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 1,
        failed: 1,
        skipped: 0,
        errors: [
          {
            row: 3,
            identifier: '9999',
            code: 'NOT_FOUND',
            message: "Siswa dengan NIS '9999' tidak ditemukan pada kelas ini.",
          },
        ],
      },
      error: null,
    })

    render(
      <ImportNilaiModal
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ujianId={10}
        kelasId={2}
      />
    )

    const file = new File(['content'], 'nilai.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const submitBtn = screen.getByRole('button', { name: /import sekarang/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('9999')).toBeDefined()
      expect(screen.getByText('NOT_FOUND')).toBeDefined()
      expect(screen.getByText("Siswa dengan NIS '9999' tidak ditemukan pada kelas ini.")).toBeDefined()
    })
  })
})
