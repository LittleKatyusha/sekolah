import { checkPermission } from '../hooks/usePermission'

const ROUTE_PERMISSIONS = [
  // ── Dashboard ──────────────────────────────────────────────
  ['/dashboard', 'dashboard.view'],

  // ── Master Data ────────────────────────────────────────────
  ['/siswa', 'siswa.view'],
  ['/kelas', 'kelas.view'],
  ['/guru', 'guru.view'],
  ['/guru-mapel', 'guru-mapel.view'],
  ['/mapel', 'mapel.view'],
  ['/wali', 'wali.view'],

  // ── Kehadiran ──────────────────────────────────────────────
  ['/absensi-siswa', 'absensi-siswa.view'],
  ['/absensi-guru', 'absensi-guru.view'],

  // ── Akademik ───────────────────────────────────────────────
  ['/jadwal-pelajaran', 'jadwal-pelajaran.view'],
  ['/akademik/materi', 'materi.view'],
  ['/akademik/tugas', 'tugas.view'],
  ['/akademik/tugas-siswa', 'tugas-siswa.view'],
  ['/akademik/ujian', 'ujian.view'],
  ['/akademik/ujian-jawaban', 'ujian-jawaban.view'],
  ['/akademik/ujian-user', 'ujian-user.view'],
  ['/akademik/soals', 'soals.view'],
  ['/akademik/nilai', 'nilai.view'],
  ['/akademik/rapor', 'rapor.view'],
  ['/akademik/ranking', 'ranking.view'],
  ['/akademik/presensi', 'presensi.view'],
  ['/akademik/forum', 'forum.view'],
  ['/akademik/tes-minat-bakat', 'tes-minat-bakat.view'],
  ['/akademik/log-akses-materi', 'log-akses-materi.view'],

  // ── Bimbingan Konseling ────────────────────────────────────
  ['/bk/kategori', 'bk-kategori.view'],
  ['/bk/jenis', 'bk-jenis.view'],
  ['/bk/kasus', 'bk-kasus.view'],
  ['/bk/sesi', 'bk-sesi.view'],
  ['/bk/hasil', 'bk-hasil.view'],
  ['/bk/tindakan', 'bk-tindakan.view'],
  ['/bk/lampiran', 'bk-lampiran.view'],
  ['/bk/wali', 'bk-wali.view'],
  ['/ews', 'ews.view'],

  // ── Keuangan ───────────────────────────────────────────────
  ['/keuangan/tarif-spp', 'tarif-spp.view'],
  ['/keuangan/pembayaran-spp', 'pembayaran-spp.view'],

  // ── PPDB ───────────────────────────────────────────────────
  ['/ppdb', 'ppdb.gelombang.view'],

  // ── Ekstrakurikuler & Organisasi ───────────────────────────
  ['/ekstrakurikuler', 'ekstrakurikuler.view'],
  ['/organisasi', 'organisasi.view'],

  // ── Perpustakaan ───────────────────────────────────────────
  ['/perpustakaan/buku', 'buku.view'],
  ['/perpustakaan/peminjaman', 'peminjaman.view'],

  // ── SPK ────────────────────────────────────────────────────
  ['/spk', 'spk-kriteria.view'],

  // ── Sekolah ────────────────────────────────────────────────
  ['/sekolah', 'sekolah.view'],

  // ── Statistik & Laporan ────────────────────────────────────
  ['/statistik', 'statistik.overview'],
  ['/laporan', 'reports.view'],

  // ── WhatsApp (WAHA) ────────────────────────────────────────
  // /whatsapp/* adalah redirect alias ke /waha — gunakan permission yang sama
  ['/waha', 'waha.view'],
  ['/whatsapp', 'waha.view'],

  // ── Files ──────────────────────────────────────────────────
  ['/files', 'files.upload'],

  // ── Email Marketing ────────────────────────────────────────
  ['/marketing/email', 'email.view'],


  // ── Pengaturan (Admin) ─────────────────────────────────────
  ['/admin/users', 'users.view'],
  // user-devices diproteksi via users.view (route backend pakai permission yang sama)
  ['/admin/user-devices', 'users.view'],
  ['/admin/roles', 'roles.view'],
  ['/admin/permissions', 'permissions.view'],
  ['/admin/role-permissions', 'role_permissions.view'],
  ['/admin/menus', 'menus.view'],
  ['/admin/references', 'sys-reference.view'],
  ['/admin/activity-logs', 'activity-logs.view'],
  ['/admin/tahun-ajaran', 'tahun-ajaran.view'],
  ['/admin/semester', 'semester.view'],
  ['/admin/hari-operasional', 'hari-operasional.view'],
  ['/admin/kalender-tipe', 'kalender-tipe.view'],
  ['/admin/kalender-akademik', 'kalender-akademik.view'],
  ['/admin/kalender-harian', 'kalender-harian.view'],
]

export const permissionForPath = (pathname) => ROUTE_PERMISSIONS
  .find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1]

export const canAccessPath = (user, pathname) => checkPermission(user, permissionForPath(pathname))
