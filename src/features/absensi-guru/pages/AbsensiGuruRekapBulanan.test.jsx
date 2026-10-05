import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as XLSX from 'xlsx'
import AbsensiGuruRekapBulanan from './AbsensiGuruRekapBulanan'
import { absensiGuruService } from '../services/absensiGuruService'

vi.mock('../services/absensiGuruService', () => ({
  absensiGuruService: {
    getRekapBulanan: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

vi.mock('xlsx', () => {
  const aoa_to_sheet = vi.fn((data) => ({ data }))
  const book_new = vi.fn(() => ({ Sheets: {}, SheetNames: [] }))
  const book_append_sheet = vi.fn((wb, ws, name) => {
    wb.Sheets[name] = ws
    wb.SheetNames.push(name)
  })
  const writeFile = vi.fn()
  return {
    utils: {
      aoa_to_sheet,
      book_new,
      book_append_sheet,
    },
    writeFile,
    default: {
      utils: { aoa_to_sheet, book_new, book_append_sheet },
      writeFile,
    },
  }
})

describe('AbsensiGuruRekapBulanan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders initial filter and elements correctly', () => {
    render(
      <MemoryRouter>
        <AbsensiGuruRekapBulanan />
      </MemoryRouter>
    )

    expect(screen.getByText('Rekap Absensi Guru Bulanan')).toBeDefined()
    expect(screen.getByText('Filter Periode')).toBeDefined()
    expect(screen.getByRole('button', { name: /tampilkan/i })).toBeDefined()
  })

  it('displays table and exports all teacher attendance to excel', async () => {
    absensiGuruService.getRekapBulanan.mockResolvedValueOnce({
      data: {
        data: {
          total: 2,
          rekap: [
            { guru_id: 1, nip: '19700101', nama: 'Guru Satu, M.Pd', hadir: 18, izin: 1, sakit: 1, alpha: 0, total_hari: 20 },
            { guru_id: 2, nip: '19800202', nama: 'Guru Dua, S.Pd', hadir: 20, izin: 0, sakit: 0, alpha: 0, total_hari: 20 },
          ],
        },
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <AbsensiGuruRekapBulanan />
      </MemoryRouter>
    )

    // Click Tampilkan
    fireEvent.click(screen.getByRole('button', { name: /tampilkan/i }))

    await waitFor(() => {
      expect(screen.getByText('Guru Satu, M.Pd')).toBeDefined()
      expect(screen.getByText('Guru Dua, S.Pd')).toBeDefined()
    })

    const exportBtn = screen.getByRole('button', { name: /export excel/i })
    expect(exportBtn).toBeDefined()
    expect(exportBtn).not.toBeDisabled()

    // Click Export Excel
    fireEvent.click(exportBtn)

    expect(XLSX.writeFile).toHaveBeenCalledTimes(1)
    const [workbook, filename] = XLSX.writeFile.mock.calls[0]
    expect(workbook).toBeDefined()
    expect(filename).toMatch(/^rekap-absensi-guru-.*\.xlsx$/)
  })
})
