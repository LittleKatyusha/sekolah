import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileUpload from './FileUpload'
import { fileUploadService } from '../../services/fileUploadService'

vi.mock('../../services/fileUploadService', () => ({
  fileUploadService: {
    uploadFile: vi.fn(),
  },
}))

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders initial dropzone with label and handles file selection for PDF', async () => {
    const handleUpload = vi.fn()
    fileUploadService.uploadFile.mockResolvedValue({
      data: {
        data: {
          file_path: '/uploads/tugas/dokumen.pdf',
        },
      },
      error: null,
    })

    const { container } = render(
      <FileUpload
        label="Unggah Tugas"
        accept="image/*,application/pdf,.doc,.docx"
        folder="tugas"
        onUpload={handleUpload}
      />
    )

    expect(screen.getByText('Unggah Tugas')).toBeInTheDocument()
    expect(screen.getByText(/Klik untuk mengunggah atau seret file ke sini/i)).toBeInTheDocument()

    const input = container.querySelector('input[type="file"]')
    expect(input).toBeInTheDocument()

    const file = new File(['dummy pdf content'], 'dokumen.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(fileUploadService.uploadFile).toHaveBeenCalledWith(file, 'tugas')
      expect(handleUpload).toHaveBeenCalledWith('/uploads/tugas/dokumen.pdf')
    })

    expect(screen.getByText('dokumen.pdf')).toBeInTheDocument()
  })

  it('rejects file when type does not match accept criteria', async () => {
    const handleUpload = vi.fn()
    const { container } = render(
      <FileUpload
        label="Unggah Tugas"
        accept="image/*,application/pdf"
        onUpload={handleUpload}
      />
    )

    const input = container.querySelector('input[type="file"]')
    const invalidFile = new File(['dummy exe content'], 'malware.exe', { type: 'application/x-msdownload' })
    fireEvent.change(input, { target: { files: [invalidFile] } })

    expect(screen.getByText('Invalid file type')).toBeInTheDocument()
    expect(fileUploadService.uploadFile).not.toHaveBeenCalled()
    expect(handleUpload).not.toHaveBeenCalled()
  })

  it('renders previewUrl if provided and allows removal', async () => {
    const handleUpload = vi.fn()
    render(
      <FileUpload
        label="Unggah Tugas"
        previewUrl="/uploads/tugas/jawaban-lama.pdf"
        onUpload={handleUpload}
      />
    )

    expect(screen.getByText('jawaban-lama.pdf')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Lihat berkas terunggah/i })).toHaveAttribute(
      'href',
      '/uploads/tugas/jawaban-lama.pdf'
    )

    const removeBtn = screen.getByRole('button', { name: 'Hapus file' })
    fireEvent.click(removeBtn)

    expect(handleUpload).toHaveBeenCalledWith(null)
    expect(screen.getByText(/Klik untuk mengunggah atau seret file ke sini/i)).toBeInTheDocument()
  })
})
