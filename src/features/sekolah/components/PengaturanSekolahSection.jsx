import { useState, useMemo } from 'react'
import {
  Settings,
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
  Sliders,
  Save,
  Edit,
  Trash2,
} from 'lucide-react'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Card from '../../../components/ui/Card'
import { SETTING_METADATA, CATEGORIES } from '../constants/settingMetadata'
import PengaturanSekolahItem from './PengaturanSekolahItem'

const PengaturanSekolahSection = ({
  sekolah,
  settings = [],
  referenceOptions = { tahunAjaran: [], ppdbGelombang: [] },
  loading = false,
  editingSettingId,
  editingSettingValue,
  savingSetting,
  setEditingSettingValue,
  handleEditSetting,
  handleCancelEditSetting,
  handleUpdateSetting,
  handleDeleteSetting,
}) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('card')

  const enrichedSettings = useMemo(() => {
    return settings.map((item) => {
      const meta = SETTING_METADATA[item.key] || {
        label: item.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        category: 'custom',
        description: 'Parameter sistem',
        icon: Sliders,
      }
      return { ...item, meta }
    })
  }, [settings])

  const filteredSettings = useMemo(() => {
    return enrichedSettings.filter((item) => {
      const matchCat = activeCategory === 'all' || item.meta.category === activeCategory
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.key.toLowerCase().includes(q) ||
        item.meta.label.toLowerCase().includes(q) ||
        (item.value && String(item.value).toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [enrichedSettings, activeCategory, searchQuery])

  const groupedSettings = useMemo(() => {
    const groups = {}
    CATEGORIES.filter((c) => c.id !== 'all').forEach((cat) => {
      groups[cat.id] = []
    })
    filteredSettings.forEach((setting) => {
      const catId = setting.meta.category || 'custom'
      if (!groups[catId]) groups[catId] = []
      groups[catId].push(setting)
    })
    return groups
  }, [filteredSettings])

  const renderTableValue = (setting) => {
    const val = setting.value
    if (setting.key === 'tahun_ajaran_aktif') {
      const matched = referenceOptions?.tahunAjaran?.find((t) => String(t.id) === String(val))
      const label = matched?.nama || matched?.kode || setting.display_value
      const isIdOnly = !label || String(label) === String(val)
      const display = isIdOnly ? (val && !isNaN(val) ? `Tahun Ajaran #${val}` : val) : label
      const showIdBadge = val && !isNaN(val) && !display?.includes(`ID: ${val}`) && !display?.endsWith(`#${val}`)
      return (
        <span className="font-medium text-gray-900 dark:text-white inline-flex items-center gap-1 flex-wrap">
          <span>{display || '-'}</span>
          {showIdBadge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono font-normal">
              ID: {val}
            </span>
          )}
        </span>
      )
    }
    if (setting.key === 'ppdb_gelombang_aktif') {
      const matched = referenceOptions?.ppdbGelombang?.find((g) => String(g.id) === String(val))
      const label = matched?.nama_gelombang || setting.display_value
      const isIdOnly = !label || String(label) === String(val)
      const display = isIdOnly ? (val && !isNaN(val) ? `Gelombang ${val}` : val) : label
      const showIdBadge = val && !isNaN(val) && !display?.includes(`ID: ${val}`) && !display?.endsWith(` ${val}`)
      return (
        <span className="font-medium text-gray-900 dark:text-white inline-flex items-center gap-1 flex-wrap">
          <span>{display || '-'}</span>
          {showIdBadge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono font-normal">
              ID: {val}
            </span>
          )}
        </span>
      )
    }
    if (setting.key === 'semester_aktif') {
      return <span className="font-medium text-gray-900 dark:text-white">Semester {val || '-'} ({val === '1' ? 'Ganjil' : 'Genap'})</span>
    }
    if (setting.key === 'maintenance_mode') {
      const isM = val === '1' || val === 1
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isM ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {isM ? 'Maintenance' : 'Normal'}
        </span>
      )
    }
    if (setting.key === 'biaya_denda_perpustakaan_per_hari' && val && !isNaN(val)) {
      return <span className="font-medium text-gray-900 dark:text-white">Rp {Number(val).toLocaleString('id-ID')}</span>
    }
    if (setting.key === 'radius_absensi_meter' && val && !isNaN(val)) {
      return <span className="font-medium text-gray-900 dark:text-white">{val} meter</span>
    }
    return <span className="font-medium text-gray-900 dark:text-white break-all">{setting.display_value || val || '-'}</span>
  }

  const renderTableEditor = (setting) => {
    if (setting.key === 'tahun_ajaran_aktif') {
      const options = referenceOptions?.tahunAjaran || []
      return (
        <select
          autoFocus
          aria-label={`Nilai setting ${setting.key}`}
          className="input-field w-full text-xs py-1"
          value={editingSettingValue}
          disabled={savingSetting}
          onChange={(e) => setEditingSettingValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateSetting(setting)
            if (e.key === 'Escape') handleCancelEditSetting()
          }}
        >
          <option value="">-- Pilih Tahun Ajaran --</option>
          {options.map((ta) => (
            <option key={ta.id} value={String(ta.id)}>
              {ta.nama || ta.kode} (ID: {ta.id})
            </option>
          ))}
          {!options.some((ta) => String(ta.id) === String(editingSettingValue)) && editingSettingValue && (
            <option value={editingSettingValue}>
              Tahun Ajaran ID: {editingSettingValue}
            </option>
          )}
        </select>
      )
    }

    if (setting.key === 'ppdb_gelombang_aktif') {
      const options = referenceOptions?.ppdbGelombang || []
      return (
        <select
          autoFocus
          aria-label={`Nilai setting ${setting.key}`}
          className="input-field w-full text-xs py-1"
          value={editingSettingValue}
          disabled={savingSetting}
          onChange={(e) => setEditingSettingValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateSetting(setting)
            if (e.key === 'Escape') handleCancelEditSetting()
          }}
        >
          <option value="">-- Pilih Gelombang PPDB --</option>
          {options.length > 0 ? (
            options.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.nama_gelombang} (ID: {g.id})
              </option>
            ))
          ) : (
            [1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={String(num)}>
                Gelombang {num}
              </option>
            ))
          )}
          {!options.some((g) => String(g.id) === String(editingSettingValue)) &&
            ![1, 2, 3, 4, 5].includes(Number(editingSettingValue)) &&
            editingSettingValue && (
              <option value={editingSettingValue}>
                Gelombang ID: {editingSettingValue}
              </option>
            )}
        </select>
      )
    }

    if (setting.key === 'semester_aktif') {
      return (
        <select
          autoFocus
          aria-label={`Nilai setting ${setting.key}`}
          className="input-field w-full text-xs py-1"
          value={editingSettingValue}
          disabled={savingSetting}
          onChange={(e) => setEditingSettingValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateSetting(setting)
            if (e.key === 'Escape') handleCancelEditSetting()
          }}
        >
          <option value="1">Semester 1 (Ganjil)</option>
          <option value="2">Semester 2 (Genap)</option>
        </select>
      )
    }

    if (setting.key === 'maintenance_mode') {
      return (
        <select
          autoFocus
          aria-label={`Nilai setting ${setting.key}`}
          className="input-field w-full text-xs py-1"
          value={editingSettingValue}
          disabled={savingSetting}
          onChange={(e) => setEditingSettingValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateSetting(setting)
            if (e.key === 'Escape') handleCancelEditSetting()
          }}
        >
          <option value="0">Normal (Akses dibuka)</option>
          <option value="1">Pemeliharaan Aktif (Maintenance)</option>
        </select>
      )
    }

    return (
      <input
        autoFocus
        type="text"
        aria-label={`Nilai setting ${setting.key}`}
        className="input-field w-full text-xs py-1"
        value={editingSettingValue}
        maxLength={10000}
        disabled={savingSetting}
        onChange={(e) => setEditingSettingValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleUpdateSetting(setting)
          if (e.key === 'Escape') handleCancelEditSetting()
        }}
      />
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={20} className="text-primary-600 dark:text-primary-400" />
              Pengaturan Sekolah
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Kelola parameter operasional, geofence presensi, akademik, dan preferensi sistem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                <LayoutGrid size={13} /> Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                <TableIcon size={13} /> Tabel
              </button>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => {
              const IconC = cat.icon
              const isActive = activeCategory === cat.id
              const count = cat.id === 'all'
                ? settings.length
                : settings.filter((s) => (SETTING_METADATA[s.key]?.category || 'custom') === cat.id).length
              if (cat.id !== 'all' && count === 0 && !searchQuery) return null
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${isActive ? 'bg-primary-600 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <IconC size={13} />
                  {cat.label}
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative min-w-[200px] md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pengaturan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-8 py-1 text-xs w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Settings size={40} className="mx-auto mb-2 opacity-30 stroke-[1.5]" />
            <p className="text-xs font-medium">Tidak ada pengaturan yang ditemukan</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">Parameter / Key</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3">Nilai Konfigurasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredSettings.map((setting) => {
                  const isEditing = editingSettingId === setting.id
                  return (
                    <tr key={setting.id || setting.key} className="border-b dark:border-gray-700 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{setting.meta.label}</div>
                        <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{setting.key}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{setting.meta.description}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          renderTableEditor(setting)
                        ) : (
                          renderTableValue(setting)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <PermissionGuard permission="sekolah.settings.update">
                          {isEditing ? (
                            <span className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Simpan setting ${setting.key}`}
                                title="Simpan"
                                disabled={savingSetting}
                                onClick={() => handleUpdateSetting(setting)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Batal edit setting ${setting.key}`}
                                title="Batal"
                                disabled={savingSetting}
                                onClick={handleCancelEditSetting}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              aria-label={`Edit setting ${setting.key}`}
                              title="Edit"
                              onClick={() => handleEditSetting(setting)}
                              className="text-amber-600 hover:text-amber-800 mr-3"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </PermissionGuard>
                        <PermissionGuard permission="sekolah.settings.delete">
                          <button
                            type="button"
                            aria-label={`Hapus setting ${setting.key}`}
                            title="Hapus"
                            onClick={() => handleDeleteSetting(setting.id, setting.key)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-5">
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const catSettings = groupedSettings[cat.id] || []
              if (catSettings.length === 0) return null
              const CatIcon = cat.icon
              return (
                <div key={cat.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                        <CatIcon size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{cat.label}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{cat.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
                      {catSettings.length} item
                    </span>
                  </div>

                  <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catSettings.map((setting) => (
                      <PengaturanSekolahItem
                        key={setting.id || setting.key}
                        setting={setting}
                        sekolah={sekolah}
                        referenceOptions={referenceOptions}
                        isEditing={editingSettingId === setting.id}
                        editingSettingValue={editingSettingValue}
                        savingSetting={savingSetting}
                        setEditingSettingValue={setEditingSettingValue}
                        handleEditSetting={handleEditSetting}
                        handleCancelEditSetting={handleCancelEditSetting}
                        handleUpdateSetting={handleUpdateSetting}
                        handleDeleteSetting={handleDeleteSetting}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

export default PengaturanSekolahSection

