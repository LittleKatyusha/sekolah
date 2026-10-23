import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NilaiKelasForm from './NilaiKelasForm'
import { nilaiService } from '../services/nilaiService'
import { ujianService } from '../../ujian/services/ujianService'
import { kelasService } from '../../kelas/services/kelasService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams({ ujian_id: '46', kelas_id: '3' }), vi.fn()],
  }
})

vi.mock('../services/nilaiService', () => ({
  nilaiService: {
    getByUjian: vi.fn(),
    batchStore: vi.fn(),
  },
}))

vi.mock('../../ujian/services/ujianService', () => ({
  ujianService: {
    getAll: vi.fn(),
    getById: vi.fn(),
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

const mockUjian = {
  id: 46,
  nama: 'ASESMEN TENGAH SEMESTER',
  mst_kelas_id: 3,
  kelas: { id: 3, nama_kelas: 'XII' },
  mapel: { id: 12, nama: 'PRAKARYA' },
}

const mockKelas = {
  id: 3,
  nama_kelas: 'XII',
}

const mockSiswaInKelas = {
  kelas: { id: 3, nama_kelas: 'XII' },
  siswa: [
    { id: 1, nis: '1001', nama: 'Ahmad Dahlan' },
    { id: 2, nis: '1002', nama: 'Budi Utomo' },
  ],
}

const mockExistingNilai = [
  { id: 10, mst_siswa_id: 1, trx_ujian_id: 46, nilai: 80, keterangan: 'Bagus' },
]

describe('NilaiKelasForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    ujianService.getById.mockResolvedValue({
      data: { data: mockUjian },
      error: null,
    })

    kelasService.getById.mockResolvedValue({
      data: { data: mockKelas },
      error: null,
    })

    kelasService.getSiswaByKelasId.mockResolvedValue({
      data: { data: mockSiswaInKelas },
      error: null,
    })

    nilaiService.getByUjian.mockResolvedValue({
      data: { data: mockExistingNilai },
      error: null,
    })

    nilaiService.batchStore.mockResolvedValue({
      data: { message: '2 nilai berhasil disimpan' },
      error: null,
    })
  })

  it('renders header, filter section, and loads student table', async () => {
    render(
      <MemoryRouter>
        <NilaiKelasForm />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Input Nilai Per Kelas' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
      expect(screen.getByText('Budi Utomo')).toBeInTheDocument()
    })

    // Ahmad Dahlan has existing grade 80
    const inputs = screen.getAllByPlaceholderText('0 - 100')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveValue(80)
    expect(inputs[1]).toHaveValue(null)
  })

  it('allows inline editing and submits batch grades', async () => {
    render(
      <MemoryRouter>
        <NilaiKelasForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    const inputs = screen.getAllByPlaceholderText('0 - 100')
    fireEvent.change(inputs[1], { target: { value: '88' } })
    expect(inputs[1]).toHaveValue(88)

    const saveButtons = screen.getAllByRole('button', { name: /Simpan Semua Nilai/i })
    fireEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(nilaiService.batchStore).toHaveBeenCalledWith({
        trx_ujian_id: 46,
        items: [
          { mst_siswa_id: 1, nilai: 80, keterangan: 'Bagus' },
          { mst_siswa_id: 2, nilai: 88, keterangan: null },
        ],
      })
    })
  })

  it('applies quick fill score to empty grade rows', async () => {
    render(
      <MemoryRouter>
        <NilaiKelasForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    const quickFillInput = screen.getByPlaceholderText('Nilai (0-100)')
    fireEvent.change(quickFillInput, { target: { value: '75' } })

    const quickFillBtn = screen.getByRole('button', { name: /Isi Kosong/i })
    fireEvent.click(quickFillBtn)

    const inputs = screen.getAllByPlaceholderText('0 - 100')
    // First student was already 80, second student should now be 75
    expect(inputs[0]).toHaveValue(80)
    expect(inputs[1]).toHaveValue(75)
  })

  it('renders unduh template and opens import modal on button click', async () => {
    render(
      <MemoryRouter>
        <NilaiKelasForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Unduh Template/i })).toBeInTheDocument()
    const importBtn = screen.getByRole('button', { name: /Import Excel/i })
    expect(importBtn).toBeInTheDocument()

    fireEvent.click(importBtn)

    await waitFor(() => {
      expect(screen.getByText('Import Nilai Excel')).toBeInTheDocument()
    })
  })
})
