import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PortalPpdb, { getSubdomain } from './PortalPpdb'
import { ppdbPublicService } from '../services/ppdbService'

vi.mock('../services/ppdbService', () => ({
  ppdbPublicService: {
    getSekolahList: vi.fn(),
    getActiveGelombang: vi.fn(),
    daftar: vi.fn(),
    cekStatus: vi.fn(),
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

    // Should indicate automatic selection from subdomain
    expect(screen.getByText(/Otomatis berdasarkan subdomain:/i)).toBeInTheDocument()

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
