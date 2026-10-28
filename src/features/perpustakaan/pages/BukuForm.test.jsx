import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BukuForm from './BukuForm'
import { bukuService } from '../services/perpustakaanService'

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => children,
}))
vi.mock('../../../utils/sweetalert', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
vi.mock('../services/perpustakaanService', () => ({
  bukuService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

describe('BukuForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Tahun Terbit label and Prolog textarea in create mode', () => {
    render(
      <MemoryRouter initialEntries={['/perpustakaan/buku/create']}>
        <Routes>
          <Route path="/perpustakaan/buku/create" element={<BukuForm />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Tambah Buku Baru')).toBeInTheDocument()
    expect(screen.getByText('Tahun Terbit')).toBeInTheDocument()
    expect(screen.getByText('Prolog / Pendahuluan')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ringkasan, sinopsis, atau pendahuluan isi buku...')).toBeInTheDocument()
  })

  it('submits form with prolog and tahun terbit', async () => {
    bukuService.create.mockResolvedValue({ data: { id: 1 }, error: null })

    render(
      <MemoryRouter initialEntries={['/perpustakaan/buku/create']}>
        <Routes>
          <Route path="/perpustakaan/buku/create" element={<BukuForm />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('Judul Buku'), { target: { value: 'Belajar Laravel' } })
    fireEvent.change(screen.getByPlaceholderText('Ringkasan, sinopsis, atau pendahuluan isi buku...'), {
      target: { value: 'Buku panduan lengkap Laravel.' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /tahun terbit/i }), {
      target: { value: '2025' },
    })

    fireEvent.click(screen.getByRole('button', { name: /simpan/i }))

    await waitFor(() => {
      expect(bukuService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Belajar Laravel',
          prolog: 'Buku panduan lengkap Laravel.',
          tahun: 2025,
        })
      )
    })
  })
})
