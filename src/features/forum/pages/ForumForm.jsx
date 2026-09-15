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
import useAuthStore from '../../../store/useAuthStore'
import { checkPermission } from '../../../hooks/usePermission'

const ForumForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isEditMode = Boolean(id)
  const canPublish = checkPermission(user, 'forum.moderate')
  const localDate = value => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(isEditMode)

  const [formData, setFormData] = useState({
    judul: '',
    konten: '',
    is_public_display: false,
    display_start_at: '',
    display_end_at: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) fetchForum()
  }, [isEditMode])

  const fetchForum = async () => {
    setFetchingData(true)
    const { data, error } = await forumService.getById(id)
    if (data) {
      const forum = data
      setFormData({
        judul: forum.judul || '',
        konten: forum.konten || forum.pesan || '',
        is_public_display: Boolean(forum.is_public_display),
        display_start_at: localDate(forum.display_start_at),
        display_end_at: localDate(forum.display_end_at),
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
    if (!formData.konten.replace(/<[^>]*>/g, '').trim()) {
      newErrors.konten = 'Konten wajib diisi'
    }
    if (!formData.judul.trim()) newErrors.judul = 'Judul wajib diisi'
    if (formData.display_start_at && formData.display_end_at && formData.display_end_at <= formData.display_start_at) newErrors.display_end_at = 'Akhir tayang harus setelah awal tayang'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      judul: formData.judul.trim(), konten: formData.konten,
      ...(canPublish ? {
        is_public_display: formData.is_public_display,
        display_start_at: formData.display_start_at ? new Date(formData.display_start_at).toISOString() : null,
        display_end_at: formData.display_end_at ? new Date(formData.display_end_at).toISOString() : null,
      } : {}),
    }

    const { error } = isEditMode ? await forumService.update(id, submitData) : await forumService.create(submitData)

    if (!error) {
      showSuccess(`Forum berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}!`)
      navigate('/akademik/forum')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'membuat'} forum`)
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
          {isEditMode ? 'Edit Forum' : 'Buat Forum'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Judul
              </label>
              <Input
                type="text"
                name="judul"
                value={formData.judul}
                onChange={handleChange}
                placeholder="Judul forum"
                error={errors.judul}
              />
            </div>

            {canPublish && <fieldset className="space-y-3 border rounded p-4">
              <legend>Publikasi TV</legend>
              <p>Konten dapat dilihat siapa pun di depan TV. Jangan publikasikan data pribadi.</p>
              <label className="flex gap-2"><input type="checkbox" checked={formData.is_public_display} onChange={e => setFormData({ ...formData, is_public_display: e.target.checked })} />Layak tayang publik</label>
              <label className="block">Mulai tayang (zona waktu browser)<Input type="datetime-local" name="display_start_at" value={formData.display_start_at} onChange={handleChange} /></label>
              <label className="block">Akhir tayang (zona waktu browser)<Input type="datetime-local" name="display_end_at" value={formData.display_end_at} onChange={handleChange} error={errors.display_end_at} /></label>
            </fieldset>}

            <div>
              <LexicalEditor
                label="Konten"
                required
                value={formData.konten}
                onChange={(html) => setFormData(prev => ({ ...prev, konten: html }))}
                placeholder="Tulis konten..."
                minHeight="150px"
              />
              {errors.konten && (
                <p className="mt-1 text-sm text-red-500">{errors.konten}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'forum.update' : 'forum.create'}>
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
