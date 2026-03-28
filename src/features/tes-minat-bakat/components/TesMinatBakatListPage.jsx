import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { tesMinatBakatResources } from '../config.jsx'
import { showDeleteConfirm, showError, showSuccess } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const TesMinatBakatListPage = ({ resourceKey }) => {
  const navigate = useNavigate()
  const { can } = usePermission()
  const [searchParams, setSearchParams] = useSearchParams()
  const gridRef = useRef(null)
  const resource = tesMinatBakatResources[resourceKey]
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])

  const pesertaIdFilter = searchParams.get('pesertaId')
  const pesertaNameFilter = searchParams.get('pesertaName')
  const gridKey = `${resourceKey}:${pesertaIdFilter || 'all'}`

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: debouncedSearch || '',
    filter: '{}',
    ...(resourceKey === 'hasil' && pesertaIdFilter ? { trx_tes_minat_bakat_peserta_id: pesertaIdFilter } : {}),
  }), [debouncedSearch, pesertaIdFilter, resourceKey])

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
    gridRef.current?.refreshGrid?.()
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
      handleEdit: (resource.allowEdit !== false && can('tes-minat-bakat.update')) ? handleEdit : undefined,
      handleDelete: (resource.allowDelete !== false && can('tes-minat-bakat.delete')) ? handleDelete : undefined,
      getRowActions,
      ActionsMenu,
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={resource.searchPlaceholder}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-72"
            />
          </div>

          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>

          {resource.allowCreate !== false && can('tes-minat-bakat.create') ? (
            <Button onClick={() => navigate(`${resource.basePath}/create`)}>
              <Plus size={18} className="mr-2" />
              Tambah
            </Button>
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