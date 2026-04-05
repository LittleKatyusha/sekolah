import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { penilaianService, kriteriaService } from '../services/spkService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const PenilaianForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    spk_kriteria_id: '',
    nilai: '',
    tahun_ajaran_id: '',
  })

  const [errors, setErrors] = useState({})
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [kriteriaOptions, setKriteriaOptions] = useState([])
  const [selectedKriteriaOption, setSelectedKriteriaOption] = useState(null)

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nis || '-'} - ${siswa.nama || `Siswa #${siswa.id}`}`
  }), [])

  const buildKriteriaOption = useCallback((kriteria) => ({
    value: String(kriteria.id),
    label: `${kriteria.kode_kriteria || '-'} - ${kriteria.nama_kriteria || `Kriteria #${kriteria.id}`}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    const list = data?.data || []
    return list.map(buildSiswaOption)
  }, [buildSiswaOption])

  const fetchKriteriaOptions = useCallback(async () => {
    const { data } = await kriteriaService.getAll({ per_page: 20 })
    const list = data?.data || []
    setKriteriaOptions(list.map(buildKriteriaOption))
  }, [buildKriteriaOption])

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

  const hydrateSelectedKriteriaOption = useCallback(async (kriteriaId) => {
    if (!kriteriaId) {
      setSelectedKriteriaOption(null)
      return
    }

    const { data } = await kriteriaService.getById(kriteriaId)
    const kriteria = data?.data

    if (kriteria) {
      const option = buildKriteriaOption(kriteria)
      setSelectedKriteriaOption(option)
      setKriteriaOptions((prev) => {
        const exists = prev.some((item) => String(item.value) === String(option.value))
        return exists ? prev : [option, ...prev]
      })
    }
  }, [buildKriteriaOption])

  useEffect(() => {
    fetchKriteriaOptions()
    if (isEditMode) {
      fetchPenilaian()
    }
  }, [id])

  useEffect(() => {
    if (formData.mst_siswa_id) {
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption])

  useEffect(() => {
    if (formData.spk_kriteria_id) {
      hydrateSelectedKriteriaOption(formData.spk_kriteria_id)
    } else {
      setSelectedKriteriaOption(null)
    }
  }, [formData.spk_kriteria_id, hydrateSelectedKriteriaOption])

  const fetchPenilaian = async () => {
    setFetchingData(true)
    const { data, error } = await penilaianService.getById(id)
    if (data) {
      const penilaian = data.data
      setFormData({
        mst_siswa_id: penilaian.mst_siswa_id ? String(penilaian.mst_siswa_id) : '',
        spk_kriteria_id: penilaian.spk_kriteria_id ? String(penilaian.spk_kriteria_id) : '',
        nilai: penilaian.nilai != null ? String(penilaian.nilai) : '',
        tahun_ajaran_id: penilaian.tahun_ajaran_id ? String(penilaian.tahun_ajaran_id) : '',
      })
    } else {
      showError('Gagal mengambil data penilaian')
      navigate('/spk/penilaian')
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
    if (!formData.spk_kriteria_id) newErrors.spk_kriteria_id = 'Kriteria wajib dipilih'
    if (!formData.nilai) newErrors.nilai = 'Nilai wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      spk_kriteria_id: parseInt(formData.spk_kriteria_id),
      nilai: parseFloat(formData.nilai),
      ...(formData.tahun_ajaran_id && { tahun_ajaran_id: parseInt(formData.tahun_ajaran_id) }),
    }

    let result
    if (isEditMode) {
      result = await penilaianService.update(id, submitData)
    } else {
      result = await penilaianService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Penilaian berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/spk/penilaian')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} penilaian`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/spk/penilaian')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Penilaian' : 'Tambah Penilaian Baru'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kriteria <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="spk_kriteria_id"
                  value={formData.spk_kriteria_id}
                  onChange={handleChange}
                  options={selectedKriteriaOption ? [selectedKriteriaOption, ...kriteriaOptions] : kriteriaOptions}
                  placeholder="Pilih kriteria"
                  searchPlaceholder="Cari kriteria..."
                  error={errors.spk_kriteria_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nilai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="nilai"
                  value={formData.nilai}
                  onChange={handleChange}
                  placeholder="Masukkan nilai"
                  step="0.01"
                  error={errors.nilai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Ajaran ID
                </label>
                <Input
                  type="number"
                  name="tahun_ajaran_id"
                  value={formData.tahun_ajaran_id}
                  onChange={handleChange}
                  placeholder="ID Tahun Ajaran (opsional)"
                  error={errors.tahun_ajaran_id}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/spk/penilaian')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'spk.edit' : 'spk.create'}>
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

export default PenilaianForm