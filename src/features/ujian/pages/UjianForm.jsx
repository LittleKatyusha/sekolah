import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { ujianService } from '../services/ujianService'
import { mapelService } from '../../mapel/services/mapelService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const UjianForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const { options: jenisUjianOptions } = useReferenceOptions('jenis_ujian', [
    { value: '1', label: 'Harian' },
    { value: '2', label: 'Penilaian Tengah Semester' },
  ])
  const { options: semesterOptions } = useReferenceOptions('kategori_semester', [
    { value: '1', label: 'Ganjil' },
    { value: '2', label: 'Genap' },
  ])

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_mapel_id: '',
    mst_kelas_id: '',
    jenis: '',
    nama: '',
    tanggal: '',
    semester: '',
    tahun_ajaran: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})
  const [selectedMapelOption, setSelectedMapelOption] = useState(null)
  const [selectedKelasOption, setSelectedKelasOption] = useState(null)

  const buildMapelOption = useCallback((mapel) => ({
    value: String(mapel.id),
    label: `${mapel.kode ? `${mapel.kode} - ` : ''}${mapel.nama || `Mapel #${mapel.id}`}`
  }), [])

  const buildKelasOption = useCallback((kelas) => ({
    value: String(kelas.id),
    label: kelas.nama_kelas || `Kelas #${kelas.id}`
  }), [])

  const searchMapelOptions = useCallback(async (keyword = '') => {
    const { data, error } = await mapelService.getMapel({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildMapelOption)
    }

    console.error('Failed to fetch mapel:', error)
    return []
  }, [buildMapelOption])

  const searchKelasOptions = useCallback(async (keyword = '') => {
    const { data, error } = await kelasService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildKelasOption)
    }

    console.error('Failed to fetch kelas:', error)
    return []
  }, [buildKelasOption])

  const fetchUjian = useCallback(async () => {
    setFetchingData(true)
    const { data, error } = await ujianService.getById(id)
    if (data) {
      const ujian = data.data
      const mapelId = ujian.mst_mapel_id ? String(ujian.mst_mapel_id) : ''
      const kelasId = ujian.mst_kelas_id ? String(ujian.mst_kelas_id) : ''

      setFormData({
        mst_mapel_id: mapelId,
        mst_kelas_id: kelasId,
        jenis: String(ujian.jenis) || '',
        nama: ujian.nama || '',
        tanggal: ujian.tanggal || '',
        semester: String(ujian.semester) || '',
        tahun_ajaran: ujian.tahun_ajaran || '',
        keterangan: ujian.keterangan || ''
      })

      if (ujian.mapel?.id) {
        setSelectedMapelOption(buildMapelOption(ujian.mapel))
      } else if (mapelId) {
        setSelectedMapelOption({
          value: mapelId,
          label: `Mapel #${mapelId}`
        })
      } else {
        setSelectedMapelOption(null)
      }

      if (ujian.kelas?.id) {
        setSelectedKelasOption(buildKelasOption(ujian.kelas))
      } else if (kelasId) {
        setSelectedKelasOption({
          value: kelasId,
          label: `Kelas #${kelasId}`
        })
      } else {
        setSelectedKelasOption(null)
      }
    } else {
      showError('Gagal mengambil data ujian')
      navigate('/akademik/ujian')
    }
    setFetchingData(false)
  }, [buildKelasOption, buildMapelOption, id, navigate])

  useEffect(() => {
    if (isEditMode) {
      fetchUjian()
    }
  }, [fetchUjian, isEditMode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_mapel_id) newErrors.mst_mapel_id = 'Mata pelajaran wajib dipilih'
    if (!formData.mst_kelas_id) newErrors.mst_kelas_id = 'Kelas wajib dipilih'
    if (!formData.jenis) newErrors.jenis = 'Jenis ujian wajib dipilih'
    if (!formData.nama) newErrors.nama = 'Nama ujian wajib diisi'
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal ujian wajib diisi'
    if (!formData.semester) newErrors.semester = 'Semester wajib dipilih'
    if (!formData.tahun_ajaran) newErrors.tahun_ajaran = 'Tahun ajaran wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      ...formData,
      mst_mapel_id: parseInt(formData.mst_mapel_id),
      mst_kelas_id: parseInt(formData.mst_kelas_id),
      jenis: parseInt(formData.jenis),
      semester: parseInt(formData.semester),
      keterangan: formData.keterangan || null
    }

    let result
    
    if (isEditMode) {
      result = await ujianService.update(id, submitData)
    } else {
      result = await ujianService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Ujian berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/ujian')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} ujian`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/ujian')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Ujian' : 'Tambah Ujian Baru'}
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
              {/* Mapel */}
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
                  placeholder="Pilih mata pelajaran"
                  searchPlaceholder="Cari mata pelajaran berdasarkan kode atau nama..."
                  noOptionsText="Tidak ada mata pelajaran yang cocok"
                  error={errors.mst_mapel_id}
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_kelas_id"
                  value={formData.mst_kelas_id}
                  onChange={handleChange}
                  options={selectedKelasOption ? [selectedKelasOption] : []}
                  loadOptions={searchKelasOptions}
                  placeholder="Pilih kelas"
                  searchPlaceholder="Cari kelas berdasarkan nama..."
                  noOptionsText="Tidak ada kelas yang cocok"
                  error={errors.mst_kelas_id}
                />
              </div>

              {/* Jenis Ujian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis Ujian <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenis"
                  value={formData.jenis}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih jenis ujian</option>
                  {jenisUjianOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.jenis && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.jenis) ? errors.jenis[0] : errors.jenis}
                  </p>
                )}
              </div>

              {/* Nama Ujian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Ujian <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama ujian"
                  maxLength={100}
                  error={errors.nama}
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Ujian <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  error={errors.tanggal}
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih semester</option>
                  {semesterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.semester && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.semester) ? errors.semester[0] : errors.semester}
                  </p>
                )}
              </div>

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <Input
                  name="tahun_ajaran"
                  value={formData.tahun_ajaran}
                  onChange={handleChange}
                  placeholder="Contoh: 2025/2026"
                  maxLength={20}
                  error={errors.tahun_ajaran}
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
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/ujian')}>
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

export default UjianForm