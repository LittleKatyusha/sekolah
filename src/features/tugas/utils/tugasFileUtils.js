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

export const openAttachment = async (rawPath, directUrl) => {
  const targetUrl = directUrl && typeof directUrl === 'string' ? directUrl.trim() : ''
  const path = rawPath && typeof rawPath === 'string' ? rawPath.trim() : ''

  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('data:'))) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
    return
  }

  if (path && (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:'))) {
    window.open(path, '_blank', 'noopener,noreferrer')
    return
  }

  if (!path && !targetUrl) return

  const candidate = path || targetUrl
  try {
    const { data } = await fileUploadService.getPresignedUrl(candidate)
    const presigned = data?.data?.url || data?.url
    if (presigned) {
      window.open(presigned, '_blank', 'noopener,noreferrer')
      return
    }
  } catch (err) {
    console.error('Failed to resolve presigned file URL:', err)
  }

  // Fallback to relative storage or direct open
  const fallbackUrl = candidate.startsWith('/') ? candidate : `/${candidate}`
  window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
}
