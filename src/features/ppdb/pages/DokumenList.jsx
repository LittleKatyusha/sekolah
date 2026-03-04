import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Plus, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
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
  const [search, setSearch] = useState('')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: search || '',
    filter: '{}',
  }), [search])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(`Dokumen "${data.jenis_dokumen || data.file_name || ''}"`)
    if (result.isConfirmed) {
      const { error } = await dokumenService.delete(data.id)
      if (!error) {
        showSuccess('Dokumen berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus dokumen')
      }
    }
  }, [])

  const columnDefs = useMemo(() => ([
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
  ]), [navigate, handleDelete])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

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
        <InfiniteGrid
          key={`dokumen-grid-${search}`}
          ref={gridRef}
          endpoint="/ppdb/dokumen/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={500}
          overlayNoRowsTemplate={'<span class="text-gray-500">Tidak ada data dokumen</span>'}
          themeClass="ag-theme-quartz dark:ag-theme-quartz-dark"
        />
      </Card>
    </div>
  )
}

export default DokumenList