import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TesMinatBakatPesertaBulkFormPage from './TesMinatBakatPesertaBulkFormPage'
import tesMinatBakatService from '../services/tesMinatBakatService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showError, showSuccess } from '../../../utils/sweetalert'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../services/tesMinatBakatService', () => ({
  default: {
    tes: {
      getAll: vi.fn(),
    },
    peserta: {
      getByTes: vi.fn(),
      bulkCreate: vi.fn(),
    },
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

const mockTests = [
  { id: 1, nama_tes: 'Tes Minat RIASEC SMADA' },
  { id: 2, nama_tes: 'Tes Bakat Skolastik' },
]

const mockClasses = [
  { id: 10, nama_kelas: 'X IPA 1' },
  { id: 20, nama_kelas: 'X IPA 2' },
]

const mockStudents = [
  { id: 101, nis: '1001', nama: 'Ahmad Dahlan', mst_kelas_id: 10, jenis_kelamin: 'Laki-Laki', kelas: { id: 10, nama_kelas: 'X IPA 1' } },
  { id: 102, nis: '1002', nama: 'Budi Santoso', mst_kelas_id: 10, jenis_kelamin: 'Laki-Laki', kelas: { id: 10, nama_kelas: 'X IPA 1' } },
  { id: 103, nis: '1003', nama: 'Citra Dewi', mst_kelas_id: 20, jenis_kelamin: 'Perempuan', kelas: { id: 20, nama_kelas: 'X IPA 2' } },
]

describe('TesMinatBakatPesertaBulkFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tesMinatBakatService.tes.getAll.mockResolvedValue({
      data: { data: mockTests },
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
    tesMinatBakatService.peserta.getByTes.mockResolvedValue({
      data: { data: [] },
      error: null,
    })
  })

  it('renders bulk form page with title, test select, filter controls and student table', async () => {
    render(
      <MemoryRouter>
        <TesMinatBakatPesertaBulkFormPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Tambah Peserta' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
      expect(screen.getByText('Citra Dewi')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Cari nama atau NIS...')).toBeInTheDocument()
    expect(screen.getByText('Semua Kelas')).toBeInTheDocument()
  })

  it('filters students by class and search query', async () => {
    render(
      <MemoryRouter>
        <TesMinatBakatPesertaBulkFormPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    // Filter by class X IPA 2 (id: 20)
    const selectKelas = screen.getByLabelText('Filter Kelas')
    fireEvent.change(selectKelas, { target: { value: '20' } })

    expect(screen.queryByText('Ahmad Dahlan')).not.toBeInTheDocument()
    expect(screen.queryByText('Budi Santoso')).not.toBeInTheDocument()
    expect(screen.getByText('Citra Dewi')).toBeInTheDocument()

    // Reset class filter
    fireEvent.change(selectKelas, { target: { value: '' } })
    expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()

    // Filter by search query
    const searchInput = screen.getByPlaceholderText('Cari nama atau NIS...')
    fireEvent.change(searchInput, { target: { value: 'Budi' } })

    expect(screen.queryByText('Ahmad Dahlan')).not.toBeInTheDocument()
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.queryByText('Citra Dewi')).not.toBeInTheDocument()
  })

  it('marks already enrolled students as disabled with Sudah Terdaftar badge', async () => {
    // Student 101 is already enrolled in test 1
    tesMinatBakatService.peserta.getByTes.mockResolvedValue({
      data: { data: [{ id: 55, tes_id: 1, siswa_id: 101 }] },
      error: null,
    })

    render(
      <MemoryRouter>
        <TesMinatBakatPesertaBulkFormPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    // Open SearchableSelect and choose test 1
    const testSelectBtn = screen.getByText('Pilih tes...')
    fireEvent.click(testSelectBtn)

    const testOption = screen.getByText('Tes Minat RIASEC SMADA')
    fireEvent.click(testOption)

    await waitFor(() => {
      expect(screen.getByText('Sudah Terdaftar')).toBeInTheDocument()
    })

    // Student 101's checkbox should be disabled
    const checkboxAhmad = screen.getByLabelText('Pilih Ahmad Dahlan')
    expect(checkboxAhmad).toBeDisabled()

    // Student 102's checkbox should still be enabled
    const checkboxBudi = screen.getByLabelText('Pilih Budi Santoso')
    expect(checkboxBudi).not.toBeDisabled()
  })

  it('selects all eligible students with master checkbox and submits bulk registration', async () => {
    tesMinatBakatService.peserta.bulkCreate.mockResolvedValue({
      data: { created_count: 3, skipped_count: 0 },
      error: null,
    })

    render(
      <MemoryRouter>
        <TesMinatBakatPesertaBulkFormPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    // Select test 1
    const testSelectBtn = screen.getByText('Pilih tes...')
    fireEvent.click(testSelectBtn)
    fireEvent.click(screen.getByText('Tes Minat RIASEC SMADA'))

    // Select master checkbox
    const masterCheckbox = screen.getByLabelText('Pilih semua siswa di tabel')
    fireEvent.click(masterCheckbox)

    // Check count pill
    expect(screen.getByText('3 Siswa Dipilih')).toBeInTheDocument()

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Simpan \(3 Siswa\)/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(tesMinatBakatService.peserta.bulkCreate).toHaveBeenCalledWith({
        tes_id: 1,
        siswa_ids: [101, 102, 103],
        status: 0,
      })
      expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining('3 peserta berhasil didaftarkan'))
      expect(mockNavigate).toHaveBeenCalledWith('/akademik/tes-minat-bakat/peserta')
    })
  })

  it('shows error if submitting without selecting a test or students', async () => {
    render(
      <MemoryRouter>
        <TesMinatBakatPesertaBulkFormPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument()
    })

    // Submit button is disabled when nothing selected, but let's test validation if triggered
    const submitBtn = screen.getByRole('button', { name: /Simpan \(0 Siswa\)/i })
    expect(submitBtn).toBeDisabled()
  })
})
