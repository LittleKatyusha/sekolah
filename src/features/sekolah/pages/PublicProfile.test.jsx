import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PublicProfile from './PublicProfile'
import { ppdbPublicService } from '../../ppdb/services/ppdbService'

vi.mock('../../ppdb/services/ppdbService', () => ({
  ppdbPublicService: {
    getPublicProfile: vi.fn(),
  },
}))

const mockSekolah = {
  id: 1,
  nama_sekolah: 'SMK Negeri 1 Surabaya',
  npsn: '20501234',
  alamat: 'Jl. Pemuda No. 10',
  logo_url: null,
  identifier: 'smkn1-sby',
  stats: {
    total_siswa: 120,
    total_guru: 25,
    total_kelas: 10,
    total_jurusan: 3,
    total_ekskul: 4,
  },
  settings: {
    jam_masuk_sekolah: '07:00',
    jam_pulang_sekolah: '15:00',
    timezone: 'Asia/Jakarta',
  },
  jurusan: [
    { id: 10, kode: 'RPL', nama: 'Rekayasa Perangkat Lunak', deskripsi: 'Belajar programming' },
  ],
  ekskul: [
    { id: 20, nama: 'Pramuka', hari: 'jumat', jam_mulai: '15:30:00', lokasi: 'Lapangan' },
  ],
  guru: [
    { id: 30, nama: 'Budi Santoso, S.Pd', pendidikan_terakhir: 's1' },
  ],
  ppdb: {
    is_active: true,
    gelombang: [{ id: 5, nama_gelombang: 'Gelombang 1 Reguler' }],
  },
}

describe('PublicProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders school profile information and sections correctly', async () => {
    ppdbPublicService.getPublicProfile.mockResolvedValue({
      data: mockSekolah,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/profile?sekolah=smkn1-sby']}>
        <PublicProfile />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('SMK Negeri 1 Surabaya').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('NPSN: 20501234').length).toBeGreaterThan(0)
    expect(screen.getByText('Jl. Pemuda No. 10')).toBeDefined()
    expect(screen.getByText('Gelombang 1 Reguler')).toBeDefined()
    expect(screen.getByText('Rekayasa Perangkat Lunak')).toBeDefined()
    expect(screen.getByText('Pramuka')).toBeDefined()
    expect(screen.getByText('Budi Santoso, S.Pd')).toBeDefined()
  })

  it('renders not found message when school is not found', async () => {
    ppdbPublicService.getPublicProfile.mockResolvedValue({ data: null, error: 'Profil sekolah tidak ditemukan' })

    render(
      <MemoryRouter initialEntries={['/profile?sekolah=unknown']}>
        <PublicProfile />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Profil sekolah tidak ditemukan')).toBeDefined()
    })
  })
})
