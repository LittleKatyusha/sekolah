import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ActionsMenu } from './TugasList'
import usePermission from '../../../hooks/usePermission'

vi.mock('../../../hooks/usePermission', () => ({
  default: vi.fn(),
}))

describe('TugasList ActionsMenu permissions', () => {
  const dummyProps = {
    data: { id: 1, judul: 'Tugas Matematika' },
    onDetail: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onGrade: vi.fn(),
  }

  it('does NOT show "Nilai Siswa" for siswa role with only tugas-siswa.update', () => {
    // Siswa has tugas-siswa.update (to update own submissions), but NOT tugas-siswa.nilai
    usePermission.mockReturnValue({
      hasPermission: (perm) => perm === 'tugas-siswa.update',
    })

    render(<ActionsMenu {...dummyProps} />)
    const trigger = screen.getByTitle('Actions')
    fireEvent.click(trigger)

    expect(screen.getByText('Detail')).toBeDefined()
    expect(screen.queryByText('Nilai Siswa')).toBeNull()
  })

  it('shows "Nilai Siswa" for guru role with tugas-siswa.nilai', () => {
    usePermission.mockReturnValue({
      hasPermission: (perm) => perm === 'tugas-siswa.nilai',
    })

    render(<ActionsMenu {...dummyProps} />)
    const trigger = screen.getByTitle('Actions')
    fireEvent.click(trigger)

    expect(screen.getByText('Detail')).toBeDefined()
    expect(screen.getByText('Nilai Siswa')).toBeDefined()
  })
})

vi.mock('../services/tugasService', () => ({
  tugasService: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
  tugasSiswaService: {
    getBySiswa: vi.fn(),
  },
}))

vi.mock('../../../components/ui/InfiniteGrid', () => ({
  default: () => <div data-testid="mock-infinite-grid">InfiniteGrid Table</div>,
}))

describe('TugasList Role-Based View', () => {
  const mockTugasData = [
    {
      id: 1,
      judul: 'Identitas diri dan Identitas Sosial',
      deskripsi: '<p>Tugas sosiologi bab 1</p>',
      tenggat_waktu: '2026-10-26T11:30:00+00:00',
      status: 1,
      guru_mapel: {
        id: 1,
        guru: { id: 1, nama: 'JAZILAH NURUL HIDAYATI' },
        mapel: { id: 6, kode: 'SOS', nama: 'SOSIOLOGI' },
      },
      kelas: { id: 1, nama_kelas: 'X' },
      created_at: '2026-10-24T20:00:00+00:00',
    },
    {
      id: 3,
      judul: 'Kelas X BAKTERI dan Peranannya',
      deskripsi: '<p>Tugas biologi bab bakteri</p>',
      tenggat_waktu: '2026-10-26T10:15:00+00:00',
      status: 1,
      guru_mapel: {
        id: 11,
        guru: { id: 7, nama: 'RIZA ADRIANUS' },
        mapel: { id: 15, kode: 'BIO', nama: 'BIOLOGI' },
      },
      kelas: { id: 1, nama_kelas: 'X' },
      created_at: '2026-10-24T21:00:00+00:00',
    },
  ]

  it('renders student cards view for siswa role without table', async () => {
    const { tugasService, tugasSiswaService } = await import('../services/tugasService')
    const { default: TugasList } = await import('./TugasList')
    const { default: useAuthStore } = await import('../../../store/useAuthStore')
    const { MemoryRouter } = await import('react-router-dom')

    tugasService.getAll.mockResolvedValue({
      data: { data: mockTugasData },
      error: null,
    })
    tugasSiswaService.getBySiswa.mockResolvedValue({
      data: { data: [] },
      error: null,
    })

    useAuthStore.setState({
      user: {
        id: 188,
        name: 'SANIA FITRI',
        role: 'siswa',
        roles: [{ code: 'siswa', name: 'siswa' }],
        permissions: [{ code: 'tugas.view' }],
      },
    })

    render(
      <MemoryRouter>
        <TugasList />
      </MemoryRouter>
    )

    // Should display student greeting banner
    expect(await screen.findByText(/Halo, SANIA FITRI!/i)).toBeInTheDocument()
    expect(screen.getByText(/Pusat Tugas Siswa/i)).toBeInTheDocument()

    // Should display tugas cards
    expect(await screen.findByText('Identitas diri dan Identitas Sosial')).toBeInTheDocument()
    expect(screen.getByText('Kelas X BAKTERI dan Peranannya')).toBeInTheDocument()
    expect(screen.getByText(/JAZILAH NURUL HIDAYATI/i)).toBeInTheDocument()
    expect(screen.getByText(/RIZA ADRIANUS/i)).toBeInTheDocument()

    // Should NOT render InfiniteGrid table
    expect(screen.queryByTestId('mock-infinite-grid')).not.toBeInTheDocument()
  })

  it('renders table view for guru or admin role', async () => {
    const { default: TugasList } = await import('./TugasList')
    const { default: useAuthStore } = await import('../../../store/useAuthStore')
    const { MemoryRouter } = await import('react-router-dom')

    useAuthStore.setState({
      user: {
        id: 1,
        name: 'Guru Pengampu',
        role: 'guru',
        roles: [{ code: 'guru', name: 'guru' }],
        permissions: [{ code: 'tugas.view' }],
      },
    })

    render(
      <MemoryRouter>
        <TugasList />
      </MemoryRouter>
    )

    // Should render InfiniteGrid table for teacher/admin
    expect(screen.getByTestId('mock-infinite-grid')).toBeInTheDocument()
    // Should NOT show student hero banner
    expect(screen.queryByText(/Pusat Tugas Siswa/i)).not.toBeInTheDocument()
  })
})

