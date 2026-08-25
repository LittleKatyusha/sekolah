import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportMapelModal from './ImportMapelModal'
import { mapelService } from '../services/mapelService'

vi.mock('../services/mapelService', () => ({
  mapelService: {
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

describe('ImportMapelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal header and unduh template button', () => {
    render(<ImportMapelModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Import Data Mata Pelajaran')).toBeDefined()
    expect(screen.getByText('Unduh Template')).toBeDefined()
    expect(screen.getByText('Pilih file Excel atau seret ke sini')).toBeDefined()
  })

  it('submits valid excel file and renders summary', async () => {
    const onSuccess = vi.fn()
    mapelService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 2,
        failed: 0,
        skipped: 0,
        errors: [],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportMapelModal onClose={vi.fn()} onSuccess={onSuccess} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mapelService.importExcel).toHaveBeenCalledWith(file)
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText('Berhasil')).toBeDefined()
      expect(screen.getByText('Tutup')).toBeDefined()
    })
  })

  it('renders error rows for partial success', async () => {
    mapelService.importExcel.mockResolvedValueOnce({
      data: {
        imported: 1,
        failed: 1,
        skipped: 0,
        errors: [
          { row: 3, identifier: 'MAT-10', code: 'DUPLICATE', message: 'Kode mapel sudah terdaftar' },
        ],
        errors_truncated: false,
      },
      error: null,
    })

    render(<ImportMapelModal onClose={vi.fn()} onSuccess={vi.fn()} />)

    const file = new File(['fake-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(screen.getByText('DUPLICATE')).toBeDefined()
      expect(screen.getByText('Kode mapel sudah terdaftar')).toBeDefined()
      expect(screen.getByText('Gagal')).toBeDefined()
    })
  })

  it('provides dialog keyboard behavior, focus trap, and restores focus', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<ImportMapelModal onClose={onClose} onSuccess={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Import Data Mata Pelajaran' })
    const close = screen.getByRole('button', { name: 'Tutup' })
    expect(document.activeElement).toBe(close)

    const importButton = screen.getByRole('button', { name: 'Import' })
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
    mapelService.importExcel.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = resolve }))
    render(<ImportMapelModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    const file = new File(['x'], 'test.xlsx')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)
    fireEvent.click(importButton)
    expect(mapelService.importExcel).toHaveBeenCalledTimes(1)

    resolveUpload({ data: { imported: 0, failed: 0, skipped: 0, errors: [] }, error: null })
    await waitFor(() => expect(screen.getByText('Tutup')).toBeDefined())
  })
})
