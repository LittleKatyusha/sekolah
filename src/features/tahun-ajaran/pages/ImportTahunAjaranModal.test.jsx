import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportTahunAjaranModal from './ImportTahunAjaranModal'
import { tahunAjaranService } from '../services/tahunAjaranService'

vi.mock('../services/tahunAjaranService', () => ({
  tahunAjaranService: {
    importExcel: vi.fn(),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('ImportTahunAjaranModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header and unduh template button', () => {
    render(<ImportTahunAjaranModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Import Data Tahun Ajaran')).toBeDefined()
    expect(screen.getByText('Unduh Template')).toBeDefined()
    expect(screen.getByText('Pilih file Excel atau seret ke sini')).toBeDefined()
  })

  it('submits valid excel file and renders summary', async () => {
    const onSuccess = vi.fn()
    tahunAjaranService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 2,
        failed: 0,
        skipped: 0,
        errors: [],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportTahunAjaranModal onClose={vi.fn()} onSuccess={onSuccess} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(tahunAjaranService.importExcel).toHaveBeenCalledWith(file)
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText('Berhasil')).toBeDefined()
      expect(screen.getByText('Tutup')).toBeDefined()
    })
  })
})
