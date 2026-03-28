import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { tesMinatBakatResources } from '../config.jsx'
import { showDeleteConfirm, showError, showSuccess } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const TesMinatBakatDetailPage = ({ resourceKey }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = usePermission()
  const resource = tesMinatBakatResources[resourceKey]
  const Icon = resource.icon

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadRecord = async () => {
    setLoading(true)

    const { data, error } = await resource.service.getById(id)
    if (error || !data?.data) {
      showError(`Gagal mengambil data ${resource.navTitle.toLowerCase()}`)
      navigate(resource.basePath)
      setLoading(false)
      return
    }

    setRecord(data.data)
    setLoading(false)
  }

  useEffect(() => {
    loadRecord()
  }, [id])

  const summary = useMemo(() => (
    record ? resource.summary(record) : null
  ), [record, resource])

  const handleDelete = async () => {
    if (!record || resource.allowDelete === false || typeof resource.service.delete !== 'function') return

    const result = await showDeleteConfirm(resource.getDeleteLabel(record))
    if (!result.isConfirmed) return

    const { error } = await resource.service.delete(record.id)
    if (error) {
      showError(`Gagal menghapus ${resource.navTitle.toLowerCase()}`)
      return
    }

    showSuccess(`${resource.navTitle} berhasil dihapus`)
    navigate(resource.basePath)
  }

  const extraActions = record && typeof resource.extraActions === 'function'
    ? resource.extraActions(record, { navigate })
    : []

  const runExtraAction = async (action) => {
    if (action.navigateTo) {
      navigate(action.navigateTo)
      return
    }

    setActionLoading(true)
    const result = await action.action()

    if (result.error) {
      showError(action.errorMessage || `Gagal memproses ${resource.navTitle.toLowerCase()}`)
      setActionLoading(false)
      return
    }

    showSuccess(action.successMessage)
    await loadRecord()
    setActionLoading(false)
  }

  if (loading || !record || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(resource.basePath)}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail {resource.navTitle}</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {extraActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || 'primary'}
              onClick={() => runExtraAction(action)}
              loading={actionLoading}
            >
              {action.label}
            </Button>
          ))}
          {resource.allowEdit !== false && can('tes-minat-bakat.update') ? (
            <Button variant="secondary" onClick={() => navigate(`${resource.basePath}/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          ) : null}
          {resource.allowDelete !== false && can('tes-minat-bakat.delete') ? (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
              <Icon size={36} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{summary.title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{summary.subtitle}</p>
            <div className="mt-3 flex justify-center">{summary.badge}</div>

            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 text-left">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">ID</span>
                <span className="font-medium text-gray-900 dark:text-white">{record.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Dibuat</span>
                <span className="font-medium text-gray-900 dark:text-white">{record.created_at ? new Date(record.created_at).toLocaleDateString('id-ID') : '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Diperbarui</span>
                <span className="font-medium text-gray-900 dark:text-white">{record.updated_at ? new Date(record.updated_at).toLocaleDateString('id-ID') : '-'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {resource.detailSections.map((section) => (
            <Card key={section.title}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field) => (
                    <div key={field.label} className={field.span === 2 ? 'md:col-span-2' : ''}>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                      <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {field.value(record)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TesMinatBakatDetailPage