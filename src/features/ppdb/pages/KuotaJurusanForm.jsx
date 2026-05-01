import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kuotaJurusanService } from '../services/ppdbService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const KuotaJurusanForm = () => {
  const { gelombangId, kuotaId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!kuotaId

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    ppdb_gelombang_id: gelombangId || '',
    jurusan_id: '',
    kuota: '',
    kuota_cadangan: '0',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) fetchKuota()
  }, [kuotaId])

  const fetchKuota = async () => {
    setFetchingData(true)
    const { data, error } = await kuotaJurusanService.getById(kuotaId)

    if (data) {
      const k = data.data
      setFormData({
        ppdb_gelombang_id: String(k.ppdb_gelombang_id || gelombangId),
        jurusan_id: k.jurusan_id ? String(k.jurusan_id) : '',
        kuota: String(k.kuota ?? ''),
        kuota_cadangan: String(k.kuota_cadangan ?? '0'),
      })
    } else {
      showError('Gagal mengambil data kuota')
      navigate(`/ppdb/gelombang/${gelombangId}/kuota`)
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
    if (!formData.jurusan_id) newErrors.jurusan_id = 'ID Jurusan wajib diisi'
    if (!formData.kuota) newErrors.kuota = 'Kuota wajib diisi'
    else if (parseInt(formData.kuota) < 1) newErrors.kuota = 'Kuota minimal 1'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const submitData = {
      ppdb_gelombang_id: parseInt(formData.ppdb_gelombang_id),
      jurusan_id: formData.jurusan_id ? parseInt(formData.jurusan_id) : null,
      kuota: parseInt(formData.kuota),
      kuota_cadangan: parseInt(formData.kuota_cadangan) || 0,
    }

    const result = isEditMode
      ? await kuotaJurusanService.update(kuotaId, submitData)
      : await kuotaJurusanService.create(submitData)

    if (!result.error) {
      showSuccess(`Kuota jurusan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate(`/ppdb/gelombang/${gelombangId}/kuota`)
    } else {
      if (result.error.errors) setErrors(result.error.errors)
      else showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kuota jurusan`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kuota`)}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kuota Jurusan' : 'Tambah Kuota Jurusan'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Jurusan <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="jurusan_id"
                  value={formData.jurusan_id}
                  onChange={handleChange}
                  placeholder="ID dari master jurusan"
                  error={errors.jurusan_id}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Nama jurusan akan diambil otomatis dari data master.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kuota Diterima <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="kuota"
                  value={formData.kuota}
                  onChange={handleChange}
                  placeholder="mis: 30"
                  min="1"
                  error={errors.kuota}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kuota Cadangan
                </label>
                <Input
                  type="number"
                  name="kuota_cadangan"
                  value={formData.kuota_cadangan}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  error={errors.kuota_cadangan}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Pendaftar cadangan yang akan dihubungi jika peserta utama mengundurkan diri.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kuota`)}
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

export default KuotaJurusanForm
