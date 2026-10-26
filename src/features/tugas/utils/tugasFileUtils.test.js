import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isImageFile,
  isPdfFile,
  getFileName,
  hasAttachment,
  getAttachmentPath,
  openAttachment,
  resolveFileUrl,
} from './tugasFileUtils'
import { fileUploadService } from '../../../services/fileUploadService'

vi.mock('../../../services/fileUploadService', () => ({
  fileUploadService: {
    getPresignedUrl: vi.fn(),
  },
}))

describe('tugasFileUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => {})
  })

  it('detects image files correctly', () => {
    expect(isImageFile('test.jpg')).toBe(true)
    expect(isImageFile('test.png?param=1')).toBe(true)
    expect(isImageFile('data:image/png;base64,123')).toBe(true)
    expect(isImageFile('document.pdf')).toBe(false)
    expect(isImageFile(null)).toBe(false)
  })

  it('detects pdf files correctly', () => {
    expect(isPdfFile('jawaban.pdf')).toBe(true)
    expect(isPdfFile('jawaban.pdf?token=abc')).toBe(true)
    expect(isPdfFile('photo.jpg')).toBe(false)
  })

  it('extracts filename cleanly', () => {
    expect(getFileName('2026/10/hash/user-1/tugas/jawaban.pdf')).toBe('jawaban.pdf')
    expect(getFileName('https://cdn.example.com/uploads/photo.jpg?token=123')).toBe('photo.jpg')
    expect(getFileName('')).toBe('berkas')
  })

  it('detects attachment existence across aliases', () => {
    expect(hasAttachment({ file_url: 'https://cdn.com/1.pdf' })).toBe(true)
    expect(hasAttachment({ file_jawaban: 'path/to/file.pdf' })).toBe(true)
    expect(hasAttachment({ file_siswa: 'path/to/file.pdf' })).toBe(true)
    expect(hasAttachment({ file_path: 'path/to/file.pdf' })).toBe(true)
    expect(hasAttachment({})).toBe(false)
    expect(hasAttachment(null)).toBe(false)
  })

  it('resolves direct http url and opens attachment without presigned call', async () => {
    const url = await resolveFileUrl('', 'https://cdn.example.com/tugas.pdf')
    expect(url).toBe('https://cdn.example.com/tugas.pdf')
    await openAttachment('', 'https://cdn.example.com/tugas.pdf')
    expect(window.open).toHaveBeenCalledWith(
      'https://cdn.example.com/tugas.pdf',
      '_blank',
      'noopener,noreferrer'
    )
    expect(fileUploadService.getPresignedUrl).not.toHaveBeenCalled()
  })

  it('resolves presigned url for storage path and opens it', async () => {
    fileUploadService.getPresignedUrl.mockResolvedValueOnce({
      data: { data: { url: 'https://s3.example.com/signed-url' } },
    })

    const url = await resolveFileUrl('2026/10/abc/tugas.pdf', null)
    expect(url).toBe('https://s3.example.com/signed-url')

    fileUploadService.getPresignedUrl.mockResolvedValueOnce({
      data: { data: { url: 'https://s3.example.com/signed-url' } },
    })
    await openAttachment('2026/10/abc/tugas.pdf', null)

    expect(fileUploadService.getPresignedUrl).toHaveBeenCalledWith('2026/10/abc/tugas.pdf')
    expect(window.open).toHaveBeenCalledWith(
      'https://s3.example.com/signed-url',
      '_blank',
      'noopener,noreferrer'
    )
  })
})

