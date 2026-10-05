import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as XLSX from 'xlsx'
import AbsensiSiswaRekapBulanan from './AbsensiSiswaRekapBulanan'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showError } from '../../../utils/sweetalert'

vi.mock('../services/absensiSiswaService', () => ({
  absensiSiswaService: {
    getRekapBulanan: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
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

describe('AbsensiSiswaRekapBulanan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    kelasService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 1, nama_kelas: 'X-1' },
          { id: 2, nama_kelas: 'X-2' },
        ],
      },
    })
  })

  it('renders initial filter and elements correctly', async () => {
    render(
      <MemoryRouter>
        <AbsensiSiswaRekapBulanan />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(kelasService.getAll).toHaveBeenCalled()
    })

    expect(screen.getByText('Rekap Absensi Siswa Bulanan')).toBeDefined()
    expect(screen.getByText('Filter Periode')).toBeDefined()
    expect(screen.getByRole('button', { name: /tampilkan/i })).toBeDefined()
  })

  it('disables export excel when searching all classes and shows notice', async () => {
    absensiSiswaService.getRekapBulanan.mockResolvedValueOnce({
      data: {
        data: {
          total: 2,
          rekap: [
            { siswa_id: 101, nis: '1001', nama: 'Budi', kelas: 'X-1', hadir: 20, izin: 1, sakit: 0, alpha: 0, total_hari: 21 },
            { siswa_id: 102, nis: '1002', nama: 'Siti', kelas: 'X-2', hadir: 19, izin: 0, sakit: 2, alpha: 0, total_hari: 21 },
          ],
        },
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <AbsensiSiswaRekapBulanan />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(kelasService.getAll).toHaveBeenCalled()
    })

    // Click Tampilkan with default "Semua Kelas"
    fireEvent.click(screen.getByRole('button', { name: /tampilkan/i }))

    await waitFor(() => {
      expect(screen.getByText(/Export hanya tersedia per kelas/i)).toBeDefined()
    })

    const exportBtn = screen.getByRole('button', { name: /export excel/i })
    expect(exportBtn).toBeDefined()
    expect(exportBtn).toBeDisabled()
    expect(XLSX.writeFile).not.toHaveBeenCalled()
  })

  it('enables export excel when a specific class is selected and exports xlsx', async () => {
    absensiSiswaService.getRekapBulanan.mockResolvedValueOnce({
      data: {
        data: {
          total: 1,
          rekap: [
            { siswa_id: 101, nis: '1001', nama: 'Budi', kelas: 'X-1', hadir: 20, izin: 1, sakit: 0, alpha: 0, total_hari: 21 },
          ],
        },
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <AbsensiSiswaRekapBulanan />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(kelasService.getAll).toHaveBeenCalled()
    })

    // Select class X-1 (id: "1")
    const kelasSelect = screen.getByDisplayValue('Semua Kelas')
    fireEvent.change(kelasSelect, { target: { value: '1' } })

    fireEvent.click(screen.getByRole('button', { name: /tampilkan/i }))

    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeDefined()
    })

    const exportBtn = screen.getByRole('button', { name: /export excel/i })
    expect(exportBtn).not.toBeDisabled()
    expect(screen.queryByText(/Export hanya tersedia per kelas/i)).toBeNull()

    // Click Export Excel
    fireEvent.click(exportBtn)

    expect(XLSX.writeFile).toHaveBeenCalledTimes(1)
    const [workbook, filename] = XLSX.writeFile.mock.calls[0]
    expect(workbook).toBeDefined()
    expect(filename).toMatch(/^rekap-absensi-siswa-X-1-.*\.xlsx$/)
  })

  it('disables export excel when class filter changed without clicking tampilkan', async () => {
    absensiSiswaService.getRekapBulanan.mockResolvedValueOnce({
      data: {
        data: {
          total: 1,
          rekap: [
            { siswa_id: 101, nis: '1001', nama: 'Budi', kelas: 'X-1', hadir: 20, izin: 1, sakit: 0, alpha: 0, total_hari: 21 },
          ],
        },
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <AbsensiSiswaRekapBulanan />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(kelasService.getAll).toHaveBeenCalled()
    })

    // Select class X-1
    const kelasSelect = screen.getByDisplayValue('Semua Kelas')
    fireEvent.change(kelasSelect, { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /tampilkan/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export excel/i })).not.toBeDisabled()
    })

    // User changes filter to X-2 without clicking Tampilkan
    fireEvent.change(kelasSelect, { target: { value: '2' } })

    const exportBtn = screen.getByRole('button', { name: /export excel/i })
    expect(exportBtn).toBeDisabled()
    expect(screen.getByText(/Klik Tampilkan untuk memperbarui data/i)).toBeDefined()
  })
})
