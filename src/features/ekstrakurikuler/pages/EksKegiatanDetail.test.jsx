import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EksKegiatanDetail from './EksKegiatanDetail'
import { eksKegiatanService, eksSiswaService } from '../services/ekstrakurikulerService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

vi.mock('../services/ekstrakurikulerService', () => ({
  eksKegiatanService: {
    getById: vi.fn(),
    delete: vi.fn(),
  },
  eksSiswaService: {
    getByEkstrakurikuler: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showDeleteConfirm: vi.fn(),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

describe('EksKegiatanDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders kegiatan detail after fetch succeeds', async () => {
    eksKegiatanService.getById.mockResolvedValue({
      data: {
        data: {
          id: 1,
          ekstrakurikuler_id: 1,
          nama_kegiatan: 'Latihan Rutin Baris-Berbaris & Semaphore',
          tanggal: '2026-10-13',
          jadwal_waktu: '14:30 - 15:10',
          status: 'dijadwalkan',
          ekstrakurikuler: { nama: 'Pramuka' },
        },
      },
      error: null,
    })
    eksSiswaService.getByEkstrakurikuler.mockResolvedValue({
      data: { data: [{ id: 10, siswa: { nama: 'Ahmad' } }] },
      error: null,
    })

    render(
      <MemoryRouter>
        <EksKegiatanDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Latihan Rutin Baris-Berbaris & Semaphore')).toBeInTheDocument()
      expect(screen.getByText('Pramuka')).toBeInTheDocument()
      expect(screen.getByText('Ahmad')).toBeInTheDocument()
    })
  })
})
