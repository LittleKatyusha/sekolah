import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EksKegiatanForm from './EksKegiatanForm'
import { eksKegiatanService, ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { guruService } from '../../guru/services/guruService'

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
    getAktif: vi.fn(),
  },
  eksKegiatanService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../guru/services/guruService', () => ({
  guruService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('EksKegiatanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ekstrakurikulerService.getAktif.mockResolvedValue({
      data: { data: [{ id: 1, nama: 'Pramuka' }] },
      error: null,
    })
    guruService.getAll.mockResolvedValue({
      data: { data: [{ id: 2, nama: 'Pak Guru' }] },
      error: null,
    })
  })

  it('renders create kegiatan form', async () => {
    render(
      <MemoryRouter>
        <EksKegiatanForm />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tambah Kegiatan Ekstrakurikuler' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Tambah Kegiatan/i })).toBeInTheDocument()
    })
  })
})
