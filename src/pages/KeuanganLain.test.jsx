import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import JenisPembayaran from './JenisPembayaran'
import PembayaranLain from './PembayaranLain'

vi.mock('../components/ui/ServerGrid', () => ({
  default: ({ endpoint }) => <div data-testid="server-grid" data-endpoint={endpoint}>ServerGrid</div>,
}))

vi.mock('../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../utils/api', () => ({
  apiService: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}))

vi.mock('../utils/sweetalert', () => ({
  showDeleteConfirm: vi.fn().mockResolvedValue({ isConfirmed: true }),
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

describe('Keuangan Lain-Lain Modules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders JenisPembayaran page and opens create modal', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <JenisPembayaran />
        </MemoryRouter>
      )
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Jenis Pembayaran' })).toBeInTheDocument()
    expect(screen.getByTestId('server-grid')).toHaveAttribute('data-endpoint', '/keuangan/jenis-pembayaran')

    const tambahButton = screen.getByRole('button', { name: /tambah jenis/i })
    await act(async () => {
      fireEvent.click(tambahButton)
    })

    expect(screen.getByText('Tambah Jenis Pembayaran')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/seragam olahraga/i)).toBeInTheDocument()
  })

  it('renders PembayaranLain page and opens create modal', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PembayaranLain />
        </MemoryRouter>
      )
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Pembayaran Lain-Lain' })).toBeInTheDocument()
    expect(screen.getByTestId('server-grid')).toHaveAttribute('data-endpoint', '/keuangan/pembayaran-lain')

    const catatButton = screen.getByRole('button', { name: /catat pembayaran/i })
    await act(async () => {
      fireEvent.click(catatButton)
    })

    expect(screen.getByText('Catat Pembayaran Baru')).toBeInTheDocument()
  })
})

