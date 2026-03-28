#!/usr/bin/env python3
"""Fix {perm} literal placeholder in detail pages."""
from pathlib import Path

FEATURES_DIR = Path('/Users/bodo/www/sekolah_fe/src/features')

DETAIL_PERMISSIONS = {
    'absensi-guru/pages/AbsensiGuruDetail.jsx':              'absensi-guru',
    'absensi-siswa/pages/AbsensiSiswaDetail.jsx':            'absensi-siswa',
    'bk/pages/BkHasilDetail.jsx':                            'bk-hasil',
    'bk/pages/BkJenisDetail.jsx':                            'bk-jenis',
    'bk/pages/BkKasusDetail.jsx':                            'bk-kasus',
    'bk/pages/BkKategoriDetail.jsx':                         'bk-kategori',
    'bk/pages/BkLampiranDetail.jsx':                         'bk-lampiran',
    'bk/pages/BkSesiDetail.jsx':                             'bk-sesi',
    'bk/pages/BkTindakanDetail.jsx':                         'bk-tindakan',
    'bk/pages/BkWaliDetail.jsx':                             'bk-wali',
    'ekstrakurikuler/pages/EksSiswaDetail.jsx':              'ekstrakurikuler.pendaftaran',
    'ekstrakurikuler/pages/EkstrakurikulerDetail.jsx':       'ekstrakurikuler',
    'ews/pages/EwsDetail.jsx':                               'ews',
    'forum/pages/ForumDetail.jsx':                           'forum',
    'guru/pages/GuruDetail.jsx':                             'guru',
    'jadwal-pelajaran/pages/JadwalPelajaranDetail.jsx':      'jadwal-pelajaran',
    'kelas/pages/KelasDetail.jsx':                           'kelas',
    'mapel/pages/MapelDetail.jsx':                           'mapel',
    'materi/pages/MateriDetail.jsx':                         'materi',
    'menus/pages/MenuDetail.jsx':                            'menus',
    'nilai/pages/NilaiDetail.jsx':                           'nilai',
    'organisasi/pages/AnggotaDetail.jsx':                    'organisasi.anggota',
    'organisasi/pages/OrganisasiDetail.jsx':                 'organisasi',
    'perpustakaan/pages/BukuDetail.jsx':                     'buku',
    'perpustakaan/pages/PeminjamanDetail.jsx':               'peminjaman',
    'ppdb/pages/DokumenDetail.jsx':                          'ppdb.dokumen',
    'ppdb/pages/GelombangDetail.jsx':                        'ppdb.gelombang',
    'ppdb/pages/PendaftarDetail.jsx':                        'ppdb.pendaftaran',
    'presensi/pages/PresensiDetail.jsx':                     'presensi',
    'ranking/pages/RankingDetail.jsx':                       'ranking',
    'rapor/pages/RaporDetail.jsx':                           'rapor',
    'references/pages/ReferenceDetail.jsx':                  'sys-reference',
    'roles/pages/PermissionsDetail.jsx':                     'permissions',
    'roles/pages/RolesDetail.jsx':                           'roles',
    'sekolah/pages/SekolahDetail.jsx':                       'sekolah',
    'semester/pages/SemesterDetail.jsx':                     'semester',
    'siswa/pages/SiswaDetail.jsx':                           'siswa',
    'soal/pages/SoalDetail.jsx':                             'soals',
    'spk/pages/HasilDetail.jsx':                             'spk-hasil',
    'spk/pages/KriteriaDetail.jsx':                          'spk-kriteria',
    'spk/pages/PenilaianDetail.jsx':                         'spk-penilaian',
    'spp/pages/PembayaranSppDetail.jsx':                     'pembayaran-spp',
    'spp/pages/TarifSppDetail.jsx':                          'tarif-spp',
    'tahun-ajaran/pages/TahunAjaranDetail.jsx':              'tahun-ajaran',
    'tugas/pages/TugasDetail.jsx':                           'tugas',
    'tugas/pages/TugasSiswaDetail.jsx':                      'tugas-siswa',
    'ujian-jawaban/pages/UjianJawabanDetail.jsx':            'ujian-jawaban',
    'ujian-user/pages/UjianUserDetail.jsx':                  'ujian-user',
    'ujian/pages/UjianDetail.jsx':                           'ujian',
    'users/pages/UsersDetail.jsx':                           'users',
    'wali/pages/WaliDetail.jsx':                             'wali',
}

fixed = 0
for rel_path, perm in DETAIL_PERMISSIONS.items():
    file_path = FEATURES_DIR / rel_path
    if not file_path.exists():
        print(f'  [MISS] {rel_path}')
        continue
    content = file_path.read_text()
    if "'{perm}." not in content:
        continue
    new_content = content.replace("'{perm}.update'", f"'{perm}.update'")
    new_content = new_content.replace("'{perm}.delete'", f"'{perm}.delete'")
    file_path.write_text(new_content)
    print(f'  [FIXED] {file_path.name}  ({perm})')
    fixed += 1

print(f'\nTotal fixed: {fixed}')
