import { describe, it, expect } from 'vitest'
import { formatJenisLabel, formatUjianOptionLabel } from '../../ujian/utils/ujianFormatters'

describe('formatJenisLabel', () => {
  it('formats raw numeric jenis into human readable text', () => {
    expect(formatJenisLabel(1, { short: true })).toBe('Harian')
    expect(formatJenisLabel(2, { short: true })).toBe('PTS')
    expect(formatJenisLabel(2)).toBe('Penilaian Tengah Semester')
    expect(formatJenisLabel(3, { short: true })).toBe('UAS')
    expect(formatJenisLabel(4, { short: true })).toBe('Try Out')
    expect(formatJenisLabel(5, { short: true })).toBe('Ujian Sekolah')
  })

  it('formats raw string numeric jenis', () => {
    expect(formatJenisLabel('2', { short: true })).toBe('PTS')
    expect(formatJenisLabel('2')).toBe('Penilaian Tengah Semester')
  })
})

describe('formatUjianOptionLabel', () => {
  it('formats label with nama when present', () => {
    const ujian = {
      nama: 'ASESMEN TENGAH SEMESTER',
      mapel: { nama: 'PRAKARYA DAN KEWIRAUSAHAAN' },
      jenis: 2,
      semester: 'Semester Ganjil'
    }
    expect(formatUjianOptionLabel(ujian)).toBe('ASESMEN TENGAH SEMESTER - PRAKARYA DAN KEWIRAUSAHAAN - PTS - Semester Ganjil')
  })

  it('formats label without nama cleanly', () => {
    const ujian = {
      mapel: { nama: 'MATEMATIKA' },
      jenis: 1,
      semester: 'Semester Genap'
    }
    expect(formatUjianOptionLabel(ujian)).toBe('MATEMATIKA - Harian - Semester Genap')
  })
})
