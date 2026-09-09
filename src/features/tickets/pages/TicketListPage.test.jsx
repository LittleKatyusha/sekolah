import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TicketListPage from './TicketListPage'

vi.mock('../services/ticketService', () => ({
  ticketService: {
    getAll: vi.fn(),
    create: vi.fn(),
    escalate: vi.fn(),
    resolve: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

import { ticketService } from '../services/ticketService'
import { showError } from '../../../utils/sweetalert'

const mockTickets = [
  {
    id: 1,
    nomor_tiket: 'TCK-20260909-001',
    kategori: 'umum',
    judul: 'Lupa cara reset password',
    deskripsi: 'Saya ingin mereset password akun siswa.',
    status: 'open',
    solusi_ai: 'Buka menu profil lalu klik Lupa Password.',
    file_url: 'https://cdn.akademihub.id/support-tickets/evidence1.png',
    file_name: 'evidence1.png',
    created_at: '2026-09-09T10:00:00Z',
    user: { id: 1, name: 'Budi' },
  },
  {
    id: 2,
    nomor_tiket: 'TCK-20260909-002',
    kategori: 'keuangan',
    judul: 'Pembayaran SPP terpotong ganda',
    deskripsi: 'Saldo terpotong dua kali di mutasi bank.',
    status: 'escalated',
    solusi_ai: 'Perlu verifikasi manual tim keuangan.',
    created_at: '2026-09-09T11:00:00Z',
    user: { id: 2, name: 'Siti' },
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <TicketListPage />
    </MemoryRouter>
  )

describe('TicketListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ticketService.getAll.mockResolvedValue({ data: mockTickets })
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-preview')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('renders ticket list and AI recommendations', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('TCK-20260909-001')).toBeInTheDocument()
      expect(screen.getByText('Lupa cara reset password')).toBeInTheDocument()
      expect(screen.getByText('Buka menu profil lalu klik Lupa Password.')).toBeInTheDocument()
      expect(screen.getByText('evidence1.png')).toBeInTheDocument()
      expect(screen.getAllByText('Ditangani AI').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Dialihkan ke Tim').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('allows manual escalation to team', async () => {
    ticketService.escalate.mockResolvedValue({ data: { success: true } })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('AI Belum Membantu? Hubungi Tim')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('AI Belum Membantu? Hubungi Tim'))

    await waitFor(() => {
      expect(ticketService.escalate).toHaveBeenCalledWith(1)
    })
  })

  it('allows marking ticket as resolved', async () => {
    ticketService.resolve.mockResolvedValue({ data: { success: true } })
    renderPage()

    await waitFor(() => {
      const resolveButtons = screen.getAllByText('Masalah Selesai')
      expect(resolveButtons.length).toBeGreaterThan(0)
      fireEvent.click(resolveButtons[0])
    })

    await waitFor(() => {
      expect(ticketService.resolve).toHaveBeenCalledWith(1)
    })
  })

  it('creates new ticket with evidence upload through modal', async () => {
    ticketService.create.mockResolvedValue({
      data: {
        data: {
          id: 3,
          nomor_tiket: 'TCK-20260909-003',
          status: 'open',
        },
      },
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Buat Tiket Kendala')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Buat Tiket Kendala'))

    expect(screen.getByText('Buat Tiket Kendala Baru')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Contoh: Pembayaran SPP/i), {
      target: { value: 'Kendala baru saya' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Ceritakan detail/i), {
      target: { value: 'Deskripsi kendala yang sangat rinci' },
    })

    const testFile = new File(['dummy-content'], 'bukti-transfer.png', { type: 'image/png' })
    const fileInput = screen.getByTestId('evidence-file-input')
    fireEvent.change(fileInput, { target: { files: [testFile] } })

    expect(screen.getByText('bukti-transfer.png')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Kirim & Analisis AI'))

    await waitFor(() => {
      expect(ticketService.create).toHaveBeenCalledWith({
        kategori: 'umum',
        judul: 'Kendala baru saya',
        deskripsi: 'Deskripsi kendala yang sangat rinci',
        file: testFile,
      })
    })
  })

  it('rejects evidence file exceeding 10MB limit', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Buat Tiket Kendala')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Buat Tiket Kendala'))

    const oversizedFile = new File([''], 'huge-video.mp4', { type: 'video/mp4' })
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 })

    const fileInput = screen.getByTestId('evidence-file-input')
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

    expect(showError).toHaveBeenCalledWith('Ukuran file bukti melebihi batas 10MB')
    expect(screen.queryByText('huge-video.mp4')).not.toBeInTheDocument()
  })
})
