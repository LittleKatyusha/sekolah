import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RaporVerificationPage from './RaporVerificationPage'
import { raporVerificationService } from '../services/raporVerificationService'

vi.mock('../services/raporVerificationService', () => ({
  raporVerificationService: {
    verify: vi.fn(),
  },
}))

describe('RaporVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders verified Rapor data and omits sensitive personal data when token is valid', async () => {
    const mockData = {
      valid: true,
      nomor_dokumen: 'RAPOR/0041/1/2025-2026',
      status: 'PUBLISHED',
      semester: 'Semester 1',
      tahun_ajaran: '2025/2026',
      tanggal_terbit: '24 September 2026',
      sekolah: {
        nama: 'SMA Darussalam',
        npsn: '12345678',
        alamat: 'Jl. Pendidikan No. 1, Bogor',
      },
      siswa: {
        nama: 'SALMAN AL FARIZI',
        nis: '242510018',
        nisn: '0092837720',
        kelas: 'XII IPA 1',
      },
      rekap: {
        total_nilai: 850,
        rata_rata: 85.0,
        sakit: 1,
        izin: 0,
        tanpa_keterangan: 0,
        catatan_wali: 'Pertahankan prestasi belajar yang sangat baik.',
      },
      wali_kelas: {
        nama: 'Budi Santoso, S.Pd.',
        nip: '198001012005011001',
      },
      kepala_sekolah: {
        nama: 'Drs. H. Mulyadi, M.Pd.',
        nip: '196805121993031005',
      },
    }

    raporVerificationService.verify.mockResolvedValueOnce({
      data: { success: true, valid: true, data: mockData },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/verifikasi/rapor/1-41-1-f33f8871d444e64b']}>
        <Routes>
          <Route path="/verifikasi/rapor/:token" element={<RaporVerificationPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('LAPORAN HASIL BELAJAR (E-RAPOR) VALID')).toBeInTheDocument()
      expect(screen.getByText(/RAPOR\/0041\/1\/2025-2026/)).toBeInTheDocument()
      expect(screen.getByText('SALMAN AL FARIZI')).toBeInTheDocument()
      expect(screen.getByText('242510018')).toBeInTheDocument()
      expect(screen.getByText('0092837720')).toBeInTheDocument()
      expect(screen.getByText('XII IPA 1')).toBeInTheDocument()
      expect(screen.getByText('Budi Santoso, S.Pd.')).toBeInTheDocument()
      expect(screen.getByText('Drs. H. Mulyadi, M.Pd.')).toBeInTheDocument()
      expect(screen.getAllByText(/SMA Darussalam/).length).toBeGreaterThan(0)
    })

    // Verify sensitive data is NOT displayed anywhere
    expect(screen.queryByText(/Nomor Induk Kependudukan \(NIK\)/)).not.toBeInTheDocument()
    expect(screen.getByText(/Privasi Terlindungi:/)).toBeInTheDocument()
  })

  it('renders invalid state when token is tampered or not found', async () => {
    raporVerificationService.verify.mockResolvedValueOnce({
      data: { success: false, valid: false, message: 'Dokumen Rapor tidak ditemukan atau barcode verifikasi tidak valid.' },
      error: { message: 'Dokumen Rapor tidak ditemukan atau barcode verifikasi tidak valid.' },
    })

    render(
      <MemoryRouter initialEntries={['/verifikasi/rapor/invalid-token']}>
        <Routes>
          <Route path="/verifikasi/rapor/:token" element={<RaporVerificationPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Dokumen Tidak Terverifikasi')).toBeInTheDocument()
      expect(screen.getByText('TIDAK VALID')).toBeInTheDocument()
      expect(screen.getByText(/Dokumen Rapor tidak ditemukan/)).toBeInTheDocument()
    })
  })
})
