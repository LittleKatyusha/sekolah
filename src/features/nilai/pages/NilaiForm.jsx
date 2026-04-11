import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { nilaiService } from '../services/nilaiService'
import { siswaService } from '../../siswa/services/siswaService'
import { ujianService } from '../../ujian/services/ujianService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const NilaiForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    trx_ujian_id: '',
    nilai: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [selectedUjianOption, setSelectedUjianOption] = useState(null)

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nis || '-'} - ${siswa.nama || `Siswa #${siswa.id}`}`
  }), [])

  const buildUjianOption = useCallback((ujian) => ({
    value: String(ujian.id),
    label: `${ujian.mapel.nama} - ${ujian.jenis} - ${ujian.semester}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Failed to fetch siswa:', error)
    return []
  }, [buildSiswaOption])

  const searchUjianOptions = useCallback(async (keyword = '') => {
    const { data, error } = await ujianService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildUjianOption)
    }

    console.error('Failed to fetch ujian:', error)
    return []
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
    }
  }, [buildSiswaOption])

  const hydrateSelectedUjianOption = useCallback(async (ujianId) => {
    if (!ujianId) {
      setSelectedUjianOption(null)
      return
    }

    const { data } = await ujianService.getById(ujianId)
    const ujian = data?.data

    if (ujian) {
      setSelectedUjianOption(buildUjianOption(ujian))
    }
  }, [buildUjianOption])

  useEffect(() => {
    if (isEditMode) {
      fetchNilai()
    }
  }, [id])

  useEffect(() => {
    if (formData.mst_siswa_id) {
      if (String(selectedSiswaOption?.value) === String(formData.mst_siswa_id)) {
        return
      }
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption, selectedSiswaOption?.value])

  useEffect(() => {
    if (formData.trx_ujian_id) {
      if (String(selectedUjianOption?.value) === String(formData.trx_ujian_id)) {
        return
      }
      hydrateSelectedUjianOption(formData.trx_ujian_id)
    } else {
      setSelectedUjianOption(null)
    }
  }, [formData.trx_ujian_id, hydrateSelectedUjianOption, selectedUjianOption?.value])

  const fetchNilai = async () => {
    setFetchingData(true)
    const { data, error } = await nilaiService.getById(id)
    if (data) {
      const nilai = data.data
      setFormData({
        mst_siswa_id: String(nilai.mst_siswa_id) || '',
        trx_ujian_id: String(nilai.trx_ujian_id) || '',
        nilai: nilai.nilai !== null && nilai.nilai !== undefined ? String(nilai.nilai) : '',
        keterangan: nilai.keterangan || ''
      })

      if (nilai.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(nilai.siswa))
      }

      if (nilai.ujian?.id) {
        setSelectedUjianOption(buildUjianOption(nilai.ujian))
      }
    } else {
      showError('Gagal mengambil data nilai')
      navigate('/akademik/nilai')
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
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (!formData.trx_ujian_id) newErrors.trx_ujian_id = 'Ujian wajib dipilih'
    if (!formData.nilai && formData.nilai !== '0') newErrors.nilai = 'Nilai wajib diisi'
    
    const nilaiNum = parseFloat(formData.nilai)
    if (formData.nilai && (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100)) {
      newErrors.nilai = 'Nilai harus berupa angka antara 0 - 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      trx_ujian_id: parseInt(formData.trx_ujian_id),
      nilai: parseFloat(formData.nilai),
      keterangan: formData.keterangan || null
    }

    let result
    
    if (isEditMode) {
      result = await nilaiService.update(id, submitData)
    } else {
      result = await nilaiService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Nilai berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/nilai')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} nilai`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/nilai')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Nilai' : 'Tambah Nilai Baru'}
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
              {/* Siswa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_siswa_id"
                  value={formData.mst_siswa_id}
                  onChange={handleChange}
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  loadOptions={searchSiswaOptions}
                  placeholder="Pilih siswa"
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errors.mst_siswa_id}
                />
              </div>

              {/* Ujian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ujian <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="trx_ujian_id"
                  value={formData.trx_ujian_id}
                  onChange={handleChange}
                  options={selectedUjianOption ? [selectedUjianOption] : []}
                  loadOptions={searchUjianOptions}
                  placeholder="Pilih ujian"
                  searchPlaceholder="Cari ujian..."
                  noOptionsText="Tidak ada ujian yang cocok"
                  error={errors.trx_ujian_id}
                />
              </div>

              {/* Nilai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nilai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="nilai"
                  value={formData.nilai}
                  onChange={handleChange}
                  placeholder="Masukkan nilai (0-100)"
                  min="0"
                  max="100"
                  step="0.01"
                  error={errors.nilai}
                />
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
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Keterangan tambahan (opsional)"
                />
                {errors.keterangan && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.keterangan) ? errors.keterangan[0] : errors.keterangan}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/nilai')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'nilai.edit' : 'nilai.create'}>
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

export default NilaiForm