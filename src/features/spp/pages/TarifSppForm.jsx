import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { tarifSppService } from '../services/sppService'
import { kelasService } from '../../kelas/services/kelasService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const TarifSppForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_kelas_id: '',
    tahun_ajaran_id: '',
    nominal: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})
  const [kelasOptions, setKelasOptions] = useState([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])

  useEffect(() => {
    fetchOptions()
    if (isEditMode) {
      fetchTarifSpp()
    }
  }, [id])

  const fetchOptions = async () => {
    const [kelasRes, tahunAjaranRes] = await Promise.all([
      kelasService.getAll({ per_page: 100 }),
      tahunAjaranService.getAll({ per_page: 100 })
    ])

    const kelasList = kelasRes.data?.data || []
    setKelasOptions(kelasList.map(k => ({
      value: String(k.id),
      label: k.nama_kelas || `Kelas ${k.id}`
    })))

    const tahunAjaranList = tahunAjaranRes.data?.data || []
    setTahunAjaranOptions(tahunAjaranList.map(ta => ({
      value: String(ta.id),
      label: ta.nama || ta.tahun_ajaran || `${ta.id}`
    })))
  }

  const fetchTarifSpp = async () => {
    setFetchingData(true)
    const { data, error } = await tarifSppService.getById(id)
    if (data) {
      const tarif = data.data
      setFormData({
        mst_kelas_id: tarif.kelas?.id ? String(tarif.kelas.id) : '',
        tahun_ajaran_id: tarif.tahun_ajaran_id ? String(tarif.tahun_ajaran_id) : '',
        nominal: tarif.nominal !== null && tarif.nominal !== undefined ? String(tarif.nominal) : '',
        keterangan: tarif.keterangan || ''
      })
    } else {
      showError('Gagal mengambil data tarif SPP')
      navigate('/keuangan/tarif-spp')
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
    if (!formData.mst_kelas_id) newErrors.mst_kelas_id = 'Kelas wajib dipilih'
    if (!formData.tahun_ajaran_id) newErrors.tahun_ajaran_id = 'Tahun ajaran wajib dipilih'
    if (!formData.nominal || parseFloat(formData.nominal) < 0) newErrors.nominal = 'Nominal wajib diisi dan tidak boleh negatif'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      mst_kelas_id: parseInt(formData.mst_kelas_id),
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      nominal: parseFloat(formData.nominal),
      keterangan: formData.keterangan || null
    }

    let result
    if (isEditMode) {
      result = await tarifSppService.update(id, submitData)
    } else {
      result = await tarifSppService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Tarif SPP berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/keuangan/tarif-spp')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tarif SPP`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/keuangan/tarif-spp')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Tarif SPP' : 'Tambah Tarif SPP Baru'}
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
                  Kelas <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_kelas_id"
                  value={formData.mst_kelas_id}
                  onChange={handleChange}
                  options={kelasOptions}
                  placeholder="Pilih kelas"
                  error={errors.mst_kelas_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="tahun_ajaran_id"
                  value={formData.tahun_ajaran_id}
                  onChange={handleChange}
                  options={tahunAjaranOptions}
                  placeholder="Pilih tahun ajaran"
                  error={errors.tahun_ajaran_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nominal (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="nominal"
                  value={formData.nominal}
                  onChange={handleChange}
                  placeholder="Masukkan nominal SPP"
                  min="0"
                  step="1000"
                  error={errors.nominal}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <Input
                  type="text"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  placeholder="Keterangan (opsional)"
                  error={errors.keterangan}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/keuangan/tarif-spp')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'tarif-spp.edit' : 'tarif-spp.create'}>
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

export default TarifSppForm