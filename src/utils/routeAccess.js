import { checkPermission } from '../hooks/usePermission'

// Routes with no active API contract in routes/api.php. Keep them inaccessible
// until the backend publishes the corresponding staff-facing endpoints.
const BACKEND_UNAVAILABLE_PATHS = [
  '/absensi-siswa',
  '/absensi-guru',
  '/akademik/presensi',
  '/akademik/ujian',
  '/akademik/ujian-user',
  '/akademik/ujian-jawaban',
  '/statistik',
  '/analytics',
  '/data-grid',
  '/settings',
]

// Allowlist for authenticated / general private routes that require no specific granular permission
const ALLOWLIST_PRIVATE_PATHS = [
  '/notifikasi',
]

export const ROUTE_RULES = [
  // ── Dashboard, Reports, Files, Email ────────────────────────
  ['/dashboard', 'dashboard.view'],
  ['/laporan', 'reports.view'],
  ['/files', 'files.upload'],
  ['/marketing/email', 'email.view'],

  // ── WhatsApp (WAHA) ────────────────────────────────────────
  ['/waha/send', 'waha.send'],
  ['/waha/session', 'waha.view'],
  ['/waha', 'waha.view'],
  ['/whatsapp/send', 'waha.send'],
  ['/whatsapp/session', 'waha.view'],
  ['/whatsapp/*', 'waha.view'],
  ['/whatsapp', 'waha.view'],

  // ── Master Data — Siswa ────────────────────────────────────
  ['/siswa/:id/insight', 'siswa.view'],
  ['/siswa/create', 'siswa.create'],
  ['/siswa/:id/edit', 'siswa.update'],
  ['/siswa/:id', 'siswa.view'],
  ['/siswa', 'siswa.view'],

  // ── Master Data — Kelas ────────────────────────────────────
  ['/kelas/create', 'kelas.create'],
  ['/kelas/:id/edit', 'kelas.update'],
  ['/kelas/:id', 'kelas.view'],
  ['/kelas', 'kelas.view'],

  // ── Master Data — Guru ─────────────────────────────────────
  ['/guru/create', 'guru.create'],
  ['/guru/:id/edit', 'guru.update'],
  ['/guru/:id', 'guru.view'],
  ['/guru', 'guru.view'],

  // ── Master Data — Mata Pelajaran ───────────────────────────
  ['/mapel/create', 'mapel.create'],
  ['/mapel/:id/edit', 'mapel.update'],
  ['/mapel/:id', 'mapel.view'],
  ['/mapel', 'mapel.view'],

  // ── Master Data — Guru Mapel ───────────────────────────────
  ['/guru-mapel/create', 'guru-mapel.create'],
  ['/guru-mapel/:id/edit', 'guru-mapel.update'],
  ['/guru-mapel/:id', 'guru-mapel.view'],
  ['/guru-mapel', 'guru-mapel.view'],

  // ── Master Data — Wali ─────────────────────────────────────
  ['/wali/create', 'wali.create'],
  ['/wali/:id/edit', 'wali.update'],
  ['/wali/:id', 'wali.view'],
  ['/wali', 'wali.view'],

  // ── Kehadiran — Absensi Siswa ──────────────────────────────
  ['/absensi-siswa/tambah', 'absensi-siswa.create'],
  ['/absensi-siswa/edit/:id', 'absensi-siswa.update'],
  ['/absensi-siswa/rekap-bulanan', 'absensi-siswa.view'],
  ['/absensi-siswa/:id', 'absensi-siswa.view'],
  ['/absensi-siswa', 'absensi-siswa.view'],

  // ── Kehadiran — Absensi Guru ───────────────────────────────
  ['/absensi-guru/tambah', 'absensi-guru.create'],
  ['/absensi-guru/edit/:id', 'absensi-guru.update'],
  ['/absensi-guru/rekap-bulanan', 'absensi-guru.view'],
  ['/absensi-guru/:id', 'absensi-guru.view'],
  ['/absensi-guru', 'absensi-guru.view'],

  // ── Akademik — Jadwal Pelajaran ────────────────────────────
  ['/jadwal-pelajaran/create', 'jadwal-pelajaran.create'],
  ['/jadwal-pelajaran/:id/edit', 'jadwal-pelajaran.update'],
  ['/jadwal-pelajaran/:id', 'jadwal-pelajaran.view'],
  ['/jadwal-pelajaran', 'jadwal-pelajaran.view'],

  // ── Akademik — Nilai ───────────────────────────────────────
  ['/akademik/nilai/create', 'nilai.create'],
  ['/akademik/nilai/:id/edit', 'nilai.update'],
  ['/akademik/nilai/:id', 'nilai.view'],
  ['/akademik/nilai', 'nilai.view'],

  // ── Akademik — Tugas ───────────────────────────────────────
  ['/akademik/tugas/create', 'tugas.create'],
  ['/akademik/tugas/:id/edit', 'tugas.update'],
  ['/akademik/tugas/:id', 'tugas.view'],
  ['/akademik/tugas', 'tugas.view'],

  // ── Akademik — Tugas Siswa ─────────────────────────────────
  ['/akademik/tugas-siswa/create', 'tugas-siswa.create'],
  ['/akademik/tugas-siswa/:id/edit', 'tugas-siswa.update'],
  ['/akademik/tugas-siswa/:id', 'tugas-siswa.view'],
  ['/akademik/tugas-siswa', 'tugas-siswa.view'],

  // ── Akademik — Ranking ─────────────────────────────────────
  ['/akademik/ranking/create', 'ranking.create'],
  ['/akademik/ranking/:id/edit', 'ranking.update'],
  ['/akademik/ranking/:id', 'ranking.view'],
  ['/akademik/ranking', 'ranking.view'],

  // ── Akademik — Rapor ───────────────────────────────────────
  ['/akademik/rapor/create', 'rapor.create'],
  ['/akademik/rapor/:id/edit', 'rapor.update'],
  ['/akademik/rapor/:id', 'rapor.view'],
  ['/akademik/rapor', 'rapor.view'],

  // ── Akademik — Forum ───────────────────────────────────────
  ['/akademik/forum/create', 'forum.create'],
  ['/akademik/forum/:id/edit', 'forum.update'],
  ['/akademik/forum/:id', 'forum.view'],
  ['/akademik/forum', 'forum.view'],

  // ── Akademik — Materi ──────────────────────────────────────
  ['/akademik/materi/create', 'materi.create'],
  ['/akademik/materi/:id/edit', 'materi.update'],
  ['/akademik/materi/:id', 'materi.view'],
  ['/akademik/materi', 'materi.view'],

  // ── Akademik — Presensi ────────────────────────────────────
  ['/akademik/presensi/tambah', 'presensi.create'],
  ['/akademik/presensi/edit/:id', 'presensi.update'],
  ['/akademik/presensi/:id', 'presensi.view'],
  ['/akademik/presensi', 'presensi.view'],

  // ── Akademik — Ujian Jawaban ───────────────────────────────
  ['/akademik/ujian-jawaban/:id/edit', 'ujian-jawaban.update'],
  ['/akademik/ujian-jawaban/:id', 'ujian-jawaban.view'],
  ['/akademik/ujian-jawaban', 'ujian-jawaban.view'],

  // ── Akademik — Log Akses Materi ────────────────────────────
  ['/akademik/log-akses-materi/:id', 'log-akses-materi.view'],
  ['/akademik/log-akses-materi', 'log-akses-materi.view'],

  // ── Akademik — Ujian ───────────────────────────────────────
  ['/akademik/ujian/create', 'ujian.create'],
  ['/akademik/ujian/:id/edit', 'ujian.update'],
  ['/akademik/ujian/:id/nilai', 'ujian.view'],
  ['/akademik/ujian/:id', 'ujian.view'],
  ['/akademik/ujian', 'ujian.view'],

  // ── Akademik — Soal (Bank Soal) ───────────────────────────
  ['/akademik/soals/create', 'soals.create'],
  ['/akademik/soals/:id/edit', 'soals.update'],
  ['/akademik/soals/:id', 'soals.view'],
  ['/akademik/soals', 'soals.view'],

  // ── Akademik — Ujian User ──────────────────────────────────
  ['/akademik/ujian-user/create', 'ujian-user.create'],
  ['/akademik/ujian-user/:id/edit', 'ujian-user.update'],
  ['/akademik/ujian-user/:id/mulai', 'ujian-user.mulai'],
  ['/akademik/ujian-user/:id', 'ujian-user.view'],
  ['/akademik/ujian-user', 'ujian-user.view'],

  // ── Akademik — Tes Minat Bakat ─────────────────────────────
  ['/akademik/tes-minat-bakat/tes/create', 'tes-minat-bakat.create'],
  ['/akademik/tes-minat-bakat/tes/:id/edit', 'tes-minat-bakat.update'],
  ['/akademik/tes-minat-bakat/tes/:id', 'tes-minat-bakat.view'],
  ['/akademik/tes-minat-bakat/tes', 'tes-minat-bakat.view'],
  ['/akademik/tes-minat-bakat/aspek/create', 'tes-minat-bakat-aspek.create'],
  ['/akademik/tes-minat-bakat/aspek/:id/edit', 'tes-minat-bakat-aspek.update'],
  ['/akademik/tes-minat-bakat/aspek/:id', 'tes-minat-bakat-aspek.view'],
  ['/akademik/tes-minat-bakat/aspek', 'tes-minat-bakat-aspek.view'],
  ['/akademik/tes-minat-bakat/pertanyaan/create', 'tes-minat-bakat-pertanyaan.create'],
  ['/akademik/tes-minat-bakat/pertanyaan/:id/edit', 'tes-minat-bakat-pertanyaan.update'],
  ['/akademik/tes-minat-bakat/pertanyaan/:id', 'tes-minat-bakat-pertanyaan.view'],
  ['/akademik/tes-minat-bakat/pertanyaan', 'tes-minat-bakat-pertanyaan.view'],
  ['/akademik/tes-minat-bakat/peserta/create', 'tes-minat-bakat-peserta.create'],
  ['/akademik/tes-minat-bakat/peserta/:id/edit', 'tes-minat-bakat-peserta.update'],
  ['/akademik/tes-minat-bakat/peserta/:id', 'tes-minat-bakat-peserta.view'],
  ['/akademik/tes-minat-bakat/peserta', 'tes-minat-bakat-peserta.view'],
  ['/akademik/tes-minat-bakat/jawaban/create', 'tes-minat-bakat-jawaban.create'],
  ['/akademik/tes-minat-bakat/jawaban/:id/edit', 'tes-minat-bakat-jawaban.update'],
  ['/akademik/tes-minat-bakat/jawaban/:id', 'tes-minat-bakat-jawaban.view'],
  ['/akademik/tes-minat-bakat/jawaban', 'tes-minat-bakat-jawaban.view'],
  ['/akademik/tes-minat-bakat/hasil/:id', 'tes-minat-bakat-hasil.view'],
  ['/akademik/tes-minat-bakat/hasil', 'tes-minat-bakat-hasil.view'],
  ['/akademik/tes-minat-bakat/dashboard', 'tes-minat-bakat.view'],
  ['/akademik/tes-minat-bakat', 'tes-minat-bakat.view'],

  // ── Bimbingan Konseling (BK) ───────────────────────────────
  ['/bk/jenis/create', 'bk-jenis.create'],
  ['/bk/jenis/:id/edit', 'bk-jenis.update'],
  ['/bk/jenis/:id', 'bk-jenis.view'],
  ['/bk/jenis', 'bk-jenis.view'],

  ['/bk/kategori/create', 'bk-kategori.manage'],
  ['/bk/kategori/:id/edit', 'bk-kategori.manage'],
  ['/bk/kategori/:id', 'bk-kategori.view'],
  ['/bk/kategori', 'bk-kategori.view'],

  ['/bk/kasus/create', 'bk-kasus.create'],
  ['/bk/kasus/:id/edit', 'bk-kasus.update'],
  ['/bk/kasus/:id', 'bk-kasus.view'],
  ['/bk/kasus', 'bk-kasus.view'],

  ['/bk/sesi/create', 'bk-sesi.manage'],
  ['/bk/sesi/:id/edit', 'bk-sesi.manage'],
  ['/bk/sesi/:id', 'bk-sesi.view'],
  ['/bk/sesi', 'bk-sesi.view'],

  ['/bk/hasil/create', 'bk-hasil.manage'],
  ['/bk/hasil/:id/edit', 'bk-hasil.manage'],
  ['/bk/hasil/:id', 'bk-hasil.view'],
  ['/bk/hasil', 'bk-hasil.view'],

  ['/bk/tindakan/create', 'bk-tindakan.manage'],
  ['/bk/tindakan/:id/edit', 'bk-tindakan.manage'],
  ['/bk/tindakan/:id', 'bk-tindakan.view'],
  ['/bk/tindakan', 'bk-tindakan.view'],

  ['/bk/lampiran/create', 'bk-lampiran.manage'],
  ['/bk/lampiran/:id/edit', 'bk-lampiran.manage'],
  ['/bk/lampiran/:id', 'bk-lampiran.view'],
  ['/bk/lampiran', 'bk-lampiran.view'],

  ['/bk/wali/create', 'bk-wali.manage'],
  ['/bk/wali/:id/edit', 'bk-wali.manage'],
  ['/bk/wali/:id', 'bk-wali.view'],
  ['/bk/wali', 'bk-wali.view'],

  ['/bk', 'bk-kasus.view'],

  // ── Early Warning System (EWS) ─────────────────────────────
  ['/ews/:id', 'ews.view'],
  ['/ews', 'ews.view'],

  // ── Keuangan — Tarif SPP ───────────────────────────────────
  ['/keuangan/tarif-spp/create', 'tarif-spp.create'],
  ['/keuangan/tarif-spp/:id/edit', 'tarif-spp.update'],
  ['/keuangan/tarif-spp/:id', 'tarif-spp.view'],
  ['/keuangan/tarif-spp', 'tarif-spp.view'],

  // ── Keuangan — Pembayaran SPP ──────────────────────────────
  ['/keuangan/pembayaran-spp/create', 'pembayaran-spp.create'],
  ['/keuangan/pembayaran-spp/tunggakan', 'pembayaran-spp.view'],
  ['/keuangan/pembayaran-spp/laporan-periode', 'pembayaran-spp.view'],
  ['/keuangan/pembayaran-spp/:id/edit', 'pembayaran-spp.update'],
  ['/keuangan/pembayaran-spp/:id', 'pembayaran-spp.view'],
  ['/keuangan/pembayaran-spp', 'pembayaran-spp.view'],

  // ── PPDB ───────────────────────────────────────────────────
  ['/ppdb/gelombang/create', 'ppdb.gelombang.create'],
  ['/ppdb/gelombang/:gelombangId/kriteria/create', 'ppdb.gelombang.create'],
  ['/ppdb/gelombang/:gelombangId/kriteria/:kriteriaId/edit', 'ppdb.gelombang.update'],
  ['/ppdb/gelombang/:gelombangId/kriteria', 'ppdb.gelombang.view'],
  ['/ppdb/gelombang/:gelombangId/kuota/create', 'ppdb.gelombang.create'],
  ['/ppdb/gelombang/:gelombangId/kuota/:kuotaId/edit', 'ppdb.gelombang.update'],
  ['/ppdb/gelombang/:gelombangId/kuota', 'ppdb.gelombang.view'],
  ['/ppdb/gelombang/:gelombangId/seleksi', 'ppdb.seleksi.view'],
  ['/ppdb/gelombang/:gelombangId/hasil-seleksi', 'ppdb.seleksi.view'],
  ['/ppdb/gelombang/:id/edit', 'ppdb.gelombang.update'],
  ['/ppdb/gelombang/:id', 'ppdb.gelombang.view'],
  ['/ppdb/gelombang', 'ppdb.gelombang.view'],

  ['/ppdb/pendaftaran/create', 'ppdb.pendaftaran.create'],
  ['/ppdb/pendaftaran/:id/edit', 'ppdb.pendaftaran.update'],
  ['/ppdb/pendaftaran/:id', 'ppdb.pendaftaran.view'],
  ['/ppdb/pendaftaran', 'ppdb.pendaftaran.view'],

  ['/ppdb/pendaftar/create', 'ppdb.pendaftaran.create'],
  ['/ppdb/pendaftar/:id/edit', 'ppdb.pendaftaran.update'],
  ['/ppdb/pendaftar/:id', 'ppdb.pendaftaran.view'],
  ['/ppdb/pendaftar', 'ppdb.pendaftaran.view'],

  ['/ppdb/dokumen/create', 'ppdb.dokumen.create'],
  ['/ppdb/dokumen/:id/edit', 'ppdb.dokumen.update'],
  ['/ppdb/dokumen/:id', 'ppdb.dokumen.view'],
  ['/ppdb/dokumen', 'ppdb.dokumen.view'],

  ['/ppdb/nilai-rapor/create', 'ppdb.pendaftaran.create'],
  ['/ppdb/nilai-rapor/bulk', 'ppdb.pendaftaran.create'],
  ['/ppdb/nilai-rapor/:id/edit', 'ppdb.pendaftaran.update'],
  ['/ppdb/nilai-rapor', 'ppdb.pendaftaran.view'],

  ['/ppdb', 'ppdb.gelombang.view'],

  // ── Ekstrakurikuler ────────────────────────────────────────
  ['/ekstrakurikuler/pendaftaran/create', 'ekstrakurikuler.pendaftaran.manage'],
  ['/ekstrakurikuler/pendaftaran/:id/edit', 'ekstrakurikuler.pendaftaran.manage'],
  ['/ekstrakurikuler/pendaftaran/:id', 'ekstrakurikuler.pendaftaran.view'],
  ['/ekstrakurikuler/pendaftaran', 'ekstrakurikuler.pendaftaran.view'],
  ['/ekstrakurikuler/create', 'ekstrakurikuler.manage'],
  ['/ekstrakurikuler/:id/edit', 'ekstrakurikuler.manage'],
  ['/ekstrakurikuler/:id', 'ekstrakurikuler.view'],
  ['/ekstrakurikuler', 'ekstrakurikuler.view'],

  // ── Organisasi ─────────────────────────────────────────────
  ['/organisasi/jabatan/create', 'organisasi.jabatan.manage'],
  ['/organisasi/jabatan/:id/edit', 'organisasi.jabatan.manage'],
  ['/organisasi/jabatan/:id', 'organisasi.jabatan.view'],
  ['/organisasi/jabatan', 'organisasi.jabatan.view'],
  ['/organisasi/anggota/create', 'organisasi.anggota.manage'],
  ['/organisasi/anggota/:id/edit', 'organisasi.anggota.manage'],
  ['/organisasi/anggota/:id', 'organisasi.anggota.view'],
  ['/organisasi/anggota', 'organisasi.anggota.view'],
  ['/organisasi/create', 'organisasi.manage'],
  ['/organisasi/:id/edit', 'organisasi.manage'],
  ['/organisasi/:id', 'organisasi.view'],
  ['/organisasi', 'organisasi.view'],

  // ── Perpustakaan ───────────────────────────────────────────
  ['/perpustakaan/buku/create', 'buku.create'],
  ['/perpustakaan/buku/:id/edit', 'buku.update'],
  ['/perpustakaan/buku/:id', 'buku.view'],
  ['/perpustakaan/buku', 'buku.view'],
  ['/perpustakaan/peminjaman/create', 'peminjaman.create'],
  ['/perpustakaan/peminjaman/:id/edit', 'peminjaman.update'],
  ['/perpustakaan/peminjaman/:id', 'peminjaman.view'],
  ['/perpustakaan/peminjaman', 'peminjaman.view'],
  ['/perpustakaan', 'buku.view'],

  // ── SPK (Sistem Pendukung Keputusan) ───────────────────────
  ['/spk/kriteria/create', 'spk-kriteria.create'],
  ['/spk/kriteria/:id/edit', 'spk-kriteria.update'],
  ['/spk/kriteria/:id', 'spk-kriteria.view'],
  ['/spk/kriteria', 'spk-kriteria.view'],
  ['/spk/penilaian/create', 'spk-penilaian.create'],
  ['/spk/penilaian/:id/edit', 'spk-penilaian.update'],
  ['/spk/penilaian/:id', 'spk-penilaian.view'],
  ['/spk/penilaian', 'spk-penilaian.view'],
  ['/spk/hasil/:id', 'spk-hasil.view'],
  ['/spk/hasil', 'spk-hasil.view'],
  ['/spk', 'spk-kriteria.view'],

  // ── Sekolah ────────────────────────────────────────────────
  ['/sekolah/edit', 'sekolah.update'],
  ['/sekolah', 'sekolah.view'],

  // ── Statistik ──────────────────────────────────────────────
  ['/statistik/overview', 'statistik.overview'],
  ['/statistik/akademik', 'statistik.overview'],
  ['/statistik/kehadiran', 'statistik.overview'],
  ['/statistik/keuangan', 'statistik.overview'],
  ['/statistik/bk', 'statistik.overview'],
  ['/statistik/ppdb', 'statistik.overview'],
  ['/statistik/perpustakaan', 'statistik.overview'],
  ['/statistik/ujian', 'statistik.overview'],
  ['/statistik/ekstrakurikuler', 'statistik.overview'],
  ['/statistik/organisasi', 'statistik.overview'],
  ['/statistik/guru', 'statistik.overview'],
  ['/statistik/spk', 'statistik.overview'],
  ['/statistik', 'statistik.overview'],

  // ── Admin — Pengguna & Hak Akses ───────────────────────────
  ['/admin/users/create', 'users.create'],
  ['/admin/users/:id/edit', 'users.update'],
  ['/admin/users/:id', 'users.view'],
  ['/admin/users', 'users.view'],

  ['/admin/user-devices/create', 'users.create'],
  ['/admin/user-devices/:id/edit', 'users.update'],
  ['/admin/user-devices/:id', 'users.view'],
  ['/admin/user-devices', 'users.view'],

  ['/admin/roles/create', 'roles.create'],
  ['/admin/roles/:id/edit', 'roles.update'],
  ['/admin/roles/:id', 'roles.view'],
  ['/admin/roles', 'roles.view'],

  ['/admin/permissions/create', 'permissions.create'],
  ['/admin/permissions/:id/edit', 'permissions.update'],
  ['/admin/permissions/:id', 'permissions.view'],
  ['/admin/permissions', 'permissions.view'],

  ['/admin/role-permissions/create', 'role_permissions.create'],
  ['/admin/role-permissions/:id/edit', 'role_permissions.update'],
  ['/admin/role-permissions/:id', 'role_permissions.view'],
  ['/admin/role-permissions', 'role_permissions.view'],

  ['/admin/menus/create', 'menus.create'],
  ['/admin/menus/:id/edit', 'menus.update'],
  ['/admin/menus/:id', 'menus.view'],
  ['/admin/menus', 'menus.view'],

  ['/admin/references/create', 'sys-reference.manage'],
  ['/admin/references/:id/edit', 'sys-reference.manage'],
  ['/admin/references/:id', 'sys-reference.view'],
  ['/admin/references', 'sys-reference.view'],

  ['/admin/activity-logs/:id', 'activity-logs.view'],
  ['/admin/activity-logs', 'activity-logs.view'],

  ['/admin/tahun-ajaran/create', 'tahun-ajaran.manage'],
  ['/admin/tahun-ajaran/:id/edit', 'tahun-ajaran.manage'],
  ['/admin/tahun-ajaran/:id', 'tahun-ajaran.view'],
  ['/admin/tahun-ajaran', 'tahun-ajaran.view'],

  ['/admin/semester/create', 'semester.manage'],
  ['/admin/semester/:id/edit', 'semester.manage'],
  ['/admin/semester/:id', 'semester.view'],
  ['/admin/semester', 'semester.view'],

  ['/admin/hari-operasional', 'hari-operasional.view'],

  ['/admin/kalender-tipe/create', 'kalender-tipe.manage'],
  ['/admin/kalender-tipe/:id/edit', 'kalender-tipe.manage'],
  ['/admin/kalender-tipe/:id', 'kalender-tipe.view'],
  ['/admin/kalender-tipe', 'kalender-tipe.view'],

  ['/admin/kalender-akademik/create', 'kalender-akademik.manage'],
  ['/admin/kalender-akademik/:id/edit', 'kalender-akademik.manage'],
  ['/admin/kalender-akademik/list', 'kalender-akademik.view'],
  ['/admin/kalender-akademik/:id', 'kalender-akademik.view'],
  ['/admin/kalender-akademik', 'kalender-akademik.view'],

  ['/admin/kalender-harian', 'kalender-harian.view'],
]

const compiledRules = ROUTE_RULES.map(([pattern, permission]) => {
  const regexStr = pattern
    .replace(/\/:[a-zA-Z0-9_]+/g, '/[^/]+')
    .replace(/\/\*/g, '(?:/.*)?')
  return [new RegExp(`^${regexStr}$`), permission]
})

export const permissionForPath = (pathname) => {
  const normalized = (pathname || '').replace(/\/+$/, '') || '/'
  for (const [regex, permission] of compiledRules) {
    if (regex.test(normalized)) {
      return permission
    }
  }
  return undefined
}

export const canAccessPath = (user, pathname) => {
  const normalized = (pathname || '').replace(/\/+$/, '') || '/'
  if (ALLOWLIST_PRIVATE_PATHS.some((path) => normalized === path || normalized.startsWith(`${path}/`))) {
    return Boolean(user)
  }

  const permission = permissionForPath(normalized)
  if (!permission) return false

  return checkPermission(user, permission)
}

export const isBackendAvailablePath = (pathname) => !BACKEND_UNAVAILABLE_PATHS
  .some((path) => pathname === path || pathname.startsWith(`${path}/`))
