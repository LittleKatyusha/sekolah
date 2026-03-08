import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const HARI_OPTIONS = [
  { value: 'MON', label: 'Senin' },
  { value: 'TUE', label: 'Selasa' },
  { value: 'WED', label: 'Rabu' },
  { value: 'THU', label: 'Kamis' },
  { value: 'FRI', label: 'Jumat' },
  { value: 'SAT', label: 'Sabtu' },
]

const JadwalPelajaranForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_kelas_id: '',
    mst_guru_mapel_id: '',
    hari: '',
    jam_mulai: '',
    jam_selesai: '',
    ruangan: ''
  })

  const [errors, setErrors] = useState({})
  const [kelasOptions, setKelasOptions] = useState([])
  const [selectedGuruMapelOption, setSelectedGuruMapelOption] = useState(null)

  useEffect(() => {
    fetchKelas()
    if (isEditMode) {
      fetchJadwal()
    }
  }, [id])

  const fetchKelas = async () => {
    const { data, error } = await kelasService.getAll({ per_page: 100 })
    if (data && data.data) {
      const options = data.data.map(kelas => ({
        value: String(kelas.id),
        label: `${kelas.nama_kelas} (Tingkat ${kelas.tingkat})`
      }))
      setKelasOptions(options)
    } else {
      console.error('Failed to fetch kelas:', error)
    }
  }

  const buildGuruMapelOption = useCallback((guruMapel) => {
    if (!guruMapel) return null

    const guruNama = guruMapel.guru?.nama || guruMapel.nama_guru || 'Guru'
    const mapelNama = guruMapel.mapel?.nama || guruMapel.mapel?.nama_mapel || guruMapel.nama_mapel || 'Mapel'
    const rawId = guruMapel.id ?? guruMapel.mst_guru_mapel_id

    if (!rawId) return null

    return {
      value: String(rawId),
      label: `${guruNama} - ${mapelNama}`
    }
  }, [])

  const searchGuruMapelOptions = useCallback(async (keyword = '') => {
    const normalizedKeyword = keyword.trim()

    const { data, error } = await jadwalPelajaranService.getAll({
      search: normalizedKeyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      const seenIds = new Set()
      return data.data.reduce((options, jadwal) => {
        const option = buildGuruMapelOption(jadwal.guru_mapel)
        if (!option || seenIds.has(option.value)) return options

        const label = option.label.toLowerCase()
        if (normalizedKeyword && !label.includes(normalizedKeyword.toLowerCase())) {
          return options
        }

        seenIds.add(option.value)
        options.push(option)
        return options
      }, [])
    }

    console.error('Failed to fetch guru mapel options:', error)
    return []
  }, [buildGuruMapelOption])

  const hydrateSelectedGuruMapelOption = useCallback(async (guruMapelId) => {
    if (!guruMapelId) {
      setSelectedGuruMapelOption(null)
      return
    }

    const { data } = await jadwalPelajaranService.getAll({ per_page: 20 })
    const jadwalList = data?.data || []
    const matchedJadwal = jadwalList.find(
      (jadwal) => String(jadwal.guru_mapel?.id) === String(guruMapelId)
    )

    const option = buildGuruMapelOption(matchedJadwal?.guru_mapel)

    if (option) {
      setSelectedGuruMapelOption(option)
      return
    }

    setSelectedGuruMapelOption({
      value: String(guruMapelId),
      label: `Guru Mapel #${guruMapelId}`
    })
  }, [buildGuruMapelOption])

  const fetchJadwal = async () => {
    setFetchingData(true)
    const { data, error } = await jadwalPelajaranService.getById(id)
    if (data) {
      const jadwal = data.data
      const guruMapelId = jadwal.guru_mapel?.id ? String(jadwal.guru_mapel.id) : ''

      setFormData({
        mst_kelas_id: jadwal.kelas?.id ? String(jadwal.kelas.id) : '',
        mst_guru_mapel_id: guruMapelId,
        hari: jadwal.hari || '',
        jam_mulai: jadwal.jam_mulai || '',
        jam_selesai: jadwal.jam_selesai || '',
        ruangan: jadwal.ruangan || ''
      })

      if (jadwal.guru_mapel) {
        const option = buildGuruMapelOption(jadwal.guru_mapel)
        if (option) {
          setSelectedGuruMapelOption(option)
        }
      }
    } else {
      showError('Gagal mengambil data jadwal pelajaran')
      navigate('/jadwal-pelajaran')
    }
    setFetchingData(false)
  }

  useEffect(() => {
    if (formData.mst_guru_mapel_id) {
      hydrateSelectedGuruMapelOption(formData.mst_guru_mapel_id)
    } else {
      setSelectedGuruMapelOption(null)
    }
  }, [formData.mst_guru_mapel_id, hydrateSelectedGuruMapelOption])

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
    if (!formData.mst_guru_mapel_id) newErrors.mst_guru_mapel_id = 'Guru Mapel wajib dipilih'
    if (!formData.hari) newErrors.hari = 'Hari wajib dipilih'
    if (!formData.jam_mulai) newErrors.jam_mulai = 'Jam mulai wajib diisi'
    if (!formData.jam_selesai) newErrors.jam_selesai = 'Jam selesai wajib diisi'
    
    if (formData.jam_mulai && formData.jam_selesai && formData.jam_mulai >= formData.jam_selesai) {
      newErrors.jam_selesai = 'Jam selesai harus setelah jam mulai'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      mst_kelas_id: parseInt(formData.mst_kelas_id),
      mst_guru_mapel_id: parseInt(formData.mst_guru_mapel_id),
      hari: formData.hari,
      jam_mulai: formData.jam_mulai,
      jam_selesai: formData.jam_selesai,
      ruangan: formData.ruangan || null
    }

    let result
    
    if (isEditMode) {
      result = await jadwalPelajaranService.update(id, submitData)
    } else {
      result = await jadwalPelajaranService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Jadwal pelajaran berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/jadwal-pelajaran')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} jadwal pelajaran`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/jadwal-pelajaran')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran Baru'}
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
              {/* Kelas */}
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

              {/* Hari */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hari <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="hari"
                  value={formData.hari}
                  onChange={handleChange}
                  options={HARI_OPTIONS}
                  placeholder="Pilih hari"
                  error={errors.hari}
                />
              </div>

              {/* Jam Mulai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Mulai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  name="jam_mulai"
                  value={formData.jam_mulai}
                  onChange={handleChange}
                  error={errors.jam_mulai}
                />
              </div>

              {/* Jam Selesai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Selesai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  name="jam_selesai"
                  value={formData.jam_selesai}
                  onChange={handleChange}
                  error={errors.jam_selesai}
                />
              </div>

              {/* Guru Mapel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guru & Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_guru_mapel_id"
                  value={formData.mst_guru_mapel_id}
                  onChange={handleChange}
                  options={selectedGuruMapelOption ? [selectedGuruMapelOption] : []}
                  loadOptions={searchGuruMapelOptions}
                  placeholder="Pilih guru & mata pelajaran"
                  searchPlaceholder="Cari guru mapel berdasarkan guru atau mapel..."
                  noOptionsText="Tidak ada guru mapel yang cocok"
                  error={errors.mst_guru_mapel_id}
                />
              </div>

              {/* Ruangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ruangan
                </label>
                <Input
                  type="text"
                  name="ruangan"
                  value={formData.ruangan}
                  onChange={handleChange}
                  placeholder="Masukkan ruangan (opsional)"
                  error={errors.ruangan}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/jadwal-pelajaran')}>
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

export default JadwalPelajaranForm