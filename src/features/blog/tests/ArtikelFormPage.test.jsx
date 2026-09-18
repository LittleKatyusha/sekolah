import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ArtikelFormPage from '../pages/ArtikelFormPage'
import ArtikelListPage from '../pages/ArtikelListPage'
import { blogService } from '../services/blogService'

vi.mock('../../../utils/sweetalert', () => ({
  showToast: vi.fn(),
  showConfirm: vi.fn().mockResolvedValue(true),
}))

vi.mock('../services/blogService', () => ({
  blogService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getCategories: vi.fn(),
  },
}))

vi.mock('../../../hooks/usePermission', () => ({
  default: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
  usePermission: () => ({
    hasPermission: () => true,
  }),
  checkPermission: () => true,
  isSuperAdminUser: () => true,
}))

vi.mock('../../../store/useAuthStore', () => ({
  default: (selector) =>
    selector({
      user: { id: 1, name: 'Admin', role: 'superadmin' },
    }),
}))

describe('ArtikelFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    blogService.getCategories.mockResolvedValue({
      data: {
        data: [
          { id: 1, nama: 'Teknologi', slug: 'teknologi' },
          { id: 2, nama: 'Prestasi', slug: 'prestasi' },
        ],
      },
    })
  })

  it('mounts LexicalEditor and does not render any slug input field', async () => {
    render(
      <MemoryRouter initialEntries={['/artikel/create']}>
        <Routes>
          <Route path="/artikel/create" element={<ArtikelFormPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Form title & inputs
    expect(screen.getByText('Tulis Artikel Baru')).toBeInTheDocument()
    expect(screen.getByLabelText(/Judul Artikel/i)).toBeInTheDocument()

    // Test 2: Ensure NO slug input exists in UI
    expect(screen.queryByLabelText(/slug/i)).toBeNull()
    expect(screen.queryByPlaceholderText(/slug/i)).toBeNull()

    // Test 1: LexicalEditor mount check (editor placeholder / content editable)
    expect(
      screen.getByText(/Mulai tulis artikel lengkap di sini/i)
    ).toBeInTheDocument()

    // Category options populated
    await waitFor(() => {
      expect(screen.getByText('Teknologi')).toBeInTheDocument()
    })
  })

  it('validates required fields before submitting draft', async () => {
    render(
      <MemoryRouter initialEntries={['/artikel/create']}>
        <Routes>
          <Route path="/artikel/create" element={<ArtikelFormPage />} />
        </Routes>
      </MemoryRouter>
    )

    const judulInput = screen.getByLabelText(/Judul Artikel/i)
    fireEvent.change(judulInput, { target: { value: 'Inovasi Baru Robotik' } })

    // Simulate clicking "Simpan Draf"
    const draftBtn = screen.getByRole('button', { name: /Simpan Draf/i })
    fireEvent.click(draftBtn)

    // Since konten is required and empty, validation error should appear
    await waitFor(() => {
      expect(screen.getByText(/Konten artikel tidak boleh kosong/i)).toBeInTheDocument()
    })
    expect(blogService.create).not.toHaveBeenCalled()
  })
})

describe('ArtikelListPage Status Filter Tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    blogService.getAll.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            judul: 'Artikel Draf 1',
            status: 'draft',
            slug: 'artikel-draf-1-abc123',
            author_name: 'Guru Budi',
            author_type: 'guru',
            created_at: '2026-09-19T10:00:00Z',
          },
        ],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
      error: null,
    })
  })

  it('filters articles when different status tabs are clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/artikel']}>
        <Routes>
          <Route path="/artikel" element={<ArtikelListPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Artikel Draf 1')).toBeInTheDocument()
    })

    // Click "Menunggu Review" tab
    const pendingTab = screen.getByRole('button', { name: /Menunggu Review/i })
    fireEvent.click(pendingTab)

    await waitFor(() => {
      expect(blogService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
    })

    // Click "Terbit" tab
    const publishedTab = screen.getByRole('button', { name: /^Terbit$/i })
    fireEvent.click(publishedTab)

    await waitFor(() => {
      expect(blogService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      )
    })
  })
})
