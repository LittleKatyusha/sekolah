import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, MoreVertical, Eye, Edit, Trash2, RefreshCw, Smartphone, Radio } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { userDevicesService } from '../services/userDevicesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

// ── Actions Menu ─────────────────────────────────────────────────────────────
const ActionsMenu = ({ data, onView, onEdit, onDelete, onTouch }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 140 })
    }
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <>
      <button ref={btnRef} onClick={handleToggle} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
        <MoreVertical size={16} />
      </button>
      {open && createPortal(
        <div
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[170px]"
        >
          <PermissionGuard permission="users.view">
            <button
              onClick={() => { onView(data); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye size={14} /> Lihat
            </button>
          </PermissionGuard>
          <PermissionGuard permission="users.update">
            <button
              onClick={() => { onEdit(data); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit size={14} /> Edit
            </button>
            <button
              onClick={() => { onTouch(data); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Radio size={14} /> Update Last Active
            </button>
          </PermissionGuard>
          <PermissionGuard permission="users.delete">
            <button
              onClick={() => { onDelete(data); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </PermissionGuard>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const UserDevicesList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user_id')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])

  const fetchData = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }
    setLoading(true)
    const { data, error } = await userDevicesService.getByUser(userId)
    if (data) {
      setItems(data.data ?? [])
    } else {
      showError('Gagal mengambil data device')
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm(`Device "${item.device_model || item.fcm_token?.slice(0, 20) + '...' || ''}"`)
    if (result.isConfirmed) {
      const { error } = await userDevicesService.delete(item.id)
      if (!error) {
        showSuccess('Device berhasil dihapus')
        fetchData()
      } else {
        showError('Gagal menghapus device')
      }
    }
  }

  const handleTouch = async (item) => {
    const { error } = await userDevicesService.touch(item.id)
    if (!error) {
      showSuccess('Last active berhasil diperbarui')
      fetchData()
    } else {
      showError('Gagal memperbarui last active')
    }
  }

  const getDeviceTypeBadge = (type) => {
    if (type === 'android') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (type === 'ios') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (type === 'web') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone size={24} /> User Devices
          </h1>
          {userId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              User ID: <span className="font-medium text-gray-700 dark:text-gray-200">{userId}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
          <PermissionGuard permission="users.create">
            <Button onClick={() => navigate(`/admin/user-devices/create${userId ? `?user_id=${userId}` : ''}`)}>
              <Plus size={16} className="mr-1" /> Tambah Device
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw size={24} className="animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Smartphone size={40} className="mx-auto mb-3 opacity-40" />
            <p>Belum ada device terdaftar</p>
            {!userId && (
              <p className="text-xs mt-1">Gunakan parameter <code>?user_id=</code> untuk filter per user</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Model / Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">OS / App Ver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{item.device_model || '-'}</div>
                      {item.device_type && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getDeviceTypeBadge(item.device_type)}`}>
                          {item.device_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      <div>{item.os_version || '-'}</div>
                      <div className="text-xs">{item.app_version ? `v${item.app_version}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {item.last_active_at ? new Date(item.last_active_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionsMenu
                        data={item}
                        onView={(d) => navigate(`/admin/user-devices/${d.id}`)}
                        onEdit={(d) => navigate(`/admin/user-devices/${d.id}/edit${userId ? `?user_id=${userId}` : ''}`)}
                        onDelete={handleDelete}
                        onTouch={handleTouch}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default UserDevicesList
