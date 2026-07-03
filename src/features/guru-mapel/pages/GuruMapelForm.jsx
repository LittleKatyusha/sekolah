import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { guruMapelService } from '../services/guruMapelService'
import { apiService } from '../../../utils/api'
import { showSuccess, showError } from '../../../utils/sweetalert'

const GuruMapelForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_guru_id: '',
    mst_mapel_id: '',
  })

  const [errors, setErrors] = useState({})
  const [selectedGuruOption, setSelectedGuruOption] = useState(null)
  const [selectedMapelOption, setSelectedMapelOption] = useState(null)

  useEffect(() => {
    if (isEditMode) fetchGuruMapel()
  }, [id])

  const fetchGuruMapel = async () => {
    setFetchingData(true)
    const { data, error } = await guruMapelService.getGuruMapelById(id)
    if (data) {
      const item = data.data
      setFormData({
        mst_guru_id: String(item.mst_guru_id),
        mst_mapel_id: String(item.mst_mapel_id),
      })
      if (item.guru) {
        setSelectedGuruOption({ value: String(item.mst_guru_id), label: item.guru.nama })
      }
      if (item.mapel) {
        setSelectedMapelOption({
          value: String(item.mst_mapel_id),
          label: `${item.mapel.kode} - ${item.mapel.nama}`,
        })
      }
    } else {
      showError('Gagal mengambil data guru mata pelajaran')
      navigate('/guru-mapel')
    }
    setFetchingData(false)
  }

  const searchGuruOptions = useCallback(async (keyword = '') => {
    const { data } = await apiService.get('/guru/', {
      params: { search: keyword || undefined, per_page: 20 },
    })
    if (data?.data) {
      return data.data.map((g) => ({ value: String(g.id), label: g.nama }))
    }
    return []
  }, [])

  const searchMapelOptions = useCallback(async (keyword = '') => {
    const { data } = await apiService.get('/mapel/', {
      params: { search: keyword || undefined, per_page: 20 },
    })
    if (data?.data) {
      return data.data.map((m) => ({ value: String(m.id), label: `${m.kode} - ${m.nama}` }))
    }
    return []
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value ?? '' }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_guru_id) newErrors.mst_guru_id = 'Guru wajib dipilih'
    if (!formData.mst_mapel_id) newErrors.mst_mapel_id = 'Mata pelajaran wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const payload = {
      mst_guru_id: Number(formData.mst_guru_id),
      mst_mapel_id: Number(formData.mst_mapel_id),
    }

    const result = isEditMode
      ? await guruMapelService.updateGuruMapel(id, payload)
      : await guruMapelService.createGuruMapel(payload)

    const { error } = result

    if (!error) {
      showSuccess(`Data guru mata pelajaran berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/guru-mapel')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} data guru mata pelajaran`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/guru-mapel')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Guru Mata Pelajaran' : 'Tambah Guru Mata Pelajaran'}
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
              {/* Guru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guru <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_guru_id"
                  value={formData.mst_guru_id}
                  onChange={handleChange}
                  options={selectedGuruOption ? [selectedGuruOption] : []}
                  loadOptions={searchGuruOptions}
                  placeholder="Pilih Guru"
                  searchPlaceholder="Cari nama guru..."
                  error={errors.mst_guru_id}
                />
                {errors.mst_guru_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.mst_guru_id}</p>
                )}
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_mapel_id"
                  value={formData.mst_mapel_id}
                  onChange={handleChange}
                  options={selectedMapelOption ? [selectedMapelOption] : []}
                  loadOptions={searchMapelOptions}
                  placeholder="Pilih Mata Pelajaran"
                  searchPlaceholder="Cari mata pelajaran..."
                  error={errors.mst_mapel_id}
                />
                {errors.mst_mapel_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.mst_mapel_id}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/guru-mapel')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'guru-mapel.update' : 'guru-mapel.create'}>
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

export default GuruMapelForm
