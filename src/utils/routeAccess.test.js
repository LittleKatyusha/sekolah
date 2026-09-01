import { describe, expect, it } from 'vitest'
import { canAccessPath, isBackendAvailablePath, permissionForPath } from './routeAccess'

const ALL_PROTECTED_LEAF_ROUTES = [
  "/absensi-guru",
  "/absensi-guru/:id",
  "/absensi-guru/edit/:id",
  "/absensi-guru/rekap-bulanan",
  "/absensi-guru/tambah",
  "/absensi-siswa",
  "/absensi-siswa/:id",
  "/absensi-siswa/edit/:id",
  "/absensi-siswa/rekap-bulanan",
  "/absensi-siswa/tambah",
  "/admin/activity-logs",
  "/admin/activity-logs/:id",
  "/admin/hari-operasional",
  "/admin/kalender-akademik",
  "/admin/kalender-akademik/:id/edit",
  "/admin/kalender-akademik/create",
  "/admin/kalender-akademik/list",
  "/admin/kalender-harian",
  "/admin/kalender-tipe",
  "/admin/kalender-tipe/:id/edit",
  "/admin/kalender-tipe/create",
  "/admin/menus",
  "/admin/menus/:id",
  "/admin/menus/:id/edit",
  "/admin/menus/create",
  "/admin/permissions",
  "/admin/permissions/:id",
  "/admin/permissions/:id/edit",
  "/admin/permissions/create",
  "/admin/references",
  "/admin/references/:id",
  "/admin/references/:id/edit",
  "/admin/references/create",
  "/admin/role-permissions",
  "/admin/role-permissions/:id",
  "/admin/role-permissions/:id/edit",
  "/admin/role-permissions/create",
  "/admin/roles",
  "/admin/roles/:id",
  "/admin/roles/:id/edit",
  "/admin/roles/create",
  "/admin/semester",
  "/admin/semester/:id",
  "/admin/semester/:id/edit",
  "/admin/semester/create",
  "/admin/tahun-ajaran",
  "/admin/tahun-ajaran/:id",
  "/admin/tahun-ajaran/:id/edit",
  "/admin/tahun-ajaran/create",
  "/admin/user-devices",
  "/admin/user-devices/:id",
  "/admin/user-devices/:id/edit",
  "/admin/user-devices/create",
  "/admin/users",
  "/admin/users/:id",
  "/admin/users/:id/edit",
  "/admin/users/create",
  "/akademik/forum",
  "/akademik/forum/:id",
  "/akademik/forum/:id/edit",
  "/akademik/forum/create",
  "/akademik/log-akses-materi",
  "/akademik/log-akses-materi/:id",
  "/akademik/materi",
  "/akademik/materi/:id",
  "/akademik/materi/:id/edit",
  "/akademik/materi/create",
  "/akademik/nilai",
  "/akademik/nilai/:id",
  "/akademik/nilai/:id/edit",
  "/akademik/nilai/create",
  "/akademik/presensi",
  "/akademik/presensi/:id",
  "/akademik/presensi/edit/:id",
  "/akademik/presensi/tambah",
  "/akademik/ranking",
  "/akademik/ranking/:id",
  "/akademik/ranking/:id/edit",
  "/akademik/ranking/create",
  "/akademik/rapor",
  "/akademik/rapor/:id",
  "/akademik/rapor/:id/edit",
  "/akademik/rapor/create",
  "/akademik/soals",
  "/akademik/soals/:id",
  "/akademik/soals/:id/edit",
  "/akademik/soals/create",
  "/akademik/tes-minat-bakat",
  "/akademik/tes-minat-bakat/aspek",
  "/akademik/tes-minat-bakat/aspek/:id",
  "/akademik/tes-minat-bakat/aspek/:id/edit",
  "/akademik/tes-minat-bakat/aspek/create",
  "/akademik/tes-minat-bakat/dashboard",
  "/akademik/tes-minat-bakat/hasil",
  "/akademik/tes-minat-bakat/hasil/:id",
  "/akademik/tes-minat-bakat/jawaban",
  "/akademik/tes-minat-bakat/jawaban/:id",
  "/akademik/tes-minat-bakat/jawaban/:id/edit",
  "/akademik/tes-minat-bakat/jawaban/create",
  "/akademik/tes-minat-bakat/pertanyaan",
  "/akademik/tes-minat-bakat/pertanyaan/:id",
  "/akademik/tes-minat-bakat/pertanyaan/:id/edit",
  "/akademik/tes-minat-bakat/pertanyaan/create",
  "/akademik/tes-minat-bakat/peserta",
  "/akademik/tes-minat-bakat/peserta/:id",
  "/akademik/tes-minat-bakat/peserta/:id/edit",
  "/akademik/tes-minat-bakat/peserta/create",
  "/akademik/tes-minat-bakat/tes",
  "/akademik/tes-minat-bakat/tes/:id",
  "/akademik/tes-minat-bakat/tes/:id/edit",
  "/akademik/tes-minat-bakat/tes/create",
  "/akademik/tugas",
  "/akademik/tugas-siswa",
  "/akademik/tugas-siswa/:id",
  "/akademik/tugas-siswa/:id/edit",
  "/akademik/tugas-siswa/create",
  "/akademik/tugas/:id",
  "/akademik/tugas/:id/edit",
  "/akademik/tugas/create",
  "/akademik/ujian",
  "/akademik/ujian-jawaban",
  "/akademik/ujian-jawaban/:id",
  "/akademik/ujian-jawaban/:id/edit",
  "/akademik/ujian-user",
  "/akademik/ujian-user/:id",
  "/akademik/ujian-user/:id/edit",
  "/akademik/ujian-user/:id/mulai",
  "/akademik/ujian-user/create",
  "/akademik/ujian/:id",
  "/akademik/ujian/:id/edit",
  "/akademik/ujian/:id/nilai",
  "/akademik/ujian/create",
  "/analytics",
  "/bk",
  "/bk/hasil",
  "/bk/hasil/:id",
  "/bk/hasil/:id/edit",
  "/bk/hasil/create",
  "/bk/jenis",
  "/bk/jenis/:id",
  "/bk/jenis/:id/edit",
  "/bk/jenis/create",
  "/bk/kasus",
  "/bk/kasus/:id",
  "/bk/kasus/:id/edit",
  "/bk/kasus/create",
  "/bk/kategori",
  "/bk/kategori/:id",
  "/bk/kategori/:id/edit",
  "/bk/kategori/create",
  "/bk/lampiran",
  "/bk/lampiran/:id",
  "/bk/lampiran/create",
  "/bk/sesi",
  "/bk/sesi/:id",
  "/bk/sesi/:id/edit",
  "/bk/sesi/create",
  "/bk/tindakan",
  "/bk/tindakan/:id",
  "/bk/tindakan/:id/edit",
  "/bk/tindakan/create",
  "/bk/wali",
  "/bk/wali/:id",
  "/bk/wali/:id/edit",
  "/bk/wali/create",
  "/dashboard",
  "/data-grid",
  "/ekstrakurikuler",
  "/ekstrakurikuler/:id",
  "/ekstrakurikuler/:id/edit",
  "/ekstrakurikuler/create",
  "/ekstrakurikuler/pendaftaran",
  "/ekstrakurikuler/pendaftaran/:id",
  "/ekstrakurikuler/pendaftaran/:id/edit",
  "/ekstrakurikuler/pendaftaran/create",
  "/ews",
  "/ews/:id",
  "/files",
  "/guru",
  "/guru-mapel",
  "/guru-mapel/:id",
  "/guru-mapel/:id/edit",
  "/guru-mapel/create",
  "/guru/:id",
  "/guru/:id/edit",
  "/guru/create",
  "/jadwal-pelajaran",
  "/jadwal-pelajaran/:id",
  "/jadwal-pelajaran/:id/edit",
  "/jadwal-pelajaran/create",
  "/kelas",
  "/kelas/:id",
  "/kelas/:id/edit",
  "/kelas/create",
  "/keuangan/pembayaran-spp",
  "/keuangan/pembayaran-spp/:id",
  "/keuangan/pembayaran-spp/:id/edit",
  "/keuangan/pembayaran-spp/create",
  "/keuangan/pembayaran-spp/laporan-periode",
  "/keuangan/pembayaran-spp/tunggakan",
  "/keuangan/tarif-spp",
  "/keuangan/tarif-spp/:id",
  "/keuangan/tarif-spp/:id/edit",
  "/keuangan/tarif-spp/create",
  "/laporan",
  "/mapel",
  "/mapel/:id",
  "/mapel/:id/edit",
  "/mapel/create",
  "/marketing/email",
  "/notifikasi",
  "/organisasi",
  "/organisasi/:id",
  "/organisasi/:id/edit",
  "/organisasi/anggota",
  "/organisasi/anggota/:id",
  "/organisasi/anggota/:id/edit",
  "/organisasi/anggota/create",
  "/organisasi/create",
  "/organisasi/jabatan",
  "/organisasi/jabatan/:id",
  "/organisasi/jabatan/:id/edit",
  "/organisasi/jabatan/create",
  "/perpustakaan",
  "/perpustakaan/buku",
  "/perpustakaan/buku/:id",
  "/perpustakaan/buku/:id/edit",
  "/perpustakaan/buku/create",
  "/perpustakaan/peminjaman",
  "/perpustakaan/peminjaman/:id",
  "/perpustakaan/peminjaman/:id/edit",
  "/perpustakaan/peminjaman/create",
  "/ppdb",
  "/ppdb/dokumen",
  "/ppdb/dokumen/:id",
  "/ppdb/dokumen/:id/edit",
  "/ppdb/dokumen/create",
  "/ppdb/gelombang",
  "/ppdb/gelombang/:gelombangId/hasil-seleksi",
  "/ppdb/gelombang/:gelombangId/kriteria",
  "/ppdb/gelombang/:gelombangId/kriteria/:kriteriaId/edit",
  "/ppdb/gelombang/:gelombangId/kriteria/create",
  "/ppdb/gelombang/:gelombangId/kuota",
  "/ppdb/gelombang/:gelombangId/kuota/:kuotaId/edit",
  "/ppdb/gelombang/:gelombangId/kuota/create",
  "/ppdb/gelombang/:gelombangId/seleksi",
  "/ppdb/gelombang/:id",
  "/ppdb/gelombang/:id/edit",
  "/ppdb/gelombang/create",
  "/ppdb/nilai-rapor",
  "/ppdb/nilai-rapor/:id/edit",
  "/ppdb/nilai-rapor/bulk",
  "/ppdb/nilai-rapor/create",
  "/ppdb/pendaftar",
  "/ppdb/pendaftar/:id",
  "/ppdb/pendaftar/:id/edit",
  "/ppdb/pendaftar/create",
  "/ppdb/pendaftaran",
  "/ppdb/pendaftaran/:id",
  "/ppdb/pendaftaran/:id/edit",
  "/ppdb/pendaftaran/create",
  "/sekolah",
  "/sekolah/edit",
  "/settings",
  "/siswa",
  "/siswa/:id",
  "/siswa/:id/edit",
  "/siswa/:id/insight",
  "/siswa/create",
  "/spk",
  "/spk/hasil",
  "/spk/hasil/:id",
  "/spk/kriteria",
  "/spk/kriteria/:id",
  "/spk/kriteria/:id/edit",
  "/spk/kriteria/create",
  "/spk/penilaian",
  "/spk/penilaian/:id",
  "/spk/penilaian/:id/edit",
  "/spk/penilaian/create",
  "/statistik",
  "/statistik/akademik",
  "/statistik/bk",
  "/statistik/ekstrakurikuler",
  "/statistik/guru",
  "/statistik/kehadiran",
  "/statistik/keuangan",
  "/statistik/organisasi",
  "/statistik/overview",
  "/statistik/perpustakaan",
  "/statistik/ppdb",
  "/statistik/spk",
  "/statistik/ujian",
  "/waha",
  "/waha/send",
  "/waha/session",
  "/wali",
  "/wali/:id",
  "/wali/:id/edit",
  "/wali/create",
  "/whatsapp",
  "/whatsapp/*",
  "/whatsapp/send",
  "/whatsapp/session"
]

describe('route access', () => {
  it('maps protected routes per action correctly', () => {
    expect(permissionForPath('/dashboard')).toBe('dashboard.view')
    expect(permissionForPath('/admin/users')).toBe('users.view')
    expect(permissionForPath('/admin/users/42')).toBe('users.view')
    expect(permissionForPath('/admin/users/create')).toBe('users.create')
    expect(permissionForPath('/admin/users/42/edit')).toBe('users.update')
  })

  it('enforces specific action permissions instead of broad list access', () => {
    const viewerOnly = { permissions: [{ code: 'users.view' }] }
    const creatorOnly = { permissions: [{ code: 'users.create' }] }
    const updaterOnly = { permissions: [{ code: 'users.update' }] }

    // List & detail
    expect(canAccessPath(viewerOnly, '/admin/users')).toBe(true)
    expect(canAccessPath(viewerOnly, '/admin/users/42')).toBe(true)
    expect(canAccessPath(viewerOnly, '/admin/users/create')).toBe(false)
    expect(canAccessPath(viewerOnly, '/admin/users/42/edit')).toBe(false)

    // Create action
    expect(canAccessPath(creatorOnly, '/admin/users/create')).toBe(true)
    expect(canAccessPath(creatorOnly, '/admin/users')).toBe(false)
    expect(canAccessPath(creatorOnly, '/admin/users/42')).toBe(false)
    expect(canAccessPath(creatorOnly, '/admin/users/42/edit')).toBe(false)

    // Update action
    expect(canAccessPath(updaterOnly, '/admin/users/42/edit')).toBe(true)
    expect(canAccessPath(updaterOnly, '/admin/users')).toBe(false)
    expect(canAccessPath(updaterOnly, '/admin/users/create')).toBe(false)
  })

  it('allows access for SUPER_ADMIN regardless of individual permissions', () => {
    const superAdmin = { role: 'SUPER_ADMIN' }
    expect(canAccessPath(superAdmin, '/admin/users/create')).toBe(true)
    expect(canAccessPath(superAdmin, '/admin/users/42/edit')).toBe(true)
  })

  it('denies direct routes without permission in fail-closed mode', () => {
    expect(canAccessPath({ permissions: [{ code: 'siswa.view' }] }, '/admin/users')).toBe(false)
    expect(canAccessPath({ permissions: [{ code: 'users.view' }] }, '/admin/users')).toBe(true)
    expect(canAccessPath({ role: 'admin' }, '/admin/users')).toBe(false)
    expect(canAccessPath(null, '/admin/users')).toBe(false)
    expect(canAccessPath(undefined, '/admin/users')).toBe(false)
  })

  it('allows allowlisted authenticated routes like /notifikasi for any authenticated user', () => {
    expect(canAccessPath({ id: 1 }, '/notifikasi')).toBe(true)
    expect(canAccessPath(null, '/notifikasi')).toBe(false)
  })

  it('denies access to unmapped protected routes', () => {
    expect(canAccessPath({ permissions: [{ code: 'users.view' }] }, '/unknown-secret-route')).toBe(false)
  })

  it('verifies that every single protected route in App.jsx resolves to a valid permission', () => {
    ALL_PROTECTED_LEAF_ROUTES.forEach((route) => {
      const concretePath = route
        .replace(/:gelombangId/g, '1')
        .replace(/:kriteriaId/g, '2')
        .replace(/:kuotaId/g, '3')
        .replace(/:id/g, '42')

      if (['/notifikasi', '/analytics', '/data-grid', '/settings'].includes(route)) {
        return
      }

      const permission = permissionForPath(concretePath)
      expect(permission, `Route ${route} (concrete: ${concretePath}) should resolve to a permission`).toBeDefined()
      expect(typeof permission).toBe('string')
    })
  })

  it('marks routes without active backend APIs as unavailable', () => {
    expect(isBackendAvailablePath('/dashboard')).toBe(true)
    expect(isBackendAvailablePath('/akademik/ujian/1')).toBe(false)
    expect(isBackendAvailablePath('/akademik/nilai')).toBe(true)
  })
})
