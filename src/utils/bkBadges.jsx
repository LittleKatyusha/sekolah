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
  const norm = typeof peran === 'string' ? peran.toLowerCase().trim() : peran
  if (norm === 1 || norm === '1' || norm === 'dipanggil') {
    return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Dipanggil</span>
  }
  if (norm === 2 || norm === '2' || norm === 'pendamping') {
    return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Pendamping</span>
  }
  if (norm === 3 || norm === '3' || norm === 'informasi') {
    return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Informasi</span>
  }
  if (norm === 4 || norm === '4' || norm === 'saksi') {
    return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Saksi</span>
  }
  return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{peran || '-'}</span>
}