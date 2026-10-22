import { describe, it, expect } from 'vitest'
import { formatJenisLabel } from '../../ujian/utils/ujianFormatters'

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
