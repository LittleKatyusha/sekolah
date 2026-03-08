import { useCallback, useEffect, useState } from 'react'
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
  
  const [selectedUjianOption, setSelectedUjianOption] = useState(null)
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  
  const [formData, setFormData] = useState({
    trx_ujian_id: '',
    mst_siswa_id: ''
  })

  const [errors, setErrors] = useState({})

  const buildUjianOption = useCallback((ujian) => ({
    value: String(ujian.id),
    label: ujian.nama || `Ujian #${ujian.id} - ${ujian.mapel?.nama || 'Unknown'}`
  }), [])

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nama || `Siswa #${siswa.id}`} (${siswa.nis || '-'}) - ${siswa.kelas?.nama_kelas || 'No Class'}`
  }), [])

  const searchUjianOptions = useCallback(async (keyword = '') => {
    const { data, error } = await ujianService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildUjianOption)
    }

    console.error('Error fetching ujian:', error)
    return []
  }, [buildUjianOption])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Error fetching siswa:', error)
    return []
  }, [buildSiswaOption])

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
      const ujianId = ujianUser.trx_ujian_id?.toString() || ujianUser.ujian?.id?.toString() || ''
      const siswaId = ujianUser.mst_siswa_id?.toString() || ujianUser.siswa?.id?.toString() || ''

      setFormData({
        trx_ujian_id: ujianId,
        mst_siswa_id: siswaId
      })

      if (ujianUser.ujian?.id) {
        setSelectedUjianOption(buildUjianOption(ujianUser.ujian))
      }

      if (ujianUser.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(ujianUser.siswa))
      }
    } else {
      showError('Gagal mengambil data ujian user')
      navigate('/akademik/ujian-user')
    }
    setFetchingData(false)
  }

  const hydrateSelectedUjianOption = useCallback(async (ujianId) => {
    if (!ujianId) {
      setSelectedUjianOption(null)
      return
    }

    const { data } = await ujianService.getById(ujianId)
    const ujian = data?.data

    if (ujian) {
      setSelectedUjianOption(buildUjianOption(ujian))
      return
    }

    setSelectedUjianOption({
      value: String(ujianId),
      label: `Ujian #${ujianId}`
    })
  }, [buildUjianOption])

  const hydrateSelectedSiswaOption = useCallback(async (siswaId) => {
    if (!siswaId) {
      setSelectedSiswaOption(null)
      return
    }

    const { data } = await siswaService.getById(siswaId)
    const siswa = data?.data

    if (siswa) {
      setSelectedSiswaOption(buildSiswaOption(siswa))
      return
    }

    setSelectedSiswaOption({
      value: String(siswaId),
      label: `Siswa #${siswaId}`
    })
  }, [buildSiswaOption])

  useEffect(() => {
    if (formData.trx_ujian_id) {
      hydrateSelectedUjianOption(formData.trx_ujian_id)
    } else {
      setSelectedUjianOption(null)
    }
  }, [formData.trx_ujian_id, hydrateSelectedUjianOption])

  useEffect(() => {
    if (formData.mst_siswa_id) {
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption])

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
                <SearchableSelect
                  name="trx_ujian_id"
                  value={formData.trx_ujian_id}
                  onChange={handleChange}
                  options={selectedUjianOption ? [selectedUjianOption] : []}
                  loadOptions={searchUjianOptions}
                  placeholder="Pilih Ujian"
                  searchPlaceholder="Cari ujian berdasarkan nama..."
                  noOptionsText="Tidak ada ujian yang cocok"
                  error={errors.trx_ujian_id}
                />
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
                <SearchableSelect
                  name="mst_siswa_id"
                  value={formData.mst_siswa_id}
                  onChange={handleChange}
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  loadOptions={searchSiswaOptions}
                  placeholder="Pilih Siswa"
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errors.mst_siswa_id}
                />
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

export default UjianUserForm