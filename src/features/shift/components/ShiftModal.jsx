import { useState, useEffect } from 'react'
import { X, Save, Clock } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import JadwalHarianEditor from './JadwalHarianEditor'
import { normalizeTime } from '../constants/shiftConstants'
import { shiftService } from '../services/shiftService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const ShiftModal = ({ isOpen, onClose, shift = null, onSuccess }) => {
  const isEdit = Boolean(shift?.id)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    jam_masuk: '07:00',
    jam_pulang: '14:20',
    toleransi_keterlambatan_menit: 15,
    is_active: true,
    jadwal_harian: null,
  })

  useEffect(() => {
    if (!isOpen) return
    setFormData(shift ? {
      kode: shift.kode || '',
      nama: shift.nama || '',
      jam_masuk: normalizeTime(shift.jam_masuk) || '07:00',
      jam_pulang: normalizeTime(shift.jam_pulang) || '14:20',
      toleransi_keterlambatan_menit: shift.toleransi_keterlambatan_menit ?? 15,
      is_active: shift.is_active ?? true,
      jadwal_harian: shift.jadwal_harian || null,
    } : {
      kode: '',
      nama: '',
      jam_masuk: '07:00',
      jam_pulang: '14:20',
      toleransi_keterlambatan_menit: 15,
      is_active: true,
      jadwal_harian: null,
    })
    setErrors({})
  }, [isOpen, shift])

  if (!isOpen) return null

  const validate = () => {
    const errs = {}
    if (!formData.kode.trim()) errs.kode = 'Kode wajib'
    if (!formData.nama.trim()) errs.nama = 'Nama wajib'
    if (!formData.jam_masuk) errs.jam_masuk = 'Jam masuk wajib'
    if (!formData.jam_pulang) errs.jam_pulang = 'Jam pulang wajib'
    if (formData.jam_pulang && formData.jam_masuk && formData.jam_pulang <= formData.jam_masuk) {
      errs.jam_pulang = 'Harus setelah jam masuk'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const payload = {
      kode: formData.kode.trim().toUpperCase(),
      nama: formData.nama.trim(),
      jam_masuk: formData.jam_masuk,
      jam_pulang: formData.jam_pulang,
      toleransi_keterlambatan_menit: Number(formData.toleransi_keterlambatan_menit) || 0,
      is_active: formData.is_active,
      jadwal_harian: formData.jadwal_harian,
    }

    const { error } = isEdit
      ? await shiftService.update(shift.id, payload)
      : await shiftService.create(payload)

    setLoading(false)
    if (error) {
      showError(error.message || 'Gagal menyimpan shift')
      return
    }
    showSuccess(`Shift ${payload.nama} berhasil disimpan`)
    if (onSuccess) onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-primary-600 dark:text-primary-400" size={18} />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              {isEdit ? `Edit Shift: ${shift.nama}` : 'Tambah Shift Sekolah'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Kode Shift"
              value={formData.kode}
              error={errors.kode}
              disabled={loading || (isEdit && shift?.kode === 'DEFAULT')}
              placeholder="DEFAULT / PAGI"
              onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
            />
            <Input
              label="Nama Shift"
              value={formData.nama}
              error={errors.nama}
              disabled={loading}
              placeholder="Shift Reguler"
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jam Masuk Utama</label>
              <input
                type="time"
                value={formData.jam_masuk}
                disabled={loading}
                onChange={(e) => setFormData({ ...formData, jam_masuk: e.target.value })}
                className="input-field font-mono text-xs"
              />
              {errors.jam_masuk && <p className="mt-1 text-xs text-red-500">{errors.jam_masuk}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jam Pulang Utama</label>
              <input
                type="time"
                value={formData.jam_pulang}
                disabled={loading}
                onChange={(e) => setFormData({ ...formData, jam_pulang: e.target.value })}
                className="input-field font-mono text-xs"
              />
              {errors.jam_pulang && <p className="mt-1 text-xs text-red-500">{errors.jam_pulang}</p>}
            </div>

            <Input
              label="Toleransi (menit)"
              type="number"
              min="0"
              max="180"
              value={formData.toleransi_keterlambatan_menit}
              error={errors.toleransi_keterlambatan_menit}
              disabled={loading}
              onChange={(e) => setFormData({ ...formData, toleransi_keterlambatan_menit: e.target.value })}
            />
          </div>

          <JadwalHarianEditor
            jadwalHarian={formData.jadwal_harian}
            defaultJamMasuk={formData.jam_masuk}
            defaultJamPulang={formData.jam_pulang}
            disabled={loading}
            onChange={(newJadwal) => setFormData({ ...formData, jadwal_harian: newJadwal })}
          />
        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            <Save size={15} className="mr-1" /> Simpan Shift
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ShiftModal
