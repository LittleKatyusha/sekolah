import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PendaftarDetail from './PendaftarDetail'
import { pendaftarService, dokumenService } from '../services/ppdbService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'

vi.mock('../services/ppdbService', () => ({
  pendaftarService: {
    getById: vi.fn(),
    delete: vi.fn(),
    verify: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
    enroll: vi.fn(),
  },
  dokumenService: {
    getByPendaftaran: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showDeleteConfirm: vi.fn(),
}))

vi.mock('../../activity-logs/components/RecordHistory', () => ({
  default: () => <div data-testid="record-history" />,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
  }
})

describe('PendaftarDetail', () => {
  const mockPendaftar = {
    id: 1,
    nama_lengkap: 'Budi Santoso',
    no_pendaftaran: 'PPDB-2026-0001',
    status_pendaftaran: 'diterima',
    nisn: '0012345678',
    email: 'budi@example.com',
    telp_hp: '08123456789',
    asal_sekolah: 'SMP N 1',
  }

  const mockDokumens = [
    {
      id: 10,
      jenis_dokumen: 'Ijazah / SKL',
      file_name: 'ijazah-budi.pdf',
      file_url: 'https://minio.test/ppdb/ijazah-budi.pdf?token=abc',
      verifikasi_status: true,
      catatan_admin: 'Valid',
    },
  ]

  const mockKelas = [
    { id: 5, nama_kelas: 'X-A', tingkat: 10 },
    { id: 6, nama_kelas: 'X-B', tingkat: 10 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    pendaftarService.getById.mockResolvedValue({
      data: { data: mockPendaftar },
      error: null,
    })
    dokumenService.getByPendaftaran.mockResolvedValue({
      data: { data: mockDokumens },
      error: null,
    })
    kelasService.getAll.mockResolvedValue({
      data: { data: mockKelas },
      error: null,
    })
    pendaftarService.enroll.mockResolvedValue({
      data: { success: true },
      error: null,
    })
  })

  it('renders document link using presigned file_url', async () => {
    render(
      <MemoryRouter>
        <PendaftarDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Budi Santoso').length).toBeGreaterThan(0)
    })

    const docLinks = await screen.findAllByRole('link', { name: /ijazah-budi\.pdf/i })
    expect(docLinks.length).toBeGreaterThan(0)
    expect(docLinks[0]).toHaveAttribute('href', 'https://minio.test/ppdb/ijazah-budi.pdf?token=abc')
    expect(docLinks[0]).toHaveAttribute('target', '_blank')
  })

  it('opens enrollment modal and submits enrollment with selected class', async () => {
    render(
      <MemoryRouter>
        <PendaftarDetail />
      </MemoryRouter>
    )

    const enrollButton = await screen.findByRole('button', { name: /Daftar Ulang \(Enroll Siswa\)/i })
    expect(enrollButton).toBeInTheDocument()

    fireEvent.click(enrollButton)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(kelasService.getAll).toHaveBeenCalled()
    })

    const selectKelas = screen.getByLabelText(/Kelas Tujuan/i)
    fireEvent.change(selectKelas, { target: { value: '5' } })

    const nisInput = screen.getByLabelText(/Nomor Induk Siswa \(NIS\)/i)
    fireEvent.change(nisInput, { target: { value: '20260010' } })

    const confirmButton = screen.getByRole('button', { name: /Konfirmasi Enroll/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(pendaftarService.enroll).toHaveBeenCalledWith(1, expect.objectContaining({
        mst_kelas_id: 5,
        kelas_id: 5,
        nis: '20260010',
        nisn: '0012345678',
      }))
      expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining('Calon siswa berhasil di-enroll'))
    })
  })
})
