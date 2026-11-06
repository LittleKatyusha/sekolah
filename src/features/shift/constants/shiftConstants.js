export const DAYS_OF_WEEK = [
  { key: 'MON', label: 'Senin' },
  { key: 'TUE', label: 'Selasa' },
  { key: 'WED', label: 'Rabu' },
  { key: 'THU', label: 'Kamis' },
  { key: 'FRI', label: 'Jumat' },
  { key: 'SAT', label: 'Sabtu' },
  { key: 'SUN', label: 'Minggu' },
]

export const normalizeTime = (val) => {
  if (!val) return ''
  const p = String(val).split(':')
  return p.length >= 2 ? `${p[0].padStart(2, '0')}:${p[1].padStart(2, '0')}` : val
}
