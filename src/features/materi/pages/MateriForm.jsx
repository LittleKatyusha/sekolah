import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import '../../../components/ui/LexicalEditor.css'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { materiService } from '../services/materiService'
import { showSuccess, showError } from '../../../utils/sweetalert'

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
    file_path: '',
    url_external: '',
    status: '1',
    urutan: ''
  })

  const [errors, setErrors] = useState({})
  const [selectedGuruMapelOption, setSelectedGuruMapelOption] = useState(null)

  useEffect(() => {
    if (isEditMode) {
      fetchMateri()
    }
  }, [id])

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

    const { data, error } = await materiService.getAll({
      search: normalizedKeyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      const seenIds = new Set()
      return data.data.reduce((options, materi) => {
        const option = buildGuruMapelOption(materi.guru_mapel)
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

    const { data } = await materiService.getAll({ per_page: 20 })
    const materiList = data?.data || []
    const matchedMateri = materiList.find(
      (materi) => String(materi.guru_mapel?.id) === String(guruMapelId)
    )

    const option = buildGuruMapelOption(matchedMateri?.guru_mapel)

    if (option) {
      setSelectedGuruMapelOption(option)
      return
    }

    setSelectedGuruMapelOption({
      value: String(guruMapelId),
      label: `Guru Mapel #${guruMapelId}`
    })
  }, [buildGuruMapelOption])

  const fetchMateri = async () => {
    setFetchingData(true)
    const { data, error } = await materiService.getById(id)
    if (data) {
      const materi = data.data
      const guruMapelId = materi.guru_mapel?.id ? String(materi.guru_mapel.id) : (materi.mst_guru_mapel_id ? String(materi.mst_guru_mapel_id) : '')

      setFormData({
        mst_guru_mapel_id: guruMapelId,
        judul: materi.judul || '',
        konten: materi.konten || '',
        file_path: materi.file_path || '',
        url_external: materi.url_external || '',
        status: materi.status !== null && materi.status !== undefined ? String(materi.status) : '1',
        urutan: materi.urutan !== null && materi.urutan !== undefined ? String(materi.urutan) : ''
      })

      if (materi.guru_mapel) {
        const option = buildGuruMapelOption(materi.guru_mapel)
        if (option) {
          setSelectedGuruMapelOption(option)
        }
      }
    } else {
      showError('Gagal mengambil data materi')
      navigate('/akademik/materi')
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
                  options={selectedGuruMapelOption ? [selectedGuruMapelOption] : []}
                  loadOptions={searchGuruMapelOptions}
                  placeholder="Pilih guru & mata pelajaran"
                  searchPlaceholder="Cari guru mapel berdasarkan guru atau mapel..."
                  noOptionsText="Tidak ada guru mapel yang cocok"
                  error={errors.mst_guru_mapel_id}
                />
              </div>

              {/* Konten */}
              <div className="md:col-span-2">
                <LexicalEditor
                  label="Konten"
                  required
                  value={formData.konten}
                  onChange={(html) => setFormData(prev => ({ ...prev, konten: html }))}
                  placeholder="Tulis konten materi..."
                  minHeight="200px"
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
              <PermissionGuard permission={isEditMode ? 'materi.edit' : 'materi.create'}>
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

export default MateriForm