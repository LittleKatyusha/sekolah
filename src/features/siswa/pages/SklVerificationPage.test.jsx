import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SklVerificationPage from './SklVerificationPage'
import { sklVerificationService } from '../services/sklVerificationService'

vi.mock('../services/sklVerificationService', () => ({
  sklVerificationService: {
    verify: vi.fn(),
  },
}))

describe('SklVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders verified SKL data, photo, and omits sensitive data when token is valid', async () => {
    const mockData = {
      valid: true,
      nomor_surat: '421.3/0041/SKL/2026',
      status_kelulusan: 'LULUS',
      tahun_ajaran: '2025/2026',
      tanggal_terbit: '21 September 2026',
      sekolah: {
        nama: 'SMA Darussalam',
        npsn: '12345678',
        alamat: 'Jl. H. Mustopa No. 13',
      },
      kepala_sekolah: {
        nama: 'JAZILAH NURUL HIDAYATI',
        nip: '197501012000032001',
      },
      siswa: {
        nama: 'SALMAN AL FARIZI',
        nis: '242510018',
        nisn: '0092837720',
        tempat_lahir: 'BOGOR',
        tanggal_lahir: '06 Januari 2009',
        jenis_kelamin: 'Laki-Laki',
        kelas: 'XII',
        asal_sekolah: 'SMA Darussalam',
        foto_url: 'data:image/jpeg;base64,mockphotodata',
      },
    }

    sklVerificationService.verify.mockResolvedValueOnce({
      data: { success: true, valid: true, data: mockData },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/verifikasi/skl/1-41-2026-f33f8871d444e64b']}>
        <Routes>
          <Route path="/verifikasi/skl/:token" element={<SklVerificationPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('SURAT KETERANGAN LULUS VALID')).toBeInTheDocument()
      expect(screen.getByText('421.3/0041/SKL/2026')).toBeInTheDocument()
      expect(screen.getByText('SALMAN AL FARIZI')).toBeInTheDocument()
      expect(screen.getByText('242510018')).toBeInTheDocument()
      expect(screen.getByText('0092837720')).toBeInTheDocument()
      expect(screen.getByText('LULUS')).toBeInTheDocument()
      expect(screen.getByText('JAZILAH NURUL HIDAYATI')).toBeInTheDocument()
      expect(screen.getAllByText(/SMA Darussalam/).length).toBeGreaterThan(0)
    })

    // Verify student photo is rendered
    const img = screen.getByAltText('SALMAN AL FARIZI')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,mockphotodata')

    // Verify sensitive data is NOT displayed anywhere
    expect(screen.queryByText(/3201300601090003/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nomor Induk Kependudukan \(NIK\)/)).not.toBeInTheDocument()
    expect(screen.getByText(/Privasi Terlindungi:/)).toBeInTheDocument()
  })

  it('renders invalid state when token is tampered or not found', async () => {
    sklVerificationService.verify.mockResolvedValueOnce({
      data: { success: false, valid: false, message: 'Dokumen SKL tidak ditemukan atau tanda tangan digital tidak valid.' },
      error: { message: 'Dokumen SKL tidak ditemukan atau tanda tangan digital tidak valid.' },
    })

    render(
      <MemoryRouter initialEntries={['/verifikasi/skl/invalid-token']}>
        <Routes>
          <Route path="/verifikasi/skl/:token" element={<SklVerificationPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Dokumen Tidak Terverifikasi')).toBeInTheDocument()
      expect(screen.getByText('TIDAK VALID')).toBeInTheDocument()
      expect(screen.getByText(/Dokumen SKL tidak ditemukan/)).toBeInTheDocument()
    })
  })
})
