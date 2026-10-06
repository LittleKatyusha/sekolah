import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UjianUserForm from './UjianUserForm'
import { ujianUserService } from '../services/ujianUserService'
import { ujianService } from '../../ujian/services/ujianService'
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

vi.mock('../services/ujianUserService', () => ({
  ujianUserService: {
    getAll: vi.fn(),
    bulkCreate: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../../ujian/services/ujianService', () => ({
  ujianService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}))

vi.mock('../../siswa/services/siswaService', () => ({
  siswaService: {
    getAll: vi.fn(),
    getById: vi.fn(),
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

const mockUjianList = [
  { id: 1, nama: 'Penilaian Tengah Semester Matematika' },
  { id: 2, nama: 'Ujian Akhir Semester Fisika' },
]

const mockClasses = [
  { id: 10, nama_kelas: 'XI IPA 1' },
]

const mockStudents = [
  { id: 201, nis: '2001', nama: 'Dimas Anggara', mst_kelas_id: 10, jenis_kelamin: 'L', kelas: { id: 10, nama_kelas: 'XI IPA 1' } },
  { id: 202, nis: '2002', nama: 'Rina Sasmita', mst_kelas_id: 10, jenis_kelamin: 'P', kelas: { id: 10, nama_kelas: 'XI IPA 1' } },
]

describe('UjianUserForm Bulk Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ujianService.getAll.mockResolvedValue({
      data: { data: mockUjianList },
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
    ujianUserService.getAll.mockResolvedValue({
      data: { data: [] },
      error: null,
    })
  })

  it('renders bulk create form with title and student list', async () => {
    render(
      <MemoryRouter>
        <UjianUserForm />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Tambah Peserta Ujian' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Dimas Anggara')).toBeInTheDocument()
      expect(screen.getByText('Rina Sasmita')).toBeInTheDocument()
    })
  })

  it('allows selecting students via button', async () => {
    render(
      <MemoryRouter>
        <UjianUserForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Dimas Anggara')).toBeInTheDocument()
    })

    const selectAllBtn = screen.getByRole('button', { name: /Pilih Semua/i })
    fireEvent.click(selectAllBtn)

    expect(screen.getByText(/2 Siswa Dipilih/i)).toBeInTheDocument()
  })
})
