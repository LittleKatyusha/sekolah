import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportGuruModal from './ImportGuruModal'
import { guruService } from '../services/guruService'

vi.mock('../services/guruService', () => ({
  guruService: {
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

describe('ImportGuruModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header and download template button', () => {
    render(<ImportGuruModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Import Data Guru')).toBeDefined()
    expect(screen.getByText('Download Template')).toBeDefined()
    expect(screen.getByText('Tarik & lepas file Excel di sini, atau klik untuk memilih')).toBeDefined()
  })

  it('submits valid excel file and renders summary', async () => {
    const onSuccess = vi.fn()
    guruService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 2,
        failed: 0,
        skipped: 0,
        errors: [],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportGuruModal onClose={vi.fn()} onSuccess={onSuccess} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /^import$/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(guruService.importExcel).toHaveBeenCalledWith(file)
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText('Berhasil')).toBeDefined()
      expect(screen.getByText('Tutup')).toBeDefined()
    })
  })

  it('renders error rows for partial success', async () => {
    guruService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 1,
        failed: 1,
        skipped: 0,
        errors: [
          { row: 3, identifier: '198501012010011002', code: 'DUPLICATE', message: 'NIP sudah terdaftar' },
        ],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportGuruModal onClose={vi.fn()} onSuccess={vi.fn()} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /^import$/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(screen.getByText('DUPLICATE')).toBeDefined()
      expect(screen.getByText('NIP sudah terdaftar')).toBeDefined()
      expect(screen.getByText('Gagal')).toBeDefined()
    })
  })

  it('provides dialog keyboard behavior, focus trap, and restores focus', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<ImportGuruModal onClose={onClose} onSuccess={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Import Data Guru' })
    const close = screen.getByRole('button', { name: 'Tutup dialog import guru' })
    expect(document.activeElement).toBe(close)

    const importButton = screen.getByRole('button', { name: /^import$/i })
    importButton.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(close)

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('prevents double-submit while upload is pending', async () => {
    let resolveUpload
    guruService.importExcel.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = resolve }))
    render(<ImportGuruModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    const file = new File(['x'], 'test.xlsx')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /^import$/i })
    fireEvent.click(importButton)
    fireEvent.click(importButton)
    expect(guruService.importExcel).toHaveBeenCalledTimes(1)

    resolveUpload({ data: { imported: 0, failed: 0, skipped: 0, errors: [] }, error: null })
    await waitFor(() => expect(screen.getByText('Tutup')).toBeDefined())
  })

  it('does not request a grid refresh when no rows were imported', async () => {
    const onSuccess = vi.fn()
    guruService.importExcel.mockResolvedValueOnce({
      data: { imported: 0, failed: 1, skipped: 0, errors: [] },
      error: null,
    })
    render(<ImportGuruModal onClose={vi.fn()} onSuccess={onSuccess} />)
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [new File(['x'], 'test.xlsx')] },
    })
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))

    await waitFor(() => expect(screen.getByText('Tutup')).toBeDefined())
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
