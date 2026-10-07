import { useState, useEffect } from 'react'
import { Printer, X, Download, AlertCircle } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { siswaService } from '../services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showToast } from '../../../utils/sweetalert'

export default function CetakKartuModal({ onClose, selectedSiswaIds = [] }) {
  const [targetType, setTargetType] = useState(selectedSiswaIds.length > 0 ? 'selected' : 'all')
  const [kelasList, setKelasList] = useState([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [format, setFormat] = useState('a4')
  const [side, setSide] = useState('front')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    kelasService.getAll({ per_page: 200 }).then(({ data }) => {
      const list = data?.data?.data || data?.data || []
      const arr = Array.isArray(list) ? list : []
      setKelasList(arr)
      if (arr.length > 0) setSelectedKelasId(String(arr[0].id))
    }).catch(() => {})
  }, [])

  const handleCetak = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)

    const payload = { format, side, status: 'aktif' }
    if (targetType === 'selected') {
      if (!selectedSiswaIds.length) {
        setLoading(false)
        return setError('Tidak ada siswa yang dipilih.')
      }
      payload.siswa_ids = selectedSiswaIds
    } else if (targetType === 'kelas') {
      if (!selectedKelasId) {
        setLoading(false)
        return setError('Silakan pilih kelas.')
      }
      payload.kelas_id = Number(selectedKelasId)
    }

    try {
      const res = await siswaService.cetakKartuPelajar(payload)
      if (res?.error) {
        const msg = res.error?.message || 'Gagal membuat file PDF kartu pelajar.'
        setError(msg)
        showToast(msg, 'error')
      } else if (res?.data) {
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kartu_pelajar_${format}_${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => window.URL.revokeObjectURL(url), 10000)
        showToast('Kartu pelajar berhasil diunduh!', 'success')
        onClose()
      }
    } catch (err) {
      const msg = err?.message || 'Terjadi kesalahan saat mengunduh kartu.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Cetak Kartu Pelajar Massal</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pilih target siswa dan format cetak kartu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCetak} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Target Siswa</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {selectedSiswaIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTargetType('selected')}
                  className={`p-2 rounded-lg border text-left ${targetType === 'selected' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 text-primary-900 font-medium' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  Terpilih ({selectedSiswaIds.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-2 rounded-lg border text-left ${targetType === 'all' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 text-primary-900 font-medium' : 'border-gray-200 dark:border-gray-700'}`}
              >
                Semua Siswa Aktif
              </button>
              <button
                type="button"
                onClick={() => setTargetType('kelas')}
                className={`p-2 rounded-lg border text-left ${targetType === 'kelas' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 text-primary-900 font-medium' : 'border-gray-200 dark:border-gray-700'}`}
              >
                Berdasarkan Kelas
              </button>
            </div>

            {targetType === 'kelas' && (
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="input-field text-xs w-full mt-2"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kelas || `Kelas #${k.id}`}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Format Kertas</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className={`p-2.5 rounded-lg border cursor-pointer ${format === 'a4' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 font-medium' : 'border-gray-200 dark:border-gray-700'}`}>
                <input type="radio" name="format" value="a4" checked={format === 'a4'} onChange={() => setFormat('a4')} className="mr-1.5" />
                Lembar A4 (10 Kartu)
              </label>
              <label className={`p-2.5 rounded-lg border cursor-pointer ${format === 'cr80' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 font-medium' : 'border-gray-200 dark:border-gray-700'}`}>
                <input type="radio" name="format" value="cr80" checked={format === 'cr80'} onChange={() => setFormat('cr80')} className="mr-1.5" />
                Satuan CR-80 (PVC)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sisi Kartu</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className={`p-2.5 rounded-lg border cursor-pointer ${side === 'front' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 font-medium' : 'border-gray-200 dark:border-gray-700'}`}>
                <input type="radio" name="side" value="front" checked={side === 'front'} onChange={() => setSide('front')} className="mr-1.5" />
                Hanya Sisi Depan
              </label>
              <label className={`p-2.5 rounded-lg border cursor-pointer ${side === 'both' ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30 font-medium' : 'border-gray-200 dark:border-gray-700'}`}>
                <input type="radio" name="side" value="both" checked={side === 'both'} onChange={() => setSide('both')} className="mr-1.5" />
                Depan & Belakang
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Batal
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              <Download size={16} className="mr-1" /> Unduh PDF Kartu
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
