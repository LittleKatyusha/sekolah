import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportBukuModal from './ImportBukuModal'
import { bukuService } from '../services/perpustakaanService'

vi.mock('../services/perpustakaanService', () => ({ bukuService: { importExcel: vi.fn() } }))
vi.mock('../../../components/guards/PermissionGuard', () => ({ default: ({ children }) => <div>{children}</div> }))
vi.mock('../../../utils/sweetalert', () => ({ showError: vi.fn() }))

describe('ImportBukuModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads once, shows partial result, refreshes only after imports', async () => {
    const onSuccess = vi.fn()
    bukuService.importExcel.mockResolvedValueOnce({
      data: { imported: 1, failed: 1, skipped: 0, errors: [{ row: 3, identifier: '9786020000001', code: 'DUPLICATE', message: 'ISBN sudah terdaftar.' }] },
      error: null,
    })
    render(<ImportBukuModal onClose={vi.fn()} onSuccess={onSuccess} />)
    const file = new File(['x'], 'buku.xlsx')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })
    const button = screen.getByRole('button', { name: 'Import' })
    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => {
      expect(bukuService.importExcel).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(screen.getByText('DUPLICATE')).toBeDefined()
      expect(screen.getByText('ISBN sudah terdaftar.')).toBeDefined()
    })
  })

  it('supports initial focus, escape close, and focus restoration', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<ImportBukuModal onClose={onClose} onSuccess={vi.fn()} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tutup' }))
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Import Data Buku' }), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})