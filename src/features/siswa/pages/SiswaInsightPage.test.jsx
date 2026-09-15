import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SiswaInsightPage from './SiswaInsightPage'
import { siswaInsightService } from '../services/siswaInsightService'
import { showError, showSuccess } from '../../../utils/sweetalert'

vi.mock('../services/siswaInsightService', () => ({ siswaInsightService: { getInsight: vi.fn() } }))
vi.mock('../../../utils/sweetalert', () => ({ showError: vi.fn(), showSuccess: vi.fn() }))

const insight = {
  siswa: { nama: 'Siswa Uji' },
  risk_profile: {
    risk_score: 32.5, risk_category: 'low',
    dimensions: {
      akademik: { risk_score: 50, detail: { status: 'no_data' } },
      keuangan: { risk_score: 85, detail: { status: 'kritis' } },
    },
  },
  academic_progress: {
    tren_nilai: { 1: { mapel_id: 1, mapel_nama: 'Matematika', rata_rata: 80, tren: 'naik', data_points: [{ nilai: 70 }, { nilai: 90 }] } },
    riwayat_ranking: [{ peringkat: 2 }],
  },
  kehadiran_summary: { total: 0, pct_hadir: null, status: 'no_data' },
  tugas_summary: { total: 0, pct_kumpul: null, status: 'no_data' },
  spp_summary: { tahun: 2026, bulan_berjalan: 9, total_bulan_wajib: 3, lunas: 1, tunggakan: 2, status: 'perlu_perhatian' },
}
const mount = () => render(<MemoryRouter initialEntries={['/siswa/1/insight']}><Routes><Route path="/siswa/:id/insight" element={<SiswaInsightPage />} /></Routes></MemoryRouter>)

describe('SiswaInsightPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    siswaInsightService.getInsight.mockResolvedValue({ data: { data: insight } })
  })

  it('renders API fields, unknown data, risk colors and academic results', async () => {
    mount()
    await screen.findByText('Insight 360° — Siswa Uji')
    expect(screen.getAllByText('Belum ada data')).toHaveLength(2)
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Data belum lengkap')
    fireEvent.click(screen.getByRole('button', { name: 'Profil Risiko' }))
    const score = screen.getByText('85/100')
    expect(score.parentElement.parentElement.querySelector('.bg-red-500')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Akademik' }))
    expect(screen.getByText('Matematika')).toBeInTheDocument()
    expect(screen.getByText('80.00')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.queryByText('Belum ada data nilai')).not.toBeInTheDocument()
  })

  it.each([
    ['API error', () => Promise.resolve({ error: { message: 'Gagal refresh' } })],
    ['network exception', () => Promise.reject(new Error('Gagal refresh'))],
  ])('never announces refresh success after %s', async (_name, failure) => {
    mount()
    await screen.findByText('Insight 360° — Siswa Uji')
    siswaInsightService.getInsight.mockImplementationOnce(failure)
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(showError).toHaveBeenCalledWith('Gagal refresh'))
    expect(showSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
    expect(siswaInsightService.getInsight).toHaveBeenLastCalledWith('1', true)
  })

  it('announces successful refresh and supports retry after initial failure', async () => {
    siswaInsightService.getInsight.mockResolvedValueOnce({ error: { message: 'Offline' } })
    mount()
    fireEvent.click(await screen.findByRole('button', { name: 'Coba lagi' }))
    await screen.findByText('Insight 360° — Siswa Uji')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Insight berhasil diperbarui'))
  })

  it('does not label unknown SPP obligations as paid or overdue', async () => {
    siswaInsightService.getInsight.mockResolvedValueOnce({ data: { data: {
      ...insight,
      spp_summary: { tahun: 2026, total_bulan_wajib: null, lunas: null, tunggakan: null, status: 'no_data' },
    } } })
    mount()
    await screen.findByText('Insight 360° — Siswa Uji')
    expect(screen.getByText('—/—')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keuangan' }))
    expect(screen.getByText('Tanggal masuk belum tersedia; kewajiban SPP belum dapat dihitung.')).toBeInTheDocument()
    expect(screen.queryByText(/SPP tahun ini sudah lunas/)).not.toBeInTheDocument()
  })
})