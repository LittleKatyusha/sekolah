import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { ujianUserService } from '../services/ujianUserService'
import { ujianService } from '../../ujian/services/ujianService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const UjianUserForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  // Data for searchable selects
  const [ujianList, setUjianList] = useState([])
  const [siswaList, setSiswaList] = useState([])
  const [loadingUjian, setLoadingUjian] = useState(false)
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  
  const [formData, setFormData] = useState({
    trx_ujian_id: '',
    mst_siswa_id: ''
  })

  const [errors, setErrors] = useState({})

  // Fetch ujian list
  useEffect(() => {
    const fetchUjianList = async () => {
      setLoadingUjian(true)
      const { data, error } = await ujianService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(ujian => ({
          value: ujian.id,
          label: ujian.nama || `Ujian #${ujian.id} - ${ujian.mapel?.nama || 'Unknown'}`
        }))
        setUjianList(options)
      } else {
        console.error('Error fetching ujian:', error)
      }
      setLoadingUjian(false)
    }
    fetchUjianList()
  }, [])

  // Fetch siswa list
  useEffect(() => {
    const fetchSiswaList = async () => {
      setLoadingSiswa(true)
      const { data, error } = await siswaService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(siswa => ({
          value: siswa.id,
          label: `${siswa.nama} (${siswa.nis}) - ${siswa.kelas?.nama_kelas || 'No Class'}`
        }))
        setSiswaList(options)
      } else {
        console.error('Error fetching siswa:', error)
      }
      setLoadingSiswa(false)
    }
    fetchSiswaList()
  }, [])

  // Fetch existing data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchUjianUser()
    }
  }, [id])

  const fetchUjianUser = async () => {
    setFetchingData(true)
    const { data, error } = await ujianUserService.getById(id)
    if (data) {
      const ujianUser = data.data
      setFormData({
        trx_ujian_id: ujianUser.trx_ujian_id?.toString() || '',
        mst_siswa_id: ujianUser.mst_siswa_id?.toString() || ''
      })
    } else {
      showError('Gagal mengambil data ujian user')
      navigate('/akademik/ujian-user')
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
    if (!formData.trx_ujian_id) newErrors.trx_ujian_id = 'Ujian wajib dipilih'
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      trx_ujian_id: parseInt(formData.trx_ujian_id),
      mst_siswa_id: parseInt(formData.mst_siswa_id)
    }

    let result
    
    if (isEditMode) {
      result = await ujianUserService.update(id, submitData)
    } else {
      result = await ujianUserService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Ujian user berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/ujian-user')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} ujian user`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Ujian User' : 'Tambah Ujian User Baru'}
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
              {/* Ujian Select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ujian <span className="text-red-500">*</span>
                </label>
                {loadingUjian ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm">Memuat data ujian...</span>
                  </div>
                ) : (
                  <SearchableSelect
                    name="trx_ujian_id"
                    value={formData.trx_ujian_id}
                    onChange={handleChange}
                    options={ujianList}
                    placeholder="Pilih Ujian"
                    error={errors.trx_ujian_id}
                  />
                )}
                {errors.trx_ujian_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.trx_ujian_id) ? errors.trx_ujian_id[0] : errors.trx_ujian_id}
                  </p>
                )}
              </div>

              {/* Siswa Select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                {loadingSiswa ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm">Memuat data siswa...</span>
                  </div>
                ) : (
                  <SearchableSelect
                    name="mst_siswa_id"
                    value={formData.mst_siswa_id}
                    onChange={handleChange}
                    options={siswaList}
                    placeholder="Pilih Siswa"
                    error={errors.mst_siswa_id}
                  />
                )}
                {errors.mst_siswa_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.mst_siswa_id) ? errors.mst_siswa_id[0] : errors.mst_siswa_id}
                  </p>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Informasi</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Pastikan ujian dan siswa sudah benar sebelum menyimpan</li>
                <li>Setelah disimpan, status ujian user akan menjadi "Belum Mulai"</li>
                <li>Siswa dapat memulai ujian setelah data ini dibuat</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>
                Batal
              </Button>
              <Button type="submit" disabled={loading || loadingUjian || loadingSiswa}>
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

export default UjianUserForm