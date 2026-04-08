import { useCallback, useMemo, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { tesMinatBakatResources } from '../config.jsx'
import { showDeleteConfirm, showError, showSuccess } from '../../../utils/sweetalert'

const TesMinatBakatListPage = ({ resourceKey }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const gridRef = useRef(null)
  const resource = tesMinatBakatResources[resourceKey]

  const pesertaIdFilter = searchParams.get('pesertaId')
  const pesertaNameFilter = searchParams.get('pesertaName')
  const gridKey = `${resourceKey}:${pesertaIdFilter || 'all'}`

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: '',
    filter: '{}',
    ...(resourceKey === 'hasil' && pesertaIdFilter ? { trx_tes_minat_bakat_peserta_id: pesertaIdFilter } : {}),
  }), [pesertaIdFilter, resourceKey])

  const handleDetail = useCallback((record) => {
    navigate(`${resource.basePath}/${record.id}`)
  }, [navigate, resource.basePath])

  const handleEdit = useCallback((record) => {
    navigate(`${resource.basePath}/${record.id}/edit`)
  }, [navigate, resource.basePath])

  const getRowActions = useCallback((record) => {
    if (typeof resource.rowActions !== 'function') {
      return []
    }

    return resource.rowActions(record, { navigate })
  }, [navigate, resource])

  const handleDelete = useCallback(async (record) => {
    if (!resource.allowDelete || typeof resource.service.delete !== 'function') {
      return
    }

    const result = await showDeleteConfirm(resource.getDeleteLabel(record))
    if (!result.isConfirmed) return

    const { error } = await resource.service.delete(record.id)

    if (error) {
      showError(`Gagal menghapus ${resource.navTitle.toLowerCase()}`)
      return
    }

    showSuccess(`${resource.navTitle} berhasil dihapus`)
    gridRef.current?.refreshGrid?.()
  }, [resource])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const handleGridReady = useCallback((params) => {
    params.api.refreshInfiniteCache()
  }, [])

  const handleClearPesertaFilter = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('pesertaId')
    nextParams.delete('pesertaName')
    setSearchParams(nextParams)
  }, [searchParams, setSearchParams])

  const columnDefs = useMemo(
    () => resource.buildColumns({
      handleDetail,
      handleEdit: resource.allowEdit !== false ? handleEdit : undefined,
      handleDelete: resource.allowDelete !== false ? handleDelete : undefined,
      getRowActions,
      ActionsMenu,
      detailPermission: 'tes-minat-bakat.view',
      editPermission: 'tes-minat-bakat.edit',
      deletePermission: 'tes-minat-bakat.delete',
    }),
    [getRowActions, handleDelete, handleDetail, handleEdit, resource]
  )

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{resource.listTitle}</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>

          {resource.allowCreate !== false ? (
            <PermissionGuard permission="tes-minat-bakat.create">
              <Button onClick={() => navigate(`${resource.basePath}/create`)}>
                <Plus size={18} className="mr-2" />
                Tambah
              </Button>
            </PermissionGuard>
          ) : null}
        </div>
      </div>

      {resourceKey === 'hasil' && pesertaIdFilter ? (
        <Card>
          <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Filter hasil peserta aktif</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Menampilkan hasil otomatis untuk {pesertaNameFilter || `peserta #${pesertaIdFilter}`}.
              </div>
            </div>
            <Button variant="secondary" onClick={handleClearPesertaFilter}>
              Tampilkan Semua Hasil
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <InfiniteGrid
          key={gridKey}
          ref={gridRef}
          endpoint={resource.endpoint}
          requestMode="ag-grid"
          onGridReady={handleGridReady}
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>
    </div>
  )
}

export default TesMinatBakatListPage
