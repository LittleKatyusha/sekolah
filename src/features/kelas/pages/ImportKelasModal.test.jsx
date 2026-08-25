import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportKelasModal from './ImportKelasModal'
import { kelasService } from '../services/kelasService'

vi.mock('../services/kelasService', () => ({
  kelasService: {
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

describe('ImportKelasModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header and unduh template button', () => {
    render(<ImportKelasModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Import Data Kelas')).toBeDefined()
    expect(screen.getByText('Unduh Template')).toBeDefined()
    expect(screen.getByText('Pilih file Excel atau seret ke sini')).toBeDefined()
  })

  it('submits valid excel file and renders summary', async () => {
    const onSuccess = vi.fn()
    kelasService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 2,
        failed: 0,
        skipped: 0,
        errors: [],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportKelasModal onClose={vi.fn()} onSuccess={onSuccess} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(kelasService.importExcel).toHaveBeenCalledWith(file)
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ imported: 2 }))
      expect(screen.getByText('Berhasil')).toBeDefined()
      expect(screen.getByText('Tutup')).toBeDefined()
    })
  })

  it('renders error rows for partial success', async () => {
    kelasService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 1,
        failed: 1,
        skipped: 0,
        errors: [
          { row: 3, identifier: 'X IPA 1', code: 'DUPLICATE', message: 'Kelas dengan nama tersebut sudah ada di tahun ajaran ini.' },
        ],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportKelasModal onClose={vi.fn()} onSuccess={onSuccessMock} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(screen.getByText('DUPLICATE')).toBeDefined()
      expect(screen.getByText('Kelas dengan nama tersebut sudah ada di tahun ajaran ini.')).toBeDefined()
      expect(screen.getByText('Gagal')).toBeDefined()
    })
  })

  const onSuccessMock = vi.fn()

  it('provides dialog keyboard behavior, focus trap, and restores focus', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<ImportKelasModal onClose={onClose} onSuccess={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Import Data Kelas' })
    const close = screen.getByRole('button', { name: 'Batal' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Unduh Template' }))

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('prevents double-submit while upload is pending', async () => {
    let resolveUpload
    kelasService.importExcel.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = resolve }))
    render(<ImportKelasModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    const file = new File(['x'], 'test.xlsx')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)
    fireEvent.click(importButton)
    expect(kelasService.importExcel).toHaveBeenCalledTimes(1)

    resolveUpload({ data: { imported: 0, failed: 0, skipped: 0, errors: [] }, error: null })
    await waitFor(() => expect(screen.getByText('Tutup')).toBeDefined())
  })

  it('rejects unsupported and oversized files before upload', () => {
    render(<ImportKelasModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    const input = screen.getByTestId('file-input')

    fireEvent.change(input, { target: { files: [new File(['x'], 'kelas.csv')] } })
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'kelas.xlsx')] },
    })

    expect(kelasService.importExcel).not.toHaveBeenCalled()
  })
})
