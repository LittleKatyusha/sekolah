import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { nilaiRaporService } from '../services/ppdbService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const NilaiRaporForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pendaftaranId = searchParams.get('pendaftaran_id') || ''
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    ppdb_pendaftar_id: pendaftaranId,
    kode_mapel: '',
    nilai: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) fetchNilai()
  }, [id])

  const fetchNilai = async () => {
    setLoading(true)
    const { data, error } = await nilaiRaporService.getById(id)
    if (data) {
      const d = data.data ?? data
      setFormData({
        ppdb_pendaftar_id: d.ppdb_pendaftar_id ?? pendaftaranId,
        kode_mapel: d.kode_mapel ?? '',
        nilai: d.nilai ?? '',
      })
    } else {
      showError('Gagal mengambil data nilai rapor')
      goBack()
    }
    setLoading(false)
  }

  const goBack = () => {
    const backUrl = pendaftaranId
      ? `/ppdb/nilai-rapor?pendaftaran_id=${pendaftaranId}`
      : '/ppdb/nilai-rapor'
    navigate(backUrl)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.ppdb_pendaftar_id) newErrors.ppdb_pendaftar_id = 'ID Pendaftar wajib diisi'
    if (!formData.kode_mapel.trim()) newErrors.kode_mapel = 'Kode mapel wajib diisi'
    const nilaiNum = parseFloat(formData.nilai)
    if (formData.nilai === '' || isNaN(nilaiNum)) newErrors.nilai = 'Nilai wajib diisi'
    else if (nilaiNum < 0 || nilaiNum > 100) newErrors.nilai = 'Nilai harus antara 0 – 100'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = {
      ppdb_pendaftar_id: Number(formData.ppdb_pendaftar_id),
      kode_mapel: formData.kode_mapel.trim(),
      nilai: parseFloat(formData.nilai),
    }
    const { data, error } = isEdit
      ? await nilaiRaporService.update(id, payload)
      : await nilaiRaporService.create(payload)

    if (!error) {
      showSuccess(isEdit ? 'Nilai rapor berhasil diperbarui' : 'Nilai rapor berhasil ditambahkan')
      goBack()
    } else {
      const msg = error?.message || (isEdit ? 'Gagal memperbarui nilai rapor' : 'Gagal menambahkan nilai rapor')
      showError(msg)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Nilai Rapor' : 'Tambah Nilai Rapor'}
        </h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID Pendaftar <span className="text-red-500">*</span>
            </label>
            <Input
              name="ppdb_pendaftar_id"
              type="number"
              value={formData.ppdb_pendaftar_id}
              onChange={handleChange}
              placeholder="ID Pendaftar PPDB"
              disabled={Boolean(pendaftaranId)}
            />
            {errors.ppdb_pendaftar_id && (
              <p className="mt-1 text-xs text-red-500">{errors.ppdb_pendaftar_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kode Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <Input
              name="kode_mapel"
              value={formData.kode_mapel}
              onChange={handleChange}
              placeholder="Contoh: MTK, B.IND, IPA"
            />
            {errors.kode_mapel && (
              <p className="mt-1 text-xs text-red-500">{errors.kode_mapel}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nilai <span className="text-red-500">*</span>
            </label>
            <Input
              name="nilai"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.nilai}
              onChange={handleChange}
              placeholder="0 – 100"
            />
            {errors.nilai && (
              <p className="mt-1 text-xs text-red-500">{errors.nilai}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>
              Batal
            </Button>
            <PermissionGuard permission="ppdb.pendaftaran.update">
              <Button type="submit" disabled={saving}>
                <Save size={16} className="mr-1" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default NilaiRaporForm
