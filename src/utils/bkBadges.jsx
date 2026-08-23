// Status color classes (explicit for Tailwind purge safety)
const statusColorClasses = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-700',
}

// Metode color classes (explicit for Tailwind purge)
const metodeColorClasses = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
  gray: 'bg-gray-100 text-gray-700',
}

export const getStatusInfo = (status) => {
  const statusMap = {
    dibuka: { label: 'Dibuka', color: 'blue' },
    dalam_proses: { label: 'Dalam Proses', color: 'yellow' },
    selesai: { label: 'Selesai', color: 'green' },
    ditutup: { label: 'Ditutup', color: 'gray' },
    1: { label: 'Dibuka', color: 'blue' },
    2: { label: 'Dalam Proses', color: 'yellow' },
    3: { label: 'Selesai', color: 'green' },
    4: { label: 'Ditutup', color: 'gray' },
  }
  return statusMap[status] || { label: status || '-', color: 'gray' }
}

export const getStatusBadge = (status) => {
  const s = getStatusInfo(status)
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColorClasses[s.color]}`}>
      {s.label}
    </span>
  )
}

export const getMetodeInfo = (metode) => {
  const metodeMap = {
    1: { label: 'Konseling Individual', color: 'blue' },
    2: { label: 'Konseling Kelompok', color: 'purple' },
    3: { label: 'Mediasi', color: 'orange' },
    4: { label: 'Kunjungan Rumah', color: 'teal' },
  }
  return metodeMap[metode] || { label: metode || '-', color: 'gray' }
}

export const getMetodeBadge = (metode) => {
  const m = getMetodeInfo(metode)
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${metodeColorClasses[m.color]}`}>
      {m.label}
    </span>
  )
}

export const getPeranBadge = (peran) => {
  switch (peran) {
    case 1:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Pelapor</span>
    case 2:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Pendamping</span>
    case 3:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Wali Siswa</span>
    case 4:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Saksi</span>
    default:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{peran || '-'}</span>
  }
}