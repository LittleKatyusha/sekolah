import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TugasSiswaDetail from './TugasSiswaDetail'
import { tugasSiswaService } from '../services/tugasService'

vi.mock('../services/tugasService', () => ({
  tugasSiswaService: {
    getById: vi.fn(),
    nilai: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../../utils/sweetalert', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showDeleteConfirm: vi.fn(),
}))

describe('TugasSiswaDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => {})
  })

  it('renders student submission details and uploaded file link', async () => {
    tugasSiswaService.getById.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          siswa_id: 101,
          siswa: { id: 101, nis: '1001', nama: 'Budi Santoso' },
          tugas: { id: 10, judul: 'Tugas Matematika Bab 3' },
          status: 1,
          status_label: 'Tepat Waktu',
          nilai: 85,
          jawaban: 'Berikut jawaban soal 1-5',
          file_jawaban: '2026/10/abc/jawaban-budi.pdf',
          file_url: 'https://cdn.example.com/jawaban-budi.pdf',
        },
      },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/akademik/tugas-siswa/1']}>
        <Routes>
          <Route path="/akademik/tugas-siswa/:id" element={<TugasSiswaDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Budi Santoso')[0]).toBeInTheDocument()
      expect(screen.getByText('Tugas Matematika Bab 3')).toBeInTheDocument()
      expect(screen.getByText('Berikut jawaban soal 1-5')).toBeInTheDocument()
      expect(screen.getByText(/Berkas Hasil Upload Tugas Siswa/i)).toBeInTheDocument()
      expect(screen.getAllByText('jawaban-budi.pdf')[0]).toBeInTheDocument()
    })

    const downloadBtn = screen.getByRole('button', { name: /Buka \/ Unduh Berkas/i })
    expect(downloadBtn).toBeInTheDocument()

    fireEvent.click(downloadBtn)
    expect(window.open).toHaveBeenCalledWith(
      'https://cdn.example.com/jawaban-budi.pdf',
      '_blank',
      'noopener,noreferrer'
    )
  })
})
