import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportSiswaModal from './ImportSiswaModal'
import SiswaList from './SiswaList'
import { siswaService } from '../services/siswaService'
import { SISWA_TEMPLATE_HEADERS } from '../siswaImportContract'

vi.mock('../services/siswaService', () => ({ siswaService: { importExcel: vi.fn() } }))
vi.mock('../../../components/guards/PermissionGuard', () => ({ default: ({ children }) => <>{children}</> }))
vi.mock('../../../utils/sweetalert', () => ({ showError: vi.fn(), showSuccess: vi.fn() }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../../../components/ui/InfiniteGrid', () => ({ default: () => null }))

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

    resolveUpload({ data: { success: true, data: { imported: 1, failed: 1, skipped: 0, errors: [{ row: 3, identifier: '001', code: 'DUPLICATE', message: 'NIS sudah terdaftar' }] } }, error: null })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(screen.getByText('DUPLICATE')).toBeDefined()
      expect(screen.getByRole('status')).toHaveTextContent('1 berhasil, 1 gagal, 0 dilewati.')
      expect(screen.getByText('NIS sudah terdaftar')).toBeVisible()
    })
  })

  it('keeps the result visible on the siswa page until explicitly closed', async () => {
    siswaService.importExcel.mockResolvedValueOnce({ data: { success: true, data: { imported: 2, failed: 0, skipped: 0, errors: [] } }, error: null })
    render(<SiswaList />)
    fireEvent.click(screen.getByRole('button', { name: 'Import Excel' }))
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [new File(['x'], 'siswa.xlsx')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Import berhasil.2 berhasil, 0 gagal, 0 dilewati.')
    fireEvent.click(screen.getAllByRole('button', { name: 'Tutup' })[0])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows all-failed results without refreshing the list', async () => {
    siswaService.importExcel.mockResolvedValueOnce({ data: { success: true, data: { imported: 0, failed: 1, errors: [{ row: 2, identifier: '001', code: 'VALIDATION', message: 'Nama wajib diisi' }] } }, error: null })
    const onSuccess = vi.fn()
    render(<ImportSiswaModal onClose={vi.fn()} onSuccess={onSuccess} />)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [new File(['x'], 'siswa.xlsx')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Import gagal.')
    expect(screen.getByText('Nama wajib diisi')).toBeVisible()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it.each([
    [{ data: null, error: { message: 'Sheet Data tidak ditemukan' } }, 'Sheet Data tidak ditemukan'],
    [{ data: null, error: 'Network Error' }, 'Network Error'],
    [{ data: { success: true }, error: null }, 'Hasil import tidak dapat dibaca'],
    [null, 'Hasil import belum dapat dipastikan'],
  ])('shows upload errors and allows retry: %j', async (response, message) => {
    if (response) siswaService.importExcel.mockResolvedValueOnce(response)
    else siswaService.importExcel.mockRejectedValueOnce(new Error('Connection lost'))
    const onSuccess = vi.fn()
    render(<ImportSiswaModal onClose={vi.fn()} onSuccess={onSuccess} />)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [new File(['x'], 'siswa.xlsx')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it.each([
    [new File(['x'], 'siswa.csv'), 'Format file tidak didukung'],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'siswa.xlsx'), 'Ukuran file melebihi batas 5MB'],
  ])('rejects invalid files without leaving the previous selection active', (file, message) => {
    render(<ImportSiswaModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    const input = screen.getByTestId('file-input')
    fireEvent.change(input, { target: { files: [new File(['x'], 'valid.xlsx')] } })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
    expect(siswaService.importExcel).not.toHaveBeenCalled()
  })

  it('shows each invalid field alongside its Excel row and NIS', async () => {
    siswaService.importExcel.mockResolvedValueOnce({ data: { data: {
      imported: 0, failed: 1, errors: [{
        row: 3, identifier: '001', code: 'INVALID_ROW', message: 'Data tidak valid',
        fields: { nisn: ['NISN maksimal 10 karakter.'], nik: ['NIK maksimal 16 karakter.'] },
      }],
    } }, error: null })
    render(<ImportSiswaModal onClose={vi.fn()} onSuccess={vi.fn()} />)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [new File(['x'], 'siswa.xlsx')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    const row = await screen.findByRole('row', { name: /3 001 INVALID_ROW/ })
    expect(row).toHaveTextContent('nisn: NISN maksimal 10 karakter.')
    expect(row).toHaveTextContent('nik: NIK maksimal 16 karakter.')
    expect(screen.getByRole('columnheader', { name: 'Baris Excel' })).toBeVisible()
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
      'nis', 'nisn', 'rfid_uid', 'nik', 'nama', 'jenis_kelamin', 'agama', 'tanggal_lahir',
      'tempat_lahir', 'alamat', 'email', 'no_hp', 'golongan_darah', 'tinggi_badan',
      'berat_badan', 'nama_kelas', 'tanggal_masuk', 'asal_sekolah', 'anak_ke',
    ])
  })
})
