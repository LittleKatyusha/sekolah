import { fileUploadService } from '../../../services/fileUploadService'

export const isImageFile = (pathOrUrl) => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return false
  if (pathOrUrl.startsWith('data:image/')) return true
  return /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(pathOrUrl)
}

export const isPdfFile = (pathOrUrl) => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return false
  return /\.pdf(\?.*)?$/i.test(pathOrUrl)
}

export const getFileName = (pathOrUrl) => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return 'berkas'
  try {
    const clean = pathOrUrl.split('?')[0]
    const segments = clean.split('/')
    return segments[segments.length - 1] || 'berkas'
  } catch {
    return 'berkas'
  }
}

export const hasAttachment = (item) => {
  if (!item) return false
  if (typeof item === 'string') return item.trim().length > 0
  const candidate =
    item.file_url ||
    item.file_jawaban ||
    item.file_siswa ||
    item.file_lampiran ||
    item.file_path
  return Boolean(candidate && String(candidate).trim().length > 0)
}

export const getAttachmentPath = (item) => {
  if (!item) return ''
  if (typeof item === 'string') return item
  return (
    item.file_jawaban ||
    item.file_siswa ||
    item.file_lampiran ||
    item.file_path ||
    item.file_url ||
    ''
  )
}

export const getDirectFileUrl = (rawPath, directUrl) => {
  const targetUrl = directUrl && typeof directUrl === 'string' ? directUrl.trim() : ''
  const path = rawPath && typeof rawPath === 'string' ? rawPath.trim() : ''

  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('data:'))) {
    return targetUrl
  }

  if (path && (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:'))) {
    return path
  }

  return ''
}

export const resolveFileUrl = async (rawPath, directUrl) => {
  const direct = getDirectFileUrl(rawPath, directUrl)
  if (direct) return direct

  const path = rawPath && typeof rawPath === 'string' ? rawPath.trim() : ''
  const targetUrl = directUrl && typeof directUrl === 'string' ? directUrl.trim() : ''
  if (!path && !targetUrl) return ''

  const candidate = path || targetUrl
  try {
    const { data } = await fileUploadService.getPresignedUrl(candidate)
    const presigned = data?.data?.url || data?.url
    if (presigned) {
      return presigned
    }
  } catch (err) {
    console.error('Failed to resolve presigned file URL:', err)
  }

  return candidate.startsWith('/') ? candidate : `/${candidate}`
}

export const openAttachment = async (rawPath, directUrl) => {
  const direct = getDirectFileUrl(rawPath, directUrl)
  if (direct) {
    window.open(direct, '_blank', 'noopener,noreferrer')
    return
  }

  const url = await resolveFileUrl(rawPath, directUrl)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Determines whether a student submission has truly been graded by a teacher,
 * distinguishing a real score (including an intentional 0) from legacy default 0 values
 * stored when a student first submits an assignment.
 */
export const isSubmissionGraded = (submission) => {
  if (!submission || typeof submission !== 'object') return false
  if (submission.is_graded === true) return true
  if (submission.is_graded === false) return false

  const rawNilai = submission.nilai
  if (rawNilai === null || rawNilai === undefined || rawNilai === '') return false
  const numNilai = Number(rawNilai)
  if (!Number.isFinite(numNilai)) return false

  // Any score > 0 is definitely graded
  if (numNilai > 0) return true

  // If score is 0, check if it was explicitly graded (status 3 / 'dinilai', has waktu_dinilai, or has catatan_guru)
  const status = submission.status ?? submission.status_kumpul ?? submission.status_kumpl
  const statusLabel = String(
    submission.status_label ??
      submission.status_kumpul_label ??
      submission.status_kumpl_label ??
      status ??
      ''
  )
    .trim()
    .toLowerCase()

  if (Number(status) === 3 || statusLabel === 'dinilai' || statusLabel === 'sudah dinilai') {
    return true
  }

  if (submission.waktu_dinilai) {
    return true
  }

  const catatan = submission.catatan_guru ?? submission.catatan
  if (catatan && String(catatan).trim().length > 0) {
    return true
  }

  return false
}

export const getSubmissionScore = (submission) => {
  if (!isSubmissionGraded(submission)) return null
  return Number(submission.nilai)
}

/**
 * Deduplicates assignments that have identical (judul, mapel/guru_mapel, kelas, tenggat_waktu),
 * preferring the item that already has a student submission or the most recent one.
 */
export const deduplicateTugasList = (tugasList = [], submissionMap = {}) => {
  if (!Array.isArray(tugasList) || tugasList.length <= 1) return tugasList

  const seen = new Map()

  tugasList.forEach((item) => {
    if (!item) return
    const judulKey = String(item.judul || '').trim().toLowerCase()
    const gmKey = String(
      item.mst_guru_mapel_id ??
        item.guru_mapel?.id ??
        item.guru_mapel?.mapel?.nama ??
        ''
    )
      .trim()
      .toLowerCase()
    const kelasKey = String(
      item.mst_kelas_id ?? item.kelas?.id ?? item.kelas?.nama_kelas ?? item.kelas?.nama ?? ''
    )
      .trim()
      .toLowerCase()
    const deadlineKey = item.tenggat_waktu
      ? new Date(item.tenggat_waktu).toISOString().slice(0, 16)
      : ''

    const compositeKey = `${judulKey}|${gmKey}|${kelasKey}|${deadlineKey}`

    if (!seen.has(compositeKey)) {
      seen.set(compositeKey, item)
    } else {
      const existing = seen.get(compositeKey)
      const existingHasSub = Boolean(submissionMap[existing.id])
      const currentHasSub = Boolean(submissionMap[item.id])

      if (!existingHasSub && currentHasSub) {
        seen.set(compositeKey, item)
      }
    }
  })

  return Array.from(seen.values())
}



