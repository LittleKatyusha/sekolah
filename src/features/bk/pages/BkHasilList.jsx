import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { bkHasilService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const BkHasilList = () => {
  const { can } = usePermission()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText])

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: debouncedSearch || '',
    filter: '{}',
  }), [debouncedSearch])

  const handleEdit = useCallback((data) => {
    navigate(`/bk/hasil/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/bk/hasil/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm('hasil konseling ini')
    if (result.isConfirmed) {
      const { error } = await bkHasilService.delete(data.id)
      if (!error) {
        showSuccess('Hasil konseling berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus hasil konseling')
      }
    }
  }, [])

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      sortable: false,
      filter: false
    },
    {
      field: 'trx_bk_kasus_id',
      headerName: 'ID Kasus',
      width: 120,
      sortable: true,
      filter: true
    },
    {
      field: 'hasil',
      headerName: 'Hasil',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const text = params.value || '-'
        const truncated = text.length > 80 ? `${text.substring(0, 80)}...` : text
        return (
          <span title={text} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncated}
          </span>
        )
      }
    },
    {
      field: 'rekomendasi',
      headerName: 'Rekomendasi',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const text = params.value || '-'
        const truncated = text.length > 80 ? `${text.substring(0, 80)}...` : text
        return (
          <span title={text} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncated}
          </span>
        )
      }
    },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              data={params.data}
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
              canEdit={can('bk-hasil.update')}
              canDelete={can('bk-hasil.delete')}
            />
          </div>
        )
      }
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Hasil Konseling</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari hasil konseling..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          {can('bk-hasil.create') && (
            <Button onClick={() => navigate('/bk/hasil/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Hasil
            </Button>
          )}
        </div>
      </div>

      <Card>
        <InfiniteGrid
          key="bk-hasil-grid"
          ref={gridRef}
          endpoint="/bk/hasil/"
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

export default BkHasilList