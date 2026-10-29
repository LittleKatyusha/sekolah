import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from './ProfilePage'

vi.mock('../../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    getActivityLogs: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

import { profileService } from '../../../services/profileService'

const mockProfileData = {
  user: {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@example.com',
    username: 'budisantoso',
    role: 'admin',
    avatar: 'https://example.com/avatar.jpg',
    tenant: {
      id: 10,
      name: 'SMK Negeri 1 Surabaya',
    },
  },
}

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileService.getProfile.mockResolvedValue(mockProfileData)
    profileService.getActivityLogs.mockResolvedValue({ data: [] })
  })

  it('renders profile card and tabs after loading', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    expect(screen.getByText(/memuat data profil/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
      expect(screen.getByText('budi@example.com')).toBeInTheDocument()
      expect(screen.getByText('@budisantoso')).toBeInTheDocument()
      expect(screen.getByText('SMK Negeri 1 Surabaya')).toBeInTheDocument()
    })

    expect(screen.getByText('Informasi Umum')).toBeInTheDocument()
    expect(screen.getByText('Foto Profil')).toBeInTheDocument()
    expect(screen.getByText('Kata Sandi')).toBeInTheDocument()
    expect(screen.getByText('Riwayat Aktivitas')).toBeInTheDocument()
  })

  it('allows switching between tabs', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Click on Kata Sandi tab
    fireEvent.click(screen.getByText('Kata Sandi'))
    expect(screen.getByLabelText(/kata sandi saat ini/i)).toBeInTheDocument()

    // Click on Riwayat Aktivitas tab
    fireEvent.click(screen.getByText('Riwayat Aktivitas'))
    await waitFor(() => {
      expect(profileService.getActivityLogs).toHaveBeenCalled()
    })
  })
})
