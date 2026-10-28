import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SiswaForm from './SiswaForm'

vi.mock('react-router-dom', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
}))

vi.mock('../services/siswaService', () => ({
  siswaService: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../components/ui/FileUpload', () => ({
  default: () => <div>FileUpload</div>,
}))

vi.mock('../../../hooks/useReferenceOptions', () => ({
  useReferenceOptions: () => ({
    options: [{ value: '1', label: 'Laki-Laki' }, { value: '2', label: 'Perempuan' }],
    loading: false,
  }),
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('SiswaForm numeric inputs validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strips non-digits in real-time for no_hp, nik, and nisn', async () => {
    render(<SiswaForm />)

    const nisnInput = await screen.findByPlaceholderText('Nomor Induk Siswa Nasional')
    await waitFor(() => expect(screen.getByPlaceholderText('Nomor Induk Siswa')).toBeInTheDocument())

    fireEvent.change(nisnInput, { target: { name: 'nisn', value: '009-796-1623' } })
    expect(nisnInput.value).toBe('0097961623')

    const nikInput = screen.getByPlaceholderText('Nomor Induk Kependudukan')
    fireEvent.change(nikInput, { target: { name: 'nik', value: '3201 3028 0309 0003' } })
    expect(nikInput.value).toBe('3201302803090003')

    const phoneInput = screen.getByPlaceholderText('08xxxxxxxxxx')
    fireEvent.change(phoneInput, { target: { name: 'no_hp', value: '0812-3456-7890' } })
    expect(phoneInput.value).toBe('081234567890')
  })
})
