import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UjianList from './UjianList'
import { kelasService } from '../../kelas/services/kelasService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../services/ujianService', () => ({
  ujianService: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../../store/useAuthStore', () => ({
  default: () => ({
    user: { id: 1, role: 'guru' },
  }),
}))

vi.mock('../../../hooks/usePermission', () => ({
  default: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
  isSuperAdminUser: () => true,
  resolvePermissions: () => ['ujian.create', 'ujian.view', 'ujian.update', 'ujian.delete'],
}))

let capturedColumnDefs = []
vi.mock('../../../components/ui/InfiniteGrid', () => ({
  default: ({ columnDefs }) => {
    capturedColumnDefs = columnDefs
    return <div data-testid="infinite-grid-mock">InfiniteGrid Mock</div>
  },
}))

describe('UjianList Status Nilai Column', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedColumnDefs = []
    kelasService.getAll.mockResolvedValue({
      data: { data: [{ id: 1, nama_kelas: 'X-A' }] },
    })
  })

  it('includes status_penilaian column in columnDefs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UjianList />
        </MemoryRouter>
      )
    })

    const statusCol = capturedColumnDefs.find((col) => col.field === 'status_penilaian')
    expect(statusCol).toBeDefined()
    expect(statusCol.headerName).toBe('Status Nilai')
  })

  it('renders student grading count badges properly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UjianList />
        </MemoryRouter>
      )
    })

    const statusCol = capturedColumnDefs.find((col) => col.field === 'status_penilaian')
    const { container: badgeContainer } = render(
      statusCol.cellRenderer({
        data: {
          total_siswa: 30,
          total_dinilai: 20,
          total_belum_dinilai: 10,
        },
      })
    )

    expect(badgeContainer.textContent).toContain('20 Dinilai')
    expect(badgeContainer.textContent).toContain('10 Belum')
  })

  it('renders dash if 0 siswa and 0 dinilai', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UjianList />
        </MemoryRouter>
      )
    })

    const statusCol = capturedColumnDefs.find((col) => col.field === 'status_penilaian')
    const { container: emptyContainer } = render(
      statusCol.cellRenderer({
        data: {
          total_siswa: 0,
          total_dinilai: 0,
          total_belum_dinilai: 0,
        },
      })
    )

    expect(emptyContainer.textContent).toBe('-')
  })
})
