import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { forumService } from '../services/forumService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const ForumForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_guru_mapel_id: '',
    sys_user_id: '',
    parent_id: '',
    judul: '',
    pesan: '',
    file_lampiran: ''
  })

  const [errors, setErrors] = useState({})
  const [guruMapelOptions, setGuruMapelOptions] = useState([])
  const [userOptions, setUserOptions] = useState([])
  const [parentOptions, setParentOptions] = useState([])

  useEffect(() => {
    fetchGuruMapelOptions()
    fetchParentOptions()
    if (isEditMode) {
      fetchForum()
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

    if (options.length === 0) {
      for (let i = 1; i <= 14; i++) {
        options.push({
          value: String(i),
          label: `Guru Mapel #${i}`
        })
      }
    }

    setGuruMapelOptions(options)
  }

  const fetchParentOptions = async () => {
    const { data } = await forumService.getAll({ per_page: 100 })
    if (data?.data) {
      const options = data.data
        .filter(f => f.is_topik)
        .map(f => ({
          value: String(f.id),
          label: f.judul || `Forum #${f.id}`
        }))
      setParentOptions(options)
    }
  }

  const fetchForum = async () => {
    setFetchingData(true)
    const { data, error } = await forumService.getById(id)
    if (data) {
      const forum = data.data
      setFormData({
        mst_guru_mapel_id: forum.guru_mapel?.id ? String(forum.guru_mapel.id) : (forum.mst_guru_mapel_id ? String(forum.mst_guru_mapel_id) : ''),
        sys_user_id: forum.user?.id ? String(forum.user.id) : (forum.sys_user_id ? String(forum.sys_user_id) : ''),
        parent_id: forum.parent?.id ? String(forum.parent.id) : (forum.parent_id ? String(forum.parent_id) : ''),
        judul: forum.judul || '',
        pesan: forum.pesan || '',
        file_lampiran: forum.file_lampiran || ''
      })
    } else {
      showError('Gagal mengambil data forum')
      navigate('/akademik/forum')
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
    if (!formData.mst_guru_mapel_id) newErrors.mst_guru_mapel_id = 'Guru Mapel wajib dipilih'
    if (!formData.sys_user_id) newErrors.sys_user_id = 'User ID wajib diisi'
    if (!formData.pesan.trim()) newErrors.pesan = 'Pesan wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = {
      mst_guru_mapel_id: parseInt(formData.mst_guru_mapel_id),
      sys_user_id: parseInt(formData.sys_user_id),
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      judul: formData.judul || null,
      pesan: formData.pesan,
      file_lampiran: formData.file_lampiran || null
    }

    let result

    if (isEditMode) {
      result = await forumService.update(id, submitData)
    } else {
      result = await forumService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Forum berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/forum')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} forum`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/forum')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Forum' : 'Tambah Forum Baru'}
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
                  Judul
                </label>
                <Input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  placeholder="Masukkan judul forum (opsional)"
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

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="sys_user_id"
                  value={formData.sys_user_id}
                  onChange={handleChange}
                  placeholder="Masukkan User ID"
                  error={errors.sys_user_id}
                />
              </div>

              {/* Parent (for replies) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Topik
                </label>
                <SearchableSelect
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleChange}
                  options={parentOptions}
                  placeholder="Pilih parent topik (opsional)"
                  error={errors.parent_id}
                />
              </div>

              {/* File Lampiran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Lampiran
                </label>
                <Input
                  type="text"
                  name="file_lampiran"
                  value={formData.file_lampiran}
                  onChange={handleChange}
                  placeholder="Path file lampiran (opsional)"
                  error={errors.file_lampiran}
                />
              </div>

              {/* Pesan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="pesan"
                  value={formData.pesan}
                  onChange={handleChange}
                  placeholder="Masukkan pesan forum"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.pesan && (
                  <p className="mt-1 text-sm text-red-500">{errors.pesan}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/forum')}>
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

export default ForumForm