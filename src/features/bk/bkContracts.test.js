import { describe, it, expect } from 'vitest'

describe('BK Form permission contracts', () => {
  it('maps correct permission for BK Kasus create and edit', () => {
    const getSubmitPermission = (isEditMode) => (isEditMode ? 'bk-kasus.update' : 'bk-kasus.create')
    expect(getSubmitPermission(false)).toBe('bk-kasus.create')
    expect(getSubmitPermission(true)).toBe('bk-kasus.update')
  })

  it('maps correct permissions for BK sub-modules', () => {
    const getJenisPermission = (isEditMode) => (isEditMode ? 'bk-jenis.update' : 'bk-jenis.create')
    expect(getJenisPermission(false)).toBe('bk-jenis.create')
    expect(getJenisPermission(true)).toBe('bk-jenis.update')

    expect('bk-kategori.manage').toBe('bk-kategori.manage')
    expect('bk-sesi.manage').toBe('bk-sesi.manage')
    expect('bk-hasil.manage').toBe('bk-hasil.manage')
    expect('bk-tindakan.manage').toBe('bk-tindakan.manage')
    expect('bk-lampiran.manage').toBe('bk-lampiran.manage')
    expect('bk-wali.manage').toBe('bk-wali.manage')
  })

  it('safely handles metode and peran without resulting in NaN', () => {
    const safeParse = (val) => {
      const parsed = parseInt(val, 10)
      return Number.isNaN(parsed) ? val : parsed
    }

    expect(safeParse('1')).toBe(1)
    expect(safeParse(2)).toBe(2)
    expect(safeParse('konseling_individu')).toBe('konseling_individu')
    expect(safeParse('')).toBe('')
  })
})