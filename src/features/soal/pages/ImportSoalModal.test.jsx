import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportSoalModal from './ImportSoalModal'
import { soalService } from '../services/soalService'
import { mapelService } from '../../mapel/services/mapelService'

vi.mock('../services/soalService', () => ({
  soalService: {
    importSoal: vi.fn(),
  },
}))

vi.mock('../../mapel/services/mapelService', () => ({
  mapelService: {
    getMapel: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 1, kode_mapel: 'MAT-10', nama_mapel: 'Matematika' },
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

describe('ImportSoalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header, download template, and mapel selector', async () => {
    render(<ImportSoalModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Import Bank Soal')).toBeDefined()
    expect(screen.getByText('Unduh')).toBeDefined()
    expect(screen.getByLabelText(/mata pelajaran/i)).toBeDefined()
    await waitFor(() => {
      expect(screen.getByText(/Matematika \(MAT-10\)/)).toBeDefined()
    })
  })

  it('submits valid excel file and triggers onSuccess', async () => {
    const onSuccess = vi.fn()
    soalService.importSoal.mockResolvedValueOnce({
      data: {
        imported: 5,
        failed: 0,
        skipped: 0,
        errors: [],
      },
      error: null,
    })

    render(<ImportSoalModal onClose={vi.fn()} onSuccess={onSuccess} />)

    const file = new File(['dummy-content'], 'bank_soal.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const startButton = screen.getByRole('button', { name: /mulai import/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(soalService.importSoal).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText('Import berhasil.')).toBeDefined()
      expect(screen.getByText(/5 berhasil/)).toBeDefined()
    })
  })
})
