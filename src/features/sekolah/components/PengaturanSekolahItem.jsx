import { Sliders, Save, X, Edit, Trash2 } from 'lucide-react'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const PengaturanSekolahItem = ({
  setting,
  sekolah,
  referenceOptions = {},
  isEditing,
  editingSettingValue,
  savingSetting,
  setEditingSettingValue,
  handleEditSetting,
  handleCancelEditSetting,
  handleUpdateSetting,
  handleDeleteSetting,
}) => {
  const IconComp = setting.meta?.icon || Sliders

  const renderValue = () => {
    const val = setting.value
    if (setting.key === 'kepala_sekolah_user_id') {
      const nama = sekolah?.kepala_sekolah?.nama || (setting.display_value ? setting.display_value.replace(/ \(ID: .*\)/, '') : '')
      if (nama) {
        return (
          <span className="font-medium text-gray-900 dark:text-white">
            {val || '-'} <span className="text-xs text-primary-600 font-semibold">({nama})</span>
          </span>
        )
      }
    }
    if (setting.key === 'tahun_ajaran_aktif') {
      const matched = referenceOptions?.tahunAjaran?.find((t) => String(t.id) === String(val))
      const label = matched?.nama || matched?.kode || setting.display_value
      const isIdOnly = !label || String(label) === String(val)
      const display = isIdOnly ? (val && !isNaN(val) ? `Tahun Ajaran #${val}` : val) : label
      const showIdBadge = val && !isNaN(val) && !display?.includes(`ID: ${val}`) && !display?.endsWith(`#${val}`)
      return (
        <span className="font-semibold text-gray-900 dark:text-white inline-flex items-center gap-1 flex-wrap">
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
        <span className="font-semibold text-gray-900 dark:text-white inline-flex items-center gap-1 flex-wrap">
          <span>{display || '-'}</span>
          {showIdBadge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono font-normal">
              ID: {val}
            </span>
          )}
        </span>
      )
    }
    if (setting.key === 'maintenance_mode') {
      const isM = val === '1' || val === 1
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isM ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {isM ? 'Maintenance' : 'Normal'}
        </span>
      )
    }
    if (setting.key === 'semester_aktif') {
      return <span className="font-semibold text-gray-900 dark:text-white">Semester {val || '-'} ({val === '1' ? 'Ganjil' : 'Genap'})</span>
    }
    if (setting.key === 'biaya_denda_perpustakaan_per_hari' && val && !isNaN(val)) {
      return <span className="font-semibold text-gray-900 dark:text-white">Rp {Number(val).toLocaleString('id-ID')}</span>
    }
    if (setting.key === 'radius_absensi_meter' && val && !isNaN(val)) {
      return <span className="font-semibold text-gray-900 dark:text-white">{val} meter</span>
    }
    return <span className="font-medium text-gray-900 dark:text-white break-all">{setting.display_value || val || '-'}</span>
  }

  const renderEditor = () => {
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
    <div className={`p-3.5 rounded-lg border transition-all ${isEditing ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500' : 'border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <IconComp size={14} className="text-primary-500 shrink-0" />
            <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">{setting.meta?.label || setting.key}</span>
          </div>
          <span className="inline-block mt-0.5 font-mono text-[10px] text-gray-500 bg-gray-200/60 dark:bg-gray-800 px-1.5 py-0.2 rounded">
            {setting.key}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <PermissionGuard permission="sekolah.settings.update">
            {isEditing ? (
              <>
                <button type="button" aria-label={`Simpan setting ${setting.key}`} title="Simpan" disabled={savingSetting} onClick={() => handleUpdateSetting(setting)} className="p-1 rounded text-emerald-600 hover:bg-emerald-100/50">
                  <Save size={15} />
                </button>
                <button type="button" aria-label={`Batal edit setting ${setting.key}`} title="Batal" disabled={savingSetting} onClick={handleCancelEditSetting} className="p-1 rounded text-gray-500 hover:bg-gray-200/50">
                  <X size={15} />
                </button>
              </>
            ) : (
              <button type="button" aria-label={`Edit setting ${setting.key}`} title="Edit" onClick={() => handleEditSetting(setting)} className="p-1 rounded text-amber-600 hover:bg-amber-100/50">
                <Edit size={14} />
              </button>
            )}
          </PermissionGuard>
          <PermissionGuard permission="sekolah.settings.delete">
            <button type="button" aria-label={`Hapus setting ${setting.key}`} title="Hapus" onClick={() => handleDeleteSetting(setting.id, setting.key)} className="p-1 rounded text-red-600 hover:bg-red-100/50">
              <Trash2 size={14} />
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        {isEditing ? (
          renderEditor()
        ) : (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 text-[11px]">Nilai:</span>
            <div>{renderValue()}</div>
          </div>
        )}
      </div>

      <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{setting.meta?.description}</p>
    </div>
  )
}

export default PengaturanSekolahItem
