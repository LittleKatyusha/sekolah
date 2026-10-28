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

  it('renders descriptive names for tahun_ajaran_aktif and ppdb_gelombang_aktif instead of bare ids', () => {
    const settingsWithIds = [
      { id: 1, key: 'tahun_ajaran_aktif', value: '2' },
      { id: 2, key: 'ppdb_gelombang_aktif', value: '1' },
    ]

    const referenceOptions = {
      tahunAjaran: [{ id: 2, nama: 'Tahun Ajaran 2025/2026', kode: '2025-2026' }],
      ppdbGelombang: [{ id: 1, nama_gelombang: 'Gelombang 1 - Jalur Prestasi' }],
    }

    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={settingsWithIds}
        referenceOptions={referenceOptions}
      />
    )

    // Should display full academic year and wave names, not bare numbers
    expect(screen.getByText('Tahun Ajaran 2025/2026')).toBeInTheDocument()
    expect(screen.getByText('Gelombang 1 - Jalur Prestasi')).toBeInTheDocument()
    expect(screen.getAllByText('ID: 2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ID: 1').length).toBeGreaterThan(0)
  })

  it('renders fallback Gelombang X when reference options are empty for numeric id', () => {
    const settingsWithIds = [
      { id: 1, key: 'tahun_ajaran_aktif', value: '2' },
      { id: 2, key: 'ppdb_gelombang_aktif', value: '1' },
    ]

    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={settingsWithIds}
        referenceOptions={{ tahunAjaran: [], ppdbGelombang: [] }}
      />
    )

    // Even without reference options loaded, it should not render bare "1" or "2"
    expect(screen.getByText('Tahun Ajaran #2')).toBeInTheDocument()
    expect(screen.getByText('Gelombang 1')).toBeInTheDocument()
  })

  it('renders select dropdowns when editing tahun_ajaran_aktif and ppdb_gelombang_aktif', () => {
    const settingsWithIds = [
      { id: 1, key: 'tahun_ajaran_aktif', value: '2' },
      { id: 2, key: 'ppdb_gelombang_aktif', value: '1' },
    ]

    const referenceOptions = {
      tahunAjaran: [
        { id: 1, nama: 'Tahun Ajaran 2024/2025' },
        { id: 2, nama: 'Tahun Ajaran 2025/2026' },
      ],
      ppdbGelombang: [
        { id: 1, nama_gelombang: 'Gelombang 1' },
        { id: 2, nama_gelombang: 'Gelombang 2' },
      ],
    }

    const { rerender } = render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={settingsWithIds}
        referenceOptions={referenceOptions}
        editingSettingId={1}
        editingSettingValue="2"
      />
    )

    const selectTa = screen.getByRole('combobox', { name: 'Nilai setting tahun_ajaran_aktif' })
    expect(selectTa).toBeInTheDocument()
    expect(selectTa).toHaveValue('2')
    expect(screen.getByRole('option', { name: 'Tahun Ajaran 2025/2026 (ID: 2)' })).toBeInTheDocument()

    // Test editing ppdb_gelombang_aktif
    rerender(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={settingsWithIds}
        referenceOptions={referenceOptions}
        editingSettingId={2}
        editingSettingValue="1"
      />
    )

    const selectGel = screen.getByRole('combobox', { name: 'Nilai setting ppdb_gelombang_aktif' })
    expect(selectGel).toBeInTheDocument()
    expect(selectGel).toHaveValue('1')
    expect(screen.getByRole('option', { name: 'Gelombang 1 (ID: 1)' })).toBeInTheDocument()
  })

  it('renders disabled empty placeholder option when ppdb_gelombang has no options', () => {
    const settings = [{ id: 2, key: 'ppdb_gelombang_aktif', value: '' }]
    render(
      <PengaturanSekolahSection
        sekolah={{ id: 1 }}
        settings={settings}
        referenceOptions={{ ppdbGelombang: [] }}
        editingSettingId={2}
        editingSettingValue=""
      />
    )

    expect(screen.getByRole('option', { name: 'Belum ada data gelombang PPDB' })).toBeDisabled()
    expect(screen.queryByRole('option', { name: 'Gelombang 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Gelombang 5' })).not.toBeInTheDocument()
  })
})
