import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProfileLogsTab from './ProfileLogsTab'

vi.mock('../../../services/profileService', () => ({
  profileService: {
    getActivityLogs: vi.fn(),
  },
}))

import { profileService } from '../../../services/profileService'

const mockLogsData = [
  {
    id: 5210,
    log_name: 'profile',
    description: 'User memperbarui foto profil',
    event: 'updated',
    subject_type: 'App\\Models\\System\\SysUser',
    subject_id: 161,
    ip_address: '103.177.176.117',
    user_agent: 'Mozilla/5.0 Chrome/157',
    properties: { file_path: 'avatar.png' },
    created_at: '2026-11-12T04:44:22+00:00',
  },
  {
    id: 4869,
    log_name: 'Nilai',
    description: 'Created Nilai ID: 631',
    event: 'create',
    subject_type: 'App\\Models\\Master\\MstNilai',
    subject_id: 631,
    ip_address: '140.213.33.111',
    user_agent: 'Mozilla/5.0 Android',
    properties: { old: { score: 70 }, new: { score: 90 } },
    created_at: '2026-11-03T03:08:53+00:00',
  },
]

describe('ProfileLogsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockResponse = [...mockLogsData]
    mockResponse.meta = {
      current_page: 1,
      last_page: 3,
      total: 25,
      per_page: 10,
    }
    profileService.getActivityLogs.mockResolvedValue(mockResponse)
  })

  it('renders table headers and fetches activity logs', async () => {
    render(<ProfileLogsTab />)

    expect(screen.getByText('Riwayat Aktivitas')).toBeInTheDocument()
    expect(screen.getByText('Waktu')).toBeInTheDocument()
    expect(screen.getByText('Aksi')).toBeInTheDocument()
    expect(screen.getByText('Modul')).toBeInTheDocument()
    expect(screen.getByText('Deskripsi Aktivitas')).toBeInTheDocument()
    expect(screen.getByText('IP Address')).toBeInTheDocument()

    await waitFor(() => {
      expect(profileService.getActivityLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, per_page: 10 })
      )
      expect(screen.getByText('User memperbarui foto profil')).toBeInTheDocument()
      expect(screen.getByText('Created Nilai ID: 631')).toBeInTheDocument()
    })
  })

  it('displays pagination information correctly', async () => {
    render(<ProfileLogsTab />)

    await waitFor(() => {
      expect(screen.getByText(/Menampilkan/)).toBeInTheDocument()
      expect(screen.getByText('Halaman 1 dari 3')).toBeInTheDocument()
      expect(screen.getByText('25 Total')).toBeInTheDocument()
    })
  })

  it('triggers page change when clicking Next page button', async () => {
    render(<ProfileLogsTab />)

    await waitFor(() => {
      expect(screen.getByText('User memperbarui foto profil')).toBeInTheDocument()
    })

    const nextBtn = screen.getByTitle('Halaman Selanjutnya')
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(profileService.getActivityLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, per_page: 10 })
      )
    })
  })

  it('filters by search term', async () => {
    render(<ProfileLogsTab />)

    const searchInput = screen.getByPlaceholderText(/Cari deskripsi, modul, atau alamat IP/i)
    fireEvent.change(searchInput, { target: { value: 'foto profil' } })
    fireEvent.submit(searchInput.closest('form'))

    await waitFor(() => {
      expect(profileService.getActivityLogs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'foto profil', page: 1 })
      )
    })
  })

  it('filters by event type', async () => {
    render(<ProfileLogsTab />)

    const eventSelect = screen.getByLabelText('Filter jenis aksi')
    fireEvent.change(eventSelect, { target: { value: 'update' } })

    await waitFor(() => {
      expect(profileService.getActivityLogs).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'update', page: 1 })
      )
    })
  })

  it('opens and closes the detail modal', async () => {
    render(<ProfileLogsTab />)

    await waitFor(() => {
      expect(screen.getByText('User memperbarui foto profil')).toBeInTheDocument()
    })

    const detailButtons = screen.getAllByTitle('Lihat Detail Aktivitas')
    fireEvent.click(detailButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Detail Log #5210')).toBeInTheDocument()
    expect(screen.getAllByText('103.177.176.117')).toHaveLength(2)

    // Close modal
    const closeBtn = screen.getByRole('button', { name: 'Tutup' })
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders diff view in detail modal for old/new properties', async () => {
    render(<ProfileLogsTab />)

    await waitFor(() => {
      expect(screen.getByText('Created Nilai ID: 631')).toBeInTheDocument()
    })

    const detailButtons = screen.getAllByTitle('Lihat Detail Aktivitas')
    fireEvent.click(detailButtons[1]) // Click second log which has old/new

    expect(screen.getByText('Old')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
  })
})
