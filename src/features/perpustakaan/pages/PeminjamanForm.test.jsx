import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PeminjamanForm from './PeminjamanForm'
import { peminjamanService, bukuService } from '../services/perpustakaanService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess } from '../../../utils/sweetalert'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  }
})

vi.mock('../services/perpustakaanService', () => ({
  bukuService: {
    getAvailable: vi.fn(),
    getById: vi.fn(),
  },
  peminjamanService: {
    batchPinjam: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../../siswa/services/siswaService', () => ({
  siswaService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

const mockSiswaList = [
  { id: 10, nama: 'Budi Santoso', nis: '1001' },
]

const mockBukuList = [
  { id: 101, judul: 'Fisika Kuantum', isbn: '978-101', penulis: 'Prof. Einstein', stok: 5 },
  { id: 102, judul: 'Kimia Organik', isbn: '978-102', penulis: 'Dr. Marie', stok: 3 },
]

describe('PeminjamanForm Multi-Item Sirkulasi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    siswaService.getAll.mockResolvedValue({ data: { data: mockSiswaList } })
    siswaService.getById.mockResolvedValue({ data: { data: mockSiswaList[0] } })
    bukuService.getAvailable.mockResolvedValue({ data: { data: mockBukuList } })
    bukuService.getById.mockImplementation((id) => {
      const found = mockBukuList.find((b) => String(b.id) === String(id))
      return Promise.resolve({ data: { data: found } })
    })
  })

  it('renders Sirkulasi Peminjaman Buku and empty cart', async () => {
    render(
      <MemoryRouter>
        <PeminjamanForm />
      </MemoryRouter>
    )

    expect(screen.getByText('Sirkulasi Peminjaman Buku')).toBeInTheDocument()
    expect(screen.getByText(/Keranjang Buku/i)).toBeInTheDocument()
    expect(screen.getByText(/Keranjang kosong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Simpan/i })).toBeDisabled()
  })

  it('allows adding and removing books from cart, and submitting batch loan', async () => {
    peminjamanService.batchPinjam.mockResolvedValueOnce({
      data: { message: 'Berhasil', data: { total_items: 1 } },
    })

    render(
      <MemoryRouter>
        <PeminjamanForm />
      </MemoryRouter>
    )

    // Select Siswa
    fireEvent.click(screen.getByText('Pilih Siswa'))
    await waitFor(() => {
      expect(screen.getByText('Budi Santoso (1001)')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Budi Santoso (1001)'))

    // Add Book 101
    fireEvent.click(screen.getByText('+ Cari buku untuk ditambahkan...'))
    await waitFor(() => {
      expect(screen.getByText(/Fisika Kuantum/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Fisika Kuantum/i))

    await waitFor(() => {
      expect(screen.getByText('Fisika Kuantum')).toBeInTheDocument()
      expect(screen.getByText('978-101')).toBeInTheDocument()
    })

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Simpan \(1 Buku\)/i })
    expect(submitBtn).toBeEnabled()
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(peminjamanService.batchPinjam).toHaveBeenCalledWith(
        expect.objectContaining({
          mst_siswa_id: 10,
          buku_ids: [101],
        })
      )
      expect(showSuccess).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/perpustakaan/peminjaman')
    })
  })

  it('allows removing a book from the cart', async () => {
    render(
      <MemoryRouter>
        <PeminjamanForm />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('+ Cari buku untuk ditambahkan...'))
    await waitFor(() => {
      expect(screen.getByText(/Kimia Organik/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Kimia Organik/i))

    await waitFor(() => {
      expect(screen.getByText('Kimia Organik')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Hapus'))

    await waitFor(() => {
      expect(screen.queryByText('Kimia Organik')).not.toBeInTheDocument()
      expect(screen.getByText(/Keranjang kosong/i)).toBeInTheDocument()
    })
  })
})
