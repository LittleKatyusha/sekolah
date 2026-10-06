import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EksSiswaForm from './EksSiswaForm'
import { eksSiswaService, ekstrakurikulerService } from '../services/ekstrakurikulerService'
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

vi.mock('../services/ekstrakurikulerService', () => ({
  ekstrakurikulerService: {
    getAll: vi.fn(),
  },
  eksSiswaService: {
    getByEkstrakurikuler: vi.fn(),
    bulkCreate: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
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

const mockEkskuls = [
  { id: 1, nama: 'Pramuka' },
  { id: 2, nama: 'PMR' },
]

const mockClasses = [
  { id: 10, nama_kelas: 'X IPA 1' },
]

const mockStudents = [
  { id: 101, nis: '1001', nama: 'Budi Santoso', mst_kelas_id: 10, jenis_kelamin: 'L', kelas: { id: 10, nama_kelas: 'X IPA 1' } },
  { id: 102, nis: '1002', nama: 'Siti Aminah', mst_kelas_id: 10, jenis_kelamin: 'P', kelas: { id: 10, nama_kelas: 'X IPA 1' } },
]

describe('EksSiswaForm Bulk Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ekstrakurikulerService.getAll.mockResolvedValue({
      data: { data: mockEkskuls },
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
    eksSiswaService.getByEkstrakurikuler.mockResolvedValue({
      data: { data: [] },
      error: null,
    })
  })

  it('renders bulk create form and table of students', async () => {
    render(
      <MemoryRouter>
        <EksSiswaForm />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Tambah Pendaftaran Ekskul' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
      expect(screen.getByText('Siti Aminah')).toBeInTheDocument()
    })
  })

  it('selects all students and submits bulk registration', async () => {
    eksSiswaService.bulkCreate.mockResolvedValue({
      data: { created_count: 2, skipped_count: 0 },
      error: null,
    })

    render(
      <MemoryRouter>
        <EksSiswaForm />
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
})
