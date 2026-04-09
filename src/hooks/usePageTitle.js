import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Exact-match titles — ordered from most specific to least specific
const PAGE_TITLES = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/login': 'Login',
  '/unauthorized': 'Unauthorized',

  // Siswa
  '/siswa': 'Data Siswa',

  // Kelas
  '/kelas': 'Data Kelas',

  // Guru
  '/guru': 'Data Guru',

  // Mapel
  '/mapel': 'Mata Pelajaran',

  // Wali
  '/wali': 'Wali Murid',

  // Absensi
  '/absensi-siswa/rekap-bulanan': 'Rekap Absensi Siswa Bulanan',
  '/absensi-siswa': 'Absensi Siswa',
  '/absensi-guru': 'Absensi Guru',
  '/absensi-guru/rekap-bulanan': 'Rekap Absensi Guru Bulanan',

  // Akademik
  '/akademik/nilai': 'Nilai',
  '/akademik/tugas': 'Tugas',
  '/akademik/tugas-siswa': 'Pengumpulan Tugas',
  '/akademik/ranking': 'Ranking',
  '/akademik/rapor': 'Rapor',
  '/akademik/forum': 'Forum',
  '/akademik/materi': 'Materi',
  '/akademik/presensi': 'Presensi',
  '/akademik/ujian-jawaban': 'Jawaban Ujian',
  '/akademik/ujian': 'Ujian',
  '/akademik/ujian-user': 'Ujian User',
  '/akademik/soals': 'Bank Soal',
  '/akademik/tes-minat-bakat': 'Tes Minat dan Bakat',
  '/akademik/log-akses-materi': 'Log Akses Materi',

  // Admin
  '/admin/users': 'Users Management',
  '/admin/tahun-ajaran': 'Tahun Ajaran',
  '/admin/semester': 'Semester',
  '/admin/kalender-akademik': 'Kalender Akademik',
  '/admin/roles': 'Roles',
  '/admin/permissions': 'Permissions',
  '/admin/role-permissions': 'Role Permissions',
  '/admin/hari-operasional': 'Hari Operasional',
  '/admin/kalender-harian': 'Kalender Harian',
  '/admin/references': 'System References',
  '/admin/kalender-tipe': 'Kalender Tipe',
  '/admin/activity-logs': 'Activity Logs',
  '/admin/menus': 'Manajemen Menu',

  // Keuangan
  '/keuangan/tarif-spp': 'Tarif SPP',
  '/keuangan/pembayaran-spp': 'Pembayaran SPP',
  '/keuangan/pembayaran-spp/laporan-periode': 'Laporan Keuangan SPP',

  // Lainnya
  '/ekstrakurikuler': 'Ekstrakurikuler',
  '/organisasi': 'Organisasi',
  '/perpustakaan': 'Perpustakaan',
  '/perpustakaan/buku': 'Perpustakaan — Buku',
  '/perpustakaan/peminjaman': 'Perpustakaan — Peminjaman',
  '/ppdb': 'PPDB',
  '/ppdb/gelombang': 'PPDB — Gelombang',
  '/ppdb/pendaftaran': 'PPDB — Pendaftar',
  '/ppdb/dokumen': 'PPDB — Dokumen',
  '/ppdb/portal': 'Portal PPDB',
  '/sekolah': 'Data Sekolah',
  '/statistik': 'Statistik',
  '/spk': 'SPK',
  '/ews': 'Early Warning System',
  '/jadwal-pelajaran': 'Jadwal Pelajaran',
  '/files': 'Files Management',

  // WAHA
  '/waha/session': 'WAHA Session',
  '/waha/send': 'WAHA Messaging',
  '/waha': 'WhatsApp WAHA',

  // BK
  '/bk': 'Bimbingan Konseling',
  '/bk/jenis': 'BK — Jenis',
  '/bk/kategori': 'BK — Kategori',
  '/bk/kasus': 'BK — Kasus',
  '/bk/sesi': 'BK — Sesi',
  '/bk/hasil': 'BK — Hasil',
  '/bk/tindakan': 'BK — Tindakan',
  '/bk/lampiran': 'BK — Lampiran',
  '/bk/wali': 'BK — Wali',

  // Misc
  '/analytics': 'Analytics',
  '/data-grid': 'Data Grid',
  '/settings': 'Settings',
}

// Prefix-based fallbacks for sub-pages (/mapel/:id, /mapel/:id/edit, etc.)
// Ordered from most specific to least specific
const PREFIX_TITLES = [
  ['/perpustakaan/buku', 'Perpustakaan — Buku'],
  ['/perpustakaan/peminjaman', 'Perpustakaan — Peminjaman'],
  ['/perpustakaan', 'Perpustakaan'],
  ['/ppdb/gelombang', 'PPDB — Gelombang'],
  ['/ppdb/pendaftaran', 'PPDB — Pendaftar'],
  ['/ppdb/dokumen', 'PPDB — Dokumen'],
  ['/ppdb', 'PPDB'],
  ['/akademik/ujian-jawaban', 'Jawaban Ujian'],
  ['/akademik/ujian-user', 'Ujian User'],
  ['/akademik/ujian', 'Ujian'],
  ['/akademik/soals', 'Bank Soal'],
  ['/akademik/tes-minat-bakat', 'Tes Minat dan Bakat'],
  ['/akademik/log-akses-materi', 'Log Akses Materi'],
  ['/akademik/presensi', 'Presensi'],
  ['/akademik/nilai', 'Nilai'],
  ['/akademik/tugas-siswa', 'Pengumpulan Tugas'],
  ['/akademik/tugas', 'Tugas'],
  ['/akademik/ranking', 'Ranking'],
  ['/akademik/rapor', 'Rapor'],
  ['/akademik/forum', 'Forum'],
  ['/akademik/materi', 'Materi'],
  ['/admin/users', 'Users Management'],
  ['/admin/tahun-ajaran', 'Tahun Ajaran'],
  ['/admin/semester', 'Semester'],
  ['/admin/kalender-akademik', 'Kalender Akademik'],
  ['/admin/roles', 'Roles'],
  ['/admin/permissions', 'Permissions'],
  ['/admin/role-permissions', 'Role Permissions'],
  ['/admin/references', 'System References'],
  ['/admin/kalender-tipe', 'Kalender Tipe'],
  ['/admin/activity-logs', 'Activity Logs'],
  ['/admin/menus', 'Manajemen Menu'],
  ['/keuangan/tarif-spp', 'Tarif SPP'],
  ['/keuangan/pembayaran-spp/laporan-periode', 'Laporan Keuangan SPP'],
  ['/keuangan/pembayaran-spp', 'Pembayaran SPP'],
  ['/absensi-siswa/rekap-bulanan', 'Rekap Absensi Siswa Bulanan'],
  ['/absensi-siswa', 'Absensi Siswa'],
  ['/absensi-guru/rekap-bulanan', 'Rekap Absensi Guru Bulanan'],
  ['/absensi-guru', 'Absensi Guru'],
  ['/bk/jenis', 'BK — Jenis'],
  ['/bk/kategori', 'BK — Kategori'],
  ['/bk/kasus', 'BK — Kasus'],
  ['/bk/sesi', 'BK — Sesi'],
  ['/bk/hasil', 'BK — Hasil'],
  ['/bk/tindakan', 'BK — Tindakan'],
  ['/bk/lampiran', 'BK — Lampiran'],
  ['/bk/wali', 'BK — Wali'],
  ['/bk', 'Bimbingan Konseling'],
  ['/waha/session', 'WAHA Session'],
  ['/waha/send', 'WAHA Messaging'],
  ['/waha', 'WhatsApp WAHA'],
  ['/siswa', 'Data Siswa'],
  ['/kelas', 'Data Kelas'],
  ['/guru', 'Data Guru'],
  ['/mapel', 'Mata Pelajaran'],
  ['/wali', 'Wali Murid'],
  ['/statistik', 'Statistik'],
  ['/ews', 'Early Warning System'],
  ['/jadwal-pelajaran', 'Jadwal Pelajaran'],
  ['/ekstrakurikuler', 'Ekstrakurikuler'],
  ['/organisasi', 'Organisasi'],
  ['/sekolah', 'Data Sekolah'],
  ['/spk', 'SPK'],
]

const APP_NAME = 'Akademihub'

const resolveTitle = (pathname) => {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = PREFIX_TITLES.find(([prefix]) => pathname.startsWith(prefix + '/') || pathname === prefix)
  return match ? match[1] : null
}

/**
 * Sets the document title and returns the resolved page title.
 * @param {string} [override] - Optional title override (used by individual page components).
 */
export const usePageTitle = (override) => {
  const location = useLocation()

  const resolved = override || resolveTitle(location.pathname) || APP_NAME

  useEffect(() => {
    document.title = `${resolved} | ${APP_NAME}`
  }, [resolved])

  return resolved
}
