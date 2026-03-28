#!/usr/bin/env python3
"""Fix literal {ind} prefix in JSX permission wrappers."""
import re
from pathlib import Path

SRC = Path('/Users/bodo/www/sekolah_fe/src')

fixed_count = 0
for file_path in sorted(SRC.rglob('*.jsx')):
    content = file_path.read_text()
    if '{ind}' not in content:
        continue

    lines = content.splitlines(keepends=True)
    changed = False
    i = 0
    new_lines = []
    while i < len(lines):
        line = lines[i]
        # Detect literal {ind}{can('...' pattern
        if '{ind}{can(' in line:
            # Look ahead to find the closing )}
            # The closing )} should be on a line by itself (possibly with whitespace before)
            # It corresponds to the end of the conditional wrapper
            closing_indent = None
            for j in range(i + 1, min(i + 30, len(lines))):
                stripped = lines[j].rstrip('\n')
                # The closing is a line like '          )}' with nothing else
                if re.match(r'^(\s*)\)\}$', stripped):
                    closing_indent = re.match(r'^(\s*)', stripped).group(1)
                    break

            if closing_indent is not None:
                # Replace {ind} with the correct whitespace
                fixed_line = line.replace('{ind}', closing_indent, 1)
                new_lines.append(fixed_line)
                changed = True
            else:
                # Fallback: try to infer from the next line (inner content is 2 more spaces)
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    inner_match = re.match(r'^(\s+)', next_line)
                    if inner_match:
                        inner_indent = inner_match.group(1)
                        # ind = inner_indent - 2 spaces
                        ind = inner_indent[:-2] if len(inner_indent) >= 2 else ''
                        fixed_line = line.replace('{ind}', ind, 1)
                        new_lines.append(fixed_line)
                        changed = True
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
        else:
            new_lines.append(line)
        i += 1

    if changed:
        file_path.write_text(''.join(new_lines))
        print(f'  [FIXED] {file_path.relative_to(SRC)}')
        fixed_count += 1

print(f'\nTotal fixed: {fixed_count}')
