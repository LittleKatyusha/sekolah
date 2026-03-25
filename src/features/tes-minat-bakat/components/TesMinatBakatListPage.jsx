import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { tesMinatBakatResources } from '../config.jsx'
import { showDeleteConfirm, showError, showSuccess } from '../../../utils/sweetalert'

const TesMinatBakatListPage = ({ resourceKey }) => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const resource = tesMinatBakatResources[resourceKey]
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: debouncedSearch || '',
    filter: '{}',
  }), [debouncedSearch])

  const handleDetail = useCallback((record) => {
    navigate(`${resource.basePath}/${record.id}`)
  }, [navigate, resource.basePath])

  const handleEdit = useCallback((record) => {
    navigate(`${resource.basePath}/${record.id}/edit`)
  }, [navigate, resource.basePath])

  const handleDelete = useCallback(async (record) => {
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

  const columnDefs = useMemo(
    () => resource.buildColumns({ handleDetail, handleEdit, handleDelete, ActionsMenu }),
    [handleDelete, handleDetail, handleEdit, resource]
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

          <Button onClick={() => navigate(`${resource.basePath}/create`)}>
            <Plus size={18} className="mr-2" />
            Tambah
          </Button>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint={resource.endpoint}
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