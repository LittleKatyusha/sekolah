import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WalletPage from './WalletPage'
import api from '../../utils/api'
import useAuthStore from '../../store/useAuthStore'

vi.mock('../../utils/api', () => ({ default: { request: vi.fn() } }))
const account = { id: 1, student: { id: 7, name: 'Anak Satu', class_id: 3 }, available: 50000, daily_limit: 10000, spent_today: 2000, remaining_today: 8000, max_payment: 8000, limit_version: 4, timezone: 'Asia/Jakarta', pin_set: true }
const page = data => ({ data, last_page: 1 })
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear()
  useAuthStore.setState({ user: { id: 1, role: 'WALI_SISWA', permissions: [] } })
  api.request.mockImplementation(async config => {
    const path = config.url
    const data = path === '/wallet/accounts' ? page([account]) : path === '/wallet/accounts/7' ? account : path === '/wallet/topups/methods' ? { methods: [{ method: 'bank_transfer' }] } : path === '/wallet/topups/quote' ? { principal: 10000, fee: 2000, total: 12000, method: 'bank_transfer', schedule_version: 'v1' } : page([])
    return { data: { data } }
  })
})
const mount = () => render(<MemoryRouter><WalletPage /></MemoryRouter>)
describe('wallet workflows', () => {
  it('sends the selected transaction status filter', async () => {
    useAuthStore.setState({ user: { id: 2, role: 'STAFF_KEUANGAN', permissions: ['wallet.view-all'] } })
    mount()
    fireEvent.change(await screen.findByLabelText('Status transaksi'), { target: { value: 'refunded' } })
    fireEvent.click(screen.getByText('Terapkan filter'))
    await waitFor(() => expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ url: '/wallet/transactions', params: { status: 'refunded', page: 1 } })))
  })
  it('guardian sees child limits and fees before any checkout; cannot spend', async () => {
    mount()
    await screen.findByText('Batas belanja harian')
    expect(screen.queryByText('Bayar kantin')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nominal saldo (Rp)'), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText('Metode pembayaran'), { target: { value: 'bank_transfer' } })
    fireEvent.click(screen.getByText('Lihat rincian biaya'))
    await screen.findByText('Setujui total & checkout')
    expect(api.request.mock.calls.some(([c]) => c.url === '/wallet/topups')).toBe(false)
  })
  it('sends optimistic limit version and does not overwrite stale changes', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mount(); await screen.findByText('Batas belanja harian')
    fireEvent.change(screen.getByLabelText('Batas (Rp)'), { target: { value: '0' } })
    fireEvent.click(screen.getByText('Simpan batas'))
    await waitFor(() => expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ url: '/wallet/accounts/7/daily-limit', method: 'put', data: { daily_limit: 0, version: 4 } })))
  })
  it('staff payout-only permission does not request student accounts', async () => {
    useAuthStore.setState({ user: { id: 2, role: 'STAFF', permissions: ['wallet.process-payout'] } })
    mount(); await screen.findByText('Pencairan pedagang')
    expect(api.request.mock.calls.some(([c]) => c.url === '/wallet/accounts')).toBe(false)
    expect(screen.queryByText('Buat akun pedagang')).not.toBeInTheDocument()
  })
  it('student has camera fallback and masked transaction PIN', async () => {
    useAuthStore.setState({ user: { id: 3, role: 'SISWA', permissions: [] } })
    mount(); await screen.findByText('Bayar kantin')
    fireEvent.click(screen.getByText('Scan kamera'))
    await screen.findByText(/Pemindai kamera tidak tersedia/)
    expect(screen.getByLabelText('Kode atau URL QR pedagang')).toBeInTheDocument()
    expect(screen.queryByText('Isi saldo online')).not.toBeInTheDocument()
  })
  it('retries an ambiguous payment with the same key and never stores its PIN', async () => {
    useAuthStore.setState({ user: { id: 3, role: 'SISWA', permissions: [] } })
    const original = api.request.getMockImplementation()
    const token = 'a'.repeat(48)
    api.request.mockImplementation(async c => {
      if (c.url === `/wallet/qr/${token}`) return { data: { data: { name: 'Kantin', school_name: 'Sekolah', active: true, qr_token: token } } }
      if (c.url === '/wallet/payments') throw new Error('Network Error')
      return original(c)
    })
    mount(); await screen.findByText('Bayar kantin')
    fireEvent.change(screen.getByLabelText('Kode atau URL QR pedagang'), { target: { value: token } })
    fireEvent.click(screen.getByText('Periksa penerima'))
    await screen.findByLabelText('Nominal pembayaran (Rp)')
    fireEvent.change(screen.getByLabelText('Nominal pembayaran (Rp)'), { target: { value: '5000' } })
    fireEvent.click(screen.getByText('Lanjutkan konfirmasi'))
    const pin = await screen.findByLabelText('PIN transaksi')
    expect(pin.type).toBe('password')
    fireEvent.change(pin, { target: { value: '123456' } })
    fireEvent.click(screen.getByText('Konfirmasi & bayar'))
    await screen.findByText('Network Error')
    fireEvent.click(screen.getByText('Konfirmasi & bayar'))
    await waitFor(() => expect(api.request.mock.calls.filter(([c]) => c.url === '/wallet/payments')).toHaveLength(2))
    const calls = api.request.mock.calls.filter(([c]) => c.url === '/wallet/payments')
    expect(calls[0][0].data.idempotency_key).toBe(calls[1][0].data.idempotency_key)
    expect(JSON.stringify(sessionStorage)).not.toContain('123456')
  })
})
