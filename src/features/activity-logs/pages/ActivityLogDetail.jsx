import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Activity, Monitor, Globe, Clock, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { activityLogsService } from '../services/activityLogsService'
import { showError } from '../../../utils/sweetalert'
import ActionBadge from '../components/ActionBadge'

// Module-level pure function — no re-creation per render
const formatDateTime = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const ActivityLogDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [log, setLog] = useState(null)
  const isMountedRef = useRef(true)

  const fetchLog = useCallback(async () => {
    setLoading(true)
    const { data, error } = await activityLogsService.getById(id)
    // Guard: don't set state if component unmounted during fetch
    if (!isMountedRef.current) return
    if (data) {
      setLog(data.data)
    } else {
      showError('Gagal mengambil data activity log')
      navigate('/admin/activity-logs')
    }
    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    isMountedRef.current = true
    fetchLog()
    return () => { isMountedRef.current = false }
  }, [fetchLog])

  if (loading || !log) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/activity-logs')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Activity Log</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Activity size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {log.user?.name || log.user?.email || 'System'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">ID: {log.id}</p>
              <ActionBadge action={log.action} size="md" />

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Module</span>
                  <span className="font-medium text-gray-900 dark:text-white">{log.module || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Waktu</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right text-sm">{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">User</p>
                    <p className="font-medium text-gray-900 dark:text-white">{log.user?.name || '-'}</p>
                    <p className="text-sm text-gray-500">{log.user?.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Action</p>
                    <div className="mt-1"><ActionBadge action={log.action} /></div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Module</p>
                    <p className="font-medium text-gray-900 dark:text-white">{log.module || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                    <p className="font-medium text-gray-900 dark:text-white">{log.reference_table || '-'} {log.reference_id ? `#${log.reference_id}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                    <p className="font-medium text-gray-900 dark:text-white">{log.ip_address || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Waktu</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                    <p className="font-medium text-gray-900 dark:text-white">{log.description || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Monitor size={20} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">User Agent</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm break-all">{log.user_agent || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ActivityLogDetail