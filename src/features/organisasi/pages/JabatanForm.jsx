import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { jabatanService } from '../services/organisasiService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const JabatanForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    urutan: '',
  })

  const [errors, setErrors] = useState({})

  const fetchJabatan = useCallback(async () => {
    setFetchingData(true)
    const { data } = await jabatanService.getById(id)
    if (data) {
      const j = data.data
      setFormData({
        nama: j.nama || '',
        deskripsi: j.deskripsi || '',
        urutan: j.urutan != null ? String(j.urutan) : '',
      })
    } else {
      showError('Gagal mengambil data jabatan')
      navigate('/organisasi/jabatan')
    }
    setFetchingData(false)
  }, [id, navigate])

  useEffect(() => {
    if (isEditMode) {
      fetchJabatan()
    }
  }, [fetchJabatan, isEditMode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nama.trim()) newErrors.nama = 'Nama jabatan wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      nama: formData.nama.trim(),
      deskripsi: formData.deskripsi.trim() || null,
      urutan: formData.urutan !== '' ? parseInt(formData.urutan) : null,
    }

    const result = isEditMode
      ? await jabatanService.update(id, submitData)
      : await jabatanService.create(submitData)

    const { error } = result

    if (!error) {
      showSuccess(`Jabatan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/organisasi/jabatan')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} jabatan`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/organisasi/jabatan')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Jabatan Organisasi' : 'Tambah Jabatan Organisasi'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Jabatan <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Contoh: Ketua, Sekretaris"
                  error={errors.nama}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urutan
                </label>
                <Input
                  type="number"
                  name="urutan"
                  value={formData.urutan}
                  onChange={handleChange}
                  placeholder="Contoh: 1"
                  min="0"
                  error={errors.urutan}
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
                  placeholder="Deskripsi jabatan (opsional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-600">{errors.deskripsi}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/organisasi/jabatan')}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save size={18} className="mr-2" />
                )}
                {isEditMode ? 'Simpan Perubahan' : 'Tambah Jabatan'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default JabatanForm
