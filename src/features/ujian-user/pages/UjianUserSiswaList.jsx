import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Search, Clock, PlayCircle, CheckCircle, Award, BookOpen } from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ExamCard from '../components/ExamCard'
import { ujianUserService } from '../services/ujianUserService'
import { showConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_TABS = [
  { key: 'all', label: 'Semua', icon: BookOpen },
  { key: '0', label: 'Belum Mulai', icon: Clock },
  { key: '1', label: 'Sedang Dikerjakan', icon: PlayCircle },
  { key: '2', label: 'Selesai', icon: CheckCircle },
  { key: '3', label: 'Dinilai', icon: Award },
]

const UjianUserSiswaList = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [ujianList, setUjianList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Get student ID from auth store
  const getSiswaId = useCallback(() => {
    if (!user) return null
    // Try different possible locations for student ID
    return user.profile?.mst_siswa_id || user.profile?.siswa_id || user.mst_siswa_id || null
  }, [user])

  const fetchUjianList = useCallback(async (pageNum = 1, append = false) => {
    const siswaId = getSiswaId()
    if (!siswaId) {
      setLoading(false)
      return
    }

    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    const params = {
      mst_siswa_id: siswaId,
      per_page: 12,
      page: pageNum,
      sort_by: 'id',
      sort_dir: 'desc',
    }

    const { data, error } = await ujianUserService.getAll(params)

    if (!error && data) {
      const items = data.data || []
      if (append) {
        setUjianList(prev => [...prev, ...items])
      } else {
        setUjianList(items)
      }
      // Check if there are more pages
      const totalPages = data.meta?.last_page || data.last_page || 1
      setHasMore(pageNum < totalPages)
    } else {
      if (!append) setUjianList([])
    }

    setLoading(false)
    setLoadingMore(false)
  }, [getSiswaId])

  useEffect(() => {
    fetchUjianList(1)
  }, [fetchUjianList])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchUjianList(nextPage, true)
  }

  const handleStart = useCallback(async (ujianUser) => {
    const ujianName = ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`
    const result = await showConfirm(
      `Apakah Anda yakin ingin memulai ujian "${ujianName}"?\n\nPastikan Anda sudah siap mengerjakan ujian.`,
      'Konfirmasi Mulai Ujian'
    )
    if (result.isConfirmed) {
      const { error } = await ujianUserService.mulaiUjian(ujianUser.id)
      if (!error) {
        showSuccess('Ujian berhasil dimulai!')
        navigate(`/akademik/ujian-user/${ujianUser.id}/mulai`)
      } else {
        showError('Gagal memulai ujian. Silakan coba lagi.')
      }
    }
  }, [navigate])

  const handleContinue = useCallback((ujianUser) => {
    navigate(`/akademik/ujian-user/${ujianUser.id}/mulai`)
  }, [navigate])

  const handleViewDetail = useCallback((ujianUser) => {
    navigate(`/akademik/ujian-user/${ujianUser.id}`)
  }, [navigate])

  const handleRefresh = () => {
    setPage(1)
    fetchUjianList(1)
  }

  // Filter and search
  const filteredList = ujianList.filter(item => {
    // Status filter
    if (activeFilter !== 'all') {
      const statusFilter = parseInt(activeFilter)
      const itemStatus = item.status ?? 0
      if (itemStatus !== statusFilter) return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const name = item.ujian?.nama || ''
      const mapel = item.ujian?.mapel?.nama || ''
      const kelas = item.ujian?.kelas?.nama_kelas || ''
      return name.toLowerCase().includes(query) ||
             mapel.toLowerCase().includes(query) ||
             kelas.toLowerCase().includes(query)
    }

    return true
  })

  // Stats
  const stats = {
    total: ujianList.length,
    belum: ujianList.filter(u => (u.status ?? 0) === 0).length,
    sedang: ujianList.filter(u => u.status === 1).length,
    selesai: ujianList.filter(u => u.status === 2).length,
    dinilai: ujianList.filter(u => u.status === 3).length,
  }

  // No student ID found
  if (!getSiswaId() && !loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ujian Saya</h1>
        <Card>
          <div className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data siswa tidak ditemukan
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pastikan akun Anda terhubung dengan data siswa. Hubungi administrator jika masalah berlanjut.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ujian Saya</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Daftar ujian yang tersedia untuk Anda
          </p>
        </div>
        <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
          <RefreshCw size={18} />
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Belum Mulai</span>
          </div>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{stats.belum}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <PlayCircle size={14} className="text-yellow-500" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400">Sedang</span>
          </div>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.sedang}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle size={14} className="text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400">Selesai</span>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.selesai}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Award size={14} className="text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">Dinilai</span>
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.dinilai}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${activeFilter === key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <Icon size={14} />
              {label}
              {key !== 'all' && (
                <span className={`ml-1 text-xs ${activeFilter === key ? 'text-white/80' : 'text-gray-400'}`}>
                  {key === '0' ? stats.belum : key === '1' ? stats.sedang : key === '2' ? stats.selesai : stats.dinilai}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredList.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {searchQuery || activeFilter !== 'all'
                ? 'Tidak ada ujian yang sesuai'
                : 'Belum ada ujian'
              }
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || activeFilter !== 'all'
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Ujian yang ditugaskan kepada Anda akan muncul di sini'
              }
            </p>
          </div>
        </Card>
      )}

      {/* Card Grid */}
      {!loading && filteredList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((ujian) => (
            <ExamCard
              key={ujian.id}
              data={ujian}
              onStart={() => handleStart(ujian)}
              onContinue={() => handleContinue(ujian)}
              onViewDetail={() => handleViewDetail(ujian)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default UjianUserSiswaList