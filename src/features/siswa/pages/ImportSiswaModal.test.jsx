import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportSiswaModal from './ImportSiswaModal'
import { siswaService } from '../services/siswaService'
import { SISWA_TEMPLATE_HEADERS } from '../siswaImportContract'

vi.mock('../services/siswaService', () => ({ siswaService: { importExcel: vi.fn() } }))
vi.mock('../../../components/guards/PermissionGuard', () => ({ default: ({ children }) => <>{children}</> }))
vi.mock('../../../utils/sweetalert', () => ({ showError: vi.fn(), showSuccess: vi.fn() }))

describe('ImportSiswaModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits once while pending and refreshes only after imported rows', async () => {
    let resolveUpload
    siswaService.importExcel.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = resolve }))
    const onSuccess = vi.fn()
    render(<ImportSiswaModal onClose={vi.fn()} onSuccess={onSuccess} />)
    const file = new File(['x'], 'siswa.xlsx')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })
    const button = screen.getByRole('button', { name: 'Import' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(siswaService.importExcel).toHaveBeenCalledTimes(1)

    resolveUpload({ data: { imported: 1, failed: 1, skipped: 0, errors: [{ row: 3, identifier: '001', code: 'DUPLICATE', message: 'NIS sudah terdaftar' }] }, error: null })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(screen.getByText('DUPLICATE')).toBeDefined()
    })
  })

  it('supports dialog focus, Escape, and focus restoration', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const { unmount } = render(<ImportSiswaModal onClose={onClose} onSuccess={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Import Data Siswa' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tutup' }))
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('defines the v1 template with natural-key headers', () => {
    expect(SISWA_TEMPLATE_HEADERS).toEqual([
      'nis', 'nisn', 'nik', 'nama', 'jenis_kelamin', 'agama', 'tanggal_lahir',
      'tempat_lahir', 'alamat', 'email', 'no_hp', 'golongan_darah', 'tinggi_badan',
      'berat_badan', 'nama_kelas', 'tanggal_masuk', 'asal_sekolah', 'anak_ke',
    ])
  })
})