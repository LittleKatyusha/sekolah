export const ATTENDANCE_STATUS_VALUES = Object.freeze([
  { value: 1, label: 'Hadir' },
  { value: 2, label: 'Izin' },
  { value: 3, label: 'Sakit' },
  { value: 4, label: 'Alpha', aliases: ['Alpa'] },
  { value: 5, label: 'Terlambat' },
])

export const STUDENT_STATUS_VALUES = Object.freeze([
  { value: 1, label: 'Aktif' },
  { value: 2, label: 'Lulus' },
  { value: 3, label: 'Pindah' },
  { value: 4, label: 'Keluar' },
])

export const EDUCATION_VALUES = Object.freeze([
  { value: 1, label: 'SD / Sederajat (Sekolah Dasar, MI)', aliases: ['SD', 'MI'] },
  { value: 2, label: 'SMP / Sederajat (Sekolah Menengah Pertama, MTs)', aliases: ['SMP', 'MTs'] },
  { value: 3, label: 'SMA / Sederajat (Sekolah Menengah Atas, SMK, MA, Pesantren)', aliases: ['SMA', 'SMK', 'MA', 'Pesantren'] },
  { value: 4, label: 'Diploma (D1, D2, D3)', aliases: ['Diploma', 'D1', 'D2', 'D3'] },
  { value: 5, label: 'Sarjana (S1) / Diploma 4 (D4)', aliases: ['Sarjana', 'S1', 'D4'] },
  { value: 6, label: 'Magister (S2)', aliases: ['Magister', 'S2'] },
  { value: 7, label: 'Doktor (S3)', aliases: ['Doktor', 'S3'] },
])

export const BK_STATUS_VALUES = Object.freeze([
  { value: 1, label: 'Dibuka' },
  { value: 2, label: 'Proses' },
  { value: 3, label: 'Selesai' },
  { value: 4, label: 'Dirujuk' },
])

export const CALENDAR_STATUS_VALUES = Object.freeze([
  { value: 0, label: 'Cancelled', aliases: ['Dibatalkan', 'Batal'] },
  { value: 1, label: 'Active', aliases: ['Aktif'] },
  { value: 2, label: 'Completed', aliases: ['Selesai'] },
])

export const optionsToMappedValues = (options = []) => options.map((option) => ({
  value: Number.isNaN(Number(option.value)) ? option.value : Number(option.value),
  label: option.label,
}))
