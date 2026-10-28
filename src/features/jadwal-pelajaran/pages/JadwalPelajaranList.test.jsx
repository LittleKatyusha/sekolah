import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import JadwalPelajaranList from './JadwalPelajaranList'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { kelasService } from '../../kelas/services/kelasService'
import useAuthStore from '../../../store/useAuthStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../services/jadwalPelajaranService', () => ({
  jadwalPelajaranService: {
    getAll: vi.fn(),
    getByKelas: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../../store/useAuthStore', () => ({
  default: vi.fn(),
}))

vi.mock('../../../hooks/usePermission', () => ({
  default: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
  isSuperAdminUser: () => true,
  resolvePermissions: () => ['jadwal-pelajaran.create', 'jadwal-pelajaran.view', 'jadwal-pelajaran.update', 'jadwal-pelajaran.delete'],
}))

vi.mock('../../../components/ui/InfiniteGrid', () => ({
  default: () => <div data-testid="infinite-grid-mock">Table View Grid</div>,
}))

const mockSchedules = [
  {
    id: 10,
    hari: 'MON',
    jam_mulai: '07:30',
    jam_selesai: '09:00',
    ruangan: 'Ruang 101',
    kelas: { id: 1, nama_kelas: 'X-A' },
    guru_mapel: {
      mapel: { nama: 'Fisika' },
      guru: { nama: 'Bambang', nip: '123456' },
    },
  },
]

const mockClasses = [
  { id: 1, nama_kelas: 'X-A', tingkat: 10 },
  { id: 2, nama_kelas: 'XI-B', tingkat: 11 },
]

describe('JadwalPelajaranList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({
      user: { role: 'superadmin' },
    })
    kelasService.getAll.mockResolvedValue({
      data: { data: mockClasses },
    })
    jadwalPelajaranService.getAll.mockResolvedValue({
      data: { data: mockSchedules },
    })
    jadwalPelajaranService.getByKelas.mockResolvedValue({
      data: { data: mockSchedules },
    })
  })

  it('renders Timeline view by default and loads schedules', async () => {
    render(
      <MemoryRouter>
        <JadwalPelajaranList />
      </MemoryRouter>
    )

    expect(screen.getByText('Jadwal Pelajaran')).toBeInTheDocument()
    expect(screen.getByText('Cards & Timeline')).toBeInTheDocument()
    expect(screen.getByText('Tabel')).toBeInTheDocument()

    await waitFor(() => {
      expect(jadwalPelajaranService.getAll).toHaveBeenCalled()
    })
  })

  it('switches between Timeline and Table view', async () => {
    render(
      <MemoryRouter>
        <JadwalPelajaranList />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(jadwalPelajaranService.getAll).toHaveBeenCalled()
    })

    const tableToggleBtn = screen.getByRole('button', { name: /tabel/i })
    fireEvent.click(tableToggleBtn)

    await waitFor(() => {
      expect(screen.getByTestId('infinite-grid-mock')).toBeInTheDocument()
    })

    const timelineToggleBtn = screen.getByRole('button', { name: /cards & timeline/i })
    fireEvent.click(timelineToggleBtn)

    await waitFor(() => {
      expect(screen.queryByTestId('infinite-grid-mock')).not.toBeInTheDocument()
    })
  })

  it('navigates to matriks and create pages when buttons are clicked', async () => {
    render(
      <MemoryRouter>
        <JadwalPelajaranList />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /matriks mingguan/i })).toBeInTheDocument()
    })

    const matriksBtn = screen.getByRole('button', { name: /matriks mingguan/i })
    fireEvent.click(matriksBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/jadwal-pelajaran/matriks')

    const createBtn = screen.getByRole('button', { name: /tambah jadwal/i })
    fireEvent.click(createBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/jadwal-pelajaran/create')
  })
})
