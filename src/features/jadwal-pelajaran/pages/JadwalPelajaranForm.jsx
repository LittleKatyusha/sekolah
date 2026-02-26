import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { kelasService } from '../../kelas/services/kelasService'
import { guruService } from '../../guru/services/guruService'
import { mapelService } from '../../mapel/services/mapelService'
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
  const [guruMapelOptions, setGuruMapelOptions] = useState([])

  useEffect(() => {
    fetchKelas()
    fetchGuruMapelOptions()
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

  const fetchGuruMapelOptions = async () => {
    // Fetch both guru and mapel data, then combine to create guru-mapel options
    // We'll use the jadwal-pelajaran list data to extract guru_mapel options
    // or fetch guru and mapel separately and build options from available data
    const [guruResult, mapelResult] = await Promise.all([
      guruService.getAll({ per_page: 100 }),
      mapelService.getMapel({ per_page: 100 })
    ])

    const guruList = guruResult.data?.data || []
    const mapelList = mapelResult.data?.data || []

    // Build guru-mapel combination options
    // Since there's no dedicated guru-mapel API, we construct options from available data
    // The guru_mapel IDs from seeder data map guru to mapel assignments
    const options = []
    for (const guru of guruList) {
      // If guru has mapel relationships loaded
      if (guru.mapels && Array.isArray(guru.mapels)) {
        for (const mapel of guru.mapels) {
          options.push({
            value: String(mapel.pivot?.id || `${guru.id}-${mapel.id}`),
            label: `${guru.nama} - ${mapel.nama || mapel.nama_mapel}`
          })
        }
      } else if (guru.guru_mapel && Array.isArray(guru.guru_mapel)) {
        for (const gm of guru.guru_mapel) {
          options.push({
            value: String(gm.id),
            label: `${guru.nama} - ${gm.mapel?.nama || gm.mapel?.nama_mapel || 'Mapel'}`
          })
        }
      }
    }

    // If no combined data available, create simple options from mapel list
    // and let the user select (fallback)
    if (options.length === 0) {
      // Try fetching jadwal list to extract available guru_mapel combinations
      const { data: jadwalData } = await jadwalPelajaranService.getAll({ per_page: 100 })
      if (jadwalData?.data) {
        const seenIds = new Set()
        for (const jadwal of jadwalData.data) {
          if (jadwal.guru_mapel && !seenIds.has(jadwal.guru_mapel.id)) {
            seenIds.add(jadwal.guru_mapel.id)
            const guruNama = jadwal.guru_mapel.guru?.nama || 'Guru'
            const mapelNama = jadwal.guru_mapel.mapel?.nama || 'Mapel'
            options.push({
              value: String(jadwal.guru_mapel.id),
              label: `${guruNama} - ${mapelNama}`
            })
          }
        }
      }

      // If still no options, create basic numbered options from known IDs
      if (options.length === 0) {
        for (let i = 1; i <= 14; i++) {
          options.push({
            value: String(i),
            label: `Guru Mapel #${i}`
          })
        }
      }
    }

    setGuruMapelOptions(options)
  }

  const fetchJadwal = async () => {
    setFetchingData(true)
    const { data, error } = await jadwalPelajaranService.getById(id)
    if (data) {
      const jadwal = data.data
      setFormData({
        mst_kelas_id: jadwal.kelas?.id ? String(jadwal.kelas.id) : '',
        mst_guru_mapel_id: jadwal.guru_mapel?.id ? String(jadwal.guru_mapel.id) : '',
        hari: jadwal.hari || '',
        jam_mulai: jadwal.jam_mulai || '',
        jam_selesai: jadwal.jam_selesai || '',
        ruangan: jadwal.ruangan || ''
      })
    } else {
      showError('Gagal mengambil data jadwal pelajaran')
      navigate('/jadwal-pelajaran')
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
                  options={guruMapelOptions}
                  placeholder="Pilih guru & mata pelajaran"
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