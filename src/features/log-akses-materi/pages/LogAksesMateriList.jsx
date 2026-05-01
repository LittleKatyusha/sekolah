import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, Eye, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

const ActionsMenu = ({ onDetail }) => {
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
          </div>
        </div>, document.body
      )}
    </div>
  )
}

const LogAksesMateriList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const formatDurasi = (detik) => {
    if (!detik) return '-'
    const m = Math.floor(detik / 60)
    const s = detik % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const columnDefs = useMemo(() => [
    { field: 'id', backendField: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'materi.judul', backendField: 'materi.judul', headerName: 'Materi', flex: 1, minWidth: 200, valueGetter: (p) => p.data?.materi?.judul || p.data?.materi_id || '-' },
    { field: 'siswa.nama', backendField: 'siswa.nama', headerName: 'Siswa', width: 180, valueGetter: (p) => p.data?.siswa?.nama || p.data?.siswa_id || '-' },
    {
      field: 'waktu_akses', backendField: 'waktu_akses', headerName: 'Waktu Akses', width: 170, sortable: true,
      cellRenderer: (p) => p.value ? new Date(p.value).toLocaleString('id-ID') : '-'
    },
    { field: 'durasi_detik', backendField: 'durasi_detik', headerName: 'Durasi', width: 110, cellRenderer: (p) => formatDurasi(p.value) },
    {
      headerName: 'Aksi', width: 80, sortable: false, filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu onDetail={() => navigate(`/akademik/log-akses-materi/${params.data.id}`)} />
        </div>
      )
    }
  ], [navigate])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Akses Materi</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary"><RefreshCw size={18} /></Button>
        </div>
      </div>
      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/akademik/log-akses-materi"
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

export default LogAksesMateriList