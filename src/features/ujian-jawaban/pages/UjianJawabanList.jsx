import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, RefreshCw, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianJawabanService } from '../services/ujianJawabanService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ActionsMenu = ({ data, onDetail, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const handleAction = (action) => { setIsOpen(false); action() }
  const handleButtonClick = (e) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + window.scrollY, left: rect.right + window.scrollX - 192 })
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && (!menuRef.current || !menuRef.current.contains(e.target))) setIsOpen(false)
    }
    if (isOpen) { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside) }
  }, [isOpen])

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={handleButtonClick} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Actions">
        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      {isOpen && createPortal(
        <div ref={menuRef} className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
          <div className="py-1">
            <button onClick={() => handleAction(onDetail)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" /> Detail
            </button>
            <button onClick={() => handleAction(onEdit)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Edit size={16} className="text-yellow-600" /> Edit
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button onClick={() => handleAction(onDelete)} className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
              <Trash2 size={16} /> Hapus
            </button>
          </div>
        </div>, document.body
      )}
    </div>
  )
}

const UjianJawabanList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  const fetchData = useCallback(async (page = 1, perPage = pageSize, searchQuery = searchText) => {
    setLoading(true)
    const params = { per_page: perPage, page }
    if (searchQuery?.trim()) params.search = searchQuery.trim()
    const { data, error } = await ujianJawabanService.getAll(params)
    if (data) {
      setRowData(data.data || [])
      if (data.meta) { setTotalRows(data.meta.total || 0); setCurrentPage(data.meta.current_page || page) }
    } else {
      showError('Gagal mengambil data ujian jawaban')
    }
    setLoading(false)
  }, [pageSize, searchText])

  useEffect(() => { fetchData(1, pageSize) }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchData(1, pageSize, searchText), 300)
    return () => clearTimeout(t)
  }, [searchText, pageSize, fetchData])

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(`Jawaban #${data.id}`)
    if (result.isConfirmed) {
      const { error } = await ujianJawabanService.delete(data.id)
      if (!error) { showSuccess('Jawaban berhasil dihapus!'); fetchData(currentPage, pageSize) }
      else showError('Gagal menghapus jawaban')
    }
  }

  const onPaginationChanged = useCallback((params) => {
    if (params.api) {
      const newPage = params.api.paginationGetCurrentPage() + 1
      const newPageSize = params.api.paginationGetPageSize()
      if (newPage !== currentPage || newPageSize !== pageSize) { setPageSize(newPageSize); setCurrentPage(newPage); fetchData(newPage, newPageSize, searchText) }
    }
  }, [currentPage, pageSize, searchText, fetchData])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'trx_ujian_user_id', headerName: 'Ujian User ID', width: 130, sortable: true },
    { field: 'mst_soal_id', headerName: 'Soal ID', width: 100, sortable: true },
    { field: 'mst_soal_opsi_id', headerName: 'Opsi ID', width: 100, sortable: true },
    { field: 'jawaban_teks', headerName: 'Jawaban Teks', flex: 1, minWidth: 200, cellRenderer: (p) => p.value || '-' },
    {
      field: 'is_benar', headerName: 'Benar', width: 90,
      cellRenderer: (p) => {
        if (p.value === null || p.value === undefined) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">-</span>
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.value ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{p.value ? 'Ya' : 'Tidak'}</span>
      }
    },
    {
      field: 'ragu_ragu', headerName: 'Ragu', width: 90,
      cellRenderer: (p) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.value ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{p.value ? 'Ya' : 'Tidak'}</span>
    },
    {
      headerName: 'Aksi', width: 80, sortable: false, filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu data={params.data}
            onDetail={() => navigate(`/akademik/ujian-jawaban/${params.data.id}`)}
            onEdit={() => navigate(`/akademik/ujian-jawaban/${params.data.id}/edit`)}
            onDelete={() => handleDelete(params.data)}
          />
        </div>
      )
    }
  ], [])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ujian Jawaban</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Cari jawaban..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64" />
          </div>
          <Button onClick={() => fetchData(currentPage, pageSize, searchText)} variant="secondary"><RefreshCw size={18} /></Button>
        </div>
      </div>
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 600 }}>
            <AgGridReact rowData={rowData} columnDefs={columnDefs} defaultColDef={defaultColDef}
              pagination={true} paginationPageSize={pageSize} paginationPageSizeSelector={[10, 20, 50, 100]}
              theme="legacy" />
          </div>
        )}
      </Card>
    </div>
  )
}

export default UjianJawabanList