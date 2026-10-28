import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GenerateRankingModal from './GenerateRankingModal'
import { rankingService } from '../services/rankingService'
import { kelasService } from '../../kelas/services/kelasService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError } from '../../../utils/sweetalert'

vi.mock('../services/rankingService', () => ({
  rankingService: {
    generate: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../semester/services/semesterService', () => ({
  semesterService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('GenerateRankingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    kelasService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 1, nama_kelas: 'X-A' },
          { id: 2, nama_kelas: 'X-B' },
        ],
      },
    })
    semesterService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 10, nama: 'Semester Ganjil 2024/2025', is_active: true },
          { id: 11, nama: 'Semester Genap 2024/2025', is_active: false },
        ],
      },
    })
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <GenerateRankingModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders and populates options when open', async () => {
    render(
      <GenerateRankingModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    )

    expect(screen.getByRole('heading', { name: 'Generate Ranking Siswa' })).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText('Semua Kelas')).toBeDefined()
      expect(screen.getByText('X-A')).toBeDefined()
      expect(screen.getByText(/Semester Ganjil 2024\/2025/)).toBeDefined()
    })
  })

  it('submits successfully for all classes by default', async () => {
    rankingService.generate.mockResolvedValue({
      data: {
        message: 'Ranking semua kelas generated successfully',
      },
      error: null,
    })

    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <GenerateRankingModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    )

    await waitFor(() => {
      expect(screen.getByText('Semua Kelas')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /Generate Sekarang/i }))

    await waitFor(() => {
      expect(rankingService.generate).toHaveBeenCalledWith({
        semester: 10,
      })
      expect(showSuccess).toHaveBeenCalledWith('Ranking semua kelas generated successfully')
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('submits successfully for specific kelas', async () => {
    rankingService.generate.mockResolvedValue({
      data: {
        message: 'Ranking generated successfully',
      },
      error: null,
    })

    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <GenerateRankingModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    )

    await waitFor(() => {
      expect(screen.getByText('X-A')).toBeDefined()
    })

    fireEvent.change(screen.getByRole('combobox', { name: /^Target Kelas/i }), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Sekarang/i }))

    await waitFor(() => {
      expect(rankingService.generate).toHaveBeenCalledWith({
        kelas_id: 1,
        semester: 10,
      })
      expect(showSuccess).toHaveBeenCalledWith('Ranking generated successfully')
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('handles error response from server', async () => {
    rankingService.generate.mockResolvedValue({
      data: null,
      error: {
        message: 'Tidak ada rapor yang ditemukan untuk kelas ini',
      },
    })

    render(
      <GenerateRankingModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getByText('X-A')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /Generate Sekarang/i }))

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith('Tidak ada rapor yang ditemukan untuk kelas ini')
    })
  })
})
