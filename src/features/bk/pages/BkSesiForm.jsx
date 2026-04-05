import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { bkSesiService, bkKasusService } from '../services/bkService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const BkSesiForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  const submitPermission = isEditMode ? 'bk.edit' : 'bk.create'

  const { options: metodeOptions } = useReferenceOptions('metode_bk')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [selectedKasusOption, setSelectedKasusOption] = useState(null)

  const [formData, setFormData] = useState({
    trx_bk_kasus_id: '',
    tanggal: '',
    metode: '',
    catatan: ''
  })

  const [errors, setErrors] = useState({})

  const buildKasusOption = useCallback((k) => ({
    value: k.id,
    label: `Kasus #${k.id} - ${k.siswa?.nama || k.keterangan || 'Kasus ' + k.id}`
  }), [])

  const searchKasusOptions = useCallback(async (keyword = '') => {
    const { data, error } = await bkKasusService.getAll({
      search: keyword || undefined,
      per_page: 20
    })
    if (data?.data) {
      return data.data.map(buildKasusOption)
    }
    console.error('Error fetching kasus options:', error)
    return []
  }, [buildKasusOption])

  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchSesi = async () => {
      setFetchingData(true)
      try {
        const { data } = await bkSesiService.getById(id)
        if (controller.signal.aborted) return

        if (data) {
          const sesi = data.data
          setFormData({
            trx_bk_kasus_id: sesi.trx_bk_kasus_id || '',
            tanggal: sesi.tanggal || '',
            metode: sesi.metode || '',
            catatan: sesi.catatan || ''
          })

          if (sesi.kasus) {
            setSelectedKasusOption(buildKasusOption(sesi.kasus))
          } else if (sesi.trx_bk_kasus_id) {
            setSelectedKasusOption({
              value: sesi.trx_bk_kasus_id,
              label: `Kasus #${sesi.trx_bk_kasus_id}`
            })
          }
        } else {
          showError('Gagal mengambil data sesi konseling')
          navigate('/bk/sesi')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching sesi:', err)
          showError('Gagal mengambil data sesi konseling')
          navigate('/bk/sesi')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchSesi()

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
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi'
    if (!formData.metode) newErrors.metode = 'Metode wajib dipilih'
    if (!formData.catatan) newErrors.catatan = 'Catatan wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = { ...formData, metode: parseInt(formData.metode) }

    let result

    if (isEditMode) {
      result = await bkSesiService.update(id, submitData)
    } else {
      result = await bkSesiService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Sesi konseling berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/sesi')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} sesi konseling`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/sesi')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Sesi Konseling' : 'Tambah Sesi Konseling'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kasus BK <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="trx_bk_kasus_id"
                  options={selectedKasusOption ? [selectedKasusOption] : []}
                  value={formData.trx_bk_kasus_id}
                  onChange={handleChange}
                  loadOptions={searchKasusOptions}
                  placeholder="Pilih Kasus BK"
                  searchPlaceholder="Cari kasus BK..."
                  noOptionsText="Tidak ada kasus yang cocok"
                  error={errors.trx_bk_kasus_id}
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Sesi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.tanggal ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.tanggal && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.tanggal) ? errors.tanggal[0] : errors.tanggal}</p>}
              </div>

              {/* Metode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metode <span className="text-red-500">*</span>
                </label>
                <select
                  name="metode"
                  value={formData.metode}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white ${
                    errors.metode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {metodeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.metode && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.metode) ? errors.metode[0] : errors.metode}</p>}
              </div>

              {/* Catatan - full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catatan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.catatan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Catatan sesi konseling"
                />
                {errors.catatan && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.catatan) ? errors.catatan[0] : errors.catatan}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/sesi')}>
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

export default BkSesiForm