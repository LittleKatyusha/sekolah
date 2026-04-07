import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import '../../../components/ui/LexicalEditor.css'
import { forumService } from '../services/forumService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const ForumForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [isTopik, setIsTopik] = useState(false)

  const [formData, setFormData] = useState({
    judul: '',
    pesan: '',
    file_lampiran: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!id) {
      navigate('/akademik/forum')
      return
    }
    fetchForum()
  }, [id])

  const fetchForum = async () => {
    setFetchingData(true)
    const { data, error } = await forumService.getById(id)
    if (data) {
      const forum = data
      setIsTopik(!!forum.is_topik)
      setFormData({
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
    if (!formData.pesan.trim() && !formData.pesan.replace(/<[^>]*>/g, '').trim()) {
      newErrors.pesan = 'Pesan wajib diisi'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      pesan: formData.pesan,
      file_lampiran: formData.file_lampiran || null
    }

    if (isTopik) {
      submitData.judul = formData.judul || null
    }

    const { error } = await forumService.update(id, submitData)

    if (!error) {
      showSuccess('Berhasil diperbarui!')
      navigate(-1)
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError('Gagal memperbarui')
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit {isTopik ? 'Topik' : 'Balasan'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {isTopik && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Judul
                </label>
                <Input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  placeholder="Judul topik"
                  error={errors.judul}
                />
              </div>
            )}

            <div>
              <LexicalEditor
                label="Pesan"
                required
                value={formData.pesan}
                onChange={(html) => setFormData(prev => ({ ...prev, pesan: html }))}
                placeholder="Tulis pesan..."
                minHeight="150px"
              />
              {errors.pesan && (
                <p className="mt-1 text-sm text-red-500">{errors.pesan}</p>
              )}
            </div>

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

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Batal
              </Button>
              <PermissionGuard permission="forum.edit">
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

export default ForumForm