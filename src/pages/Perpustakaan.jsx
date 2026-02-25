import { useState, useEffect } from 'react'
import { BookOpen, BookCopy, Book, RotateCcw, CheckCircle } from 'lucide-react'
import { bukuService, peminjamanService } from '../features/perpustakaan/services/perpustakaanService'
import { NavigationCard } from '../components/bk/NavigationCard'
import { StatCard } from '../components/bk/StatCard'
import { usePageTitle } from '../hooks/usePageTitle'
import { showError } from '../utils/sweetalert'

const Perpustakaan = () => {
  usePageTitle('Perpustakaan')

  const [stats, setStats] = useState({
    totalBuku: '-',
    bukuTersedia: '-',
    peminjamanAktif: '-',
    peminjamanSelesai: '-',
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const [bukuRes, availableRes, peminjamanRes] = await Promise.all([
          bukuService.getAll(),
          bukuService.getAvailable(),
          peminjamanService.getAll(),
        ])

        const totalBuku = bukuRes.data?.data?.length ?? 0
        const bukuTersedia = availableRes.data?.data?.length ?? 0
        const peminjamanList = peminjamanRes.data?.data ?? []
        
        // Count active and completed peminjaman
        const peminjamanAktif = peminjamanList.filter(p => p.status === 'dipinjam').length
        const peminjamanSelesai = peminjamanList.filter(p => p.status === 'dikembalikan').length

        setStats({
          totalBuku,
          bukuTersedia,
          peminjamanAktif,
          peminjamanSelesai,
        })
      } catch (error) {
        console.error('Failed to fetch perpustakaan stats:', error)
        showError('Gagal memuat statistik perpustakaan')
        setStats({
          totalBuku: '-',
          bukuTersedia: '-',
          peminjamanAktif: '-',
          peminjamanSelesai: '-',
        })
      }
      setLoadingStats(false)
    }

    fetchStats()
  }, [])

  const navigationItems = [
    {
      icon: BookOpen,
      title: 'Kelola Buku',
      description: 'Kelola data buku perpustakaan',
      path: '/perpustakaan/buku',
      color: 'blue',
    },
    {
      icon: BookCopy,
      title: 'Kelola Peminjaman',
      description: 'Kelola peminjaman dan pengembalian buku',
      path: '/perpustakaan/peminjaman',
      color: 'indigo',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perpustakaan</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Kelola data buku dan peminjaman perpustakaan
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Book}
          label="Total Buku"
          value={stats.totalBuku}
          color="blue"
          loadingStats={loadingStats}
        />
        <StatCard
          icon={BookOpen}
          label="Buku Tersedia"
          value={stats.bukuTersedia}
          color="green"
          loadingStats={loadingStats}
        />
        <StatCard
          icon={RotateCcw}
          label="Peminjaman Aktif"
          value={stats.peminjamanAktif}
          color="orange"
          loadingStats={loadingStats}
        />
        <StatCard
          icon={CheckCircle}
          label="Peminjaman Selesai"
          value={stats.peminjamanSelesai}
          color="teal"
          loadingStats={loadingStats}
        />
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Modul Perpustakaan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navigationItems.map((item) => (
            <NavigationCard key={item.path} {...item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Perpustakaan