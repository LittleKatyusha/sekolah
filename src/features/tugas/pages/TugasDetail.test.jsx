import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TugasDetail from './TugasDetail'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import useAuthStore from '../../../store/useAuthStore'

vi.mock('../services/tugasService', () => ({
  tugasService: {
    getById: vi.fn(),
    delete: vi.fn(),
  },
  tugasSiswaService: {
    getByTugas: vi.fn(),
    getBySiswa: vi.fn(),
  },
}))

vi.mock('../../../store/useAuthStore', () => ({
  default: vi.fn(),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../../utils/sweetalert', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showDeleteConfirm: vi.fn(),
}))

describe('TugasDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({
      user: { role: 'admin' },
    })
  })

  it('renders assignment details and opens preview modal for submission files', async () => {
    tugasService.getById.mockResolvedValueOnce({
      data: {
        data: {
          id: 5,
          judul: 'Tugas Teori Sosiologi',
          deskripsi: 'Baca teori sosiologi',
          status: 1,
          tenggat_waktu: '2026-10-30T23:59:00Z',
          file_url: null,
          kelas: { nama_kelas: 'XII IPS 1' },
          guru_mapel: { guru: { nama: 'Guru A' }, mapel: { nama: 'Sosiologi' } },
        },
      },
      error: null,
    })

    tugasSiswaService.getByTugas.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 11,
            siswa: { id: 201, nama: 'Dila Amelia' },
            waktu_kumpul: '2026-10-26T10:23:00Z',
            status: 'tepat waktu',
            nilai: 85,
            file_url: 'https://cdn.example.com/dila-tugas.jpg',
          },
        ],
      },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/akademik/tugas/5']}>
        <Routes>
          <Route path="/akademik/tugas/:id" element={<TugasDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Tugas Teori Sosiologi')[0]).toBeInTheDocument()
      expect(screen.getByText('Dila Amelia')).toBeInTheDocument()
      expect(screen.getByText('Preview File')).toBeInTheDocument()
    })

    // Click "Preview File" button
    fireEvent.click(screen.getByText('Preview File'))

    // Expect modal to be open with student assignment title
    await waitFor(() => {
      expect(screen.getByText('Tugas: Dila Amelia')).toBeInTheDocument()
      expect(screen.getByText('dila-tugas.jpg')).toBeInTheDocument()
      expect(screen.getByTitle('Putar Kanan 90°')).toBeInTheDocument()
    })
  })
})
