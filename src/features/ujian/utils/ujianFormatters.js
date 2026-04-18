const JENIS_ALIASES = {
  '1': 'harian',
  harian: 'harian',
  '2': 'pts',
  pts: 'pts',
  'penilaian tengah semester': 'pts',
  '3': 'uas',
  uas: 'uas',
  pas: 'uas',
  'penilaian akhir semester': 'uas',
  '4': 'tryout',
  'try out': 'tryout',
  tryout: 'tryout',
  '5': 'ujian-sekolah',
  us: 'ujian-sekolah',
  'ujian sekolah': 'ujian-sekolah',
}

const JENIS_SHORT_LABELS = {
  harian: 'Harian',
  pts: 'PTS',
  uas: 'UAS',
  tryout: 'Try Out',
  'ujian-sekolah': 'Ujian Sekolah',
}

const JENIS_LONG_LABELS = {
  harian: 'Harian',
  pts: 'Penilaian Tengah Semester',
  uas: 'UAS',
  tryout: 'Try Out',
  'ujian-sekolah': 'Ujian Sekolah',
}

const JENIS_COLOR_CLASSES = {
  harian: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pts: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  uas: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  tryout: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'ujian-sekolah': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export const normalizeJenisToken = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const normalized = String(value).trim().toLowerCase()
  return JENIS_ALIASES[normalized] || normalized
}

export const formatJenisLabel = (value, { short = false } = {}) => {
  if (value === null || value === undefined || value === '') return '-'

  const token = normalizeJenisToken(value)
  const knownLabel = short ? JENIS_SHORT_LABELS[token] : JENIS_LONG_LABELS[token]
  if (knownLabel) return knownLabel

  // Handle full label values like "Harian", "Penilaian Tengah Semester", etc.
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'harian') return short ? 'Harian' : 'Harian'
  if (normalized === 'penilaian tengah semester' || normalized === 'pts') return short ? 'PTS' : 'Penilaian Tengah Semester'
  if (normalized === 'uas' || normalized === 'penilaian akhir semester') return short ? 'UAS' : 'UAS'
  if (normalized === 'try out' || normalized === 'tryout') return short ? 'Try Out' : 'Try Out'
  if (normalized === 'ujian sekolah' || normalized === 'us') return short ? 'Ujian Sekolah' : 'Ujian Sekolah'

  return String(value)
}

export const getJenisColorClass = (value) => {
  const token = normalizeJenisToken(value)
  return JENIS_COLOR_CLASSES[token] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

export const formatSemesterLabel = (value) => {
  if (value === null || value === undefined || value === '') return '-'

  const normalized = String(value).trim().toLowerCase()
  
  // Handle kode values (1, 2)
  if (normalized === '1') return 'Ganjil'
  if (normalized === '2') return 'Genap'
  
  // Handle full format like "Ganjil 2025/2026"
  if (normalized.includes('ganjil')) return 'Ganjil'
  if (normalized.includes('genap')) return 'Genap'

  return String(value)
}

export const getMapelLabel = (mapel) => {
  if (!mapel) return '-'
  return mapel.nama || mapel.nama_mapel || `Mapel #${mapel.id}`
}

export const getMapelCode = (mapel) => {
  if (!mapel) return null
  return mapel.kode || mapel.kode_mapel || null
}

export const getUjianName = (ujian) => {
  if (!ujian) return 'Ujian'
  if (ujian.nama) return ujian.nama

  const mapelLabel = getMapelLabel(ujian.mapel)
  if (mapelLabel !== '-') {
    return `${mapelLabel} - ${formatJenisLabel(ujian.jenis, { short: true })}`
  }

  return ujian.id ? `Ujian #${ujian.id}` : 'Ujian'
}