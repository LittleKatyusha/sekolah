import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TugasFilePreviewModal from './TugasFilePreviewModal'
import { fileUploadService } from '../../../services/fileUploadService'

vi.mock('../../../services/fileUploadService', () => ({
  fileUploadService: {
    getPresignedUrl: vi.fn(),
  },
}))

describe('TugasFilePreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => {})
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TugasFilePreviewModal
        isOpen={false}
        onClose={vi.fn()}
        filePath="uploads/tugas.jpg"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders image preview and handles rotation', async () => {
    fileUploadService.getPresignedUrl.mockResolvedValueOnce({
      data: { data: { url: 'https://example.com/uploads/photo.jpg' } },
    })

    render(
      <TugasFilePreviewModal
        isOpen={true}
        onClose={vi.fn()}
        filePath="uploads/photo.jpg"
        title="Tugas Siswa A"
      />
    )

    expect(screen.getByText('Tugas Siswa A')).toBeDefined()
    expect(screen.getByText('photo.jpg')).toBeDefined()

    const rotateCwBtn = screen.getByTitle('Putar Kanan 90°')
    const rotateCcwBtn = screen.getByTitle('Putar Kiri 90°')

    // Initially 0 deg, badge not shown
    expect(screen.queryByText('90°')).toBeNull()

    // Click rotate clockwise -> 90deg
    fireEvent.click(rotateCwBtn)
    expect(screen.getByText('90°')).toBeDefined()

    // Click rotate clockwise again -> 180deg
    fireEvent.click(rotateCwBtn)
    expect(screen.getByText('180°')).toBeDefined()

    // Click rotate counter-clockwise -> 90deg
    fireEvent.click(rotateCcwBtn)
    expect(screen.getByText('90°')).toBeDefined()

    // Reset rotation
    const resetBtn = screen.getByTitle('Reset rotasi')
    fireEvent.click(resetBtn)
    expect(screen.queryByText('90°')).toBeNull()
  })

  it('renders iframe for PDF files', async () => {
    render(
      <TugasFilePreviewModal
        isOpen={true}
        onClose={vi.fn()}
        fileUrl="https://example.com/docs/jawaban.pdf"
        title="Jawaban PDF"
      />
    )

    const iframe = await screen.findByTitle('Jawaban PDF')
    expect(iframe).toBeDefined()
    expect(iframe.getAttribute('src')).toBe('https://example.com/docs/jawaban.pdf')
  })

  it('calls onClose when close button clicked or ESC pressed', async () => {
    const onClose = vi.fn()
    render(
      <TugasFilePreviewModal
        isOpen={true}
        onClose={onClose}
        fileUrl="https://example.com/photo.png"
      />
    )

    const closeBtn = await screen.findByTitle('Tutup')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

})
