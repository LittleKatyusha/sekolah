import { useState, useEffect } from 'react'
import { Sparkles, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { generateSoalAi } from '../services/soalService'
import { mapelService } from '../../mapel/services/mapelService'

const TIPE_OPTIONS = [
  { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
  { value: 'essay', label: 'Esai' },
]

const KESULITAN_OPTIONS = [
  { value: 'mudah', label: 'Mudah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'sulit', label: 'Sulit' },
]

const DEFAULT_FORM = {
  mst_mapel_id: '',
  topik: '',
  tipe: 'pilihan_ganda',
  tingkat_kesulitan: 'sedang',
  jumlah: 5,
  kelas: '',
  instruksi_tambahan: '',
}

/**
 * @param {{ open: boolean, onClose: () => void, onSuccess: (soals: any[]) => void }} props
 */
const GenerateSoalModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [mapelList, setMapelList] = useState([])
  const [loadingMapel, setLoadingMapel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { count, soals } | null
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setResult(null)
      setError(null)
      fetchMapel()
    }
  }, [open])

  const fetchMapel = async () => {
    setLoadingMapel(true)
    const { data } = await mapelService.getMapel({ per_page: 200 })
    setMapelList(data?.data ?? [])
    setLoadingMapel(false)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    const payload = {
      mst_mapel_id: Number(form.mst_mapel_id),
      topik: form.topik,
      tipe: form.tipe,
      tingkat_kesulitan: form.tingkat_kesulitan,
      jumlah: Number(form.jumlah),
      ...(form.kelas && { kelas: form.kelas }),
      ...(form.instruksi_tambahan && { instruksi_tambahan: form.instruksi_tambahan }),
    }

    const { data, error: apiError } = await generateSoalAi(payload)
    setLoading(false)

    if (apiError) {
      setError(
        typeof apiError === 'object'
          ? apiError.message ?? JSON.stringify(apiError)
          : String(apiError),
      )
      return
    }

    const soals = data?.data ?? []
    setResult({ count: soals.length, soals })
    onSuccess?.(soals)
  }

  const handleReset = () => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setError(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-violet-600 px-6 py-4 text-white">
          <Sparkles className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Generate Soal dengan AI</h2>
            <p className="text-xs text-violet-200">GPT-4o akan membuat soal berdasarkan topik & parameter yang Anda tentukan</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-violet-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {result ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-14 w-14 text-green-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {result.count} Soal Berhasil Di-generate!
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Soal telah disimpan ke bank soal dan dapat langsung digunakan.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="secondary" onClick={handleReset}>
                  Generate Lagi
                </Button>
                <Button variant="primary" onClick={onClose}>
                  Selesai
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.mst_mapel_id}
                  onChange={(e) => handleChange('mst_mapel_id', e.target.value)}
                  required
                  disabled={loadingMapel}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">
                    {loadingMapel ? 'Memuat...' : '-- Pilih Mata Pelajaran --'}
                  </option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama || m.nama_mapel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topik */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Topik / Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.topik}
                  onChange={(e) => handleChange('topik', e.target.value)}
                  required
                  placeholder="cth: Fotosintesis, Persamaan Linear Dua Variabel, Proklamasi Kemerdekaan…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              {/* Tipe + Kesulitan + Jumlah (2-col grid) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipe Soal
                  </label>
                  <select
                    value={form.tipe}
                    onChange={(e) => handleChange('tipe', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {TIPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={form.tingkat_kesulitan}
                    onChange={(e) => handleChange('tingkat_kesulitan', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {KESULITAN_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jumlah + Kelas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah Soal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.jumlah}
                    onChange={(e) => handleChange('jumlah', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="mt-0.5 text-xs text-gray-400">Maks. 20 soal</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas (opsional)
                  </label>
                  <input
                    type="text"
                    value={form.kelas}
                    onChange={(e) => handleChange('kelas', e.target.value)}
                    placeholder="cth: X, XI IPA, 7A…"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Instruksi Tambahan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instruksi Tambahan (opsional)
                </label>
                <textarea
                  rows={2}
                  value={form.instruksi_tambahan}
                  onChange={(e) => handleChange('instruksi_tambahan', e.target.value)}
                  placeholder="cth: Gunakan konteks Indonesia. Hindari soal yang terlalu mudah."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !form.mst_mapel_id || !form.topik.trim()}
                  className="bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Soal
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerateSoalModal
