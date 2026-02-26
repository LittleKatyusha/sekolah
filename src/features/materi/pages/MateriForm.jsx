import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { materiService } from '../services/materiService'
import { guruService } from '../../guru/services/guruService'
import { mapelService } from '../../mapel/services/mapelService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const TIPE_OPTIONS = [
  { value: 'dokumen', label: 'Dokumen' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' },
  { value: 'lainnya', label: 'Lainnya' },
]

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

const MateriForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_guru_mapel_id: '',
    judul: '',
    konten: '',
    tipe: '',
    file_path: '',
    url_external: '',
    status: '1',
    urutan: ''
  })

  const [errors, setErrors] = useState({})
  const [guruMapelOptions, setGuruMapelOptions] = useState([])

  useEffect(() => {
    fetchGuruMapelOptions()
    if (isEditMode) {
      fetchMateri()
    }
  }, [id])

  const fetchGuruMapelOptions = async () => {
    const [guruResult, mapelResult] = await Promise.all([
      guruService.getAll({ per_page: 100 }),
      mapelService.getMapel({ per_page: 100 })
    ])

    const guruList = guruResult.data?.data || []
    const mapelList = mapelResult.data?.data || []

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
      const { data: materiData } = await materiService.getAll({ per_page: 100 })
      if (materiData?.data) {
        const seenIds = new Set()
        for (const materi of materiData.data) {
          if (materi.guru_mapel && !seenIds.has(materi.guru_mapel.id)) {
            seenIds.add(materi.guru_mapel.id)
            const guruNama = materi.guru_mapel.guru?.nama || 'Guru'
            const mapelNama = materi.guru_mapel.mapel?.nama || 'Mapel'
            options.push({
              value: String(materi.guru_mapel.id),
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

  const fetchMateri = async () => {
    setFetchingData(true)
    const { data, error } = await materiService.getById(id)
    if (data) {
      const materi = data.data
      setFormData({
        mst_guru_mapel_id: materi.guru_mapel?.id ? String(materi.guru_mapel.id) : (materi.mst_guru_mapel_id ? String(materi.mst_guru_mapel_id) : ''),
        judul: materi.judul || '',
        konten: materi.konten || '',
        tipe: materi.tipe || '',
        file_path: materi.file_path || '',
        url_external: materi.url_external || '',
        status: materi.status !== null && materi.status !== undefined ? String(materi.status) : '1',
        urutan: materi.urutan !== null && materi.urutan !== undefined ? String(materi.urutan) : ''
      })
    } else {
      showError('Gagal mengambil data materi')
      navigate('/akademik/materi')
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      mst_guru_mapel_id: parseInt(formData.mst_guru_mapel_id),
      judul: formData.judul,
      konten: formData.konten || null,
      tipe: formData.tipe || null,
      file_path: formData.file_path || null,
      url_external: formData.url_external || null,
      status: formData.status !== '' ? parseInt(formData.status) : null,
      urutan: formData.urutan !== '' ? parseInt(formData.urutan) : null
    }

    let result
    
    if (isEditMode) {
      result = await materiService.update(id, submitData)
    } else {
      result = await materiService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Materi berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/materi')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} materi`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/materi')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Materi' : 'Tambah Materi Baru'}
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
                  placeholder="Masukkan judul materi"
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

              {/* Tipe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipe
                </label>
                <SearchableSelect
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  options={TIPE_OPTIONS}
                  placeholder="Pilih tipe materi"
                  error={errors.tipe}
                />
              </div>

              {/* Konten */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Konten
                </label>
                <textarea
                  name="konten"
                  value={formData.konten}
                  onChange={handleChange}
                  placeholder="Masukkan konten/deskripsi materi"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.konten && (
                  <p className="mt-1 text-sm text-red-500">{errors.konten}</p>
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

              {/* URL External */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL External
                </label>
                <Input
                  type="text"
                  name="url_external"
                  value={formData.url_external}
                  onChange={handleChange}
                  placeholder="URL external (opsional)"
                  error={errors.url_external}
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

              {/* Urutan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urutan
                </label>
                <Input
                  type="number"
                  name="urutan"
                  value={formData.urutan}
                  onChange={handleChange}
                  placeholder="Urutan (opsional)"
                  error={errors.urutan}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/materi')}>
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

export default MateriForm