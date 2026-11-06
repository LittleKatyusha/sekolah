import { memo } from 'react'
import { Clock, Sparkles } from 'lucide-react'
import { DAYS_OF_WEEK, normalizeTime } from '../constants/shiftConstants'

const JadwalHarianEditor = ({
  jadwalHarian = {},
  onChange,
  defaultJamMasuk = '07:00',
  defaultJamPulang = '14:20',
  disabled = false,
}) => {
  const current = jadwalHarian && typeof jadwalHarian === 'object' ? jadwalHarian : {}

  const handleToggle = (key) => {
    if (disabled) return
    const updated = { ...current }
    if (updated[key]) {
      delete updated[key]
    } else {
      updated[key] = {
        jam_masuk: normalizeTime(defaultJamMasuk) || '07:00',
        jam_pulang: key === 'FRI' ? '11:30' : (normalizeTime(defaultJamPulang) || '14:20'),
      }
    }
    onChange(Object.keys(updated).length > 0 ? updated : null)
  }

  const handleTimeChange = (key, field, val) => {
    if (disabled) return
    onChange({ ...current, [key]: { ...(current[key] || {}), [field]: val } })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg">
        <div>
          <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Clock size={13} className="text-amber-600 dark:text-amber-400" />
            Jadwal Kepulangan Khusus Per Hari
          </span>
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Aktifkan hari tertentu jika jam pulang berbeda (mis. Jumat pulang 11:30).
          </p>
        </div>
        {!current.FRI && (
          <button
            type="button"
            onClick={() => !disabled && onChange({ ...current, FRI: { jam_masuk: normalizeTime(defaultJamMasuk) || '07:00', jam_pulang: '11:30' } })}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded shrink-0"
          >
            <Sparkles size={12} /> Preset Jumat 11:30
          </button>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
        {DAYS_OF_WEEK.map((d) => {
          const isSet = Boolean(current[d.key])
          const dData = current[d.key] || {}
          const masuk = normalizeTime(dData.jam_masuk) || normalizeTime(defaultJamMasuk) || '07:00'
          const pulang = normalizeTime(dData.jam_pulang) || normalizeTime(defaultJamPulang) || '14:20'
          const invalid = isSet && pulang <= masuk

          return (
            <div key={d.key} className={`p-2.5 ${isSet ? 'bg-primary-50/20 dark:bg-primary-950/20' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSet}
                    disabled={disabled}
                    onChange={() => handleToggle(d.key)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    {d.label} <span className="text-[10px] text-gray-400 font-mono">({d.key})</span>
                  </span>
                </label>

                {isSet ? (
                  <div className="flex flex-wrap items-center gap-2 pl-5 sm:pl-0">
                    <span className="text-[11px] text-gray-500">Masuk:</span>
                    <input
                      type="time"
                      value={masuk}
                      disabled={disabled}
                      onChange={(e) => handleTimeChange(d.key, 'jam_masuk', e.target.value)}
                      className="px-1.5 py-0.5 text-xs font-mono border rounded bg-white dark:bg-gray-800"
                    />
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                    <span className="text-[11px] font-medium text-amber-600">Pulang:</span>
                    <input
                      type="time"
                      value={pulang}
                      disabled={disabled}
                      onChange={(e) => handleTimeChange(d.key, 'jam_pulang', e.target.value)}
                      className={`px-1.5 py-0.5 text-xs font-mono font-bold border rounded bg-white dark:bg-gray-800 ${invalid ? 'border-red-500 text-red-600' : 'border-amber-400 text-amber-900 dark:text-amber-200'}`}
                    />
                    <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      Khusus
                    </span>
                    {invalid && (
                      <span className="w-full text-[10px] text-red-500">Jam pulang harus setelah jam masuk.</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 pl-5 sm:pl-0">
                    Default: {normalizeTime(defaultJamMasuk) || '07:00'} - {normalizeTime(defaultJamPulang) || '14:20'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(JadwalHarianEditor)
