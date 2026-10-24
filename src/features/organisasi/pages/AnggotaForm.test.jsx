import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AnggotaForm from './AnggotaForm'
import { anggotaService, organisasiService, jabatanService } from '../services/organisasiService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  }
})

vi.mock('../services/organisasiService', () => ({
  organisasiService: {
    getAktif: vi.fn(),
  },
  jabatanService: {
    getAllList: vi.fn(),
  },
  anggotaService: {
    getByOrganisasi: vi.fn(),
    bulkCreate: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../siswa/services/siswaService', () => ({
  siswaService: {
    getAll: vi.fn(),
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

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

const mockOrganisasi = [
  { id: 1, nama: 'OSIS' },
  { id: 2, nama: 'MPK' },
]

const mockJabatan = [
  { id: 1, nama: 'Ketua Umum' },
  { id: 5, nama: 'Anggota' },
]

const mockClasses = [
  { id: 10, nama_kelas: 'X IPA 1' },
]

const mockStudents = [
  { id: 101, nis: '1001', nama: 'Budi Santoso', mst_kelas_id: 10, jenis_kelamin: 'L', kelas: { id: 10, nama_kelas: 'X IPA 1' } },
  { id: 102, nis: '1002', nama: 'Siti Aminah', mst_kelas_id: 10, jenis_kelamin: 'P', kelas: { id: 10, nama_kelas: 'X IPA 1' } },
]

describe('AnggotaForm Bulk Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    organisasiService.getAktif.mockResolvedValue({
      data: { data: mockOrganisasi },
      error: null,
    })
    jabatanService.getAllList.mockResolvedValue({
      data: { data: mockJabatan },
      error: null,
    })
    kelasService.getAll.mockResolvedValue({
      data: { data: mockClasses },
      error: null,
    })
    siswaService.getAll.mockResolvedValue({
      data: { data: mockStudents },
      error: null,
    })
    anggotaService.getByOrganisasi.mockResolvedValue({
      data: { data: [] },
      error: null,
    })
  })

  it('renders bulk create form and table of students', async () => {
    render(
      <MemoryRouter>
        <AnggotaForm />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Tambah Anggota Organisasi' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
      expect(screen.getByText('Siti Aminah')).toBeInTheDocument()
    })
  })

  it('selects all students and updates selection count', async () => {
    render(
      <MemoryRouter>
        <AnggotaForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Click select all
    const selectAllBtn = screen.getByRole('button', { name: /Pilih Semua/i })
    fireEvent.click(selectAllBtn)

    expect(screen.getByText(/2 Siswa Dipilih/i)).toBeInTheDocument()
  })

  it('validates required fields before submitting', async () => {
    render(
      <MemoryRouter>
        <AnggotaForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Submit button should be disabled when no students are selected
    const submitBtn = screen.getByRole('button', { name: /Daftarkan/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submits bulk registration when form is valid', async () => {
    anggotaService.bulkCreate.mockResolvedValue({
      data: { created_count: 2, skipped_count: 0 },
      error: null,
    })

    render(
      <MemoryRouter>
        <AnggotaForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Select all students
    fireEvent.click(screen.getByRole('button', { name: /Pilih Semua/i }))

    // Open Organisasi dropdown and select OSIS
    fireEvent.click(screen.getByText('Pilih organisasi'))
    await waitFor(() => {
      expect(screen.getByText('OSIS')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('OSIS'))

    const submitBtn = screen.getByRole('button', { name: /Daftarkan \(2 Siswa\)/i })
    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(anggotaService.bulkCreate).toHaveBeenCalledWith(expect.objectContaining({
        organisasi_id: 1,
        siswa_ids: [101, 102],
        jabatan_id: 5,
      }))
    })
  })
})
