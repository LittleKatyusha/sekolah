import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, BookOpen, Search, BookMarked, Library, Sparkles, ChevronDown, Layers, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { bukuService } from '../services/perpustakaanService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import usePermission from '../../../hooks/usePermission'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import useAuthStore from '../../../store/useAuthStore'
import ImportBukuModal from './ImportBukuModal'

// ─── Actions Menu Component (Admin/Guru) ───────────────────────────────────────

const ActionsMenu = ({ data, onDetail, onEdit, onDelete, detailPermission, editPermission, deletePermission }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const { hasPermission } = usePermission()

  const showDetail = onDetail && (detailPermission ? hasPermission(detailPermission) : true)
  const showEdit = onEdit && (editPermission ? hasPermission(editPermission) : true)
  const showDelete = onDelete && (deletePermission ? hasPermission(deletePermission) : true)
  const hasVisibleActions = showDetail || showEdit || showDelete

  const handleAction = (action) => {
    setIsOpen(false)
    action()
  }

  const handleButtonClick = (e) => {
    e.stopPropagation()

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 192
      })
    }

    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target)
      const isOutsideMenu = !menuRef.current || !menuRef.current.contains(e.target)

      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      {hasVisibleActions && (
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Actions"
        >
          <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            {showDetail && (
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            )}
            {showEdit && (
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            )}
            {showDelete && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Book Cover Placeholder ────────────────────────────────────────────────────

const BookCover = ({ judul, className = '' }) => {
  const accentColors = [
    'text-blue-500 dark:text-blue-400',
    'text-emerald-500 dark:text-emerald-400',
    'text-violet-500 dark:text-violet-400',
    'text-rose-500 dark:text-rose-400',
    'text-amber-500 dark:text-amber-400',
    'text-cyan-500 dark:text-cyan-400',
    'text-fuchsia-500 dark:text-fuchsia-400',
    'text-lime-500 dark:text-lime-400',
  ]

  const colorIndex = judul
    ? judul.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % accentColors.length
    : 0

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center ${className}`}>
      <BookOpen size={32} className={accentColors[colorIndex]} />
    </div>
  )
}

// ─── Stock Badge ───────────────────────────────────────────────────────────────

const StockBadge = ({ stok }) => {
  const value = stok || 0
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Habis
      </span>
    )
  }
  if (value < 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Tersisa {value}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      Tersedia
    </span>
  )
}

// ─── Student Book Card ─────────────────────────────────────────────────────────

const BukuCard = ({ buku, onClick }) => {
  return (
    <button
      onClick={() => onClick(buku)}
      className="group w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover */}
      <BookCover
        judul={buku.judul}
        className="w-full h-44 relative"
      />

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {buku.judul || 'Tanpa Judul'}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {buku.penulis || 'Penulis tidak diketahui'}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {buku.penerbit || '-'}{buku.tahun ? ` · ${buku.tahun}` : ''}
          </span>
          <StockBadge stok={buku.stok} />
        </div>
      </div>
    </button>
  )
}

// ─── Student View (Card Grid) ──────────────────────────────────────────────────

const StudentBukuView = () => {
  usePageTitle('Katalog Buku')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const profile = user?.profile || user?.siswa || {}

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)
  const [totalBooks, setTotalBooks] = useState(0)
  const debounceRef = useRef(null)

  const fetchBooks = useCallback(async (searchQuery = '') => {
    setLoading(true)
    setError('')

    const params = {
      per_page: 100,
      sort_by: 'judul',
      sort_dir: 'asc',
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim()
    }

    const { data, error: fetchError } = await bukuService.getAll(params)

    if (fetchError) {
      setError('Gagal memuat katalog buku. Coba beberapa saat lagi.')
      setBooks([])
      setTotalBooks(0)
    } else {
      const rows = data?.data || data || []
      setBooks(Array.isArray(rows) ? rows : [])
      setTotalBooks(data?.total || data?.meta?.total || (Array.isArray(rows) ? rows.length : 0))
      setVisibleCount(12)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleSearch = useCallback((value) => {
    setSearch(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchBooks(value)
    }, 400)
  }, [fetchBooks])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleCardClick = useCallback((buku) => {
    if (buku?.id) {
      navigate(`/perpustakaan/buku/${buku.id}`)
    }
  }, [navigate])

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 12, books.length))
  }, [books.length])

  const visibleBooks = books.slice(0, visibleCount)
  const hasMore = visibleCount < books.length

  // Stats
  const availableCount = books.filter((b) => (b.stok || 0) > 0).length
  const lowStockCount = books.filter((b) => (b.stok || 0) > 0 && (b.stok || 0) < 5).length

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-6 shadow-sm dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 md:px-8 md:py-8">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-700/20" />
        <div className="absolute bottom-0 left-0 h-28 w-28 -translate-x-6 translate-y-8 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-700/20" />

        <div className="relative flex flex-col gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-slate-900/70 dark:text-emerald-300">
              <Sparkles size={14} />
              Katalog Perpustakaan
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Hai, {profile?.nama || 'Siswa'} 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300 md:text-base">
              Jelajahi koleksi buku perpustakaan sekolah dan temukan bacaan yang menarik untukmu.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white border border-gray-200/80 dark:bg-gray-900/70 dark:border-gray-800 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Library size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Buku</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalBooks}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-200/80 dark:bg-gray-900/70 dark:border-gray-800 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <BookMarked size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tersedia</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{availableCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-200/80 dark:bg-gray-900/70 dark:border-gray-800 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Layers size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stok Terbatas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Cari judul buku, penulis, atau penerbit..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
        />
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl h-44" />
              <div className="mt-3 space-y-2 px-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-red-500 font-medium">{error}</p>
          <Button
            variant="secondary"
            onClick={() => fetchBooks(search)}
            className="mt-4"
          >
            <RefreshCw size={16} className="mr-2" />
            Coba Lagi
          </Button>
        </div>
      ) : visibleBooks.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {search.trim() ? 'Tidak ada buku yang cocok dengan pencarianmu.' : 'Belum ada buku di katalog perpustakaan.'}
          </p>
          {search.trim() && (
            <Button
              variant="secondary"
              onClick={() => { setSearch(''); fetchBooks('') }}
              className="mt-4"
            >
              Reset Pencarian
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {visibleBooks.length} dari {books.length} buku
            {search.trim() && <span> untuk &ldquo;{search.trim()}&rdquo;</span>}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {visibleBooks.map((buku) => (
              <BukuCard
                key={buku.id}
                buku={buku}
                onClick={handleCardClick}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                className="min-w-[200px]"
              >
                <ChevronDown size={16} className="mr-2" />
                Muat Lebih Banyak
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Admin/Guru View (Table Grid) ──────────────────────────────────────────────

const AdminBukuView = () => {
  usePageTitle('Data Buku')
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [showImport, setShowImport] = useState(false)
  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/perpustakaan/buku/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/perpustakaan/buku/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(data.judul)
    if (result.isConfirmed) {
      const { error } = await bukuService.delete(data.id)
      if (!error) {
        showSuccess(`${data.judul} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus buku')
      }
    }
  }, [])

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 60
    },
    {
      field: 'isbn',
      headerName: 'ISBN',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'judul',
      headerName: 'Judul',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 200
    },
    {
      field: 'penulis',
      headerName: 'Penulis',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'penerbit',
      headerName: 'Penerbit',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
    field: 'tahun',
    headerName: 'Tahun',
    sortable: true,
    filter: true,
    width: 100,
    minWidth: 80,
    cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'stok',
      headerName: 'Stok',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70,
      cellRenderer: (params) => {
        const stok = params.value || 0
        const colorClass = stok === 0
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          : stok < 5
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {stok}
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
              detailPermission="buku.view"
              editPermission="buku.edit"
              deletePermission="buku.delete"
            />
          </div>
        )
      }
    }
  ], [handleDetail, handleEdit, handleDelete])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Buku</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <PermissionGuard permission="buku.create">
            <Button onClick={() => setShowImport(true)} variant="secondary" title="Import Excel">
              <Upload size={18} className="mr-2" />
              Import Excel
            </Button>
          </PermissionGuard>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="buku.create">
            <Button onClick={() => navigate('/perpustakaan/buku/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Buku
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/perpustakaan/buku/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>
      {showImport && (
        <ImportBukuModal onClose={() => setShowImport(false)} onSuccess={handleRefresh} />
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const BukuList = () => {
  const { user } = useAuthStore()
  const isSiswa = user?.role === 'siswa'

  if (isSiswa) {
    return <StudentBukuView />
  }

  return <AdminBukuView />
}

export default BukuList
