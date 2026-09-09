import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SklPreviewModal from './SklPreviewModal'
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

describe('SklPreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SklPreviewModal isOpen={false} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('fetches and renders iframe with html content when opened', async () => {
    reportService.preview.mockResolvedValueOnce({
      data: { html: '<div>SURAT KETERANGAN LULUS BUDI</div>' },
      error: null,
    })

    render(<SklPreviewModal isOpen={true} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />)

    expect(screen.getByText(/Memuat tampilan SKL/i)).toBeDefined()

    await waitFor(() => {
      const iframe = screen.getByTitle('Preview SKL Siswa')
      expect(iframe).toBeDefined()
      expect(iframe.getAttribute('srcDoc')).toContain('SURAT KETERANGAN LULUS BUDI')
    })

    expect(reportService.preview).toHaveBeenCalledWith({
      report_path: '/reports/akademik/skl_siswa',
      parameters: { siswa_id: 1 },
    })
  })

  it('handles error state and provides retry button', async () => {
    reportService.preview.mockResolvedValueOnce({
      data: null,
      error: { message: 'Gagal merender SKL' },
    })

    render(<SklPreviewModal isOpen={true} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />)

    await waitFor(() => {
      expect(screen.getByText('Gagal merender SKL')).toBeDefined()
      expect(screen.getByRole('button', { name: /Coba Lagi/i })).toBeDefined()
    })

    reportService.preview.mockResolvedValueOnce({
      data: { html: '<div>HTML OK</div>' },
      error: null,
    })

    fireEvent.click(screen.getByRole('button', { name: /Coba Lagi/i }))

    await waitFor(() => {
      expect(screen.getByTitle('Preview SKL Siswa')).toBeDefined()
    })
  })

  it('triggers PDF download when Unduh PDF is clicked', async () => {
    reportService.preview.mockResolvedValueOnce({
      data: { html: '<div>OK</div>' },
      error: null,
    })
    reportService.generateAndDownload.mockResolvedValueOnce({ error: null })

    render(<SklPreviewModal isOpen={true} onClose={vi.fn()} siswaId={1} siswaNama="Budi" />)

    await waitFor(() => {
      expect(screen.getByTitle('Preview SKL Siswa')).toBeDefined()
    })

    const downloadBtn = screen.getByRole('button', { name: /Unduh PDF/i })
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(reportService.generateAndDownload).toHaveBeenCalledWith({
        report_path: '/reports/akademik/skl_siswa',
        parameters: { siswa_id: 1 },
        format: 'pdf',
      })
    })
  })
})
