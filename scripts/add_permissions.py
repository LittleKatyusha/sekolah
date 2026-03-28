#!/usr/bin/env python3
"""
Batch-add usePermission checks to all feature List and Detail pages.

For List pages:
  - Adds usePermission import
  - Adds canEdit / canDelete default props to local ActionsMenu
  - Wraps Edit / Hapus items with conditional rendering
  - Injects `const { can } = usePermission()` into the main component
  - Passes canEdit/canDelete to <ActionsMenu> in columnDefs cell renderer
  - Gates the "Tambah" button

For Detail pages:
  - Adds usePermission import
  - Adds `const { can } = usePermission()` into the component
  - Gates Edit and Delete buttons
"""

import re, shutil, sys
from pathlib import Path

FEATURES_DIR = Path('/Users/bodo/www/sekolah_fe/src/features')
HOOKS_IMPORT_RE = re.compile(r'^import .+ from [\'"]react[\'"];?$', re.MULTILINE)

# ── Permission mappings ──────────────────────────────────────────────────────
# Maps relative path fragment → permission resource prefix.
# The hook automatically handles`.manage` fallback for create/update/delete.
LIST_PERMISSIONS = {
    'absensi-guru/pages/AbsensiGuruList.jsx':                'absensi-guru',
    'absensi-siswa/pages/AbsensiSiswaList.jsx':              'absensi-siswa',
    'activity-logs/pages/ActivityLogsList.jsx':              'activity-logs',
    'bk/pages/BkHasilList.jsx':                              'bk-hasil',
    'bk/pages/BkJenisList.jsx':                              'bk-jenis',
    'bk/pages/BkKasusList.jsx':                              'bk-kasus',
    'bk/pages/BkKategoriList.jsx':                           'bk-kategori',
    'bk/pages/BkLampiranList.jsx':                           'bk-lampiran',
    'bk/pages/BkSesiList.jsx':                               'bk-sesi',
    'bk/pages/BkTindakanList.jsx':                           'bk-tindakan',
    'bk/pages/BkWaliList.jsx':                               'bk-wali',
    'ekstrakurikuler/pages/EksSiswaList.jsx':                'ekstrakurikuler.pendaftaran',
    'ekstrakurikuler/pages/EkstrakurikulerList.jsx':         'ekstrakurikuler',
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
    'roles/pages/RolePermissionsList.jsx':                   'role_permissions',
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


# ── Helpers ──────────────────────────────────────────────────────────────────

def already_patched(content: str) -> bool:
    return 'usePermission' in content


def compute_hook_import_path(file_path: Path) -> str:
    """Relative import from a features/X/pages/*.jsx to hooks/usePermission."""
    # features/<feature>/pages/<file> -> ../../../hooks/usePermission
    rel = file_path.relative_to(FEATURES_DIR)
    depth = len(rel.parts) - 1  # number of dirs above the file
    return '../' * depth + 'hooks/usePermission'


def add_import(content: str, hook_path: str) -> str:
    """Insert the usePermission import after the last `from 'react'` style import."""
    import_line = f"import usePermission from '{hook_path}'\n"
    # Insert after the last import block line
    lines = content.splitlines(keepends=True)
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    if last_import_idx == -1:
        return import_line + content
    lines.insert(last_import_idx + 1, import_line)
    return ''.join(lines)


# ── List-page transformations ────────────────────────────────────────────────

_ACTIONS_PROPS_RE = re.compile(
    r'(const ActionsMenu = (?:memo\()?\(\s*\{)([^}]+?)(\}\s*\))',
    re.DOTALL
)

def patch_actions_menu_props(content: str) -> str:
    """Add canEdit=true, canDelete=true default props to ActionsMenu."""
    def replacer(m):
        props_str = m.group(2)
        # Only add if not already there
        if 'canEdit' in props_str or 'canDelete' in props_str:
            return m.group(0)
        # Remove trailing whitespace/newline from props_str and append new props
        stripped = props_str.rstrip()
        new_props = stripped + ',\n  canEdit = true,\n  canDelete = true\n'
        return m.group(1) + new_props + m.group(3)
    return _ACTIONS_PROPS_RE.sub(replacer, content, count=1)


# Pattern for Edit button inside ActionsMenu dropdown
_EDIT_BTN_RE = re.compile(
    r'(<button\s[^>]*onClick=\{[^}]*handleAction\(onEdit\)[^}]*\}[^>]*>.*?</button>)',
    re.DOTALL
)

# Pattern for the divider before delete
_DIVIDER_RE = re.compile(
    r'(\s*<div className="border-t[^"]*"[^/]*/>\s*\n)',
)

# Pattern for Delete button inside ActionsMenu
_DEL_BTN_RE = re.compile(
    r'(<button\s[^>]*onClick=\{[^}]*handleAction\(onDelete\)[^}]*\}[^>]*>.*?</button>)',
    re.DOTALL
)


def guard_edit_delete_items(content: str) -> str:
    """Wrap Edit and Delete items with {canEdit && ...} / {canDelete && ...}."""

    # Guard Edit button (only if not already guarded)
    if 'canEdit &&' not in content and 'handleAction(onEdit)' in content:
        def wrap_edit(m):
            btn = m.group(1)
            return '{canEdit && (\n              ' + btn.strip() + '\n            )}'
        content = _EDIT_BTN_RE.sub(wrap_edit, content, count=1)

    # Guard Delete button
    if 'canDelete &&' not in content and 'handleAction(onDelete)' in content:
        def wrap_delete(m):
            btn = m.group(1)
            return '{canDelete && (\n              ' + btn.strip() + '\n            )}'
        content = _DEL_BTN_RE.sub(wrap_delete, content, count=1)

    # Guard divider between Edit and Delete (only show when both are visible)
    if 'canEdit && canDelete' not in content:
        def wrap_divider(m):
            divider = m.group(1)
            return '\n            {canEdit && canDelete && (\n              ' + divider.strip() + '\n            )}\n'
        content = _DIVIDER_RE.sub(wrap_divider, content, count=1)

    return content


def inject_can_in_component(content: str, perm: str) -> str:
    """
    Inject `const { can } = usePermission()` into the main component body.
    Inserts just after the first `const navigate = useNavigate()` or
    `const [` line inside the component function, whichever comes first.
    """
    if 'const { can }' in content:
        return content

    lines = content.splitlines(keepends=True)
    # Look for the main component declaration
    component_start = -1
    for i, line in enumerate(lines):
        # Skip ActionsMenu definition area (it comes before main component)
        stripped = line.strip()
        # Heuristic: the main component starts on a line like:
        # `const GuruList = () => {`  or  `const GuruList = memo(…`
        if re.match(r'const \w+(?:List|Form|Detail|Page)?\s*=\s*(?:memo\()?', stripped):
            component_start = i
            break

    if component_start == -1:
        return content  # couldn't find, skip

    # Find a good injection point after the component starts
    inject_at = -1
    for i in range(component_start + 1, min(component_start + 30, len(lines))):
        stripped = lines[i].strip()
        if stripped.startswith('const navigate') or stripped.startswith('const gridRef') \
                or stripped.startswith('const [') or stripped.startswith('const {'):
            inject_at = i
            break

    if inject_at == -1:
        inject_at = component_start + 1

    lines.insert(inject_at, '  const { can } = usePermission()\n')
    return ''.join(lines)


def patch_actions_menu_call(content: str, perm: str) -> str:
    """Add canEdit={can('X.update')} canDelete={can('X.delete')} to <ActionsMenu calls."""

    def replacer(m):
        tag = m.group(0)
        if 'canEdit' in tag or 'canDelete' in tag:
            return tag
        # Insert before the closing /> or before onDetail=
        insert = f'\n              canEdit={{can(\'{perm}.update\')}}\n              canDelete={{can(\'{perm}.delete\')}}'
        # Place before the closing />
        tag = re.sub(r'(\s*/?>)$', insert + r'\1', tag.rstrip())
        return tag

    # Match <ActionsMenu followed by props until />
    pattern = re.compile(r'<ActionsMenu\b[^>]*/>', re.DOTALL)
    return pattern.sub(replacer, content)


def patch_tambah_button(content: str, perm: str) -> str:
    """Gate the 'Tambah' Button with can('X.create')."""
    if f"can('{perm}.create')" in content or 'can(' in content and 'Tambah' in content:
        # Already done or can check present near Tambah
        pass

    # Pattern: <Button ...onClick=...navigate...>...</Button> containing 'Tambah'
    # We need to find this and wrap it
    # Simple approach: find lines with 'Tambah' text inside a Button
    lines = content.splitlines(keepends=True)
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Detect start of a Button that will contain 'Tambah'
        if re.search(r'<Button\b', line) and not re.search(r'can\(', line):
            # Collect the entire Button element
            block = [line]
            j = i + 1
            depth = line.count('<Button') - line.count('</Button>')
            # Accumulate lines until Button closes
            while j < len(lines) and depth > 0:
                block.append(lines[j])
                depth += lines[j].count('<Button') - lines[j].count('</Button>')
                j += 1
            block_str = ''.join(block)
            if 'Tambah' in block_str and f"can('{perm}.create')" not in block_str:
                # Determine indentation of the Button
                indent = len(line) - len(line.lstrip())
                ind = ' ' * indent
                wrapped = "{ind}{can('" + perm + ".create') && (\n".replace('{ind}', ind)
                # Indent the block by 2 more spaces
                wrapped += ''.join('  ' + bl for bl in block)
                wrapped += ind + ")}\n"
                result.append(wrapped)
                i = j
                continue
        result.append(line)
        i += 1
    return ''.join(result)


def process_list_file(file_path: Path, perm: str, dry_run: bool = False):
    content = file_path.read_text()
    if already_patched(content):
        print(f'  [SKIP] {file_path.name} — already patched')
        return

    original = content
    hook_path = compute_hook_import_path(file_path)

    content = add_import(content, hook_path)
    content = patch_actions_menu_props(content)
    content = guard_edit_delete_items(content)
    content = inject_can_in_component(content, perm)
    content = patch_actions_menu_call(content, perm)
    content = patch_tambah_button(content, perm)

    if content == original:
        print(f'  [NOOP] {file_path.name}')
        return

    if dry_run:
        print(f'  [DRY ] {file_path.name}')
        return

    file_path.write_text(content)
    print(f'  [DONE] {file_path.name}')


# ── Detail-page transformations ───────────────────────────────────────────────

def inject_can_in_detail(content: str, perm: str) -> str:
    """Inject `const { can } = usePermission()` into a Detail component."""
    if 'const { can }' in content:
        return content

    lines = content.splitlines(keepends=True)
    inject_at = -1
    in_component = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Find main component declaration
        if not in_component and re.match(r'const \w+\s*=\s*(?:\(\)|memo)', stripped):
            in_component = True
        if in_component and (stripped.startswith('const { id }') or
                              stripped.startswith('const { id,') or
                              stripped.startswith('const navigate') or
                              stripped.startswith('const [loading') or
                              stripped.startswith('const [')):
            inject_at = i
            break

    if inject_at == -1:
        # Fallback: find first const/let inside component
        for i, line in enumerate(lines):
            if re.match(r'const \w+\s*=\s*', line.lstrip()):
                inject_at = i
                break

    if inject_at != -1:
        lines.insert(inject_at, '  const { can } = usePermission()\n')

    return ''.join(lines)


def gate_edit_button_detail(content: str, perm: str) -> str:
    """
    Wrap Edit button in Detail page with {can('X.update') && ...}.
    Looks for Button variant='warning' or onClick navigate edit.
    """
    if f"can('{perm}.update')" in content:
        return content

    # Pattern: standalone <Button ...> containing 'Edit' or navigate edit
    lines = content.splitlines(keepends=True)
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Detect a Button line that leads to an edit action
        if re.search(r"<Button\b", line) and not re.search(r"can\(|Kembali|Refresh", line):
            block = [line]
            j = i + 1
            # Count open tags
            depth = line.count('<Button') - line.count('</Button>')
            while j < len(lines) and depth > 0:
                block.append(lines[j])
                depth += lines[j].count('<Button') - lines[j].count('</Button>')
                j += 1
            block_str = ''.join(block)
            indent = len(line) - len(line.lstrip())
            ind = ' ' * indent

            if ("Edit" in block_str or "/edit`" in block_str) and f"can('{perm}.update')" not in block_str:
                wrapped = ind + "{can('{perm}.update') && (\n"
                wrapped += ''.join('  ' + bl for bl in block)
                wrapped += ind + ")}\n"
                result.append(wrapped)
                i = j
                continue
            elif ("Hapus" in block_str or "Delete" in block_str or "handleDelete" in block_str) and \
                 f"can('{perm}.delete')" not in block_str:
                wrapped = ind + "{can('{perm}.delete') && (\n"
                wrapped += ''.join('  ' + bl for bl in block)
                wrapped += ind + ")}\n"
                result.append(wrapped)
                i = j
                continue
        result.append(line)
        i += 1
    return ''.join(result)


def process_detail_file(file_path: Path, perm: str, dry_run: bool = False):
    content = file_path.read_text()
    if already_patched(content):
        print(f'  [SKIP] {file_path.name} — already patched')
        return

    original = content
    hook_path = compute_hook_import_path(file_path)

    content = add_import(content, hook_path)
    content = inject_can_in_detail(content, perm)
    content = gate_edit_button_detail(content, perm)

    if content == original:
        print(f'  [NOOP] {file_path.name}')
        return

    if dry_run:
        print(f'  [DRY ] {file_path.name}')
        return

    file_path.write_text(content)
    print(f'  [DONE] {file_path.name}')


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    dry_run = '--dry' in sys.argv

    print('\n=== List Pages ===')
    for rel_path, perm in LIST_PERMISSIONS.items():
        fp = FEATURES_DIR / rel_path
        if not fp.exists():
            print(f'  [MISS] {rel_path}')
            continue
        process_list_file(fp, perm, dry_run)

    print('\n=== Detail Pages ===')
    for rel_path, perm in DETAIL_PERMISSIONS.items():
        fp = FEATURES_DIR / rel_path
        if not fp.exists():
            print(f'  [MISS] {rel_path}')
            continue
        process_detail_file(fp, perm, dry_run)

    print('\nDone.')


if __name__ == '__main__':
    main()
