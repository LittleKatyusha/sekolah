import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import { Plus, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { dokumenService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ActionsMenu = ({ data, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 120 })
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
        <div style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
          <button onClick={() => { onView(data); setOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Eye size={14} /> Lihat
          </button>
          <button onClick={() => { onEdit(data); setOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Edit size={14} /> Edit
          </button>
          <button onClick={() => { onDelete(data); setOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Trash2 size={14} /> Hapus
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

const DokumenList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [totalRows, setTotalRows] = useState(0)
  const [paginationPageSize] = useState(20)
  const pageCursorsRef = useRef({})
  const currentPageRef = useRef(0)

  const fetchData = useCallback(async (page = 0) => {
    setLoading(true)
    const params = { page_size: paginationPageSize }
    if (search) params.search = search
    if (page > 0 && pageCursorsRef.current[page]) params.cursor = pageCursorsRef.current[page]

    const { data, error } = await dokumenService.getAll(params)
    if (data) {
      const items = data.data || []
      setRowData(items)
      setTotalRows(data.total || items.length)
      if (data.next_cursor) pageCursorsRef.current[page + 1] = data.next_cursor
      currentPageRef.current = page
    } else {
      showError('Gagal mengambil data dokumen')
    }
    setLoading(false)
  }, [search, paginationPageSize])

  useEffect(() => { fetchData(0) }, [fetchData])

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(`Dokumen "${data.jenis_dokumen || data.file_name || ''}"`)
    if (result.isConfirmed) {
      const { error } = await dokumenService.delete(data.id)
      if (!error) {
        showSuccess('Dokumen berhasil dihapus!')
        fetchData(currentPageRef.current)
      } else {
        showError('Gagal menghapus dokumen')
      }
    }
  }

  const columnDefs = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'ppdb_pendaftar_id', headerName: 'ID Pendaftar', width: 120, sortable: true },
    { field: 'jenis_dokumen', headerName: 'Jenis Dokumen', flex: 1, sortable: true },
    { field: 'file_name', headerName: 'Nama File', flex: 1, sortable: true },
    {
      field: 'verifikasi_status',
      headerName: 'Status',
      width: 140,
      cellRenderer: (params) => {
        const val = params.value
        if (val === 'verified' || val === true || val === 1) {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Terverifikasi</span>
        }
        if (val === 'rejected') {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Ditolak</span>
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Belum</span>
      }
    },
    {
      headerName: 'Aksi',
      width: 80,
      cellRenderer: (params) => (
        <ActionsMenu
          data={params.data}
          onView={(d) => navigate(`/ppdb/dokumen/${d.id}`)}
          onEdit={(d) => navigate(`/ppdb/dokumen/${d.id}/edit`)}
          onDelete={handleDelete}
        />
      ),
      sortable: false,
      filter: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokumen PPDB</h1>
        <Button onClick={() => navigate('/ppdb/dokumen/create')}>
          <Plus size={18} className="mr-2" />
          Tambah Dokumen
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="ag-theme-quartz dark:ag-theme-quartz-dark" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true }}
            pagination={true}
            paginationPageSize={paginationPageSize}
            suppressPaginationPanel={false}
            loading={loading}
            overlayNoRowsTemplate='<span class="text-gray-500">Tidak ada data dokumen</span>'
          />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
          Total: {totalRows} dokumen
        </div>
      </Card>
    </div>
  )
}

export default DokumenList