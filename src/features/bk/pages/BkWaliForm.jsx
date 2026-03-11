import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { bkWaliService, bkKasusService } from '../services/bkService'
import waliService from '../../wali/services/waliService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BkWaliForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [selectedKasusOption, setSelectedKasusOption] = useState(null)
  const [selectedWaliOption, setSelectedWaliOption] = useState(null)

  const [formData, setFormData] = useState({
    trx_bk_kasus_id: '',
    mst_wali_id: '',
    peran: ''
  })

  const [errors, setErrors] = useState({})

  const buildKasusOption = useCallback((k) => ({
    value: k.id,
    label: `Kasus #${k.id} - ${k.siswa?.nama || k.keterangan || 'Kasus ' + k.id}`
  }), [])

  const buildWaliOption = useCallback((w) => ({
    value: w.id,
    label: `${w.nama}${w.notelp ? ' (' + w.notelp + ')' : ''}`
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

  const searchWaliOptions = useCallback(async (keyword = '') => {
    const { data, error } = await waliService.getWalis({
      search: keyword || undefined,
      per_page: 20
    })
    if (data?.data) {
      return data.data.map(buildWaliOption)
    }
    console.error('Error fetching wali options:', error)
    return []
  }, [buildWaliOption])

  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchWali = async () => {
      setFetchingData(true)
      try {
        const { data } = await bkWaliService.getById(id)
        if (controller.signal.aborted) return

        if (data) {
          const wali = data.data
          setFormData({
            trx_bk_kasus_id: wali.trx_bk_kasus_id || '',
            mst_wali_id: wali.mst_wali_id || wali.wali_murid?.id || '',
            peran: wali.peran || ''
          })

          if (wali.kasus) {
            setSelectedKasusOption(buildKasusOption(wali.kasus))
          } else if (wali.trx_bk_kasus_id) {
            setSelectedKasusOption({
              value: wali.trx_bk_kasus_id,
              label: `Kasus #${wali.trx_bk_kasus_id}`
            })
          }

          if (wali.wali_murid) {
            setSelectedWaliOption(buildWaliOption(wali.wali_murid))
          } else if (wali.mst_wali_id) {
            setSelectedWaliOption({
              value: wali.mst_wali_id,
              label: `Wali #${wali.mst_wali_id}`
            })
          }
        } else {
          showError('Gagal mengambil data wali')
          navigate('/bk/wali')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching wali:', err)
          showError('Gagal mengambil data wali')
          navigate('/bk/wali')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchWali()

    return () => controller.abort()
  }, [id, isEditMode, navigate, buildKasusOption, buildWaliOption])

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
    if (!formData.mst_wali_id) newErrors.mst_wali_id = 'Wali murid wajib dipilih'
    if (!formData.peran) newErrors.peran = 'Peran wajib dipilih'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = { ...formData, peran: parseInt(formData.peran) }

    let result

    if (isEditMode) {
      result = await bkWaliService.update(id, submitData)
    } else {
      result = await bkWaliService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Wali berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/wali')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} wali`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/wali')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Wali BK' : 'Tambah Wali BK'}
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
                  loadOptions={searchKasusOptions}
                  placeholder="Pilih Kasus BK"
                  searchPlaceholder="Cari kasus BK..."
                  noOptionsText="Tidak ada kasus yang cocok"
                  error={errors.trx_bk_kasus_id}
                />
              </div>

              {/* Wali Murid */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Wali Murid <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_wali_id"
                  options={selectedWaliOption ? [selectedWaliOption] : []}
                  value={formData.mst_wali_id}
                  onChange={handleChange}
                  loadOptions={searchWaliOptions}
                  placeholder="Pilih Wali Murid"
                  searchPlaceholder="Cari wali murid..."
                  noOptionsText="Tidak ada wali yang cocok"
                  error={errors.mst_wali_id}
                />
              </div>

              {/* Peran */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peran <span className="text-red-500">*</span>
                </label>
                <select
                  name="peran"
                  value={formData.peran}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.peran ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Pilih Peran</option>
                  <option value={1}>Pelapor</option>
                  <option value={2}>Pendamping</option>
                  <option value={3}>Wali Siswa</option>
                  <option value={4}>Saksi</option>
                </select>
                {errors.peran && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.peran) ? errors.peran[0] : errors.peran}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/wali')}>
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

export default BkWaliForm