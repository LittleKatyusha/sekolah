import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PengaturanSekolahSection from './PengaturanSekolahSection'
import useAuthStore from '../../../store/useAuthStore'

describe('PengaturanSekolahSection', () => {
  const mockSettings = [
    { id: 1, key: 'tahun_ajaran_aktif', value: '2025/2026' },
    { id: 2, key: 'radius_absensi_meter', value: '150' },
    { id: 3, key: 'ppdb_gelombang_aktif', value: '1' },
    { id: 4, key: 'maintenance_mode', value: '0' },
    { id: 5, key: 'custom_secret', value: 'xyz123' },
  ]

  beforeEach(() => {
    useAuthStore.setState({
      user: {
        role: 'admin',
        roles: [],
        permissions: [
          { code: 'sekolah.settings.view' },
          { code: 'sekolah.settings.update' },
          { code: 'sekolah.settings.delete' },
        ],
      },
    })
  })

  it('renders categorized cards by default with settings', () => {
    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1, nama_sekolah: 'SMA Test' }}
        settings={mockSettings}
      />
    )

    expect(screen.getByText('Pengaturan Sekolah')).toBeInTheDocument()
    expect(screen.getByText('tahun_ajaran_aktif')).toBeInTheDocument()
    expect(screen.getByText('radius_absensi_meter')).toBeInTheDocument()
    expect(screen.getByText('ppdb_gelombang_aktif')).toBeInTheDocument()
    expect(screen.getByText('150 meter')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('filters settings by search query', () => {
    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={mockSettings}
      />
    )

    const searchInput = screen.getByPlaceholderText('Cari pengaturan...')
    fireEvent.change(searchInput, { target: { value: 'radius' } })

    expect(screen.getByText('radius_absensi_meter')).toBeInTheDocument()
    expect(screen.queryByText('tahun_ajaran_aktif')).not.toBeInTheDocument()
  })

  it('switches between card and table view modes', () => {
    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={mockSettings}
      />
    )

    // Default card view
    expect(screen.getByRole('button', { name: 'Card' })).toBeInTheDocument()
    const tableBtn = screen.getByRole('button', { name: 'Tabel' })
    fireEvent.click(tableBtn)

    // Table view should render <table> and table headers
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Parameter / Key')).toBeInTheDocument()

    // Switch back to Card view
    const cardBtn = screen.getByRole('button', { name: 'Card' })
    fireEvent.click(cardBtn)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('calls edit and update handlers', () => {
    const handleEdit = vi.fn()
    const handleUpdate = vi.fn()
    const setEditingValue = vi.fn()

    const { rerender } = render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={mockSettings}
        handleEditSetting={handleEdit}
        handleUpdateSetting={handleUpdate}
        setEditingSettingValue={setEditingValue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit setting radius_absensi_meter' }))
    expect(handleEdit).toHaveBeenCalledWith(expect.objectContaining(mockSettings[1]))

    // Simulate editing mode active
    rerender(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={mockSettings}
        editingSettingId={2}
        editingSettingValue="200"
        handleEditSetting={handleEdit}
        handleUpdateSetting={handleUpdate}
        setEditingSettingValue={setEditingValue}
      />
    )

    const input = screen.getByRole('textbox', { name: 'Nilai setting radius_absensi_meter' })
    expect(input).toHaveValue('200')
    fireEvent.change(input, { target: { value: '250' } })
    expect(setEditingValue).toHaveBeenCalledWith('250')

    fireEvent.click(screen.getByRole('button', { name: 'Simpan setting radius_absensi_meter' }))
    expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining(mockSettings[1]))
  })

  it('calls delete handler when delete button clicked', () => {
    const handleDelete = vi.fn()

    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={mockSettings}
        handleDeleteSetting={handleDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus setting radius_absensi_meter' }))
    expect(handleDelete).toHaveBeenCalledWith(2, 'radius_absensi_meter')
  })
})
