import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { bkHasilService, bkKasusService } from '../services/bkService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BkHasilForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  const submitPermission = isEditMode ? 'bk.edit' : 'bk.create'

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [selectedKasusOption, setSelectedKasusOption] = useState(null)

  const [formData, setFormData] = useState({
    trx_bk_kasus_id: '',
    hasil: '',
    rekomendasi: ''
  })

  const [errors, setErrors] = useState({})

  const buildKasusOption = useCallback((kasus) => ({
    value: String(kasus.id),
    label: `Kasus #${kasus.id} - ${kasus.siswa?.nama || kasus.keterangan || `Kasus ${kasus.id}`}`
  }), [])

  const searchKasusOptions = useCallback(async (keyword = '') => {
    const { data } = await bkKasusService.getAll({
      search: keyword || undefined,
      per_page: 20,
    })
    const list = data?.data || []
    return list.map(buildKasusOption)
  }, [buildKasusOption])

  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchHasil = async () => {
      setFetchingData(true)
      try {
        const { data } = await bkHasilService.getById(id)
        if (controller.signal.aborted) return

        if (data) {
          const hasil = data.data
          setFormData({
            trx_bk_kasus_id: String(hasil.trx_bk_kasus_id || hasil.kasus?.id || ''),
            hasil: hasil.hasil || '',
            rekomendasi: hasil.rekomendasi || ''
          })

          if (hasil.kasus?.id) {
            setSelectedKasusOption(buildKasusOption(hasil.kasus))
          } else if (hasil.trx_bk_kasus_id) {
            setSelectedKasusOption({
              value: String(hasil.trx_bk_kasus_id),
              label: `Kasus #${hasil.trx_bk_kasus_id}`
            })
          }
        } else {
          showError('Gagal mengambil data hasil konseling')
          navigate('/bk/hasil')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching hasil:', err)
          showError('Gagal mengambil data hasil konseling')
          navigate('/bk/hasil')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchHasil()

    return () => controller.abort()
  }, [id, isEditMode, navigate, buildKasusOption])

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
    if (!formData.hasil) newErrors.hasil = 'Hasil wajib diisi'
    if (!formData.rekomendasi) newErrors.rekomendasi = 'Rekomendasi wajib diisi'

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
      result = await bkHasilService.update(id, submitData)
    } else {
      result = await bkHasilService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Hasil konseling berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/hasil')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} hasil konseling`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/hasil')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Hasil Konseling' : 'Tambah Hasil Konseling'}
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
                  options={selectedKasusOption ? [selectedKasusOption] : []}
                  value={formData.trx_bk_kasus_id}
                  onChange={handleChange}
                  placeholder="Pilih Kasus BK"
                  loadOptions={searchKasusOptions}
                  searchPlaceholder="Cari kasus BK..."
                  noOptionsText="Tidak ada kasus yang cocok"
                  error={errors.trx_bk_kasus_id}
                />
              </div>

              {/* Hasil */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hasil Konseling <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="hasil"
                  value={formData.hasil}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.hasil ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Hasil konseling"
                />
                {errors.hasil && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.hasil) ? errors.hasil[0] : errors.hasil}</p>}
              </div>

              {/* Rekomendasi */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rekomendasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="rekomendasi"
                  value={formData.rekomendasi}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.rekomendasi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Rekomendasi"
                />
                {errors.rekomendasi && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.rekomendasi) ? errors.rekomendasi[0] : errors.rekomendasi}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/hasil')}>
                Batal
              </Button>
              <PermissionGuard permission={submitPermission}>
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

export default BkHasilForm