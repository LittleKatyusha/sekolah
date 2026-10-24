import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AssignUjianModal from './AssignUjianModal'
import { soalService } from '../services/soalService'
import { ujianService } from '../../ujian/services/ujianService'

vi.mock('../services/soalService', () => ({
  soalService: {
    batchAssignUjian: vi.fn(),
  },
}))

vi.mock('../../ujian/services/ujianService', () => ({
  ujianService: {
    getAll: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 10, nama: 'UTS Biologi', mst_mapel_id: 1, kelas: { nama_kelas: 'X-A' }, mapel: { nama: 'Biologi' } },
        ],
      },
      error: null,
    }),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('AssignUjianModal', () => {
  const mockSoals = [
    { id: 101, mst_mapel_id: 1, mapel: { nama: 'Biologi' }, pertanyaan: 'Soal 1' },
    { id: 102, mst_mapel_id: 1, mapel: { nama: 'Biologi' }, pertanyaan: 'Soal 2' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders selected soals summary and options', async () => {
    render(<AssignUjianModal open={true} onClose={vi.fn()} selectedSoals={mockSoals} onSuccess={vi.fn()} />)

    expect(screen.getByText('Tambahkan Soal ke Ujian')).toBeDefined()
    expect(screen.getByText('2 soal dipilih')).toBeDefined()
    expect(screen.getByText(/Biologi/)).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText(/UTS Biologi/)).toBeDefined()
    })
  })

  it('submits batch assign and calls onSuccess', async () => {
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    soalService.batchAssignUjian.mockResolvedValueOnce({
      data: {
        data: {
          assigned_count: 2,
          total_soal: 2,
        },
      },
      error: null,
    })

    render(<AssignUjianModal open={true} onClose={onClose} selectedSoals={mockSoals} onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText(/UTS Biologi/)).toBeDefined()
    })

    const select = screen.getByLabelText(/pilih ujian tujuan/i)
    fireEvent.change(select, { target: { value: '10' } })

    const submitBtn = screen.getByRole('button', { name: /tugaskan ke ujian/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(soalService.batchAssignUjian).toHaveBeenCalledWith('10', [101, 102])
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('displays warning when selected soals have different subjects', async () => {
    const mixedSoals = [
      { id: 101, mst_mapel_id: 1, mapel: { nama: 'Biologi' } },
      { id: 102, mst_mapel_id: 2, mapel: { nama: 'Kimia' } },
    ]

    render(<AssignUjianModal open={true} onClose={vi.fn()} selectedSoals={mixedSoals} />)

    await waitFor(() => {
      expect(screen.getByText(/soal yang dipilih memiliki mata pelajaran yang berbeda/i)).toBeDefined()
    })
    const submitBtn = screen.getByRole('button', { name: /tugaskan ke ujian/i })
    expect(submitBtn.disabled).toBe(true)
  })
})
