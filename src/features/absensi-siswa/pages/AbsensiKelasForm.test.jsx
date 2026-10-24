import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AbsensiKelasForm from './AbsensiKelasForm'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { kelasService } from '../../kelas/services/kelasService'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams({ kelas_id: '3', tanggal: '2026-10-24' }), vi.fn()],
  }
})

vi.mock('../services/absensiSiswaService', () => ({
  absensiSiswaService: {
    getAbsensiSiswa: vi.fn(),
    bulkAbsensiSiswa: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getSiswaByKelasId: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showConfirm: vi.fn(() => Promise.resolve({ isConfirmed: true })),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

const mockKelas = {
  id: 3,
  nama_kelas: 'XII-IPA-1',
}

const mockSiswaInKelas = {
  kelas: { id: 3, nama_kelas: 'XII-IPA-1' },
  siswa: [
    { id: 101, nis: '2024001', nama: 'Budi Santoso', jenis_kelamin: 'L' },
    { id: 102, nis: '2024002', nama: 'Siti Aminah', jenis_kelamin: 'P' },
    { id: 103, nis: '2024003', nama: 'Dewi Lestari', jenis_kelamin: '2' },
  ],
}

const mockExistingAbsensi = [
  { id: 1, mst_siswa_id: 101, status: 1, keterangan: 'Hadir tepat waktu' },
]

describe('AbsensiKelasForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    kelasService.getById.mockResolvedValue({
      data: { data: mockKelas },
      error: null,
    })

    kelasService.getSiswaByKelasId.mockResolvedValue({
      data: { data: mockSiswaInKelas },
      error: null,
    })

    absensiSiswaService.getAbsensiSiswa.mockResolvedValue({
      data: { data: mockExistingAbsensi },
      error: null,
    })

    absensiSiswaService.bulkAbsensiSiswa.mockResolvedValue({
      data: { message: '3 presensi berhasil disimpan' },
      error: null,
    })
  })

  it('renders student rows and existing attendance', async () => {
    render(
      <MemoryRouter>
        <AbsensiKelasForm />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Presensi Harian Siswa Per Kelas' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
      expect(screen.getByText('Siti Aminah')).toBeInTheDocument()
      expect(screen.getByText('Dewi Lestari')).toBeInTheDocument()
    })

    expect(screen.getByText('2024001')).toBeInTheDocument()
    expect(screen.getByText('2024002')).toBeInTheDocument()
    expect(screen.getByText('2024003')).toBeInTheDocument()

    // Gender badges
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getAllByText('P')).toHaveLength(2)
  })

  it('updates all rows to Hadir when "Tandai Semua Hadir" is clicked', async () => {
    render(
      <MemoryRouter>
        <AbsensiKelasForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    const markAllBtn = screen.getByRole('button', { name: /Tandai Semua Hadir/i })
    fireEvent.click(markAllBtn)

    // Check stats counter: Hadir: 3
    expect(screen.getByText('Hadir: 3')).toBeInTheDocument()
  })

  it('submits bulk attendance with proper payload', async () => {
    render(
      <MemoryRouter>
        <AbsensiKelasForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Mark all as Hadir
    const markAllBtn = screen.getByRole('button', { name: /Tandai Semua Hadir/i })
    fireEvent.click(markAllBtn)

    // Save attendance
    const saveBtn = screen.getByRole('button', { name: /Simpan Presensi Kelas/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(absensiSiswaService.bulkAbsensiSiswa).toHaveBeenCalledWith({
        tanggal: '2026-10-24',
        items: [
          { mst_siswa_id: 101, status: 1, keterangan: 'Hadir tepat waktu' },
          { mst_siswa_id: 102, status: 1, keterangan: null },
          { mst_siswa_id: 103, status: 1, keterangan: null },
        ],
      })
    })
  })

  it('supports keyboard shortcuts to set status and navigate rows', async () => {
    render(
      <MemoryRouter>
        <AbsensiKelasForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Press '2' (Izin) for active student (index 0 - Budi Santoso)
    fireEvent.keyDown(window, { key: '2' })

    // Active row advances to index 1 (Siti Aminah). Press '3' (Sakit)
    fireEvent.keyDown(window, { key: '3' })

    // Active row advances to index 2 (Dewi Lestari). Press '4' (Alpha)
    fireEvent.keyDown(window, { key: '4' })

    expect(screen.getByText('Izin: 1')).toBeInTheDocument()
    expect(screen.getByText('Sakit: 1')).toBeInTheDocument()
    expect(screen.getByText('Alpha: 1')).toBeInTheDocument()
  })
})
