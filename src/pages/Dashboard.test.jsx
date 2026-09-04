import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import useAuthStore from '../store/useAuthStore'
import { dashboardService } from '../features/dashboard/services/dashboardService'

vi.mock('../features/dashboard/services/dashboardService', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
  },
}))

vi.mock('../features/dashboard/components/QuickActions', () => ({
  default: () => <div>Quick Actions</div>,
}))

const dashboardData = {
  role: 'admin',
  summary_cards: {
    total_siswa_aktif: 42,
    total_guru: 8,
    total_kelas: 3,
    total_tunggakan_spp: { formatted: 'Rp 0', month: '', year: 0, jumlah_siswa: 0 },
    kasus_bk_proses: 1,
    ppdb_summary: { total_pendaftar: 5, pendaftar_diterima: 2 },
  },
  financial: {},
  academic_attendance: {},
  counseling: {},
  ppdb: null,
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dashboardService.getDashboardData.mockResolvedValue(dashboardData)
    useAuthStore.setState({ user: { id: 1, name: 'Super Admin', role: 'SUPERADMIN' } })
  })

  it('loads and renders the admin summary for superadmin', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())

    expect(dashboardService.getDashboardData).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Total Siswa Aktif')).toBeInTheDocument()
    expect(screen.queryByText(/Ringkasan dashboard dinonaktifkan/i)).not.toBeInTheDocument()
  })
})