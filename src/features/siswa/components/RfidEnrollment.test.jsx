import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import RfidEnrollment from './RfidEnrollment'
import { siswaService } from '../services/siswaService'

vi.mock('../services/siswaService', () => ({ siswaService: {
  getRfidReaders: vi.fn(), startRfidEnrollment: vi.fn(), getRfidEnrollment: vi.fn(),
} }))

const session = { session_id: 'session-a', siswa_id: 1, device_id: 3, status: 'pending', expires_at: '2099-01-01T00:05:00Z' }
const siswa = { id: 1, nama: 'Ani', rfid_uid: null }
beforeEach(() => {
  vi.clearAllMocks()
  siswaService.getRfidReaders.mockResolvedValue({ data: { data: [{ id: 3, device_name: 'Gerbang', tipe_lokasi: 'utama' }] } })
  siswaService.startRfidEnrollment.mockResolvedValue({ data: { data: session } })
  siswaService.getRfidEnrollment.mockResolvedValue({ data: { data: session } })
})
afterEach(() => vi.useRealTimers())

async function start(props = {}) {
  render(<RfidEnrollment siswa={siswa} onClose={vi.fn()} {...props} />)
  await screen.findByRole('option', { name: 'Gerbang (utama)' })
  fireEvent.click(screen.getByRole('button', { name: 'Mulai pendaftaran' }))
}

describe('RFID scan enrollment', () => {
  it('selects reader without school settings; binds selected student automatically', async () => {
    const onSuccess = vi.fn()
    siswaService.getRfidEnrollment.mockResolvedValue({ data: { data: { ...session, status: 'completed', rfid_uid: 'AABBCCDD' } } })
    await start({ onSuccess })
    expect(await screen.findByText('AABBCCDD')).toBeInTheDocument()
    expect(siswaService.getRfidReaders).toHaveBeenCalledWith(1)
    expect(siswaService.startRfidEnrollment).toHaveBeenCalledWith(1, 3)
    expect(siswaService.getRfidEnrollment).toHaveBeenCalledWith(1, 3, 'session-a')
    expect(onSuccess).toHaveBeenCalledWith('AABBCCDD')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('keeps pending controls locked and shows server scan errors', async () => {
    siswaService.getRfidEnrollment.mockResolvedValue({ data: { data: { ...session, error: 'Kartu sudah terdaftar pada pengguna lain.' } } })
    await start()
    expect(await screen.findByRole('alert')).toHaveTextContent('Kartu sudah terdaftar')
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mulai pendaftaran' })).toBeDisabled()
  })

  it('shows expiry and permits a new session', async () => {
    siswaService.getRfidEnrollment.mockResolvedValue({ data: { data: { ...session, status: 'expired' } } })
    await start()
    expect(await screen.findByText(/Waktu pendaftaran habis/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mulai pendaftaran' })).toBeEnabled()
  })

  it('rejects mismatched session results', async () => {
    const onSuccess = vi.fn()
    siswaService.getRfidEnrollment.mockResolvedValue({ data: { data: { ...session, session_id: 'other', status: 'completed', rfid_uid: 'AABBCCDD' } } })
    await start({ onSuccess })
    expect(await screen.findByRole('alert')).toHaveTextContent('Identitas sesi tidak cocok')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('reports busy readers without creating a pending UI', async () => {
    siswaService.startRfidEnrollment.mockResolvedValue({ error: { message: 'Mesin sedang digunakan.' } })
    await start()
    expect(await screen.findByRole('alert')).toHaveTextContent('Mesin sedang digunakan.')
    expect(siswaService.getRfidEnrollment).not.toHaveBeenCalled()
  })

  it('ignores a late completion after unmount', async () => {
    let complete
    siswaService.getRfidEnrollment.mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const onSuccess = vi.fn()
    const view = render(<RfidEnrollment siswa={siswa} onSuccess={onSuccess} onClose={vi.fn()} />)
    await screen.findByRole('option')
    fireEvent.click(screen.getByRole('button', { name: 'Mulai pendaftaran' }))
    await waitFor(() => expect(complete).toBeTypeOf('function'))
    view.unmount()
    await act(async () => complete({ data: { data: { ...session, status: 'completed', rfid_uid: 'AABBCCDD' } } }))
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('shows reader loading errors', async () => {
    siswaService.getRfidReaders.mockResolvedValue({ error: { message: 'Akses siswa ditolak.' } })
    render(<RfidEnrollment siswa={siswa} onClose={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Akses siswa ditolak.')
    expect(screen.queryByRole('button', { name: 'Mulai pendaftaran' })).not.toBeInTheDocument()
  })

  it('fails closed during status lookup errors', async () => {
    siswaService.getRfidEnrollment.mockRejectedValue(new Error('Koneksi terputus.'))
    await start()
    expect(await screen.findByRole('alert')).toHaveTextContent('Koneksi terputus.')
    expect(screen.getByRole('button', { name: 'Mulai pendaftaran' })).toBeDisabled()
  })

  it('does not remain locked indefinitely when expired and offline', async () => {
    siswaService.startRfidEnrollment.mockResolvedValue({ data: { data: { ...session, expires_at: '2000-01-01T00:00:00Z' } } })
    siswaService.getRfidEnrollment.mockRejectedValue(new Error('Offline'))
    await start()
    expect(await screen.findByRole('alert')).toHaveTextContent('hasil scan belum dapat dikonfirmasi')
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeEnabled()
  })
})
