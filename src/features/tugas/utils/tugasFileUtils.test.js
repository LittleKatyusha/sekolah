import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isImageFile,
  isPdfFile,
  getFileName,
  hasAttachment,
  getAttachmentPath,
  openAttachment,
  resolveFileUrl,
  isSubmissionGraded,
  getSubmissionScore,
  deduplicateTugasList,
  getSubmissionLink,
  getLinkProviderLabel,
  isGroupSubmission,
  getGroupMembers,
  isRevisionRequested,
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

  it('distinguishes ungraded legacy 0 submissions from truly graded submissions', () => {
    // Legacy ungraded submission with default nilai=0 and status=1 (Tepat Waktu)
    expect(
      isSubmissionGraded({
        id: 1,
        nilai: 0,
        status: 1,
        status_label: 'Tepat Waktu',
        waktu_dinilai: null,
        catatan_guru: null,
      })
    ).toBe(false)
    expect(
      getSubmissionScore({
        id: 1,
        nilai: 0,
        status: 1,
      })
    ).toBeNull()

    // Graded with positive score
    expect(isSubmissionGraded({ id: 2, nilai: 90, status: 1 })).toBe(true)
    expect(getSubmissionScore({ id: 2, nilai: 90, status: 1 })).toBe(90)

    // Intentionally graded with 0 by teacher (status=3 or has waktu_dinilai / catatan_guru)
    expect(isSubmissionGraded({ id: 3, nilai: 0, status: 3 })).toBe(true)
    expect(getSubmissionScore({ id: 3, nilai: 0, status: 3 })).toBe(0)
    expect(
      isSubmissionGraded({ id: 4, nilai: 0, status: 1, catatan_guru: 'Belum sesuai instruksi' })
    ).toBe(true)
  })

  it('deduplicates identical tasks and keeps the one with submission', () => {
    const list = [
      {
        id: 10,
        judul: 'Identitas diri dan Identitas Sosial',
        mst_guru_mapel_id: 5,
        mst_kelas_id: 1,
        tenggat_waktu: '2026-10-26T11:30:00Z',
      },
      {
        id: 11,
        judul: 'Identitas diri dan Identitas Sosial',
        mst_guru_mapel_id: 5,
        mst_kelas_id: 1,
        tenggat_waktu: '2026-10-26T11:30:00Z',
      },
      {
        id: 12,
        judul: 'Teori Masalah Sosial',
        mst_guru_mapel_id: 5,
        mst_kelas_id: 1,
        tenggat_waktu: '2026-10-26T16:00:00Z',
      },
    ]

    const submissionMap = {
      11: { id: 99, tugas_id: 11, status: 1 },
    }

    const deduped = deduplicateTugasList(list, submissionMap)
    expect(deduped).toHaveLength(2)
    expect(deduped[0].id).toBe(11)
    expect(deduped[1].id).toBe(12)
  })

  it('extracts external links and provider labels', () => {
    expect(
      getSubmissionLink({ metadata: { link_tugas: 'https://drive.google.com/file/d/123' } })
    ).toBe('https://drive.google.com/file/d/123')
    expect(getLinkProviderLabel('https://drive.google.com/file/d/123')).toBe('Google Drive')
    expect(getLinkProviderLabel('https://www.canva.com/design/abc')).toBe('Canva')
    expect(getLinkProviderLabel('https://youtu.be/xyz')).toBe('YouTube')
    expect(getLinkProviderLabel('https://github.com/org/repo')).toBe('GitHub')
  })

  it('detects group submissions, members, and revision requests', () => {
    const groupSub = {
      id: 50,
      is_kelompok: true,
      nama_kelompok: 'Kelompok 1',
      anggota_kelompok: [
        { id: 1, nama: 'Budi' },
        { id: 2, nama: 'Siti' },
      ],
      perlu_revisi: true,
      status_label: 'Perlu Revisi',
      nilai: 75,
    }
    expect(isGroupSubmission(groupSub)).toBe(true)
    expect(getGroupMembers(groupSub)).toHaveLength(2)
    expect(isRevisionRequested(groupSub)).toBe(true)
    // When revision is requested, isSubmissionGraded should return false so student sees Perlu Revisi
    expect(isSubmissionGraded(groupSub)).toBe(false)
  })
})

