import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublicBlogDetail from '../pages/PublicBlogDetail'
import ReviewModal from '../components/ReviewModal'
import { blogService } from '../services/blogService'

vi.mock('../services/blogService', () => ({
  blogService: {
    getPublicArticleBySlug: vi.fn(),
  },
}))

const mockArtikel = {
  id: 12,
  judul: 'Juara 1 Lomba Robotik Nasional',
  slug: 'juara-1-lomba-robotik-nasional-k8x1a2',
  ringkasan: 'Tim robotik SMA berhasil meraih medali emas di ajang bergengsi.',
  konten: '<p>Pada tanggal 18 September kemarin, tim siswa kami berprestasi.</p>',
  thumbnail_url: 'https://example.com/robotik.jpg',
  author_name: 'Ahmad Fauzi',
  author_type: 'siswa',
  kategori: { id: 2, nama: 'Prestasi', slug: 'prestasi' },
  published_at: '2026-09-19T08:30:00Z',
  view_count: 142,
}

describe('PublicBlogDetail SEO & JSON-LD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.title = ''
    document.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove())
    document.querySelectorAll('#blog-posting-jsonld').forEach((el) => el.remove())
  })

  it('injects document.title, OG meta tags, and BlogPosting JSON-LD script', async () => {
    blogService.getPublicArticleBySlug.mockResolvedValueOnce({
      data: { success: true, data: mockArtikel },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/blog/juara-1-lomba-robotik-nasional-k8x1a2?sekolah=smada']}>
        <Routes>
          <Route path="/blog/:slug" element={<PublicBlogDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.title).toContain('Juara 1 Lomba Robotik Nasional')
    })

    // OG Meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    expect(ogTitle).not.toBeNull()
    expect(ogTitle?.getAttribute('content')).toBe('Juara 1 Lomba Robotik Nasional')

    const ogDesc = document.querySelector('meta[property="og:description"]')
    expect(ogDesc).not.toBeNull()
    expect(ogDesc?.getAttribute('content')).toBe(mockArtikel.ringkasan)

    const ogImage = document.querySelector('meta[property="og:image"]')
    expect(ogImage?.getAttribute('content')).toBe('https://example.com/robotik.jpg')

    // JSON-LD Script
    const jsonLdScript = document.getElementById('blog-posting-jsonld')
    expect(jsonLdScript).not.toBeNull()
    const schema = JSON.parse(jsonLdScript?.textContent || '{}')
    expect(schema['@type']).toBe('BlogPosting')
    expect(schema.headline).toBe('Juara 1 Lomba Robotik Nasional')
    expect(schema.author?.name).toBe('Ahmad Fauzi')
  })
})

describe('ReviewModal', () => {
  it('displays rejection note textarea when Tolak tab is clicked', async () => {
    const handleSubmit = vi.fn()
    const handleClose = vi.fn()

    render(
      <ReviewModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        artikel={mockArtikel}
        initialAction="approve"
      />
    )

    // Initially approve mode
    expect(screen.getByText('Artikel ini akan segera diterbitkan dan dapat dibaca oleh publik di portal sekolah.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Alasan Penolakan/i)).toBeNull()

    // Click "Tolak" button tab
    const tolakBtn = screen.getByRole('button', { name: /Tolak/i })
    fireEvent.click(tolakBtn)

    // Now rejection note input should appear
    const textarea = screen.getByPlaceholderText(/Tuliskan catatan perbaikan atau alasan penolakan/i)
    expect(textarea).toBeInTheDocument()

    // Validation check: short text should show validation error
    fireEvent.change(textarea, { target: { value: 'Bad' } })
    const submitBtn = screen.getByRole('button', { name: /Tolak Artikel/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/Catatan penolakan wajib diisi minimal 5 karakter/i)).toBeInTheDocument()
    expect(handleSubmit).not.toHaveBeenCalled()

    // Valid rejection note
    fireEvent.change(textarea, { target: { value: 'Perbaiki tanda baca paragraf pertama' } })
    fireEvent.click(submitBtn)

    expect(handleSubmit).toHaveBeenCalledWith({
      action: 'reject',
      artikelId: 12,
      rejectionNote: 'Perbaiki tanda baca paragraf pertama',
    })
  })
})
