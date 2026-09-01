import { useState, useEffect } from 'react'
import {
  Tag, FolderOpen, Calendar, CheckCircle,
  ClipboardList, Paperclip, Users,
  BarChart3
} from 'lucide-react'
import { bkKasusService, bkJenisService, bkKategoriService, bkSesiService } from '../features/bk/services/bkService'
import StatCard from '../components/bk/StatCard'
import NavigationCard from '../components/bk/NavigationCard'
import usePermission from '../hooks/usePermission'

const BK = () => {
  const { hasAnyPermission } = usePermission()
  const [stats, setStats] = useState({ kasus: '-', sesi: '-', jenis: '-', kategori: '-' })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const countParams = { per_page: 1 }

        const [kasusRes, sesiRes, jenisRes, kategoriRes] = await Promise.all([
          bkKasusService.getAll(countParams),
          bkSesiService.getAll(countParams),
          bkJenisService.getAll(countParams),
          bkKategoriService.getAll(countParams),
        ])

        const getTotalCount = (response) => response.data?.meta?.total ?? response.data?.total ?? response.data?.data?.length ?? '-'

        setStats({
          kasus: getTotalCount(kasusRes),
          sesi: getTotalCount(sesiRes),
          jenis: getTotalCount(jenisRes),
          kategori: getTotalCount(kategoriRes),
        })
      } catch (error) {
        console.error('Failed to fetch BK stats:', error)
        setStats({ kasus: '-', sesi: '-', jenis: '-', kategori: '-' })
      }
      setLoadingStats(false)
    }
    fetchStats()
  }, [])

  const navigationItems = [
    { icon: FolderOpen, title: 'Kasus BK', description: 'Kelola data kasus bimbingan konseling', path: '/bk/kasus', color: 'indigo', permissions: ['bk-kasus.view', 'bk-kasus.create', 'bk-kasus.update', 'bk-kasus.delete'] },
    { icon: Calendar, title: 'Sesi Konseling', description: 'Kelola sesi konseling dengan siswa', path: '/bk/sesi', color: 'blue', permissions: ['bk-sesi.manage', 'bk-sesi.create', 'bk-sesi.update', 'bk-sesi.delete'] },
    { icon: CheckCircle, title: 'Hasil Konseling', description: 'Catat hasil dari proses konseling', path: '/bk/hasil', color: 'green', permissions: ['bk-hasil.manage', 'bk-hasil.create', 'bk-hasil.update', 'bk-hasil.delete'] },
    { icon: ClipboardList, title: 'Tindakan', description: 'Tindak lanjut dari kasus BK', path: '/bk/tindakan', color: 'orange', permissions: ['bk-tindakan.manage', 'bk-tindakan.create', 'bk-tindakan.update', 'bk-tindakan.delete'] },
    { icon: Tag, title: 'Jenis BK', description: 'Kelola jenis bimbingan konseling', path: '/bk/jenis', color: 'purple', permissions: ['bk-jenis.view', 'bk-jenis.create', 'bk-jenis.update', 'bk-jenis.delete'] },
    { icon: BarChart3, title: 'Kategori BK', description: 'Kelola kategori bimbingan konseling', path: '/bk/kategori', color: 'teal', permissions: ['bk-kategori.manage', 'bk-kategori.create', 'bk-kategori.update', 'bk-kategori.delete'] },
    { icon: Paperclip, title: 'Lampiran', description: 'Kelola file lampiran kasus BK', path: '/bk/lampiran', color: 'pink', permissions: ['bk-lampiran.manage', 'bk-lampiran.create', 'bk-lampiran.update', 'bk-lampiran.delete'] },
    { icon: Users, title: 'Wali BK', description: 'Kelola keterlibatan wali murid', path: '/bk/wali', color: 'amber', permissions: ['bk-wali.manage', 'bk-wali.create', 'bk-wali.update', 'bk-wali.delete'] },
  ].filter(({ permissions }) => hasAnyPermission(permissions))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bimbingan Konseling</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Kelola seluruh data bimbingan dan konseling siswa</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Total Kasus" value={stats.kasus} color="indigo" loadingStats={loadingStats} />
        <StatCard icon={Calendar} label="Total Sesi" value={stats.sesi} color="blue" loadingStats={loadingStats} />
        <StatCard icon={Tag} label="Total Jenis" value={stats.jenis} color="purple" loadingStats={loadingStats} />
        <StatCard icon={BarChart3} label="Total Kategori" value={stats.kategori} color="teal" loadingStats={loadingStats} />
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Modul BK</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navigationItems.map((item) => (
            <NavigationCard key={item.path} {...item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BK
