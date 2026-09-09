import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IjazahPreviewModal from './IjazahPreviewModal'
import { reportService } from '../../../services/reportService'

vi.mock('../../../services/reportService', () => ({
  reportService: {
    preview: vi.fn(),
    generateAndDownload: vi.fn(),
  },
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('IjazahPreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <IjazahPreviewModal isOpen={false} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('fetches and renders iframe with html content when opened', async () => {
    reportService.preview.mockResolvedValueOnce({
      data: { html: '<div>SURAT KETERANGAN LULUS BUDI</div>' },
      error: null,
    })

    render(<IjazahPreviewModal isOpen={true} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />)

    expect(screen.getByText(/Memuat tampilan ijazah/i)).toBeDefined()

    await waitFor(() => {
      const iframe = screen.getByTitle('Ijazah - Budi')
      expect(iframe).toBeDefined()
      expect(iframe.getAttribute('srcDoc')).toContain('SURAT KETERANGAN LULUS BUDI')
    })

    expect(reportService.preview).toHaveBeenCalledWith({
      report_path: '/reports/akademik/ijazah_siswa',
      parameters: { siswa_id: 1 },
    })
  })

  it('handles error state and provides retry button', async () => {
    reportService.preview.mockResolvedValueOnce({
      data: null,
      error: { message: 'Gagal merender ijazah' },
    })

    render(<IjazahPreviewModal isOpen={true} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />)

    await waitFor(() => {
      expect(screen.getByText('Gagal merender ijazah')).toBeDefined()
      expect(screen.getByRole('button', { name: /Coba Lagi/i })).toBeDefined()
    })

    reportService.preview.mockResolvedValueOnce({
      data: { html: '<div>HTML OK</div>' },
      error: null,
    })

    fireEvent.click(screen.getByRole('button', { name: /Coba Lagi/i }))

    await waitFor(() => {
      expect(screen.getByTitle('Ijazah - Budi')).toBeDefined()
    })
  })

  it('triggers PDF download when Unduh PDF is clicked', async () => {
    reportService.preview.mockResolvedValueOnce({
      data: { html: '<div>OK</div>' },
      error: null,
    })
    reportService.generateAndDownload.mockResolvedValueOnce({ error: null })

    render(<IjazahPreviewModal isOpen={true} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />)

    await waitFor(() => {
      expect(screen.getByTitle('Ijazah - Budi')).toBeDefined()
    })

    const downloadBtn = screen.getByRole('button', { name: /Unduh PDF/i })
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(reportService.generateAndDownload).toHaveBeenCalledWith({
        report_path: '/reports/akademik/ijazah_siswa',
        parameters: { siswa_id: 1 },
        format: 'pdf',
      })
    })
  })
})
