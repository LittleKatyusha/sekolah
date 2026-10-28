import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import BukuList from './BukuList'
import useAuthStore from '../../../store/useAuthStore'

vi.mock('../../../components/ui/InfiniteGrid', () => ({
  default: () => <div data-testid="infinite-grid">InfiniteGrid</div>,
}))
vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => children,
}))
vi.mock('../services/perpustakaanService', () => ({
  bukuService: {
    getAll: vi.fn().mockResolvedValue({ data: { data: [] } }),
    delete: vi.fn(),
    batchDelete: vi.fn(),
  },
}))

describe('BukuList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders AdminBukuView for admin role without TDZ error', () => {
    useAuthStore.setState({
      user: { role: 'admin', permissions: ['buku.view', 'buku.create', 'buku.update', 'buku.delete'] },
    })

    render(
      <MemoryRouter>
        <BukuList />
      </MemoryRouter>
    )

    expect(screen.getByText('Data Buku')).toBeInTheDocument()
    expect(screen.getByTestId('infinite-grid')).toBeInTheDocument()
  })

  it('renders StudentBukuView for siswa role', async () => {
    useAuthStore.setState({
      user: { role: 'siswa', permissions: ['buku.view'] },
    })

    render(
      <MemoryRouter>
        <BukuList />
      </MemoryRouter>
    )

    expect(await screen.findByText('Katalog Perpustakaan')).toBeInTheDocument()
  })
})
