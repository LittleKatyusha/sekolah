import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { eksKegiatanService, ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: 'dijadwalkan', label: 'Dijadwalkan' },
  { value: 'terlaksana', label: 'Terlaksana' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

const EksKegiatanForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [ekskulOptions, setEkskulOptions] = useState([])

  const [formData, setFormData] = useState({
    ekstrakurikuler_id: '',
    nama_kegiatan: '',
    tanggal: '',
    jam_mulai: '',
    jam_selesai: '',
    lokasi: '',
    deskripsi: '',
    pembina_guru_id: '',
    status: 'dijadwalkan',
  })

  const [errors, setErrors] = useState({})
  const [selectedGuruOption, setSelectedGuruOption] = useState(null)

  useEffect(() => {
    ekstrakurikulerService.getAktif().then((res) => {
      if (res.data?.data) {
        setEkskulOptions(res.data.data.map((e) => ({ value: String(e.id), label: `${e.nama} (${e.hari || '-'})` })))
      }
    })
  }, [])

  useEffect(() => {
    if (isEditMode) {
      setFetchingData(true)
      eksKegiatanService.getById(id).then((res) => {
        if (res.data?.data) {
          const k = res.data.data
          setFormData({
            ekstrakurikuler_id: String(k.ekstrakurikuler_id || ''),
            nama_kegiatan: k.nama_kegiatan || '',
            tanggal: k.tanggal || '',
            jam_mulai: k.jam_mulai || '',
            jam_selesai: k.jam_selesai || '',
            lokasi: k.lokasi || '',
            deskripsi: k.deskripsi || '',
            pembina_guru_id: k.pembina_guru_id ? String(k.pembina_guru_id) : '',
            status: k.status || 'dijadwalkan',
          })
          if (k.pembina) {
            setSelectedGuruOption({ value: String(k.pembina.id), label: k.pembina.nama })
          }
        } else {
          showError('Gagal memuat data kegiatan')
          navigate('/ekstrakurikuler/kegiatan')
        }
      }).finally(() => setFetchingData(false))
    }
  }, [id, isEditMode, navigate])

  const searchGuruOptions = useCallback(async (keyword = '') => {
    const { data } = await guruService.getAll({ search: keyword || undefined, per_page: 20 })
    if (data?.data) {
      return data.data.map((g) => ({ value: String(g.id), label: g.nama }))
    }
    return []
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.ekstrakurikuler_id) newErrors.ekstrakurikuler_id = 'Pilih ekstrakurikuler'
    if (!formData.nama_kegiatan.trim()) newErrors.nama_kegiatan = 'Nama kegiatan wajib diisi'
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal kegiatan wajib diisi'
    if (formData.jam_mulai && formData.jam_selesai && formData.jam_mulai >= formData.jam_selesai) {
      newErrors.jam_selesai = 'Jam selesai harus setelah jam mulai'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const payload = {
      ...formData,
      ekstrakurikuler_id: Number(formData.ekstrakurikuler_id),
      pembina_guru_id: formData.pembina_guru_id ? Number(formData.pembina_guru_id) : null,
      jam_mulai: formData.jam_mulai || null,
      jam_selesai: formData.jam_selesai || null,
    }

    const { error } = isEditMode
      ? await eksKegiatanService.update(id, payload)
      : await eksKegiatanService.create(payload)

    setLoading(false)
    if (!error) {
      showSuccess(`Kegiatan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
  if (fetchingData) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/ekstrakurikuler/kegiatan')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kegiatan Ekstrakurikuler' : 'Tambah Kegiatan Ekstrakurikuler'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ekstrakurikuler <span className="text-red-500">*</span>
              </label>
              <select
                name="ekstrakurikuler_id"
                value={formData.ekstrakurikuler_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
              >
                <option value="">-- Pilih Ekstrakurikuler --</option>
                {ekskulOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.ekstrakurikuler_id && <p className="text-xs text-red-500 mt-1">{errors.ekstrakurikuler_id}</p>}
            </div>

            <Input
              label="Nama Kegiatan"
              name="nama_kegiatan"
              value={formData.nama_kegiatan}
              onChange={handleChange}
              error={errors.nama_kegiatan}
              placeholder="Contoh: Latihan Rutin PBB, Gelar Senja, dll."
              required
            />

            <Input
              label="Tanggal Kegiatan"
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              error={errors.tanggal}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Pelaksanaan
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Jam Mulai"
              type="time"
              name="jam_mulai"
              value={formData.jam_mulai}
              onChange={handleChange}
              error={errors.jam_mulai}
            />

            <Input
              label="Jam Selesai"
              type="time"
              name="jam_selesai"
              value={formData.jam_selesai}
              onChange={handleChange}
              error={errors.jam_selesai}
            />

            <Input
              label="Lokasi Kegiatan"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              placeholder="Contoh: Lapangan Utama, Ruang Musik, Lab Komputer"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pembina / Pendamping (Opsional)
              </label>
              <SearchableSelect
                loadOptions={searchGuruOptions}
                value={selectedGuruOption}
                onChange={(opt) => {
                  setSelectedGuruOption(opt)
                  setFormData((prev) => ({ ...prev, pembina_guru_id: opt ? opt.value : '' }))
                }}
                placeholder="Cari nama guru..."
                isClearable
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi & Agenda Kegiatan
            </label>
            <textarea
              name="deskripsi"
              rows={4}
              value={formData.deskripsi}
              onChange={handleChange}
              placeholder="Rincian materi latihan, perlengkapan yang perlu dibawa, atau catatan..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/ekstrakurikuler/kegiatan')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )

      navigate('/ekstrakurikuler/kegiatan')
    } else {
      showError(error?.message || 'Gagal menyimpan kegiatan')
    }
  }
}

export default EksKegiatanForm
