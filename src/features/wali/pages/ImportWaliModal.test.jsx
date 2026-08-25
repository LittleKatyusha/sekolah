import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportWaliModal from './ImportWaliModal'
import { waliService } from '../services/waliService'

vi.mock('../services/waliService', () => ({
  waliService: {
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

describe('ImportWaliModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header and download template button', () => {
    render(<ImportWaliModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Import Data Wali Siswa')).toBeDefined()
    expect(screen.getByText('Download Template')).toBeDefined()
    expect(screen.getByText('Tarik & lepas file Excel di sini, atau klik untuk memilih')).toBeDefined()
  })

  it('submits valid excel file and renders summary', async () => {
    const onSuccess = vi.fn()
    waliService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 2,
        failed: 0,
        skipped: 0,
        errors: [],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportWaliModal onClose={vi.fn()} onSuccess={onSuccess} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /^import$/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(waliService.importExcel).toHaveBeenCalledWith(file)
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText('Berhasil')).toBeDefined()
      expect(screen.getByText('Tutup')).toBeDefined()
    })
  })

  it('renders error rows for partial success', async () => {
    waliService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 1,
        failed: 1,
        skipped: 0,
        errors: [
          { row: 3, identifier: '***0001', code: 'DUPLICATE', message: 'NIK sudah terdaftar' },
        ],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportWaliModal onClose={vi.fn()} onSuccess={vi.fn()} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /^import$/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(screen.getByText('DUPLICATE')).toBeDefined()
      expect(screen.getByText('NIK sudah terdaftar')).toBeDefined()
      expect(screen.getByText('Gagal')).toBeDefined()
    })
  })

  it('provides dialog keyboard behavior, focus trap, and restores focus', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<ImportWaliModal onClose={onClose} onSuccess={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Import Data Wali Siswa' })
    const close = screen.getByRole('button', { name: 'Tutup dialog import wali' })
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
    waliService.importExcel.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = resolve }))
    render(<ImportWaliModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    const file = new File(['x'], 'test.xlsx')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /^import$/i })
    fireEvent.click(importButton)
    fireEvent.click(importButton)
    expect(waliService.importExcel).toHaveBeenCalledTimes(1)

    resolveUpload({ data: { imported: 0, failed: 0, skipped: 0, errors: [] }, error: null })
    await waitFor(() => expect(screen.getByText('Tutup')).toBeDefined())
  })

  it('does not request a grid refresh when no rows were imported', async () => {
    const onSuccess = vi.fn()
    waliService.importExcel.mockResolvedValueOnce({
      data: { imported: 0, failed: 1, skipped: 0, errors: [] },
      error: null,
    })
    render(<ImportWaliModal onClose={vi.fn()} onSuccess={onSuccess} />)
    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [new File(['x'], 'test.xlsx')] },
    })
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))

    await waitFor(() => expect(screen.getByText('Tutup')).toBeDefined())
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
