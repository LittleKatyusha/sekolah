import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TugasKelasGradeForm from './TugasKelasGradeForm'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import { kelasService } from '../../kelas/services/kelasService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '15' }),
    useSearchParams: () => [new URLSearchParams({ tugas_id: '15' }), vi.fn()],
  }
})

vi.mock('../services/tugasService', () => ({
  tugasService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
  tugasSiswaService: {
    getByTugas: vi.fn(),
    batchStore: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
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

const mockTugas = {
  id: 15,
  judul: 'Tugas Aljabar Linear',
  deskripsi: 'Kerjakan latihan soal 1-5',
  mst_kelas_id: 3,
  tenggat_waktu: '2026-05-30T23:59:00Z',
  kelas: { id: 3, nama_kelas: 'XII-IPA-1' },
  guru_mapel: {
    guru: { id: 1, nama: 'Budi Santoso, M.Pd' },
    mapel: { id: 2, nama: 'Matematika Wajib' },
  },
}

const mockSiswaInKelas = {
  kelas: { id: 3, nama_kelas: 'XII-IPA-1' },
  siswa: [
    { id: 101, nis: '1001', nama: 'Ahmad Dahlan' },
    { id: 102, nis: '1002', nama: 'Budi Utomo' },
  ],
}

const mockSubmissions = [
  {
    id: 1,
    siswa_id: 101,
    tugas_id: 15,
    status: 1, // Tepat Waktu
    waktu_kumpul: '2026-05-25T14:30:00Z',
    nilai: 85,
    catatan_guru: 'Kerja bagus',
    jawaban: 'Jawaban soal 1: x = 5, y = 3',
  },
]

describe('TugasKelasGradeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    tugasService.getById.mockResolvedValue({
      data: { data: mockTugas },
      error: null,
    })

    kelasService.getSiswaByKelasId.mockResolvedValue({
      data: { data: mockSiswaInKelas },
      error: null,
    })

    tugasSiswaService.getByTugas.mockResolvedValue({
      data: { data: mockSubmissions },
      error: null,
    })

    tugasSiswaService.batchStore.mockResolvedValue({
      data: { message: '2 nilai tugas berhasil disimpan' },
      error: null,
    })
  })

  it('renders header, assignment info, and student list with submission status', async () => {
    render(
      <MemoryRouter>
        <TugasKelasGradeForm />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Penilaian Tugas Siswa Per Kelas/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Tugas Aljabar Linear')).toBeInTheDocument()
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
      expect(screen.getByText('Budi Utomo')).toBeInTheDocument()
    })

    // Ahmad Dahlan has score 85, Budi Utomo is empty
    const scoreInputs = screen.getAllByPlaceholderText('0 - 100')
    expect(scoreInputs).toHaveLength(2)
    expect(scoreInputs[0]).toHaveValue(85)
    expect(scoreInputs[1]).toHaveValue(null)

    // Ahmad has submitted on time, Budi has not
    expect(screen.getByText('Tepat Waktu')).toBeInTheDocument()
    expect(screen.getByText('Belum Mengumpulkan')).toBeInTheDocument()
  })

  it('fills empty score with quick fill button', async () => {
    render(
      <MemoryRouter>
        <TugasKelasGradeForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Utomo')).toBeInTheDocument()
    })

    const quickFillInput = screen.getByPlaceholderText('Skor (0-100)')
    fireEvent.change(quickFillInput, { target: { value: '75' } })

    const quickFillBtn = screen.getByRole('button', { name: /Isi Kosong/i })
    fireEvent.click(quickFillBtn)

    const scoreInputs = screen.getAllByPlaceholderText('0 - 100')
    // First student was already 85, so unchanged
    expect(scoreInputs[0]).toHaveValue(85)
    // Second student was empty, now 75
    expect(scoreInputs[1]).toHaveValue(75)
  })

  it('submits batch scores to tugasSiswaService.batchStore', async () => {
    render(
      <MemoryRouter>
        <TugasKelasGradeForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Utomo')).toBeInTheDocument()
    })

    const scoreInputs = screen.getAllByPlaceholderText('0 - 100')
    fireEvent.change(scoreInputs[1], { target: { value: '90' } })

    const noteInputs = screen.getAllByPlaceholderText('Catatan guru...')
    fireEvent.change(noteInputs[1], { target: { value: 'Pengerjaan rapi' } })

    const saveButtons = screen.getAllByRole('button', { name: /Simpan Semua Nilai/i })
    fireEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(tugasSiswaService.batchStore).toHaveBeenCalledWith({
        tugas_id: 15,
        items: [
          { siswa_id: 101, nilai: 85, catatan_guru: 'Kerja bagus' },
          { siswa_id: 102, nilai: 90, catatan_guru: 'Pengerjaan rapi' },
        ],
      })
    })
  })

  it('opens text answer preview modal when clicking Lihat', async () => {
    render(
      <MemoryRouter>
        <TugasKelasGradeForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    const viewButton = screen.getByRole('button', { name: /Lihat/i })
    fireEvent.click(viewButton)

    expect(screen.getByText(/Jawaban: Ahmad Dahlan/i)).toBeInTheDocument()
    expect(screen.getByText('Jawaban soal 1: x = 5, y = 3')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /Tutup/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByText(/Jawaban: Ahmad Dahlan/i)).not.toBeInTheDocument()
  })
})
