import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GuruMapelBatchForm from './GuruMapelBatchForm'
import { guruMapelService } from '../services/guruMapelService'
import { mapelService } from '../../mapel/services/mapelService'
import { apiService } from '../../../utils/api'
import * as sweetalert from '../../../utils/sweetalert'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../services/guruMapelService', () => ({
  guruMapelService: {
    getByGuru: vi.fn(),
    batchStore: vi.fn(),
  },
}))

vi.mock('../../mapel/services/mapelService', () => ({
  mapelService: {
    getMapel: vi.fn(),
  },
}))

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showConfirm: vi.fn(),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => children,
}))

const mockMapels = [
  { id: 1, kode_mapel: 'MAT', nama_mapel: 'Matematika' },
  { id: 2, kode_mapel: 'BIN', nama_mapel: 'Bahasa Indonesia' },
  { id: 3, kode_mapel: 'BIG', nama_mapel: 'Bahasa Inggris' },
  { id: 4, kode_mapel: 'FIS', nama_mapel: 'Fisika' },
]

describe('GuruMapelBatchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiService.get.mockImplementation(async (url) => {
      if (url.includes('/guru/')) {
        return {
          data: {
            data: [{ id: 5, nama: 'Budi Guru', nip: '19800101' }],
          },
        }
      }
      return { data: { data: [] } }
    })
    mapelService.getMapel.mockResolvedValue({
      data: { data: mockMapels },
    })
    guruMapelService.getByGuru.mockResolvedValue({
      data: {
        data: [{ id: 10, mst_guru_id: 5, mst_mapel_id: 1, mapel: mockMapels[0] }],
      },
    })
    guruMapelService.batchStore.mockResolvedValue({
      data: { success: true },
    })
    sweetalert.showConfirm.mockResolvedValue({ isConfirmed: true })
  })

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <GuruMapelBatchForm />
      </MemoryRouter>
    )

  it('renders header, title, and loads subjects checklist', async () => {
    renderComponent()

    expect(screen.getByText('Penugasan Massal Guru Mata Pelajaran')).toBeDefined()
    expect(screen.getByText('1. Pilih Guru')).toBeDefined()
    expect(screen.getByText('2. Mode Penugasan')).toBeDefined()
    expect(screen.getByText('3. Pilih Mata Pelajaran')).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText('Matematika')).toBeDefined()
      expect(screen.getByText('Bahasa Indonesia')).toBeDefined()
      expect(screen.getByText('Fisika')).toBeDefined()
    })
  })

  it('fetches existing teacher assignments when teacher is selected', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Matematika')).toBeDefined()
    })

    // Open SearchableSelect dropdown
    const selectTrigger = screen.getByText('Pilih Guru untuk ditugaskan')
    fireEvent.click(selectTrigger)

    await waitFor(() => {
      expect(screen.getByText(/Budi Guru/i)).toBeDefined()
    })

    // Choose the teacher
    fireEvent.click(screen.getByText(/Budi Guru/i))

    await waitFor(() => {
      expect(guruMapelService.getByGuru).toHaveBeenCalledWith(5)
      expect(screen.getByText('Aktif')).toBeDefined()
      expect(screen.getByText(/1 dipilih dari 4 total/i)).toBeDefined()
    })
  })

  it('allows toggling subjects and selects all visible', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Bahasa Indonesia')).toBeDefined()
    })

    const binCard = screen.getByText('Bahasa Indonesia').closest('div[class*="cursor-pointer"]')
    fireEvent.click(binCard)

    expect(screen.getByText(/1 dipilih dari 4 total/i)).toBeDefined()

    // Select all button
    const selectAllBtn = screen.getByText('Pilih Semua')
    fireEvent.click(selectAllBtn)

    expect(screen.getByText(/4 dipilih dari 4 total/i)).toBeDefined()

    // Clear all button
    const clearBtn = screen.getByText('Kosongkan')
    fireEvent.click(clearBtn)

    expect(screen.getByText(/0 dipilih dari 4 total/i)).toBeDefined()
  })

  it('submits batch assignments successfully', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Matematika')).toBeDefined()
    })

    // Select teacher
    const selectTrigger = screen.getByText('Pilih Guru untuk ditugaskan')
    fireEvent.click(selectTrigger)

    await waitFor(() => {
      expect(screen.getByText(/Budi Guru/i)).toBeDefined()
    })

    fireEvent.click(screen.getByText(/Budi Guru/i))

    await waitFor(() => {
      expect(guruMapelService.getByGuru).toHaveBeenCalledWith(5)
    })

    // Click additional subject (Bahasa Inggris - id 3)
    const bigCard = screen.getByText('Bahasa Inggris').closest('div[class*="cursor-pointer"]')
    fireEvent.click(bigCard)

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Simpan Penugasan/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(sweetalert.showConfirm).toHaveBeenCalled()
      expect(guruMapelService.batchStore).toHaveBeenCalledWith({
        mst_guru_id: 5,
        mapel_ids: [1, 3],
        mode: 'sync',
      })
      expect(sweetalert.showSuccess).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/guru-mapel')
    })
  })
})
