import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../utils/api', () => ({
  apiService: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}))

import { apiService } from '../utils/api'
import { absensiSiswaService } from './absensi-siswa/services/absensiSiswaService'
import { absensiGuruService } from './absensi-guru/services/absensiGuruService'
import { ewsService } from './ews/services/ewsService'
import { presensiService } from './presensi/services/presensiService'

beforeEach(() => vi.clearAllMocks())

describe('Go attendance contracts', () => {
  it('uses canonical EWS aliases and methods', async () => {
    await ewsService.getAll({ page: 2, per_page: 20 })
    await ewsService.resolve(7)
    await ewsService.trigger(9)
    expect(apiService.get).toHaveBeenCalledWith('/ews/alerts', { params: { page: 2, per_page: 20 } })
    expect(apiService.patch).toHaveBeenCalledWith('/ews/alerts/7/resolve', {})
    expect(apiService.post).toHaveBeenCalledWith('/ews/process-siswa/9', {})
  })

  it('normalizes legacy date filters to Go canonical names', async () => {
    await absensiSiswaService.getAbsensiSiswa({ tanggal_mulai: '2026-01-01', tanggal_akhir: '2026-01-31', page: 2 })
    await absensiGuruService.getByGuru(5, { tanggal_mulai: '2026-01-01', tanggal_akhir: '2026-01-31' })
    await presensiService.getPresensi({ tanggal_mulai: '2026-01-01', tanggal_akhir: '2026-01-31', per_page: 20 })
    expect(apiService.get).toHaveBeenCalledWith('/akademik/absensi-siswa', { params: { tanggal_awal: '2026-01-01', tanggal_akhir: '2026-01-31', page: 2 } })
    expect(apiService.get).toHaveBeenCalledWith('/akademik/absensi-guru/guru/5', { params: { tanggal_awal: '2026-01-01', tanggal_akhir: '2026-01-31' } })
    expect(apiService.get).toHaveBeenCalledWith('/akademik/presensi', { params: { tanggal_awal: '2026-01-01', tanggal_akhir: '2026-01-31', per_page: 20 } })
  })
})
