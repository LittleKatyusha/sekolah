import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PanduanPage from './PanduanPage'
import { PANDUAN_MODULES } from '../data/panduanData'

const renderPage = () => {
  return render(
    <MemoryRouter>
      <PanduanPage />
    </MemoryRouter>
  )
}

describe('PanduanPage', () => {
  it('renders header, title, and total module count correctly', () => {
    renderPage()

    expect(screen.getByText('Petunjuk Penggunaan Aplikasi')).toBeInTheDocument()
    expect(screen.getByText('Pusat Panduan Resmi AkademiHub')).toBeInTheDocument()
    expect(screen.getByText('15 Modul Lengkap')).toBeInTheDocument()
  })

  it('renders mobile PWA installation guide with Android and iOS tabs', () => {
    renderPage()

    expect(screen.getByText('Pasang Aplikasi di Smartphone')).toBeInTheDocument()
    expect(screen.getByText('Buka di Chrome')).toBeInTheDocument()

    // Toggle iOS tab
    fireEvent.click(screen.getByText('iOS (Safari)'))
    expect(screen.getByText('Buka di Safari')).toBeInTheDocument()
  })

  it('filters modules by search term', () => {
    renderPage()

    const searchInput = screen.getByPlaceholderText(/Cari petunjuk modul/i)
    fireEvent.change(searchInput, { target: { value: 'SPP Online' } })

    expect(screen.getAllByText('Keuangan & Pembayaran SPP Online').length).toBeGreaterThanOrEqual(1)
  })

  it('filters modules by category pill', () => {
    renderPage()

    const presensiTab = screen.getByText('🕒 Presensi & RFID')
    fireEvent.click(presensiTab)

    expect(screen.getAllByText('Presensi & Kehadiran (RFID, GPS, & Selfie)').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when search returns no match', () => {
    renderPage()

    const searchInput = screen.getByPlaceholderText(/Cari petunjuk modul/i)
    fireEvent.change(searchInput, { target: { value: 'XYZ_NOT_EXISTING_MODULE_123' } })

    expect(screen.getByText('Tidak ada petunjuk yang sesuai')).toBeInTheDocument()
    expect(screen.getByText('Reset Semua Filter')).toBeInTheDocument()

    // Clicking reset restores modules
    fireEvent.click(screen.getByText('Reset Semua Filter'))
    expect(screen.getAllByText('Keuangan & Pembayaran SPP Online').length).toBeGreaterThanOrEqual(1)
  })

  it('has all 15 core modules configured in panduanData', () => {
    expect(PANDUAN_MODULES.length).toBe(15)
    PANDUAN_MODULES.forEach((m) => {
      expect(m.id).toBeDefined()
      expect(m.title).toBeDefined()
      expect(m.webGuide.length).toBeGreaterThan(0)
      expect(m.mobileGuide.length).toBeGreaterThan(0)
    })
  })
})
