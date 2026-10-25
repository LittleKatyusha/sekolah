import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import useAuthStore from '../../../store/useAuthStore'
import MateriList from './MateriList'
import { materiService } from '../services/materiService'

vi.mock('../services/materiService', () => ({
  materiService: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../../components/ui/InfiniteGrid', () => ({
  default: () => <div data-testid="mock-infinite-grid">InfiniteGrid Table</div>,
}))

describe('MateriList Role-Based View', () => {
  const mockMateriData = [
    {
      id: 1,
      judul: 'Bakteri Serta Peranannya Bagi Manusia',
      deskripsi: '<p>Bakteri tidak selalu merugikan.</p>',
      file_materi: 'BAKTERI',
      link_video: 'https://docs.google.com/presentation/d/test/edit',
      status: 1,
      guru_mapel: {
        id: 11,
        guru: { id: 7, nama: 'RIZA ADRIANUS' },
        mapel: { id: 15, kode: 'BIO', nama: 'BIOLOGI' },
      },
      created_at: '2026-10-24T20:40:17+00:00',
    },
    {
      id: 3,
      judul: 'Identitas diri, tindakan sosial',
      deskripsi: '<p>Penjelasan tindakan sosial</p>',
      file_materi: 'https://drive.google.com/file/d/test/view',
      link_video: 'https://youtu.be/test1234567',
      status: 1,
      guru_mapel: {
        id: 1,
        guru: { id: 1, nama: 'JAZILAH NURUL HIDAYATI' },
        mapel: { id: 6, kode: 'SOS', nama: 'SOSIOLOGI' },
      },
      created_at: '2026-10-24T22:20:28+00:00',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    materiService.getAll.mockResolvedValue({
      data: { data: mockMateriData },
      error: null,
    })
  })

  it('renders student card view for siswa role without table', async () => {
    useAuthStore.setState({
      user: {
        id: 188,
        name: 'SANIA FITRI',
        role: 'siswa',
        roles: [{ code: 'siswa', name: 'siswa' }],
        permissions: [{ code: 'materi.view' }],
      },
    })

    render(
      <MemoryRouter>
        <MateriList />
      </MemoryRouter>
    )

    // Should display student greeting banner
    expect(await screen.findByText(/Halo, SANIA FITRI!/i)).toBeInTheDocument()
    expect(screen.getByText(/Ruang Belajar Mandiri/i)).toBeInTheDocument()

    // Should display materi cards
    expect(await screen.findByText('Bakteri Serta Peranannya Bagi Manusia')).toBeInTheDocument()
    expect(screen.getByText('Identitas diri, tindakan sosial')).toBeInTheDocument()
    expect(screen.getByText(/RIZA ADRIANUS/i)).toBeInTheDocument()

    // Should NOT render InfiniteGrid table
    expect(screen.queryByTestId('mock-infinite-grid')).not.toBeInTheDocument()
  })

  it('renders table view for guru or admin role', async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: 'Guru Pengampu',
        role: 'guru',
        roles: [{ code: 'guru', name: 'guru' }],
        permissions: [{ code: 'materi.view' }],
      },
    })

    render(
      <MemoryRouter>
        <MateriList />
      </MemoryRouter>
    )

    // Should render InfiniteGrid table for teacher/admin
    expect(screen.getByTestId('mock-infinite-grid')).toBeInTheDocument()
    // Should NOT show student hero banner
    expect(screen.queryByText(/Ruang Belajar Mandiri/i)).not.toBeInTheDocument()
  })
})
