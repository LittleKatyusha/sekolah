import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { tugasService } from '../services/tugasService'
import { guruService } from '../../guru/services/guruService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

const TugasForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_guru_mapel_id: '',
    mst_kelas_id: '',
    judul: '',
    deskripsi: '',
    tenggat_waktu: '',
    file_path: '',
    status: '1'
  })

  const [errors, setErrors] = useState({})
  const [guruMapelOptions, setGuruMapelOptions] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])

  useEffect(() => {
    fetchGuruMapelOptions()
    fetchKelasOptions()
    if (isEditMode) {
      fetchTugas()
    }
  }, [id])

  const fetchGuruMapelOptions = async () => {
    const guruResult = await guruService.getAll({ per_page: 100 })

    const guruList = guruResult.data?.data || []
    const options = []

    for (const guru of guruList) {
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

    // Fallback: create basic numbered options
    if (options.length === 0) {
      const { data: tugasData } = await tugasService.getAll({ per_page: 100 })
      if (tugasData?.data) {
        const seenIds = new Set()
        for (const tugas of tugasData.data) {
          if (tugas.guru_mapel && !seenIds.has(tugas.guru_mapel.id)) {
            seenIds.add(tugas.guru_mapel.id)
            const guruNama = tugas.guru_mapel.guru?.nama || 'Guru'
            const mapelNama = tugas.guru_mapel.mapel?.nama || 'Mapel'
            options.push({
              value: String(tugas.guru_mapel.id),
              label: `${guruNama} - ${mapelNama}`
            })
          }
        }
      }

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

  const fetchKelasOptions = async () => {
    const { data, error } = await kelasService.getAll({ per_page: 100 })
    if (data?.data) {
      const options = data.data.map(kelas => ({
        value: String(kelas.id),
        label: kelas.nama_kelas || kelas.nama || `Kelas #${kelas.id}`
      }))
      setKelasOptions(options)
    }
  }

  const fetchTugas = async () => {
    setFetchingData(true)
    const { data, error } = await tugasService.getById(id)
    if (data) {
      const tugas = data.data
      // Format datetime for datetime-local input
      let tenggatWaktu = ''
      if (tugas.tenggat_waktu) {
        const dt = new Date(tugas.tenggat_waktu)
        tenggatWaktu = dt.toISOString().slice(0, 16)
      }
      setFormData({
        mst_guru_mapel_id: tugas.guru_mapel?.id ? String(tugas.guru_mapel.id) : (tugas.mst_guru_mapel_id ? String(tugas.mst_guru_mapel_id) : ''),
        mst_kelas_id: tugas.kelas?.id ? String(tugas.kelas.id) : (tugas.mst_kelas_id ? String(tugas.mst_kelas_id) : ''),
        judul: tugas.judul || '',
        deskripsi: tugas.deskripsi || '',
        tenggat_waktu: tenggatWaktu,
        file_path: tugas.file_path || '',
        status: tugas.status !== null && tugas.status !== undefined ? String(tugas.status) : '1'
      })
    } else {
      showError('Gagal mengambil data tugas')
      navigate('/akademik/tugas')
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
    if (!formData.judul.trim()) newErrors.judul = 'Judul wajib diisi'
    if (!formData.mst_guru_mapel_id) newErrors.mst_guru_mapel_id = 'Guru Mapel wajib dipilih'
    if (!formData.mst_kelas_id) newErrors.mst_kelas_id = 'Kelas wajib dipilih'
    if (!formData.tenggat_waktu) newErrors.tenggat_waktu = 'Tenggat waktu wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      mst_guru_mapel_id: parseInt(formData.mst_guru_mapel_id),
      mst_kelas_id: parseInt(formData.mst_kelas_id),
      judul: formData.judul,
      deskripsi: formData.deskripsi || null,
      tenggat_waktu: formData.tenggat_waktu || null,
      file_path: formData.file_path || null,
      status: formData.status !== '' ? parseInt(formData.status) : null
    }

    let result
    
    if (isEditMode) {
      result = await tugasService.update(id, submitData)
    } else {
      result = await tugasService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Tugas berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/tugas')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tugas`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/tugas')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Tugas' : 'Tambah Tugas Baru'}
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
              {/* Judul */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Judul <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  placeholder="Masukkan judul tugas"
                  error={errors.judul}
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

              {/* Deskripsi */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  placeholder="Masukkan deskripsi tugas"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-500">{errors.deskripsi}</p>
                )}
              </div>

              {/* Tenggat Waktu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenggat Waktu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="tenggat_waktu"
                  value={formData.tenggat_waktu}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                {errors.tenggat_waktu && (
                  <p className="mt-1 text-sm text-red-500">{errors.tenggat_waktu}</p>
                )}
              </div>

              {/* File Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Path
                </label>
                <Input
                  type="text"
                  name="file_path"
                  value={formData.file_path}
                  onChange={handleChange}
                  placeholder="Path file (opsional)"
                  error={errors.file_path}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <SearchableSelect
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                  placeholder="Pilih status"
                  error={errors.status}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/tugas')}>
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

export default TugasForm