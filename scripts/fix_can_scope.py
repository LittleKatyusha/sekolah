#!/usr/bin/env python3
"""
Move `const { can } = usePermission()` from inside ActionsMenu (wrong scope)
to inside the main List component (correct scope).
"""
from pathlib import Path
import re

FEATURES_DIR = Path('/Users/bodo/www/sekolah_fe/src/features')

HOOK_LINE = '  const { can } = usePermission()\n'

def fix_file(file_path: Path) -> bool:
    content = file_path.read_text()
    if 'usePermission' not in content:
        return False
    if HOOK_LINE.strip() not in content:
        return False

    lines = content.splitlines(keepends=True)

    # Find all occurrences of the hook line
    can_lines = [i for i, l in enumerate(lines) if l.strip() == 'const { can } = usePermission()']
    if not can_lines:
        return False

    # Determine which ones are inside a top-level function component
    # Strategy: track brace depth
    # - depth 0 = module level
    # - depth 1 = inside first-level function body
    # We need can to be at depth 1 inside the MAIN list component

    # Find the main list/page component
    # It comes AFTER any ActionsMenu definition
    # Pattern: `const XxxList = () => {` or `const XxxList = memo(...`
    main_component_line = -1
    # Also find 'const ActionsMenu' line to skip everything before it
    actions_menu_line = -1

    for i, line in enumerate(lines):
        stripped = line.strip()
        if 'const ActionsMenu' in stripped and actions_menu_line == -1:
            actions_menu_line = i
        # Main component: must contain List or Page in name, be a const arrow function
        if re.match(r'const \w*(?:List|Page|Form)\w*\s*=\s*(?:memo\()?(?:\(\)|\([^)]+\))\s*=>', stripped):
            if i > max(actions_menu_line, 0):
                main_component_line = i
                break

    if main_component_line == -1:
        # Try a broader search
        for i, line in enumerate(lines):
            stripped = line.strip()
            if re.match(r'const \w+\s*=\s*\(\)\s*=>\s*\{', stripped):
                if i > max(actions_menu_line, 0):
                    main_component_line = i
                    break

    if main_component_line == -1:
        print(f'  [SKIP] {file_path.name}: could not find main component')
        return False

    # Find good injection point inside main component
    # Inject after the opening brace line, after const navigate/gridRef/ref lines
    inject_at = -1
    for i in range(main_component_line + 1, min(main_component_line + 40, len(lines))):
        stripped = lines[i].strip()
        if stripped.startswith('const navigate') or stripped.startswith('const gridRef') \
                or stripped.startswith('const [') or stripped.startswith('const {') \
                or stripped.startswith('const ref'):
            inject_at = i
            break
        if stripped.startswith('const ') or stripped.startswith('return '):
            inject_at = i
            break

    if inject_at == -1:
        inject_at = main_component_line + 1

    # Check if can is already at the correct position
    already_correct = False
    if inject_at < len(lines):
        # Check if can is already nearby (within 5 lines) of the injection point
        for i in range(max(0, inject_at - 2), min(len(lines), inject_at + 5)):
            if lines[i].strip() == 'const { can } = usePermission()':
                if i >= main_component_line:
                    already_correct = True
                    break

    if already_correct:
        # Check if there's also one in the wrong place
        wrong_can = [i for i in can_lines if i < main_component_line]
        if not wrong_can:
            return False

    # Remove all existing can hook lines
    new_lines = [l for l in lines if l.strip() != 'const { can } = usePermission()']

    # Recompute injection point after removal
    # Find main component again in new_lines
    main_component_line2 = -1
    actions_menu_line2 = -1
    for i, line in enumerate(new_lines):
        stripped = line.strip()
        if 'const ActionsMenu' in stripped and actions_menu_line2 == -1:
            actions_menu_line2 = i
        if re.match(r'const \w*(?:List|Page|Form)\w*\s*=\s*(?:memo\()?(?:\(\)|\([^)]+\))\s*=>', stripped):
            if i > max(actions_menu_line2, 0):
                main_component_line2 = i
                break

    if main_component_line2 == -1:
        for i, line in enumerate(new_lines):
            stripped = line.strip()
            if re.match(r'const \w+\s*=\s*\(\)\s*=>\s*\{', stripped):
                if i > max(actions_menu_line2, 0):
                    main_component_line2 = i
                    break

    if main_component_line2 == -1:
        print(f'  [SKIP] {file_path.name}: could not re-find main component after removal')
        return False

    inject_at2 = -1
    for i in range(main_component_line2 + 1, min(main_component_line2 + 40, len(new_lines))):
        stripped = new_lines[i].strip()
        if stripped.startswith('const navigate') or stripped.startswith('const gridRef') \
                or stripped.startswith('const [') or stripped.startswith('const ref'):
            inject_at2 = i
            break
        if stripped.startswith('const ') or stripped.startswith('return '):
            inject_at2 = i
            break

    if inject_at2 == -1:
        inject_at2 = main_component_line2 + 1

    new_lines.insert(inject_at2, HOOK_LINE)

    file_path.write_text(''.join(new_lines))
    return True


fixed = 0
skipped = 0
for file_path in sorted(FEATURES_DIR.rglob('*List.jsx')):
    result = fix_file(file_path)
    if result:
        print(f'  [FIXED] {file_path.name}')
        fixed += 1
    elif 'usePermission' in file_path.read_text():
        pass  # already correct or skipped
    
print(f'\nFixed: {fixed}')
