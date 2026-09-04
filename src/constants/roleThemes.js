/**
 * Role-based sidebar theme definitions.
 * Each role gets a unique visual identity via CSS custom properties
 * applied to the sidebar element. Properties cascade to all children.
 */

export const ROLE_THEMES = {
  // ── Administrative authority ──────────────────────────────────────────────
  SUPER_ADMIN: {
    label: 'Super Admin',
    vars: {
      '--sb-from':         '#0f172a',
      '--sb-to':           '#1e1b4b',
      '--sb-border':       'rgba(99,102,241,0.30)',
      '--sb-text':         '#c7d2fe',
      '--sb-text-muted':   '#818cf8',
      '--sb-hover':        'rgba(99,102,241,0.20)',
      '--sb-active':       'rgba(99,102,241,0.50)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#4338ca',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(99,102,241,0.30)',
      '--sb-accent':       '#818cf8',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  SUPERADMIN: {
    label: 'Super Admin',
    vars: {
      '--sb-from':         '#0f172a',
      '--sb-to':           '#1e1b4b',
      '--sb-border':       'rgba(99,102,241,0.30)',
      '--sb-text':         '#c7d2fe',
      '--sb-text-muted':   '#818cf8',
      '--sb-hover':        'rgba(99,102,241,0.20)',
      '--sb-active':       'rgba(99,102,241,0.50)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#4338ca',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(99,102,241,0.30)',
      '--sb-accent':       '#818cf8',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  ADMIN_SEKOLAH: {
    label: 'Admin Sekolah',
    vars: {
      '--sb-from':         '#0f172a',
      '--sb-to':           '#1e1b4b',
      '--sb-border':       'rgba(99,102,241,0.30)',
      '--sb-text':         '#c7d2fe',
      '--sb-text-muted':   '#818cf8',
      '--sb-hover':        'rgba(99,102,241,0.20)',
      '--sb-active':       'rgba(99,102,241,0.50)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#4338ca',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(99,102,241,0.30)',
      '--sb-accent':       '#818cf8',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── School principal – leadership presence ───────────────────────────────
  KEPALA_SEKOLAH: {
    label: 'Kepala Sekolah',
    vars: {
      '--sb-from':         '#0c1322',
      '--sb-to':           '#1a1503',
      '--sb-border':       'rgba(245,158,11,0.30)',
      '--sb-text':         '#fef3c7',
      '--sb-text-muted':   '#fbbf24',
      '--sb-hover':        'rgba(245,158,11,0.18)',
      '--sb-active':       'rgba(245,158,11,0.42)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#d97706',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(245,158,11,0.30)',
      '--sb-accent':       '#f59e0b',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Vice principal – collaborative professional ───────────────────────────
  WAKIL_KEPALA_SEKOLAH: {
    label: 'Wakil Kepala',
    vars: {
      '--sb-from':         '#0f1f2e',
      '--sb-to':           '#0d2337',
      '--sb-border':       'rgba(20,184,166,0.30)',
      '--sb-text':         '#99f6e4',
      '--sb-text-muted':   '#5eead4',
      '--sb-hover':        'rgba(20,184,166,0.18)',
      '--sb-active':       'rgba(20,184,166,0.42)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#0d9488',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(20,184,166,0.30)',
      '--sb-accent':       '#14b8a6',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Teacher – academic growth ─────────────────────────────────────────────
  GURU: {
    label: 'Guru',
    vars: {
      '--sb-from':         '#052e16',
      '--sb-to':           '#14532d',
      '--sb-border':       'rgba(74,222,128,0.25)',
      '--sb-text':         '#bbf7d0',
      '--sb-text-muted':   '#86efac',
      '--sb-hover':        'rgba(74,222,128,0.18)',
      '--sb-active':       'rgba(74,222,128,0.40)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#16a34a',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(74,222,128,0.25)',
      '--sb-accent':       '#4ade80',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Homeroom teacher – caring & organized ────────────────────────────────
  WALI_KELAS: {
    label: 'Wali Kelas',
    vars: {
      '--sb-from':         '#0c1a2e',
      '--sb-to':           '#0c2340',
      '--sb-border':       'rgba(56,189,248,0.30)',
      '--sb-text':         '#bae6fd',
      '--sb-text-muted':   '#7dd3fc',
      '--sb-hover':        'rgba(56,189,248,0.18)',
      '--sb-active':       'rgba(56,189,248,0.42)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#0284c7',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(56,189,248,0.30)',
      '--sb-accent':       '#38bdf8',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Counseling teacher – empathetic calm ─────────────────────────────────
  GURU_BK: {
    label: 'Guru BK',
    vars: {
      '--sb-from':         '#1a0533',
      '--sb-to':           '#2e1065',
      '--sb-border':       'rgba(167,139,250,0.30)',
      '--sb-text':         '#e9d5ff',
      '--sb-text-muted':   '#c4b5fd',
      '--sb-hover':        'rgba(167,139,250,0.18)',
      '--sb-active':       'rgba(167,139,250,0.42)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#7c3aed',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(167,139,250,0.30)',
      '--sb-accent':       '#a78bfa',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Finance staff – trusted & stable ─────────────────────────────────────
  STAFF_KEUANGAN: {
    label: 'Staff Keuangan',
    vars: {
      '--sb-from':         '#052e16',
      '--sb-to':           '#0d3321',
      '--sb-border':       'rgba(52,211,153,0.30)',
      '--sb-text':         '#a7f3d0',
      '--sb-text-muted':   '#6ee7b7',
      '--sb-hover':        'rgba(52,211,153,0.18)',
      '--sb-active':       'rgba(52,211,153,0.40)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#059669',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(52,211,153,0.30)',
      '--sb-accent':       '#34d399',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Library staff – scholarly warmth ─────────────────────────────────────
  STAFF_PERPUSTAKAAN: {
    label: 'Staff Perpustakaan',
    vars: {
      '--sb-from':         '#1c0f05',
      '--sb-to':           '#2d1b0e',
      '--sb-border':       'rgba(251,191,36,0.30)',
      '--sb-text':         '#fef3c7',
      '--sb-text-muted':   '#fcd34d',
      '--sb-hover':        'rgba(251,191,36,0.18)',
      '--sb-active':       'rgba(251,191,36,0.40)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#b45309',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(251,191,36,0.30)',
      '--sb-accent':       '#fbbf24',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Admission admin – dynamic & modern ───────────────────────────────────
  ADMIN_PPDB: {
    label: 'Admin PPDB',
    vars: {
      '--sb-from':         '#1a0533',
      '--sb-to':           '#2d1b69',
      '--sb-border':       'rgba(232,121,249,0.30)',
      '--sb-text':         '#fae8ff',
      '--sb-text-muted':   '#e879f9',
      '--sb-hover':        'rgba(232,121,249,0.18)',
      '--sb-active':       'rgba(232,121,249,0.40)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#a21caf',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(232,121,249,0.30)',
      '--sb-accent':       '#e879f9',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Parent/guardian – warm family ────────────────────────────────────────
  WALI_SISWA: {
    label: 'Wali Siswa',
    vars: {
      '--sb-from':         '#1c0505',
      '--sb-to':           '#3b0f0f',
      '--sb-border':       'rgba(251,146,60,0.30)',
      '--sb-text':         '#ffedd5',
      '--sb-text-muted':   '#fdba74',
      '--sb-hover':        'rgba(251,146,60,0.18)',
      '--sb-active':       'rgba(251,146,60,0.42)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#c2410c',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(251,146,60,0.30)',
      '--sb-accent':       '#fb923c',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },

  // ── Student – modern reference ────────────────────────────────────────────
  SISWA: {
    label: 'Siswa',
    vars: {
      '--sb-from':         '#0a0a1a',
      '--sb-to':           '#161632',
      '--sb-border':       'rgba(129,140,248,0.30)',
      '--sb-text':         '#e0e7ff',
      '--sb-text-muted':   '#a5b4fc',
      '--sb-hover':        'rgba(129,140,248,0.18)',
      '--sb-active':       'rgba(129,140,248,0.44)',
      '--sb-active-text':  '#ffffff',
      '--sb-avatar':       '#4f46e5',
      '--sb-avatar-text':  '#ffffff',
      '--sb-child-border': 'rgba(129,140,248,0.30)',
      '--sb-accent':       '#818cf8',
      '--sb-logout-hover': 'rgba(239,68,68,0.20)',
    },
  },
}

const DEFAULT_THEME = {
  label: 'Pengguna',
  vars: {
    '--sb-from':         '#111827',
    '--sb-to':           '#1f2937',
    '--sb-border':       'rgba(99,102,241,0.25)',
    '--sb-text':         '#d1d5db',
    '--sb-text-muted':   '#9ca3af',
    '--sb-hover':        'rgba(255,255,255,0.08)',
    '--sb-active':       'rgba(99,102,241,0.42)',
    '--sb-active-text':  '#ffffff',
    '--sb-avatar':       '#4b5563',
    '--sb-avatar-text':  '#ffffff',
    '--sb-child-border': 'rgba(156,163,175,0.25)',
    '--sb-accent':       '#9ca3af',
    '--sb-logout-hover': 'rgba(239,68,68,0.20)',
  },
}

/**
 * Returns the theme object for the given role string.
 * Falls back to the default theme if role is not found.
 * @param {string|undefined} role
 * @returns {{ label: string, vars: Record<string, string> }}
 */
export const getTheme = (role) => {
  const key = role?.toUpperCase?.()
  return ROLE_THEMES[key] || DEFAULT_THEME
}
