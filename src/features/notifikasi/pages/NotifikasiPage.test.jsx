import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotifikasiPage from './NotifikasiPage'

// Mock service
vi.mock('../services/notifikasiService', () => ({
  notifikasiService: {
    getAll: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({ showError: vi.fn(), showSuccess: vi.fn() }))

import { notifikasiService } from '../services/notifikasiService'

const mockItems = [
  {
    id: 1,
    judul: 'Alert EWS',
    pesan: 'Siswa membutuhkan perhatian',
    type: 'ews_alert',
    urgency: 'high',
    is_read: false,
    data: {},
    read_at: null,
    created_at: '2024-01-15T08:00:00Z',
  },
  {
    id: 2,
    judul: 'Info SPP',
    pesan: 'SPP bulan ini sudah dibayar',
    type: 'spp_tunggakan',
    urgency: 'low',
    is_read: true,
    data: {},
    read_at: '2024-01-15T09:00:00Z',
    created_at: '2024-01-15T07:00:00Z',
  },
]

const mockResponse = {
  data: mockItems,
  meta: { total: 2, per_page: 20, current_page: 1, last_page: 1, unread_count: 1 },
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotifikasiPage />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  notifikasiService.getAll.mockResolvedValue(mockResponse)
})

describe('NotifikasiPage', () => {
  it('renders page heading', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('heading', { name: /notifikasi/i })).toBeInTheDocument())
  })

  it('shows loading state initially', () => {
    renderPage()
    expect(screen.getByText(/memuat/i)).toBeInTheDocument()
  })

  it('displays list of notifications after load', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Alert EWS')).toBeInTheDocument())
    expect(screen.getByText('Info SPP')).toBeInTheDocument()
  })

  it('shows unread badge count', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('belum dibaca')).toBeInTheDocument())
  })

  it('filters to unread only when Belum Dibaca tab is clicked', async () => {
    notifikasiService.getAll.mockResolvedValue({
      data: [mockItems[0]],
      meta: { total: 1, per_page: 20, current_page: 1, last_page: 1, unread_count: 1 },
    })
    renderPage()
    await waitFor(() => screen.getByText('Alert EWS'))
    const unreadTab = screen.getByRole('button', { name: /belum dibaca/i })
    fireEvent.click(unreadTab)
    await waitFor(() =>
      expect(notifikasiService.getAll).toHaveBeenCalledWith(expect.objectContaining({ is_read: 0 }))
    )
  })

  it('calls markRead when Tandai Dibaca button is clicked on unread notification', async () => {
    notifikasiService.markRead.mockResolvedValue({ data: { ...mockItems[0], is_read: true, read_at: new Date().toISOString() } })
    renderPage()
    await waitFor(() => screen.getByText('Alert EWS'))
    const markReadBtn = screen.getByRole('button', { name: /tandai dibaca/i })
    fireEvent.click(markReadBtn)
    await waitFor(() => expect(notifikasiService.markRead).toHaveBeenCalledWith(1))
  })

  it('calls markAllRead when Tandai Semua Dibaca button is clicked', async () => {
    notifikasiService.markAllRead.mockResolvedValue({ data: { updated: 1 } })
    renderPage()
    await waitFor(() => screen.getByText('Alert EWS'))
    const markAllBtn = screen.getByRole('button', { name: /tandai semua dibaca/i })
    fireEvent.click(markAllBtn)
    await waitFor(() => expect(notifikasiService.markAllRead).toHaveBeenCalled())
  })
})
