#!/usr/bin/env python3
"""Add canEdit/canDelete props to shared ActionsMenu calls in BK and Ekstrakurikuler list files."""
import re
from pathlib import Path

FEATURES_DIR = Path('/Users/bodo/www/sekolah_fe/src/features')

# Files using shared ActionsMenu that need canEdit/canDelete props
FILES = {
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
    'tes-minat-bakat/components/TesMinatBakatListPage.jsx':  'tes-minat-bakat',
}

def fix_actions_menu_call(content, perm):
    """Add canEdit and canDelete props to <ActionsMenu ... /> calls."""
    def replacer(m):
        tag = m.group(0)
        if 'canEdit' in tag or 'canDelete' in tag:
            return tag
        # Insert before closing />
        insert = f'\n              canEdit={{can(\'{perm}.update\')}}\n              canDelete={{can(\'{perm}.delete\')}}'
        tag = re.sub(r'(\s*/>\s*)$', insert + r'\n            />', tag.rstrip())
        return tag

    pattern = re.compile(r'<ActionsMenu\b.*?/>', re.DOTALL)
    return pattern.sub(replacer, content)


fixed = 0
for rel_path, perm in FILES.items():
    file_path = FEATURES_DIR / rel_path
    if not file_path.exists():
        print(f'  [MISS] {rel_path}')
        continue
    content = file_path.read_text()
    if f"canEdit={{can('{perm}.update')}}" in content:
        print(f'  [SKIP] {file_path.name}')
        continue
    new_content = fix_actions_menu_call(content, perm)
    if new_content != content:
        file_path.write_text(new_content)
        print(f'  [FIXED] {file_path.name} ({perm})')
        fixed += 1
    else:
        print(f'  [NOOP] {file_path.name}')

print(f'\nFixed: {fixed}')
