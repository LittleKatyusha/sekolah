import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Smartphone, Radio } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { userDevicesService } from '../services/userDevicesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="w-40 text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
    <span className="text-sm text-gray-900 dark:text-white break-all">{value ?? '-'}</span>
  </div>
)

const UserDevicesDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user_id')

  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState(null)

  const goBack = () => {
    const uid = userId || device?.user_id
    navigate(uid ? `/admin/user-devices?user_id=${uid}` : '/admin/user-devices')
  }

  const fetchDevice = async () => {
    setLoading(true)
    const { data, error } = await userDevicesService.getById(id)
    if (data) {
      setDevice(data.data ?? data)
    } else {
      showError('Gagal mengambil data device')
      navigate('/admin/user-devices')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDevice()
  }, [id])

  const handleDelete = async () => {
    const result = await showDeleteConfirm(`Device "${device.device_model || id}"`)
    if (result.isConfirmed) {
      const { error } = await userDevicesService.delete(device.id)
      if (!error) {
        showSuccess('Device berhasil dihapus')
        goBack()
      } else {
        showError('Gagal menghapus device')
      }
    }
  }

  const handleTouch = async () => {
    const { error } = await userDevicesService.touch(device.id)
    if (!error) {
      showSuccess('Last active berhasil diperbarui')
      fetchDevice()
    } else {
      showError('Gagal memperbarui last active')
    }
  }

  if (loading || !device) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone size={22} /> Detail Device
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {device.id}</p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="users.update">
            <Button variant="outline" onClick={handleTouch} title="Update last active">
              <Radio size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/user-devices/${device.id}/edit${userId ? `?user_id=${userId}` : ''}`)}
            >
              <Edit size={16} className="mr-1" /> Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="users.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={16} className="mr-1" /> Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Detail Card */}
      <Card className="p-6">
        <DetailRow label="ID" value={device.id} />
        <DetailRow label="User ID" value={device.user_id} />
        <DetailRow
          label="Status"
          value={
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${device.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
              {device.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          }
        />
        <DetailRow label="Tipe Device" value={device.device_type} />
        <DetailRow label="Model Device" value={device.device_model} />
        <DetailRow label="Versi OS" value={device.os_version} />
        <DetailRow label="Versi Aplikasi" value={device.app_version} />
        <DetailRow
          label="FCM Token"
          value={
            <span className="font-mono text-xs break-all">{device.fcm_token}</span>
          }
        />
        <DetailRow
          label="Last Active"
          value={device.last_active_at ? new Date(device.last_active_at).toLocaleString('id-ID') : '-'}
        />
        <DetailRow
          label="Dibuat"
          value={device.created_at ? new Date(device.created_at).toLocaleString('id-ID') : '-'}
        />
        <DetailRow
          label="Diperbarui"
          value={device.updated_at ? new Date(device.updated_at).toLocaleString('id-ID') : '-'}
        />
      </Card>
    </div>
  )
}

export default UserDevicesDetail
