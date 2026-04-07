import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kriteriaSeleksiService } from '../services/ppdbService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const TIPE_OPTIONS = [
  { value: 'benefit', label: 'Benefit — semakin tinggi semakin baik' },
  { value: 'cost', label: 'Cost — semakin rendah semakin baik' },
]

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

// Kolom dari ppdb_pendaftar yang bisa menjadi source_field
const SOURCE_FIELD_OPTIONS = [
  { value: '', label: 'Input manual (tidak ada sumber otomatis)' },
  { value: 'nilai_rata_rata_rapor', label: 'nilai_rata_rata_rapor — Rata-rata rapor' },
  { value: 'nilai_mtk', label: 'nilai_mtk — Nilai Matematika' },
  { value: 'nilai_ipa', label: 'nilai_ipa — Nilai IPA' },
  { value: 'nilai_bindo', label: 'nilai_bindo — Nilai Bahasa Indonesia' },
  { value: 'nilai_bing', label: 'nilai_bing — Nilai Bahasa Inggris' },
  { value: 'jumlah_prestasi', label: 'jumlah_prestasi — Jumlah Prestasi' },
  { value: 'tingkat_prestasi_tertinggi', label: 'tingkat_prestasi_tertinggi — Tingkat Prestasi (otomatis konversi)' },
  { value: 'poin_pelanggaran', label: 'poin_pelanggaran — Poin Pelanggaran' },
  { value: 'juz_hafalan', label: 'juz_hafalan — Jumlah Juz Hafalan' },
  { value: 'usia', label: 'usia — Usia (dihitung dari tanggal lahir)' },
]

const KriteriaSeleksiForm = () => {
  const { gelombangId, kriteriaId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!kriteriaId

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    ppdb_gelombang_id: gelombangId || '',
    kode_kriteria: '',
    nama_kriteria: '',
    bobot: '',
    tipe: 'benefit',
    source_field: '',
    nilai_min: '0',
    nilai_max: '100',
    is_required: '1',
    is_active: '1',
    urutan: '0',
    deskripsi: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) fetchKriteria()
  }, [kriteriaId])

  const fetchKriteria = async () => {
    setFetchingData(true)
    const { data, error } = await kriteriaSeleksiService.getById(kriteriaId)
    if (data) {
      const k = data.data
      setFormData({
        ppdb_gelombang_id: String(k.ppdb_gelombang_id || gelombangId),
        kode_kriteria: k.kode_kriteria || '',
        nama_kriteria: k.nama_kriteria || '',
        bobot: String(k.bobot ?? ''),
        tipe: k.tipe || 'benefit',
        source_field: k.source_field || '',
        nilai_min: String(k.nilai_min ?? '0'),
        nilai_max: String(k.nilai_max ?? '100'),
        is_required: k.is_required ? '1' : '0',
        is_active: k.is_active ? '1' : '0',
        urutan: String(k.urutan ?? '0'),
        deskripsi: k.deskripsi || '',
      })
    } else {
      showError('Gagal mengambil data kriteria')
      navigate(`/ppdb/gelombang/${gelombangId}/kriteria`)
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.kode_kriteria.trim()) newErrors.kode_kriteria = 'Kode kriteria wajib diisi'
    if (!formData.nama_kriteria.trim()) newErrors.nama_kriteria = 'Nama kriteria wajib diisi'
    if (!formData.bobot) newErrors.bobot = 'Bobot wajib diisi'
    else if (parseFloat(formData.bobot) <= 0 || parseFloat(formData.bobot) > 100) {
      newErrors.bobot = 'Bobot harus antara 0.01 dan 100'
    }
    if (!formData.tipe) newErrors.tipe = 'Tipe wajib dipilih'
    if (parseFloat(formData.nilai_max) <= parseFloat(formData.nilai_min)) {
      newErrors.nilai_max = 'Nilai maksimum harus lebih besar dari nilai minimum'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const submitData = {
      ppdb_gelombang_id: parseInt(formData.ppdb_gelombang_id),
      kode_kriteria: formData.kode_kriteria.trim().toLowerCase().replace(/\s+/g, '_'),
      nama_kriteria: formData.nama_kriteria,
      bobot: parseFloat(formData.bobot),
      tipe: formData.tipe,
      source_field: formData.source_field || null,
      nilai_min: parseFloat(formData.nilai_min),
      nilai_max: parseFloat(formData.nilai_max),
      is_required: formData.is_required === '1',
      is_active: formData.is_active === '1',
      urutan: parseInt(formData.urutan) || 0,
      deskripsi: formData.deskripsi || null,
    }

    const result = isEditMode
      ? await kriteriaSeleksiService.update(kriteriaId, submitData)
      : await kriteriaSeleksiService.create(submitData)

    if (!result.error) {
      showSuccess(`Kriteria berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate(`/ppdb/gelombang/${gelombangId}/kriteria`)
    } else {
      if (result.error.errors) setErrors(result.error.errors)
      else showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kriteria`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kriteria`)}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kriteria Seleksi' : 'Tambah Kriteria Seleksi'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kode Kriteria <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="kode_kriteria"
                  value={formData.kode_kriteria}
                  onChange={handleChange}
                  placeholder="mis: nilai_rapor, prestasi"
                  error={errors.kode_kriteria}
                  disabled={isEditMode}
                />
                <p className="mt-1 text-xs text-gray-400">Huruf kecil, tanpa spasi (otomatis diformat)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Kriteria <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nama_kriteria"
                  value={formData.nama_kriteria}
                  onChange={handleChange}
                  placeholder="Nama tampilan kriteria"
                  error={errors.nama_kriteria}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bobot (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="bobot"
                  value={formData.bobot}
                  onChange={handleChange}
                  placeholder="0–100"
                  min="0.01"
                  max="100"
                  step="0.01"
                  error={errors.bobot}
                />
                <p className="mt-1 text-xs text-gray-400">Total semua kriteria harus = 100%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipe <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  options={TIPE_OPTIONS}
                  placeholder="Pilih tipe"
                  error={errors.tipe}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nilai Minimum
                </label>
                <Input
                  type="number"
                  name="nilai_min"
                  value={formData.nilai_min}
                  onChange={handleChange}
                  placeholder="0"
                  step="0.01"
                  error={errors.nilai_min}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nilai Maksimum
                </label>
                <Input
                  type="number"
                  name="nilai_max"
                  value={formData.nilai_max}
                  onChange={handleChange}
                  placeholder="100"
                  step="0.01"
                  error={errors.nilai_max}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sumber Data Otomatis
                </label>
                <SearchableSelect
                  name="source_field"
                  value={formData.source_field}
                  onChange={handleChange}
                  options={SOURCE_FIELD_OPTIONS}
                  placeholder="Pilih sumber data (opsional)"
                  error={errors.source_field}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Jika diisi, nilai akan diambil otomatis dari kolom pendaftar saat scoring.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urutan Tampil
                </label>
                <Input
                  type="number"
                  name="urutan"
                  value={formData.urutan}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  error={errors.urutan}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <SearchableSelect
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                  placeholder="Pilih status"
                  error={errors.is_active}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Penjelasan kriteria ini..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kriteria`)}
              >
                Batal
              </Button>
              <PermissionGuard permission="ppdb.seleksi.manage">
                <Button type="submit" disabled={loading}>
                  <Save size={18} className="mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default KriteriaSeleksiForm
