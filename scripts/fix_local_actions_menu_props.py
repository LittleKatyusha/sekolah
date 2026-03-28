#!/usr/bin/env python3
"""Add canEdit={can(X.update)} canDelete={can(X.delete)} to local ActionsMenu calls in List pages."""
import re
from pathlib import Path

FEATURES_DIR = Path('/Users/bodo/www/sekolah_fe/src/features')

LIST_PERMISSIONS = {
    'absensi-guru/pages/AbsensiGuruList.jsx':                'absensi-guru',
    'absensi-siswa/pages/AbsensiSiswaList.jsx':              'absensi-siswa',
    'activity-logs/pages/ActivityLogsList.jsx':              'activity-logs',
    'ews/pages/EwsList.jsx':                                 'ews',
    'forum/pages/ForumList.jsx':                             'forum',
    'guru/pages/GuruList.jsx':                               'guru',
    'hari-operasional/pages/HariOperasionalList.jsx':        'hari-operasional',
    'jadwal-pelajaran/pages/JadwalPelajaranList.jsx':        'jadwal-pelajaran',
    'kalender-akademik/pages/KalenderAkademikList.jsx':      'kalender-akademik',
    'kalender-harian/pages/KalenderHarianList.jsx':          'kalender-harian',
    'kalender-tipe/pages/KalenderTipeList.jsx':              'kalender-tipe',
    'kelas/pages/KelasList.jsx':                             'kelas',
    'log-akses-materi/pages/LogAksesMateriList.jsx':         'log-akses-materi',
    'mapel/pages/MapelList.jsx':                             'mapel',
    'materi/pages/MateriList.jsx':                           'materi',
    'menus/pages/MenuList.jsx':                              'menus',
    'nilai/pages/NilaiList.jsx':                             'nilai',
    'organisasi/pages/AnggotaList.jsx':                      'organisasi.anggota',
    'organisasi/pages/OrganisasiList.jsx':                   'organisasi',
    'perpustakaan/pages/BukuList.jsx':                       'buku',
    'perpustakaan/pages/PeminjamanList.jsx':                 'peminjaman',
    'ppdb/pages/DokumenList.jsx':                            'ppdb.dokumen',
    'ppdb/pages/GelombangList.jsx':                          'ppdb.gelombang',
    'ppdb/pages/PendaftarList.jsx':                          'ppdb.pendaftaran',
    'presensi/pages/PresensiList.jsx':                       'presensi',
    'ranking/pages/RankingList.jsx':                         'ranking',
    'rapor/pages/RaporList.jsx':                             'rapor',
    'references/pages/ReferenceList.jsx':                    'sys-reference',
    'roles/pages/PermissionsList.jsx':                       'permissions',
    'roles/pages/RolesList.jsx':                             'roles',
    'semester/pages/SemesterList.jsx':                       'semester',
    'siswa/pages/SiswaList.jsx':                             'siswa',
    'soal/pages/SoalList.jsx':                               'soals',
    'spk/pages/HasilList.jsx':                               'spk-hasil',
    'spk/pages/KriteriaList.jsx':                            'spk-kriteria',
    'spk/pages/PenilaianList.jsx':                           'spk-penilaian',
    'spp/pages/PembayaranSppList.jsx':                       'pembayaran-spp',
    'spp/pages/TarifSppList.jsx':                            'tarif-spp',
    'tahun-ajaran/pages/TahunAjaranList.jsx':                'tahun-ajaran',
    'tugas/pages/TugasList.jsx':                             'tugas',
    'tugas/pages/TugasSiswaList.jsx':                        'tugas-siswa',
    'ujian-jawaban/pages/UjianJawabanList.jsx':              'ujian-jawaban',
    'ujian-user/pages/UjianUserList.jsx':                    'ujian-user',
    'ujian/pages/UjianList.jsx':                             'ujian',
    'users/pages/UsersList.jsx':                             'users',
    'wali/pages/WaliList.jsx':                               'wali',
}


def add_can_props_to_actions_menu_calls(content, perm):
    """
    In lines with <ActionsMenu that are CALL SITES (not definition),
    add canEdit/canDelete props if they're missing.
    Only acts on the ActionsMenu inside the columnDefs cellRenderer, 
    which is after the 'const ActionsMenu = ' definition.
    """
    lines = content.splitlines(keepends=True)
    
    # Find where the main component (List) starts
    component_start = -1
    for i, line in enumerate(lines):
        stripped = line.strip()
        if re.match(r'const \w*(?:List|Page)\w*\s*=\s*(?:\(\)|memo)', stripped):
            component_start = i
            break
    
    if component_start == -1:
        return content, False

    # In lines AFTER the component start, find '<ActionsMenu' call sites
    # and add canEdit/canDelete props
    result = []
    i = 0
    changed = False

    while i < len(lines):
        line = lines[i]
        # Only process ActionsMenu CALL SITES (after component_start, not the definition)
        if i > component_start and '<ActionsMenu' in line.strip() and not re.search(r'=\s*(?:memo\()?', line):
            # Collect the multi-line ActionsMenu tag
            block_start = i
            block = [line]
            # Check if it's self-closing on multiple lines
            if '/>' not in line:
                j = i + 1
                while j < len(lines):
                    block.append(lines[j])
                    if '/>' in lines[j]:
                        j += 1
                        break
                    j += 1
                i = j
            else:
                i += 1

            block_str = ''.join(block)

            if 'canEdit' in block_str or 'canDelete' in block_str:
                result.extend(block)
                continue

            # Find the closing /> line and insert props before it
            # Get indent of the <ActionsMenu line
            first_line = block[0]
            base_indent = len(first_line) - len(first_line.lstrip())
            prop_indent = ' ' * (base_indent + 2)

            new_block = []
            for bi, bl in enumerate(block):
                if '/>' in bl and bi == len(block) - 1:
                    # Replace closing /> with props + />
                    new_block.append(prop_indent + f"canEdit={{can('{perm}.update')}}\n")
                    new_block.append(prop_indent + f"canDelete={{can('{perm}.delete')}}\n")
                    new_block.append(' ' * base_indent + '/>\n')
                else:
                    new_block.append(bl)

            result.extend(new_block)
            changed = True
            continue

        result.append(line)
        i += 1

    return ''.join(result), changed


fixed = 0
skipped = 0
for rel_path, perm in LIST_PERMISSIONS.items():
    file_path = FEATURES_DIR / rel_path
    if not file_path.exists():
        print(f'  [MISS] {rel_path}')
        continue
    content = file_path.read_text()
    # Only process files with local ActionsMenu definition
    if 'const ActionsMenu = ' not in content:
        skipped += 1
        continue
    if f"canEdit={{can('{perm}.update')}}" in content:
        print(f'  [SKIP] {file_path.name}')
        continue

    new_content, changed = add_can_props_to_actions_menu_calls(content, perm)
    if changed:
        file_path.write_text(new_content)
        print(f'  [FIXED] {file_path.name} ({perm})')
        fixed += 1
    else:
        print(f'  [NOOP] {file_path.name}')

print(f'\nFixed: {fixed}, Skipped (no local ActionsMenu): {skipped}')
