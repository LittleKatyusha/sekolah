import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import '../../../components/ui/LexicalEditor.css'
import { showSoal, storeSoal, updateSoal } from '../services/soalService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const SoalForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    pertanyaan: '',
    tipe: '',
    trx_ujian_id: '',
    bobot: 1,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchSoal()
    }
  }, [id])

  const fetchSoal = async () => {
    setFetchingData(true)
    const { data, error } = await showSoal(id)
    if (data) {
      const soal = data.data
      const ujianId = soal.trx_ujian_id ? String(soal.trx_ujian_id) : ''

      setFormData({
        pertanyaan: soal.pertanyaan || '',
        tipe: soal.tipe || '',
        trx_ujian_id: ujianId,
        bobot: soal.bobot || 1,
      })
    } else {
      showError('Gagal mengambil data soal')
      navigate('/akademik/soals')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.pertanyaan.trim()) newErrors.pertanyaan = 'Pertanyaan wajib diisi'
    if (!formData.tipe) newErrors.tipe = 'Tipe soal wajib dipilih'
    if (!formData.trx_ujian_id) newErrors.trx_ujian_id = 'Ujian wajib dipilih'
    if (!formData.bobot && formData.bobot !== 0) newErrors.bobot = 'Bobot wajib diisi'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      pertanyaan: formData.pertanyaan,
      tipe: formData.tipe,
      trx_ujian_id: Number(formData.trx_ujian_id),
      bobot: formData.bobot,
    }

    let result
    
    if (isEditMode) {
      result = await updateSoal(id, submitData)
    } else {
      result = await storeSoal(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Soal berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/soals')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} soal`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/soals')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Soal' : 'Tambah Soal Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Pertanyaan */}
              <div>
                <LexicalEditor
                  label="Pertanyaan"
                  required
                  value={formData.pertanyaan}
                  onChange={(html) => setFormData(prev => ({ ...prev, pertanyaan: html }))}
                  placeholder="Tulis pertanyaan..."
                  minHeight="150px"
                />
                {errors.pertanyaan && <p className="mt-1 text-sm text-red-500">{errors.pertanyaan}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipe Soal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipe Soal <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tipe"
                    value={formData.tipe}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih tipe soal</option>
                    <option value="1">Pilihan Ganda</option>
                    <option value="2">Essay</option>
                  </select>
                  {errors.tipe && <p className="mt-1 text-sm text-red-500">{errors.tipe}</p>}
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ujian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ujian <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.trx_ujian_id}
                    name="trx_ujian_id"
                    onChange={handleChange}
                    placeholder="ID ujian"
                    error={errors.trx_ujian_id}
                  />
                </div>

                {/* Bobot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bobot <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="bobot"
                    value={formData.bobot}
                    onChange={handleChange}
                    placeholder="Masukkan bobot soal"
                    min="0"
                    error={errors.bobot}
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/soals')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'soals.update' : 'soals.create'}>
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

export default SoalForm
