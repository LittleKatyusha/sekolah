import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, School, MapPin, Hash, Shield, CreditCard, Settings, Trash2, Plus } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { sekolahService } from '../services/sekolahService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const SekolahDetail = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [sekolah, setSekolah] = useState(null)
  const [settings, setSettings] = useState([])
  const [loadingSettings, setLoadingSettings] = useState(false)

  useEffect(() => {
    fetchSekolah()
  }, [])

  const fetchSekolah = async () => {
    setLoading(true)
    const { data, error } = await sekolahService.getAll({ per_page: 1 })
    if (data) {
      const list = data.data?.data || data.data || []
      const first = Array.isArray(list) ? list[0] : list
      if (first) {
        setSekolah(first)
        fetchSettings(first.id)
      }
    } else {
      showError('Gagal mengambil data sekolah')
    }
    setLoading(false)
  }

  const fetchSettings = async (sekolahId) => {
    setLoadingSettings(true)
    const { data } = await sekolahService.getSettings(sekolahId)
    if (data) {
      setSettings(data.data || [])
    }
    setLoadingSettings(false)
  }

  const handleDeleteSetting = async (settingId, key) => {
    const result = await showDeleteConfirm(`Setting "${key}"`)
    if (result.isConfirmed) {
      const { error } = await sekolahService.deleteSetting(sekolah.id, settingId)
      if (!error) {
        showSuccess('Setting berhasil dihapus!')
        fetchSettings(sekolah.id)
      } else {
        showError('Gagal menghapus setting')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (isActive) => {
    if (isActive === true || isActive === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Aktif
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Nonaktif
      </span>
    )
  }

  if (loading || !sekolah) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Sekolah</h1>
        <PermissionGuard permission="sekolah.edit">
          <Button variant="warning" onClick={() => navigate(`/sekolah/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit Profil
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                {sekolah.logo_path ? (
                  <img src={sekolah.logo_path} alt="Logo" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <School size={48} className="text-gray-400" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {sekolah.nama_sekolah || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(sekolah.is_active)}
              </div>
              {sekolah.npsn && (
                <p className="text-sm text-gray-500 dark:text-gray-400">NPSN: {sekolah.npsn}</p>
              )}

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{sekolah.id}</span>
                </div>
                {sekolah.uuid && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">UUID</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs break-all">{sekolah.uuid}</span>
                  </div>
                )}
                {sekolah.subscription_plan && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Plan</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{sekolah.subscription_plan}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <School size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Sekolah</p>
                    <p className="font-medium text-gray-900 dark:text-white">{sekolah.nama_sekolah || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NPSN</p>
                    <p className="font-medium text-gray-900 dark:text-white">{sekolah.npsn || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Alamat</p>
                    <p className="font-medium text-gray-900 dark:text-white">{sekolah.alamat || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(sekolah.is_active)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Subscription Plan</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{sekolah.subscription_plan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(sekolah.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(sekolah.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Settings Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={20} />
              Pengaturan Sekolah
            </h3>
          </div>

          {loadingSettings ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Settings size={48} className="mx-auto mb-3 opacity-50" />
              <p>Belum ada pengaturan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.id || setting.key} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{setting.key}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{setting.value || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <PermissionGuard permission="sekolah.delete">
                          <button
                            onClick={() => handleDeleteSetting(setting.id, setting.key)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SekolahDetail