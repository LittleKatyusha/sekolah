import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import useAuthStore from '../store/useAuthStore'
import authService from '../services/authService'

vi.mock('../services/authService', () => {
  return {
    authService: {
      me: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    },
    default: {
      me: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    },
  }
})

vi.mock('../utils/api', () => ({
  refreshToken: vi.fn(),
}))

describe('ProtectedRoute fail-closed hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      tokenType: 'bearer',
      expiresIn: null,
      isAuthenticated: false,
      authorizationStatus: 'unknown',
    })
  })

  it('redirects to /login when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeDefined()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('renders loading spinner while authorization is loading', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'valid-token',
      authorizationStatus: 'loading',
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('auth-loading')).toBeDefined()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('renders protected content when authorization is ready', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'valid-token',
      authorizationStatus: 'ready',
      user: {
        id: 1,
        role: 'guru',
        roles: [{ id: 1, code: 'guru', permissions: [] }],
        permissions: [],
      },
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeDefined()
  })

  it('triggers /auth/me on mount when token exists but authorization is not ready', async () => {
    authService.me.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 1,
          role: 'guru',
          roles: [],
          permissions: [],
        },
      },
    })

    useAuthStore.setState({
      isAuthenticated: true,
      token: 'valid-token',
      authorizationStatus: 'unknown',
      user: { id: 1, role: 'admin' }, // admin does not trigger profile hydration
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(authService.me).toHaveBeenCalled()
  })

  it('renders error view on /auth/me network failure without exposing content', async () => {
    authService.me.mockRejectedValueOnce({
      status: 500,
      message: 'Server error',
    })

    useAuthStore.setState({
      isAuthenticated: true,
      token: 'valid-token',
      refreshToken: 'valid-refresh-token',
      authorizationStatus: 'loading',
      user: { id: 1, role: 'admin' },
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Initially shows loading spinner
    expect(screen.getByTestId('auth-loading')).toBeDefined()

    // When status changes to error, shows error UI
    useAuthStore.setState({ authorizationStatus: 'error' })

    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toBeDefined()
    })
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('logs out and redirects to login when /auth/me returns 401', async () => {
    authService.me.mockRejectedValueOnce({
      status: 401,
      message: 'Unauthenticated',
    })

    useAuthStore.setState({
      isAuthenticated: true,
      token: 'expired-token',
      authorizationStatus: 'unknown',
      user: { id: 1, role: 'guru' },
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(screen.getByText('Login Page')).toBeDefined()
    })
  })
})