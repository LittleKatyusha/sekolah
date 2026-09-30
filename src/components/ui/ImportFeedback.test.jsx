import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ImportGuruModal from '../../features/guru/pages/ImportGuruModal'
import ImportWaliModal from '../../features/wali/pages/ImportWaliModal'
import ImportKelasModal from '../../features/kelas/pages/ImportKelasModal'
import ImportMapelModal from '../../features/mapel/pages/ImportMapelModal'
import ImportTahunAjaranModal from '../../features/tahun-ajaran/pages/ImportTahunAjaranModal'
import ImportTarifSppModal from '../../features/spp/pages/ImportTarifSppModal'
import ImportBukuModal from '../../features/perpustakaan/pages/ImportBukuModal'

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }))
vi.mock('../../features/guru/services/guruService', () => ({ guruService: { importExcel: upload } }))
vi.mock('../../features/wali/services/waliService', () => ({ waliService: { importExcel: upload } }))
vi.mock('../../features/kelas/services/kelasService', () => ({ kelasService: { importExcel: upload } }))
vi.mock('../../features/mapel/services/mapelService', () => ({ mapelService: { importExcel: upload } }))
vi.mock('../../features/tahun-ajaran/services/tahunAjaranService', () => ({ tahunAjaranService: { importExcel: upload } }))
vi.mock('../../features/spp/services/sppService', () => ({ tarifSppService: { importExcel: upload } }))
vi.mock('../../features/perpustakaan/services/perpustakaanService', () => ({ bukuService: { importExcel: upload } }))
vi.mock('../guards/PermissionGuard', () => ({ default: ({ children }) => children }))
vi.mock('../../utils/sweetalert', () => ({ showError: vi.fn() }))

describe.each([
  ['Guru', ImportGuruModal], ['Wali', ImportWaliModal], ['Kelas', ImportKelasModal],
  ['Mapel', ImportMapelModal], ['Tahun Ajaran', ImportTahunAjaranModal],
  ['Tarif SPP', ImportTarifSppModal], ['Buku', ImportBukuModal],
])('%s import feedback', (_, Modal) => {
  beforeEach(() => upload.mockReset())

  const submit = () => {
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [new File(['x'], 'data.xlsx')] } })
    fireEvent.click(screen.getByRole('button', { name: /^Import$/i }))
  }

  it('keeps partial success visible with Excel row, field reasons, duplicates and truncation', async () => {
    upload.mockResolvedValueOnce({ data: { data: {
      imported: 1, failed: 2, skipped: 1, errors_truncated: true,
      errors: [
        { row: 3, identifier: '001', code: 'INVALID_ROW', message: 'Invalid', fields: { nama: ['Nama wajib diisi.'], kode: ['Kode maksimal 10 karakter.'] } },
        { row: 4, identifier: '002', code: 'DUPLICATE', message: 'Kode sudah terdaftar.', fields: [] },
      ],
    } } })
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<Modal onClose={onClose} onSuccess={onSuccess} />)
    submit()
    expect(await screen.findByRole('status')).toHaveTextContent('1 berhasil, 2 gagal, 1 dilewati.')
    expect(screen.getByRole('columnheader', { name: 'Baris Excel' })).toBeVisible()
    const row = screen.getByRole('row', { name: /3 001 INVALID_ROW/ })
    expect(row).toHaveTextContent('nama: Nama wajib diisi.')
    expect(row).toHaveTextContent('kode: Kode maksimal 10 karakter.')
    expect(screen.getByText('Kode sudah terdaftar.')).toBeVisible()
    expect(screen.getByText('Hanya 100 error pertama yang ditampilkan.')).toBeVisible()
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not refresh when all rows fail', async () => {
    upload.mockResolvedValueOnce({ data: { imported: 0, failed: 1, errors: [] } })
    const onSuccess = vi.fn()
    render(<Modal onClose={vi.fn()} onSuccess={onSuccess} />)
    submit()
    expect(await screen.findByRole('status')).toHaveTextContent('Tidak ada data yang berhasil diimport.')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('prevents duplicate uploads while pending', async () => {
    let resolveUpload
    upload.mockReturnValueOnce(new Promise((resolve) => { resolveUpload = resolve }))
    render(<Modal onClose={vi.fn()} onSuccess={vi.fn()} />)
    submit()
    fireEvent.click(screen.getByRole('button', { name: /^Import$/i }))
    expect(upload).toHaveBeenCalledOnce()
    resolveUpload({ data: { imported: 1, failed: 0, errors: [] } })
    expect(await screen.findByRole('status')).toHaveTextContent('Import berhasil.')
  })

  it.each(['rejected', 'network', 'server', 'malformed', 'validation'])('handles %s errors without claiming rollback; allows retry', async (kind) => {
    if (kind === 'rejected') upload.mockRejectedValueOnce(new Error('Connection lost'))
    else upload.mockResolvedValueOnce({
      network: { error: 'Network Error' },
      server: { error: { status: 500, message: 'Server error' } },
      malformed: { data: {} },
      validation: { error: { status: 422, message: 'File ditolak.', errors: [{ message: 'Sheet Data wajib tersedia.' }] } },
    }[kind])
    render(<Modal onClose={vi.fn()} onSuccess={vi.fn()} />)
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(kind === 'validation' ? 'Sheet Data wajib tersedia.' : 'Hasil import belum dapat dipastikan.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    upload.mockResolvedValueOnce({ data: { imported: 1, failed: 0, errors: [] } })
    fireEvent.click(screen.getByRole('button', { name: /^Import$/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Import berhasil.'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})