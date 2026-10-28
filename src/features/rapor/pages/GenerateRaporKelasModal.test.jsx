import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GenerateRaporKelasModal from './GenerateRaporKelasModal'
import { raporService } from '../services/raporService'
import { kelasService } from '../../kelas/services/kelasService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError } from '../../../utils/sweetalert'

vi.mock('../services/raporService', () => ({
  raporService: {
    generateKelas: vi.fn(),
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

describe('GenerateRaporKelasModal', () => {
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
      <GenerateRaporKelasModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders and populates options when open', async () => {
    render(
      <GenerateRaporKelasModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    )

    expect(screen.getByRole('heading', { name: 'Generate Rapor per Kelas' })).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText('X-A')).toBeDefined()
      expect(screen.getByText(/Semester Ganjil 2024\/2025/)).toBeDefined()
    })
  })

  it('validates empty class selection on submit', async () => {
    render(
      <GenerateRaporKelasModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getByText('X-A')).toBeDefined()
    })

    // Submit button without choosing class
    fireEvent.click(screen.getByRole('button', { name: /Generate Sekarang/i }))

    expect(await screen.findByText('Pilih kelas dan semester terlebih dahulu')).toBeDefined()
    expect(raporService.generateKelas).not.toHaveBeenCalled()
  })

  it('submits successfully when kelas and semester are selected', async () => {
    raporService.generateKelas.mockResolvedValue({
      data: {
        message: 'Rapor kelas di-generate: 30 berhasil, 0 gagal',
      },
      error: null,
    })

    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <GenerateRaporKelasModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    )

    await waitFor(() => {
      expect(screen.getByText('X-A')).toBeDefined()
    })

    fireEvent.change(screen.getByRole('combobox', { name: /^Kelas/i }), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Sekarang/i }))

    await waitFor(() => {
      expect(raporService.generateKelas).toHaveBeenCalledWith({
        kelas_id: 1,
        semester: 10,
      })
      expect(showSuccess).toHaveBeenCalledWith('Rapor kelas di-generate: 30 berhasil, 0 gagal')
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('handles backend error properly', async () => {
    raporService.generateKelas.mockResolvedValue({
      data: null,
      error: { message: 'Kelas tidak ditemukan' },
    })

    render(
      <GenerateRaporKelasModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getByText('X-A')).toBeDefined()
    })

    fireEvent.change(screen.getByRole('combobox', { name: /^Kelas/i }), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Sekarang/i }))

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith('Kelas tidak ditemukan')
      expect(screen.getByText('Kelas tidak ditemukan')).toBeDefined()
    })
  })
})
