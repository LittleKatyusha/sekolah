import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { userDevicesService } from '../services/userDevicesService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const DEVICE_TYPES = ['android', 'ios', 'web']

const UserDevicesForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userIdParam = searchParams.get('user_id') || ''
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    user_id: userIdParam,
    fcm_token: '',
    device_type: '',
    app_version: '',
    device_model: '',
    os_version: '',
    is_active: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) fetchDevice()
  }, [id])

  const fetchDevice = async () => {
    setLoading(true)
    const { data, error } = await userDevicesService.getById(id)
    if (data) {
      const d = data.data ?? data
      setFormData({
        user_id: d.user_id ?? '',
        fcm_token: d.fcm_token ?? '',
        device_type: d.device_type ?? '',
        app_version: d.app_version ?? '',
        device_model: d.device_model ?? '',
        os_version: d.os_version ?? '',
        is_active: d.is_active ?? true,
      })
    } else {
      showError('Gagal mengambil data device')
      goBack()
    }
    setLoading(false)
  }

  const goBack = () => {
    const userId = formData.user_id || userIdParam
    navigate(userId ? `/admin/user-devices?user_id=${userId}` : '/admin/user-devices')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.user_id) newErrors.user_id = 'User ID wajib diisi'
    if (!isEdit && !formData.fcm_token.trim()) newErrors.fcm_token = 'FCM Token wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const payload = {
      user_id: Number(formData.user_id),
      fcm_token: formData.fcm_token.trim(),
      device_type: formData.device_type || undefined,
      app_version: formData.app_version || undefined,
      device_model: formData.device_model || undefined,
      os_version: formData.os_version || undefined,
      is_active: formData.is_active,
    }
    if (isEdit) delete payload.fcm_token  // token not updatable via this field

    const { error } = isEdit
      ? await userDevicesService.update(id, payload)
      : await userDevicesService.create(payload)

    if (!error) {
      showSuccess(isEdit ? 'Device berhasil diperbarui' : 'Device berhasil didaftarkan')
      goBack()
    } else {
      showError(error?.message ?? (isEdit ? 'Gagal memperbarui device' : 'Gagal mendaftarkan device'))
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Device' : 'Daftarkan Device'}
        </h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <Input
              name="user_id"
              type="number"
              value={formData.user_id}
              onChange={handleChange}
              placeholder="ID User"
              disabled={Boolean(userIdParam)}
            />
            {errors.user_id && <p className="mt-1 text-xs text-red-500">{errors.user_id}</p>}
          </div>

          {/* FCM Token — only on create */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                FCM Token <span className="text-red-500">*</span>
              </label>
              <Input
                name="fcm_token"
                value={formData.fcm_token}
                onChange={handleChange}
                placeholder="Firebase Cloud Messaging token"
              />
              {errors.fcm_token && <p className="mt-1 text-xs text-red-500">{errors.fcm_token}</p>}
            </div>
          )}

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe Device</label>
            <select
              name="device_type"
              value={formData.device_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Pilih tipe —</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Device Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model Device</label>
            <Input
              name="device_model"
              value={formData.device_model}
              onChange={handleChange}
              placeholder="Contoh: Samsung Galaxy A54"
            />
          </div>

          {/* OS Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Versi OS</label>
            <Input
              name="os_version"
              value={formData.os_version}
              onChange={handleChange}
              placeholder="Contoh: Android 13"
            />
          </div>

          {/* App Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Versi Aplikasi</label>
            <Input
              name="app_version"
              value={formData.app_version}
              onChange={handleChange}
              placeholder="Contoh: 1.2.0"
            />
          </div>

          {/* Is Active — only on edit */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Aktif
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>Batal</Button>
            <PermissionGuard permission={isEdit ? 'users.update' : 'users.create'}>
              <Button type="submit" disabled={saving}>
                <Save size={16} className="mr-1" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default UserDevicesForm
