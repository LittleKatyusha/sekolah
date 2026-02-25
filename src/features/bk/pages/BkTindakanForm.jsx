import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { bkTindakanService, bkKasusService } from '../services/bkService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BkTindakanForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [kasusOptions, setKasusOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [formData, setFormData] = useState({
    trx_bk_kasus_id: '',
    deskripsi_tindakan: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchKasusOptions()
    if (isEditMode) {
      fetchTindakan()
    }
  }, [id])

  const fetchKasusOptions = async () => {
    setLoadingOptions(true)
    const { data } = await bkKasusService.getAll()
    if (data) {
      setKasusOptions((data.data || []).map(k => ({
        value: k.id,
        label: `Kasus #${k.id} - ${k.siswa?.nama || k.keterangan || 'Kasus ' + k.id}`
      })))
    }
    setLoadingOptions(false)
  }

  const fetchTindakan = async () => {
    setFetchingData(true)
    const { data, error } = await bkTindakanService.getById(id)
    if (data) {
      const tindakan = data.data
      setFormData({
        trx_bk_kasus_id: tindakan.trx_bk_kasus_id || '',
        deskripsi_tindakan: tindakan.deskripsi_tindakan || ''
      })
    } else {
      showError('Gagal mengambil data tindakan')
      navigate('/bk/tindakan')
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
    if (!formData.trx_bk_kasus_id) newErrors.trx_bk_kasus_id = 'Kasus BK wajib dipilih'
    if (!formData.deskripsi_tindakan) newErrors.deskripsi_tindakan = 'Deskripsi tindakan wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = { ...formData }

    let result

    if (isEditMode) {
      result = await bkTindakanService.update(id, submitData)
    } else {
      result = await bkTindakanService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Tindakan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/tindakan')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tindakan`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/tindakan')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Tindakan BK' : 'Tambah Tindakan BK'}
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
              {/* Kasus BK */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kasus BK <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="trx_bk_kasus_id"
                  options={kasusOptions}
                  value={formData.trx_bk_kasus_id}
                  onChange={handleChange}
                  placeholder="Pilih Kasus BK"
                  error={errors.trx_bk_kasus_id}
                  disabled={loadingOptions}
                />
              </div>

              {/* Deskripsi Tindakan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi Tindakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="deskripsi_tindakan"
                  value={formData.deskripsi_tindakan}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.deskripsi_tindakan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Deskripsi tindakan"
                />
                {errors.deskripsi_tindakan && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.deskripsi_tindakan) ? errors.deskripsi_tindakan[0] : errors.deskripsi_tindakan}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/tindakan')}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save size={18} className="mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default BkTindakanForm