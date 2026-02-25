import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Tag, FolderOpen, Calendar, CheckCircle, 
  ClipboardList, Paperclip, Users, ArrowRight, 
  BarChart3, AlertCircle
} from 'lucide-react'
import Card from '../components/ui/Card'
import { bkKasusService, bkJenisService, bkKategoriService, bkSesiService } from '../features/bk/services/bkService'

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-600',
    groupHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-300 dark:hover:border-blue-600',
    groupHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    hover: 'hover:border-green-300 dark:hover:border-green-600',
    groupHover: 'group-hover:text-green-600 dark:group-hover:text-green-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:border-orange-300 dark:hover:border-orange-600',
    groupHover: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-300 dark:hover:border-purple-600',
    groupHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    hover: 'hover:border-teal-300 dark:hover:border-teal-600',
    groupHover: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    hover: 'hover:border-pink-300 dark:hover:border-pink-600',
    groupHover: 'group-hover:text-pink-600 dark:group-hover:text-pink-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    hover: 'hover:border-amber-300 dark:hover:border-amber-600',
    groupHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
}

const BK = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ kasus: '-', sesi: '-', jenis: '-', kategori: '-' })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const [kasusRes, sesiRes, jenisRes, kategoriRes] = await Promise.all([
          bkKasusService.getAll(),
          bkSesiService.getAll(),
          bkJenisService.getAll(),
          bkKategoriService.getAll(),
        ])
        setStats({
          kasus: kasusRes.data?.data?.length ?? '-',
          sesi: sesiRes.data?.data?.length ?? '-',
          jenis: jenisRes.data?.data?.length ?? '-',
          kategori: kategoriRes.data?.data?.length ?? '-',
        })
      } catch {
        setStats({ kasus: '-', sesi: '-', jenis: '-', kategori: '-' })
      }
      setLoadingStats(false)
    }
    fetchStats()
  }, [])

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${colorStyles[color].bg} flex items-center justify-center`}>
          <Icon size={24} className={colorStyles[color].text} />
        </div>
        <div>
          {loadingStats ? (
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  )

  const NavigationCard = ({ icon: Icon, title, description, path, color }) => (
    <div
      onClick={() => navigate(path)}
      className={`group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg ${colorStyles[color].hover} transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${colorStyles[color].bg} flex items-center justify-center`}>
            <Icon size={24} className={colorStyles[color].text} />
          </div>
          <div>
            <h3 className={`font-semibold text-gray-900 dark:text-white ${colorStyles[color].groupHover} transition-colors`}>{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <ArrowRight size={20} className={`text-gray-400 ${colorStyles[color].groupHover} group-hover:translate-x-1 transition-all`} />
      </div>
    </div>
  )

  const navigationItems = [
    { icon: FolderOpen, title: 'Kasus BK', description: 'Kelola data kasus bimbingan konseling', path: '/bk/kasus', color: 'indigo' },
    { icon: Calendar, title: 'Sesi Konseling', description: 'Kelola sesi konseling dengan siswa', path: '/bk/sesi', color: 'blue' },
    { icon: CheckCircle, title: 'Hasil Konseling', description: 'Catat hasil dari proses konseling', path: '/bk/hasil', color: 'green' },
    { icon: ClipboardList, title: 'Tindakan', description: 'Tindak lanjut dari kasus BK', path: '/bk/tindakan', color: 'orange' },
    { icon: Tag, title: 'Jenis BK', description: 'Kelola jenis bimbingan konseling', path: '/bk/jenis', color: 'purple' },
    { icon: BarChart3, title: 'Kategori BK', description: 'Kelola kategori bimbingan konseling', path: '/bk/kategori', color: 'teal' },
    { icon: Paperclip, title: 'Lampiran', description: 'Kelola file lampiran kasus BK', path: '/bk/lampiran', color: 'pink' },
    { icon: Users, title: 'Wali BK', description: 'Kelola keterlibatan wali murid', path: '/bk/wali', color: 'amber' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bimbingan Konseling</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Kelola seluruh data bimbingan dan konseling siswa</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Total Kasus" value={stats.kasus} color="indigo" />
        <StatCard icon={Calendar} label="Total Sesi" value={stats.sesi} color="blue" />
        <StatCard icon={Tag} label="Total Jenis" value={stats.jenis} color="purple" />
        <StatCard icon={BarChart3} label="Total Kategori" value={stats.kategori} color="teal" />
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