import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { bkLampiranService, bkKasusService } from '../services/bkService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BkLampiranForm = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [kasusOptions, setKasusOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [formData, setFormData] = useState({
    trx_bk_kasus_id: '',
    keterangan: ''
  })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchKasusOptions()
  }, [])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'Ukuran file maksimal 10MB' }))
        return
      }
      setFile(selectedFile)
      if (errors.file) setErrors(prev => ({ ...prev, file: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.trx_bk_kasus_id) newErrors.trx_bk_kasus_id = 'Kasus BK wajib dipilih'
    if (!file) newErrors.file = 'File wajib dipilih'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const submitData = new FormData()
    submitData.append('trx_bk_kasus_id', formData.trx_bk_kasus_id)
    submitData.append('file', file)
    if (formData.keterangan) submitData.append('keterangan', formData.keterangan)

    const result = await bkLampiranService.create(submitData)
    if (!result.error) {
      showSuccess('Lampiran berhasil ditambahkan!')
      navigate('/bk/lampiran')
    } else {
      if (result.error.errors) setErrors(result.error.errors)
      else showError('Gagal menambahkan lampiran')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/lampiran')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tambah Lampiran BK
        </h1>
      </div>

      <Card>
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

            {/* File Lampiran */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Lampiran <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100
                  dark:file:bg-primary-900 dark:file:text-primary-300"
              />
              {file && <p className="mt-1 text-sm text-gray-500">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
              {errors.file && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.file) ? errors.file[0] : errors.file}</p>}
            </div>

            {/* Keterangan */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleChange}
                rows={3}
                maxLength={255}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                  errors.keterangan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Keterangan lampiran (opsional)"
              />
              {errors.keterangan && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.keterangan) ? errors.keterangan[0] : errors.keterangan}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/bk/lampiran')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default BkLampiranForm