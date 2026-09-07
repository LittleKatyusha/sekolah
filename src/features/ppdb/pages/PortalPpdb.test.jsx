import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PortalPpdb, { getSubdomain } from './PortalPpdb'
import { ppdbPublicService } from '../services/ppdbService'

vi.mock('../services/ppdbService', () => ({
  ppdbPublicService: {
    getSekolahList: vi.fn(),
    getActiveGelombang: vi.fn(),
    daftar: vi.fn(),
    cekStatus: vi.fn(),
    downloadBukti: vi.fn(),
  },
}))

const mockSchools = [
  { id: 3, nama_sekolah: 'SMA Darussalam', slug: 'smada', subdomain: 'smada' },
  { id: 1, nama_sekolah: 'SMA Negeri 1 Example', slug: 'sman1-example', subdomain: 'sman1-example' },
]

describe('PortalPpdb Subdomain Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ppdbPublicService.getSekolahList.mockResolvedValue({
      data: { data: mockSchools },
      error: null,
    })
    ppdbPublicService.getActiveGelombang.mockResolvedValue({
      data: {
        data: [
          { id: 10, nama_gelombang: 'Gelombang 1 - Jalur Reguler', biaya_pendaftaran: 150000 },
        ],
      },
      error: null,
    })
  })

  it('detects subdomain from query params or hostname', () => {
    // Query param takes priority
    delete window.location
    window.location = new URL('https://smada.akademihub.id/ppdb/portal?subdomain=smada')
    expect(getSubdomain()).toBe('smada')

    // Hostname detection
    window.location = new URL('https://smada.akademihub.id/ppdb/portal')
    expect(getSubdomain()).toBe('smada')

    // Ignores app and www
    window.location = new URL('https://app.akademihub.id/ppdb/portal')
    expect(getSubdomain()).toBeNull()
    window.location = new URL('https://www.akademihub.id/ppdb/portal')
    expect(getSubdomain()).toBeNull()
  })

  it('automatically sets target school and loads waves when subdomain matches', async () => {
    window.location = new URL('https://smada.akademihub.id/ppdb/portal')

    render(
      <MemoryRouter>
        <PortalPpdb />
      </MemoryRouter>
    )

    // Should display school name in locked read-only input
    const schoolInput = await screen.findByDisplayValue('SMA Darussalam')
    expect(schoolInput).toBeInTheDocument()
    expect(schoolInput).toHaveAttribute('readonly')

    // Keep technical subdomain details hidden from users
    expect(screen.queryByText(/Otomatis berdasarkan subdomain:/i)).not.toBeInTheDocument()

    // Should have automatically fetched active waves for SMADA (id 3)
    await waitFor(() => {
      expect(ppdbPublicService.getActiveGelombang).toHaveBeenCalledWith('3')
    })

    // Single active wave should be auto-selected in dropdown
    await waitFor(() => {
      const select = document.querySelector('select[name="ppdb_gelombang_id"]')
      expect(select).toBeInTheDocument()
      expect(select.value).toBe('10')
    })
  })

  it('downloads the receipt using the matched lookup and shows API errors', async () => {
    window.location = new URL('https://smada.akademihub.id/ppdb/portal')
    ppdbPublicService.cekStatus.mockResolvedValue({ data: { data: {
      no_pendaftaran: 'PPDB-001', nama_lengkap: 'B***', status_pendaftaran: 'submitted',
    } } })
    ppdbPublicService.downloadBukti.mockResolvedValue({ data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }), error: null })
    const createURL = vi.fn(() => 'blob:receipt')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createURL, revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      render(<MemoryRouter><PortalPpdb /></MemoryRouter>)
      await screen.findByDisplayValue('SMA Darussalam')
      fireEvent.click(screen.getByRole('button', { name: 'Cek Status' }))
      fireEvent.change(screen.getByPlaceholderText('Contoh: PPDB-2026-001234'), { target: { value: 'PPDB-001' } })
      const email = screen.getByPlaceholderText('Email saat pendaftaran')
      fireEvent.change(email, { target: { value: 'peserta@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Cek Status Pendaftaran' }))
      const download = await screen.findByRole('button', { name: 'Unduh Bukti Pendaftaran (PDF)' })
      fireEvent.change(email, { target: { value: 'other@example.com' } })
      fireEvent.click(download)
      await waitFor(() => expect(click).toHaveBeenCalledOnce())
      expect(ppdbPublicService.downloadBukti).toHaveBeenCalledWith('PPDB-001', 'peserta@example.com', 3)
      expect(createURL).toHaveBeenCalledOnce()
      await waitFor(() => expect(download).not.toBeDisabled())
      ppdbPublicService.downloadBukti.mockResolvedValue({ data: null, error: { message: 'Gagal membuat PDF' } })
      fireEvent.click(download)
      expect(await screen.findByRole('alert')).toHaveTextContent('Gagal membuat PDF')
    } finally {
      click.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it('renders selectable dropdown when no subdomain matches', async () => {
    window.location = new URL('https://app.akademihub.id/ppdb/portal')

    render(
      <MemoryRouter>
        <PortalPpdb />
      </MemoryRouter>
    )

    // Should render select element with placeholder
    const selects = await screen.findAllByRole('combobox')
    const schoolSelect = selects[0]
    expect(schoolSelect).toBeInTheDocument()
    expect(screen.getByText('— Pilih Sekolah —')).toBeInTheDocument()
  })
})
