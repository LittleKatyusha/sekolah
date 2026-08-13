import { checkPermission } from '../hooks/usePermission'

const ROUTE_PERMISSIONS = [
  ['/dashboard', 'dashboard.view'],
  ['/admin/users', 'users.view'], ['/admin/user-devices', 'user-devices.view'],
  ['/admin/activity-logs', 'activity-logs.view'], ['/admin/menus', 'menus.view'],
  ['/admin/roles', 'roles.view'], ['/admin/permissions', 'permissions.view'],
  ['/admin/references', 'sys-reference.view'], ['/admin/tahun-ajaran', 'tahun-ajaran.view'],
  ['/admin/semester', 'semester.view'], ['/admin/hari-operasional', 'hari-operasional.view'],
  ['/admin/kalender', 'kalender-akademik.view'], ['/siswa', 'siswa.view'], ['/kelas', 'kelas.view'],
  ['/guru-mapel', 'guru-mapel.view'], ['/guru', 'guru.view'], ['/wali', 'wali.view'],
  ['/mapel', 'mapel.view'], ['/jadwal-pelajaran', 'jadwal-pelajaran.view'],
  ['/akademik/materi', 'materi.view'], ['/akademik/tugas-siswa', 'tugas-siswa.view'],
  ['/akademik/tugas', 'tugas.view'], ['/akademik/nilai', 'nilai.view'], ['/akademik/rapor', 'rapor.view'],
  ['/akademik/ranking', 'ranking.view'], ['/akademik/forum', 'forum.view'], ['/akademik/presensi', 'presensi.view'],
  ['/akademik/tes-minat-bakat', 'tes-minat-bakat.view'], ['/keuangan/tarif-spp', 'tarif-spp.view'],
  ['/keuangan/pembayaran-spp', 'pembayaran-spp.view'], ['/perpustakaan/buku', 'buku.view'],
  ['/perpustakaan/peminjaman', 'peminjaman.view'], ['/bk/kategori', 'bk-kategori.view'],
  ['/bk/jenis', 'bk-jenis.view'], ['/bk/kasus', 'bk-kasus.view'], ['/bk/sesi', 'bk-sesi.view'],
  ['/bk/hasil', 'bk-hasil.view'], ['/bk/tindakan', 'bk-tindakan.view'], ['/bk/lampiran', 'bk-lampiran.view'],
  ['/bk/wali', 'bk-wali.view'], ['/statistik', 'statistik.overview'], ['/laporan', 'reports.view'],
  ['/waha', 'waha.view'], ['/files', 'files.view'],
]

export const permissionForPath = (pathname) => ROUTE_PERMISSIONS
  .find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1]

export const canAccessPath = (user, pathname) => checkPermission(user, permissionForPath(pathname))
