#!/usr/bin/env python3
"""Check which list files have can() injected in the wrong scope (inside ActionsMenu instead of main component)."""
from pathlib import Path

FEATURES_DIR = Path('/Users/bodo/www/sekolah_fe/src/features')

bad = []
ok = []

for file_path in sorted(FEATURES_DIR.rglob('*List.jsx')):
    content = file_path.read_text()
    if 'usePermission' not in content:
        continue
    lines = content.splitlines()
    actions_menu_start = -1
    main_component_start = -1
    can_line = -1

    for i, line in enumerate(lines):
        stripped = line.strip()
        if 'const ActionsMenu' in stripped and actions_menu_start == -1:
            actions_menu_start = i
        if can_line == -1 and "const { can } = usePermission()" in stripped:
            can_line = i
        # Main component: const XxxList = () => { or const XxxList = memo(
        if ('List' in stripped or 'Page' in stripped) and 'const ' in stripped and '= () =>' in stripped:
            if i > max(actions_menu_start, 0):
                main_component_start = i
                break

    if main_component_start > 0 and can_line >= 0:
        if can_line < main_component_start:
            bad.append(f"  [BAD] {file_path.name}: can at L{can_line+1}, main_component at L{main_component_start+1}")
        else:
            ok.append(f"  [OK ] {file_path.name}: can at L{can_line+1}, main_component at L{main_component_start+1}")
    elif can_line >= 0:
        bad.append(f"  [???] {file_path.name}: can at L{can_line+1}, couldn't find main component (actions_menu_start={actions_menu_start})")

for item in ok:
    print(item)
for item in bad:
    print(item)
print(f"\nBad: {len(bad)}, OK: {len(ok)}")
