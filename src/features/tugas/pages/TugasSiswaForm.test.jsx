import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TugasSiswaForm from './TugasSiswaForm'
import useAuthStore from '../../../store/useAuthStore'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import { siswaService } from '../../siswa/services/siswaService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  }
})

vi.mock('../services/tugasService', () => ({
  tugasService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
  tugasSiswaService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    nilai: vi.fn(),
  },
}))

vi.mock('../../siswa/services/siswaService', () => ({
  siswaService: {
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

vi.mock('../../../hooks/usePermission', () => ({
  default: () => ({
    hasPermission: () => true,
  }),
}))

describe('TugasSiswaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tugasService.getAll.mockResolvedValue({
      data: {
        data: [{ id: 1, judul: 'Tugas Matematika' }],
      },
    })
    siswaService.getAll.mockResolvedValue({
      data: {
        data: [{ id: 10, nis: '12345', nama: 'Budi Siswa' }],
      },
    })
  })

  it('autofills and disables Siswa field from login session when user is siswa', async () => {
    useAuthStore.setState({
      user: {
        id: 99,
        role: 'siswa',
        profile: {
          id: 10,
          nis: '12345',
          nama: 'Budi Siswa',
        },
      },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter>
        <TugasSiswaForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      const siswaInput = screen.getByDisplayValue('12345 - Budi Siswa')
      expect(siswaInput).toBeInTheDocument()
      expect(siswaInput).toBeDisabled()
    })

    // SearchableSelect placeholder shouldn't appear for siswa
    expect(screen.queryByText('Pilih siswa')).not.toBeInTheDocument()

    // File upload field is rendered instead of "Path file (opsional)" text input
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.getByText(/Klik untuk mengunggah atau seret file ke sini/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Path file (opsional)')).not.toBeInTheDocument()
  })

  it('shows SearchableSelect for Siswa when user is not siswa', async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        role: 'admin',
      },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter>
        <TugasSiswaForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Pilih siswa')).toBeInTheDocument()
    })

    expect(screen.getByText('Upload File')).toBeInTheDocument()
  })
})
