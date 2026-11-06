import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { ProfileRoute } from './App'
import useAuthStore from './store/useAuthStore'

vi.mock('./features/sekolah/pages/PublicProfile', () => ({
  default: () => <div data-testid="public-school-profile">Detail Sekolah Publik</div>,
}))

vi.mock('./utils/tenant', () => ({
  getSubdomain: vi.fn(() => null),
}))

describe('ProfileRoute Dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ isAuthenticated: false, user: null, token: null })
  })

  it('renders public school profile without login at /profile?sekolah=smada', async () => {
    render(
      <MemoryRouter initialEntries={['/profile?sekolah=smada']}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/profile" element={<ProfileRoute />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    )

    expect(await screen.findByTestId('public-school-profile')).toBeInTheDocument()
    expect(screen.getByText('Detail Sekolah Publik')).toBeInTheDocument()
  })

  it('renders public school profile without login at /profile when on school subdomain', async () => {
    const { getSubdomain } = await import('./utils/tenant')
    vi.mocked(getSubdomain).mockReturnValueOnce('smada')

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/profile" element={<ProfileRoute />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    )

    expect(await screen.findByTestId('public-school-profile')).toBeInTheDocument()
  })

  it('renders public school profile even when logged in if sekolah param is present', async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: 1, name: 'Admin' }, token: 'xyz' })

    render(
      <MemoryRouter initialEntries={['/profile?sekolah=smada']}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/profile" element={<ProfileRoute />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    )

    expect(await screen.findByTestId('public-school-profile')).toBeInTheDocument()
  })

  it('redirects authenticated user to /user/profile when inside dashboard without school context', async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: 1, name: 'Admin' }, token: 'xyz' })

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/profile" element={<ProfileRoute />} />
            <Route path="/user/profile" element={<div data-testid="user-profile-page">Akun Pengguna</div>} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    )

    expect(await screen.findByTestId('user-profile-page')).toBeInTheDocument()
    expect(screen.queryByTestId('public-school-profile')).toBeNull()
  })
})

